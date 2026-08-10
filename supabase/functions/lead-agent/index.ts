import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Lead = {
  id: string;
  organization_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  lead_score: number;
  notes: string | null;
};

type AgentResult = {
  score: number;
  status: "new" | "contacted" | "qualified" | "booked" | "won" | "lost";
  message: string;
  reason: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

  if (!supabaseUrl || !serviceRoleKey || !openaiApiKey) {
    return json({ error: "Required server configuration is missing" }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    const body = await req.json();
    const leadId = body?.lead_id;

    if (!leadId || typeof leadId !== "string") {
      return json({ error: "lead_id is required" }, 400);
    }

    const { data: lead, error: leadError } = await admin
      .from("leads")
      .select("id, organization_id, first_name, last_name, email, phone, source, status, lead_score, notes")
      .eq("id", leadId)
      .single<Lead>();

    if (leadError || !lead) {
      return json({ error: "Lead not found", details: leadError?.message }, 404);
    }

    const { data: organization, error: organizationError } = await admin
      .from("organizations")
      .select("id, name, industry, plan, status")
      .eq("id", lead.organization_id)
      .single();

    if (organizationError || !organization) {
      return json({ error: "Organization not found" }, 404);
    }

    const systemPrompt = `You are AutoAI, an AI lead-response employee for a small business.\n\nYour job is to analyze a new lead and produce a concise, professional first response. Do not invent prices, availability, guarantees, or facts that are not provided. Do not claim to have booked an appointment. The business owner will send or review the response.\n\nReturn ONLY valid JSON with these fields:\nscore: integer 0-100\nstatus: one of new, contacted, qualified, booked, won, lost\nmessage: the suggested customer-facing response, under 500 characters\nreason: one short sentence explaining the score.`;

    const userPrompt = JSON.stringify({
      business: {
        name: organization.name,
        industry: organization.industry,
      },
      lead: {
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        current_status: lead.status,
        notes: lead.notes,
      },
    });

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_output_tokens: 400,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI error:", errorText);
      return json({ error: "AI request failed" }, 502);
    }

    const ai = await openaiResponse.json();
    const outputText = ai.output_text?.trim();

    if (!outputText) {
      return json({ error: "AI returned no output" }, 502);
    }

    let result: AgentResult;
    try {
      result = JSON.parse(outputText);
    } catch {
      console.error("Invalid AI JSON:", outputText);
      return json({ error: "AI returned invalid structured output" }, 502);
    }

    const score = Math.max(0, Math.min(100, Number(result.score) || 0));
    const allowedStatuses = new Set(["new", "contacted", "qualified", "booked", "won", "lost"]);
    const status = allowedStatuses.has(result.status) ? result.status : "contacted";
    const message = String(result.message || "").slice(0, 500);
    const reason = String(result.reason || "AI lead assessment").slice(0, 500);

    const { error: updateError } = await admin
      .from("leads")
      .update({ lead_score: score, status, updated_at: new Date().toISOString() })
      .eq("id", lead.id);

    if (updateError) throw updateError;

    const { data: interaction, error: interactionError } = await admin
      .from("interactions")
      .insert({
        organization_id: lead.organization_id,
        lead_id: lead.id,
        type: "ai_response",
        direction: "outbound",
        message,
        ai_generated: true,
        status: "generated",
      })
      .select("id, created_at")
      .single();

    if (interactionError) throw interactionError;

    await admin.from("automation_events").insert({
      organization_id: lead.organization_id,
      lead_id: lead.id,
      event_type: "lead_ai_analyzed",
      payload: { score, status, reason },
      status: "completed",
    });

    return json({
      success: true,
      lead_id: lead.id,
      score,
      status,
      message,
      reason,
      interaction_id: interaction.id,
    });
  } catch (error) {
    console.error("Lead agent error:", error);
    return json({ error: "Unexpected lead-agent error" }, 500);
  }
});

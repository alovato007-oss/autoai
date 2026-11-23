import { createClient } from "npm:@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { assessHermesReadiness, normalizeLimit } from "./contract.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const executionUrlConfigured = Boolean(Deno.env.get("HERMES_EXECUTION_URL"));
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return json({ error: "POST required" }, 405);
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Server configuration is incomplete" }, 500);
  }

  // Supabase JWT verification remains enabled. Restrict this operational
  // preflight to the service-role caller; never accept a user JWT here.
  const authorization = request.headers.get("authorization") ?? "";
  if (authorization !== `Bearer ${serviceRoleKey}`) {
    return json({ error: "Service-role authorization required" }, 403);
  }

  let input: { sampleLimit?: unknown } = {};
  try {
    input = await request.json();
  } catch {
    return json({ error: "A JSON request body is required" }, 400);
  }
  const sampleLimit = normalizeLimit(input.sampleLimit);
  const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [queueResult, integrationResult] = await Promise.all([
    db.from("jarvis_agency_dispatch_queue")
      .select("id,status,created_at,organization_id,lead_id")
      .order("created_at", { ascending: true })
      .limit(sampleLimit),
    db.schema("agency").from("integrations")
      .select("integration_key,state,endpoint,metadata,last_verified_at")
      .eq("integration_key", "hermes-cli")
      .maybeSingle(),
  ]);

  if (queueResult.error) return json({ error: "Dispatch queue query failed" }, 500);
  if (integrationResult.error) return json({ error: "Hermes integration query failed" }, 500);

  const hermes = assessHermesReadiness(
    integrationResult.data,
    executionUrlConfigured,
  );
  const pendingCount = (queueResult.data ?? []).filter((row) => row.status === "pending").length;

  return json({
    mode: "read_only_preflight",
    production_mutations: false,
    dispatch_started: false,
    pending_sample_count: pendingCount,
    queue_sample: (queueResult.data ?? []).map((row) => ({
      id: row.id,
      status: row.status,
      created_at: row.created_at,
    })),
    hermes: {
      ready: hermes.ready,
      reasons: hermes.reasons,
      endpoint_configured: executionUrlConfigured,
      recorded_state: integrationResult.data?.state ?? null,
      recorded_endpoint_type: integrationResult.data?.endpoint ?? null,
      last_verified_at: integrationResult.data?.last_verified_at ?? null,
    },
    pretest_ready: hermes.ready && pendingCount > 0,
  });
});

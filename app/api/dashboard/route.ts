import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: leads } = await supabase
    .from("leads")
    .select("id, company_name, lead_score, status, pipeline_value")
    .order("created_at", { ascending: false })
    .limit(20);

  const rows = leads ?? [];
  const qualified = rows.filter((lead: any) => ["qualified", "QUALIFIED", "appointment", "APPOINTMENT"].includes(lead.status)).length;
  const pipeline = rows.reduce((sum: number, lead: any) => sum + Number(lead.pipeline_value ?? 0), 0);

  return NextResponse.json({
    leads: rows,
    stats: {
      leads: rows.length,
      qualified,
      pipeline,
      activeMissions: 0,
    },
  }, { headers: { "Cache-Control": "no-store" } });
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signout } from "@/app/login/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) redirect("/login?next=/dashboard");

  const email = typeof data.claims.email === "string" ? data.claims.email : "";
  const { data: leads } = await supabase
    .from("leads")
    .select("id, company_name, lead_score, status, pipeline_value")
    .limit(10);

  return (
    <main style={{ maxWidth: 1100, margin: "40px auto", padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20 }}>
        <div>
          <p>AutoAI Protected Dashboard</p>
          <h1>Revenue Command Center</h1>
          <p>Signed in as {email}</p>
        </div>
        <form action={signout}><button type="submit">Sign out</button></form>
      </header>

      <section style={{ marginTop: 32 }}>
        <h2>Recent leads</h2>
        {!leads?.length ? <p>No leads available yet.</p> : (
          <div style={{ display: "grid", gap: 12 }}>
            {leads.map((lead) => (
              <div key={lead.id} style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
                <strong>{lead.company_name ?? "Unnamed company"}</strong>
                <div>Score: {lead.lead_score ?? "—"} · Status: {lead.status ?? "—"} · Pipeline: ${Number(lead.pipeline_value ?? 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

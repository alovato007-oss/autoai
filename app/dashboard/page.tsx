"use client";

import { useEffect, useMemo, useState } from "react";
import { signout } from "@/app/login/actions";

const fallback = { leads: [], stats: { leads: 0, qualified: 0, pipeline: 0, activeMissions: 0 } };

export default function DashboardPage() {
  const [data, setData] = useState<any>(fallback);
  const [status, setStatus] = useState("CONNECTING");
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const load = async () => { try { const res = await fetch("/api/dashboard", { cache: "no-store" }); if (!res.ok) throw new Error(); setData(await res.json()); setStatus("LIVE"); setLastSync(new Date()); } catch { setStatus("OFFLINE"); } };
  useEffect(() => { load(); const timer = window.setInterval(load, 5000); return () => window.clearInterval(timer); }, []);
  const missionText = useMemo(() => data.stats.activeMissions > 0 ? "EXECUTING" : "READY", [data.stats.activeMissions]);

  return <main className="jarvis-shell">
    <header className="jarvis-topbar"><div className="brand-wrap"><div className="bot-mark">◉</div><div><strong>JARVIS</strong><span> AGENCY COMMAND CENTER</span></div></div><div className="top-actions"><span className={`live-pill ${status === "LIVE" ? "live" : ""}`}><i /> {status}</span><form action={signout}><button className="ghost-btn">Sign out</button></form></div></header>
    <section className="jarvis-main">
      <div className="hero-row"><div><div className="eyebrow">AUTONOMOUS REVENUE OPERATIONS</div><h1>Agency Command Center</h1><p>One living dashboard for JARVIS, agents, missions, sales, evidence and verified outcomes.</p></div><div className="sync">Last sync<br/><b>{lastSync ? lastSync.toLocaleTimeString() : "—"}</b></div></div>
      <div className="dashboard-grid">
        <section className="bot-card panel"><div className="panel-label">JARVIS</div><div className={`jarvis-orb ${missionText === "EXECUTING" ? "working" : ""}`}><div className="orb-core">◉</div></div><div className="bot-state">{missionText}</div><div className="bot-copy">Command interface online. Ask JARVIS to execute a mission, inspect evidence, or review agency performance.</div><button className="chat-btn" onClick={() => alert("JARVIS chat interface is ready for the next command.")}>Open JARVIS Chat</button></section>
        <section className="panel metrics-panel"><div className="panel-label">AGENCY PULSE</div><div className="metric-grid"><Metric label="Leads" value={data.stats.leads}/><Metric label="Qualified" value={data.stats.qualified}/><Metric label="Pipeline" value={`$${Number(data.stats.pipeline).toLocaleString()}`}/><Metric label="Active Missions" value={data.stats.activeMissions}/></div><div className="operation-list">{[["LEAD CAPTURE","LIVE"],["AI FOLLOW-UP","READY"],["APPOINTMENT CONVERSION","READY"],["REVIEW + REFERRAL","READY"],["STRIPE BILLING","CONNECTED"]].map(([name,state]) => <div className="operation" key={name}><span>{name}</span><b>{state}</b></div>)}</div></section>
      </div>
      <section className="panel section-panel"><div className="section-head"><div><div className="panel-label">SALES PIPELINE</div><h2>Recent prospects</h2></div><span className="count">{data.leads.length} visible</span></div>{data.leads.length === 0 ? <div className="empty">No leads yet. New leads will appear here automatically.</div> : <div className="lead-table">{data.leads.map((lead: any) => <div className="lead-row" key={lead.id}><div><b>{lead.company_name || "Unnamed company"}</b><span>{lead.status || "NEW"}</span></div><strong>{lead.lead_score ?? "—"}</strong><strong>${Number(lead.pipeline_value || 0).toLocaleString()}</strong></div>)}</div>}</section>
      <section className="module-strip">{["MISSIONS","AGENTS","EXECUTIONS","EVIDENCE","VERIFICATION","VERIFIED","CLIENTS","REPORTS"].map((x,i)=><div key={x} className={`module ${i===5 ? "verified" : ""}`}><span>{i===5 ? "✓" : "●"}</span>{x}</div>)}</section>
    </section>
  </main>;
}
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="metric"><span>{label}</span><strong>{value}</strong></div>; }

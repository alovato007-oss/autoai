"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const stages = ["Discover", "Research", "Score", "Review", "Revenue"];

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState([
    ["Prospects Found", "—"],
    ["Qualified", "—"],
    ["Opportunities", "—"],
    ["Pipeline", "—"],
  ]);

  useEffect(() => {
    async function loadMetrics() {
      const { data, error } = await supabase
        .from("leads")
        .select("id, lead_score, status, pipeline_value");

      if (!error && data) {
        const qualified = data.filter((lead) => (lead.lead_score ?? 0) >= 80).length;
        const opportunities = data.filter((lead) => ["qualified", "opportunity", "won"].includes(String(lead.status).toLowerCase())).length;
        const pipeline = data.reduce((sum, lead) => sum + Number(lead.pipeline_value ?? 0), 0);
        setMetrics([
          ["Prospects Found", String(data.length)],
          ["Qualified", String(qualified)],
          ["Opportunities", String(opportunities)],
          ["Pipeline", `$${pipeline.toLocaleString()}`],
        ]);
      }
      setLoading(false);
    }
    loadMetrics();
  }, []);

  return (
    <div className="shell">
      <nav className="nav"><div className="brand">AUTOAI</div><div className="badge">MVP • Lead Engine</div></nav>
      <main className="main">
        <div className="eyebrow">Revenue Command Center</div>
        <h1 className="title">Turn market intelligence into pipeline.</h1>
        <p className="subtitle">AutoAI finds prospects, researches companies, scores opportunities, and turns qualified intelligence into a measurable sales pipeline.</p>
        <a className="cta" href="#pipeline">View Lead Engine</a>
        <div className="grid">{metrics.map(([label,value])=><div className="card" key={label}><div className="label">{label}</div><div className="value">{loading ? "…" : value}</div></div>)}</div>
        <section className="section" id="pipeline"><h2>Lead Engine Pipeline</h2><div className="pipeline">{stages.map((stage)=><div className="stage" key={stage}>{stage}</div>)}</div></section>
      </main>
    </div>
  );
}

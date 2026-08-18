"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const stages = ["Discover", "Research", "Score", "Review", "Revenue"];
const PAYMENT_LINK = "https://buy.stripe.com/dRm6oI18X6qAfSN4Qb83C04";

type ScoreResult = {
  score: number;
  priority: "low" | "medium" | "high";
  reasoning: string;
  recommended_action: string;
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [metrics, setMetrics] = useState([
    ["Prospects Found", "—"],
    ["Qualified", "—"],
    ["Opportunities", "—"],
    ["Pipeline", "—"],
  ]);

  useEffect(() => {
    async function loadMetrics() {
      if (!supabase) {
        setMetrics([
          ["Prospects Found", "Demo"],
          ["Qualified", "—"],
          ["Opportunities", "—"],
          ["Pipeline", "Connect Supabase"],
        ]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from("leads").select("id, lead_score, status, pipeline_value");

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
      } else {
        setMetrics([["Prospects Found", "0"], ["Qualified", "0"], ["Opportunities", "0"], ["Pipeline", "$0"]]);
        setMessage("Supabase is connected, but the leads table could not be read.");
      }
      setLoading(false);
    }
    loadMetrics();
  }, []);

  async function scoreLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setScoring(true);
    setMessage("");
    setResult(null);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const response = await fetch("/api/score-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Scoring failed");
      setResult(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Scoring failed");
    } finally {
      setScoring(false);
    }
  }

  return (
    <div className="shell">
      <nav className="nav">
        <div className="brand">AUTOAI</div>
        <div className="nav-right">
          <span className="status"><span className="dot" /> AI Revenue Engine</span>
          <div className="badge">LIVE OFFER</div>
        </div>
      </nav>

      <main className="main">
        <section className="hero">
          <div className="eyebrow">Revenue Command Center</div>
          <h1 className="title">Turn market intelligence into pipeline.</h1>
          <p className="subtitle">AutoAI finds prospects, researches companies, scores opportunities, and turns qualified intelligence into a measurable sales pipeline.</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a className="cta" href="#scorer">Score a Lead <span>→</span></a>
            <a className="cta" href={PAYMENT_LINK}>Start JARVIS Growth — $1,500/mo <span>→</span></a>
          </div>
        </section>

        <section className="grid" aria-label="Pipeline metrics">
          {metrics.map(([label, value]) => (
            <div className="card" key={label}>
              <div className="label">{label}</div>
              <div className="value">{loading ? "…" : value}</div>
            </div>
          ))}
        </section>

        <section className="section" id="pipeline">
          <div className="section-heading">
            <div><div className="eyebrow">Workflow</div><h2>Lead Engine Pipeline</h2></div>
            <span className="live-pill">LIVE SYSTEM</span>
          </div>
          <div className="pipeline">
            {stages.map((stage, index) => (
              <div className="stage" key={stage}><span className="stage-number">0{index + 1}</span><span>{stage}</span></div>
            ))}
          </div>
        </section>

        <section className="workspace" id="scorer">
          <div className="workspace-copy">
            <div className="eyebrow">AI Prospect Scoring</div>
            <h2>Know which prospects deserve attention.</h2>
            <p>Send a prospect through the AI scoring engine and get a 0–100 fit score, priority, reasoning, and recommended next action.</p>
          </div>

          <form className="score-form" onSubmit={scoreLead}>
            <label>Company name<input name="company_name" placeholder="Acme Manufacturing" required /></label>
            <div className="form-row">
              <label>Industry<input name="industry" placeholder="Manufacturing" /></label>
              <label>Location<input name="location" placeholder="Dallas, TX" /></label>
            </div>
            <label>Website<input name="website" placeholder="https://example.com" /></label>
            <label>Why is this a fit?<textarea name="fit_reason" placeholder="Growing company with manual sales and operations workflows." rows={3} /></label>
            <button className="score-button" disabled={scoring}>{scoring ? "Analyzing…" : "Run AI Score →"}</button>
            {message && <div className="notice">{message}</div>}
          </form>

          {result && (
            <div className="result">
              <div className="score-ring"><strong>{result.score}</strong><span>/100</span></div>
              <div>
                <div className={`priority priority-${result.priority}`}>{result.priority} priority</div>
                <h3>{result.recommended_action}</h3>
                <p>{result.reasoning}</p>
              </div>
            </div>
          )}
        </section>

        <section className="section" id="pricing">
          <div className="section-heading"><div><div className="eyebrow">Managed AI automation</div><h2>JARVIS Growth Automation</h2></div></div>
          <div className="card" style={{ maxWidth: 620 }}>
            <div className="label">Managed AI Revenue System</div>
            <div className="value">$1,500<span style={{ fontSize: 18, opacity: 0.6 }}>/month</span></div>
            <p style={{ opacity: 0.75, lineHeight: 1.6 }}>Lead qualification, personalized outreach, follow-up, appointment conversion, CRM updates, reporting, and verified JARVIS execution.</p>
            <a className="cta" href={PAYMENT_LINK}>Start JARVIS Growth →</a>
          </div>
        </section>

        <footer className="footer">AutoAI · JARVIS-powered business automation</footer>
      </main>
    </div>
  );
}

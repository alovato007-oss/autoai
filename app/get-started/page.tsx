"use client";

import { FormEvent, useState } from "react";

export default function GetStarted() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error ?? "Checkout is unavailable right now.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout is unavailable right now.");
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#07090d", color: "#f5f7fb" }}>
      <section style={{ width: "100%", maxWidth: 620, border: "1px solid #202631", borderRadius: 24, padding: 36, background: "#0d1118" }}>
        <div style={{ fontSize: 13, letterSpacing: 2, opacity: 0.65 }}>AUTOAI · AI REVENUE ENGINE</div>
        <h1 style={{ fontSize: 46, lineHeight: 1.05, margin: "16px 0" }}>Put your lead follow-up on autopilot.</h1>
        <p style={{ fontSize: 18, lineHeight: 1.6, opacity: 0.78 }}>AutoAI Lead Employee helps qualify prospects, prioritize opportunities, and turn follow-up into a measurable sales pipeline.</p>
        <div style={{ margin: "28px 0", padding: 22, borderRadius: 16, background: "#121822" }}>
          <strong style={{ fontSize: 24 }}>$499/month</strong>
          <div style={{ marginTop: 8, opacity: 0.7 }}>Growth plan · cancel anytime</div>
        </div>
        <form onSubmit={startCheckout}>
          <label style={{ display: "block", marginBottom: 10 }}>Business email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@company.com" style={{ width: "100%", boxSizing: "border-box", padding: "15px 16px", borderRadius: 12, border: "1px solid #303846", background: "#080b10", color: "inherit", fontSize: 16 }} />
          <button disabled={loading} style={{ width: "100%", marginTop: 14, padding: "16px 20px", border: 0, borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: loading ? "wait" : "pointer" }}>{loading ? "Opening secure checkout…" : "Start AutoAI →"}</button>
          {error && <p style={{ color: "#ff8b8b", marginTop: 14 }}>{error}</p>}
        </form>
        <p style={{ marginTop: 22, fontSize: 13, opacity: 0.55 }}>Secure subscription checkout powered by Stripe.</p>
      </section>
    </main>
  );
}

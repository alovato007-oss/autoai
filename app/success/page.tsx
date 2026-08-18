export default function SuccessPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ maxWidth: 640, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <p style={{ letterSpacing: ".12em", textTransform: "uppercase", opacity: 0.65 }}>AutoAI Pro</p>
        <h1>Welcome to AutoAI.</h1>
        <p style={{ fontSize: 18, lineHeight: 1.6, opacity: 0.8 }}>
          Your Stripe checkout was completed. We&apos;ll use the subscription event to activate your AutoAI workspace.
        </p>
        <a href="/" style={{ display: "inline-block", marginTop: 20 }}>Return to AutoAI →</a>
      </section>
    </main>
  );
}

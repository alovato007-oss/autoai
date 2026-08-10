import { login, signup } from "./actions";

type Props = { searchParams: Promise<{ error?: string; message?: string; next?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") ? params.next : "/dashboard";

  return (
    <main style={{ maxWidth: 480, margin: "80px auto", padding: 24 }}>
      <h1>Sign in to AutoAI</h1>
      <p>Access your protected revenue command center.</p>
      {params.error && <p role="alert">{params.error}</p>}
      {params.message && <p>{params.message}</p>}
      <form style={{ display: "grid", gap: 16, marginTop: 24 }}>
        <input name="email" type="email" placeholder="Email" required autoComplete="email" />
        <input name="password" type="password" placeholder="Password" required autoComplete="current-password" minLength={6} />
        <input type="hidden" name="next" value={next} />
        <div style={{ display: "flex", gap: 12 }}>
          <button formAction={login}>Sign in</button>
          <button formAction={signup}>Create account</button>
        </div>
      </form>
    </main>
  );
}

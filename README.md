# AutoAI / JARVIS

AutoAI is the application layer for a JARVIS-powered business automation system.

## Architecture

- **Next.js** — web application and API routes
- **Supabase** — authentication, operational data, and database-backed automation state
- **OpenAI** — AI scoring and agent intelligence
- **Stripe** — revenue and subscription infrastructure
- **n8n** — external workflow automation
- **Vercel** — application deployment

## Runtime flow

`User → Next.js → API → Supabase / OpenAI / Stripe → JARVIS state → Dashboard`

The `jarvis` operational data model should be the source of truth for missions, executions, evidence, and verification. Public dashboard state should be a read-only projection of that operational state.

## Local setup

1. Install Node.js 20+ and pnpm 9.
2. Copy `.env.example` to `.env.local`.
3. Fill in the required Supabase, OpenAI, and Stripe values.
4. Run `pnpm install`.
5. Run `pnpm dev`.

## Validation

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

Never commit `.env*` secrets, service-role keys, Stripe secrets, OpenAI keys, or generated build artifacts.

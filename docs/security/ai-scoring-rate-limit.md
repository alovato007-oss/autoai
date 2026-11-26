# AI prospect scoring protection

The public prospect-scoring page is available without signing in, but the paid model endpoint requires a valid Supabase session.

The endpoint enforces:
- A persistent per-user quota of 10 scoring attempts per rolling hour.
- An 8 KiB request-body ceiling.
- Field-specific input length limits and text-only values.
- A 15-second model timeout with automatic retries disabled.
- Strict validation of the model's JSON result before returning it.

## Database prerequisite

Apply `supabase/migrations/20261126000000_add_ai_scoring_rate_limit.sql` to the target environment before enabling the updated API route. The migration creates a private RLS-enabled counter table and a `SECURITY DEFINER` RPC that derives the caller from `auth.uid()`. Direct table access is revoked from browser roles; only authenticated users can execute the quota function.

The API fails closed with HTTP 503 if the quota RPC is unavailable. It returns HTTP 429 with `Retry-After: 3600` when the per-user quota is exhausted.

## Validation before release

1. Apply the migration in staging.
2. Confirm unauthenticated requests return 401 and do not call OpenAI.
3. Confirm 10 authenticated requests can proceed in one hour and request 11 returns 429.
4. Confirm a different authenticated user has an independent quota.
5. Confirm anonymous and authenticated clients cannot select or modify `ai_scoring_rate_limits`.
6. Confirm the quota resets after the configured window.
7. Deploy only after CI passes and staging tests succeed.

No production migration or deployment is performed by this pull request.

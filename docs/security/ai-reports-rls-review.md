# Database security review: AI reports

## Finding

The production database had two permissive SELECT policies on `public.ai_reports` for the `authenticated` role with an always-true predicate:

- `ai_reports_select_authenticated`
- `replace_with_policy_name`

PostgreSQL combines permissive policies with OR semantics, so these policies bypassed the intended organization-scoped `ai_reports_org_all` policy.

## Correction

The migration `20261127232803_scope_ai_reports_select_by_org.sql` removes only those two broad policies. It first verifies that the existing `ai_reports_org_all` policy still includes both `organization_id` and `current_user_organization_id()`; if that guard fails, the migration aborts.

## Verification

- The same policy correction was applied to the isolated `autoai-staging` project first.
- Staging then showed exactly one `ai_reports` policy: `ai_reports_org_all`, with the organization predicate intact.
- The production project was then updated with the same guarded correction.
- A production read-only verification confirmed the two broad policies are gone and the organization-scoped policy remains.
- No `ai_reports` rows were present in production at the time of the change.

## Remaining database observations

- The public legacy `jarvis_*` tables are marked as historical in `public.jarvis_canonical_source`; the canonical runtime uses the `jarvis` schema.
- Several operational tables still have browser-role grants even though RLS currently blocks row access. Review and remove unnecessary grants in a separately tested migration.
- Keep `public.stripe_webhook_events` inaccessible to browser roles.
- Review the remaining Supabase security-advisor findings before broadening access.

## Safety

Do not add broad `USING (true)` SELECT policies to organization data. Any future policy must be scoped to the current organization and tested against two distinct organizations in staging.

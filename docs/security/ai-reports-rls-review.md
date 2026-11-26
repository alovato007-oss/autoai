# Database security review: AI reports

## Finding

The connected Supabase project has row-level security enabled on `public.ai_reports`, but it also has two permissive SELECT policies for the `authenticated` role whose predicate is `true`:

- `ai_reports_select_authenticated`
- `replace_with_policy_name`

Because PostgreSQL combines permissive policies with OR, these policies defeat the existing organization-scoped `ai_reports_org_all` policy for authenticated users. The table contains report summaries and JSON report data, so cross-organization visibility is not acceptable.

## Proposed correction

The migration removes only the two broad SELECT policies and preserves `ai_reports_org_all`. Before dropping anything, it checks that the organization-scoped policy exists and contains both the organization key and the `current_user_organization_id()` predicate. If that safety condition is not met, the migration aborts.

## Other observations

- `public.jarvis_agency_dispatch_queue` and `public.jarvis_system_state` have SQL SELECT grants for anon/authenticated but RLS is enabled with no policies. Those grants do not by themselves expose rows; the current RLS state denies reads to those roles.
- `public.stripe_webhook_events` similarly has no RLS policies. Keep it inaccessible to browser roles.
- `public.jarvis_transition_rules` has an authenticated SELECT policy with a true predicate. Its columns are status transitions, evidence type, verification requirement, and enabled state. This appears to be operational configuration rather than customer report data; confirm the intended visibility before changing it.
- `public.ai_insights` has a public SELECT policy, but current anon/authenticated table SELECT grants are absent. The policy is currently inert for those roles; remove or replace it before adding any browser grants.

## Deployment gate

This migration has **not** been applied to the connected production project. Apply it first to a staging database, verify that a user can read only their own organization's reports and cannot read another organization's reports, then schedule production rollout with rollback prepared.

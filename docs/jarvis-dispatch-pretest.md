# JARVIS / Agency dispatch pre-test

## Safety boundary

This change adds a **read-only preflight** only. It does not claim queue rows, create missions or tasks, call Hermes, modify CRM leads, or change production data. It must be deployed with Supabase Edge Function JWT verification enabled.

The Supabase project currently records the Hermes integration as `configured`, endpoint `local-cli`, with `live_remote_execution=false` and no `last_verified_at`. A local CLI process cannot be invoked by a hosted Supabase Edge Function. A secured remote Hermes execution endpoint and credential must be configured before a real dispatch worker can be enabled.

## Verified database facts

- `public.jarvis_agency_dispatch_queue` has seven rows in `pending` state.
- The queue columns currently include only `id`, `organization_id`, `lead_id`, `status`, `created_at`, and `updated_at`.
- The queue currently has no attached non-internal trigger.
- `agency.tasks` and `agency.task_executions` are separate tables; the latter defaults its runtime to `hermes`.
- `agency.integrations` records Hermes as local CLI only and not live-verified.

## Why the stale rows are not replayed

The seven rows are dated September 1, 2026. They may represent historical leads and do not contain an idempotency key, retry count, claim timestamp, or payload snapshot. Do not replay them automatically. First reconcile each lead against current CRM state and establish a deduplication policy.

## Required next implementation

1. Add a reviewed SQL migration for atomic queue claiming using `FOR UPDATE SKIP LOCKED`, explicit lease/attempt fields, and service-role-only execution.
2. Configure a remote Hermes gateway with authentication, request signing, timeouts, idempotency keys, and callback verification.
3. Implement a worker that creates an Agency mission/task and records a task execution only after Hermes acknowledges and returns evidence.
4. Keep a hard production side-effect allowlist; the first mission must be a synthetic, read-only task with no customer email, CRM mutation, billing, or external writes.
5. Verify the result independently and pause for CEO approval.

## Test gates

- Unit tests for readiness and queue-claim logic.
- Integration test against a non-production Supabase database.
- Authentication rejection test for non-service-role callers.
- Idempotency/retry test proving duplicate delivery cannot create duplicate missions.
- Hermes callback signature and replay-protection tests.
- End-to-end test requiring actual runtime evidence, not caller-supplied success fields.

## Current pre-test decision

**Blocked** until a remote Hermes execution endpoint is configured and independently verified. The read-only preflight is not itself an execution test.

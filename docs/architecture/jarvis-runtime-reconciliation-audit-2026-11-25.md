# Follow-up status — 2026-11-27

This section records changes made after the historical audit below.

- AutoAI main CI was repaired. The latest merged main workflow now passes Node regression tests, Deno Hermes readiness contract tests, TypeScript validation, and the Next.js production build.
- The production `public.ai_reports` table had two permissive always-true SELECT policies. A guarded migration was verified in staging, applied to production, and recorded in GitHub. The organization-scoped policy remains.
- The private AI scoring quota table and authenticated RPC were added to production. The fixed limit is 10 attempts per authenticated user per rolling hour; browser roles have no table privileges.
- The Hermes readiness preflight now requires a timestamped, verified HTTPS endpoint and an exact match with `HERMES_EXECUTION_URL`. A local CLI configuration cannot be marked remotely ready.
- The Agency repository still documents a local Hermes CLI runtime; it does not yet provide a reachable, authenticated remote ACP gateway for hosted JARVIS dispatch. That gap is tracked separately and no live Hermes mission has been run.
- Vercel currently links the production project to `agentic-ai-task-orchestrator`, not the `autoai` repository. Do not assume changes merged to `autoai` automatically deploy to Vercel.
- The deployed Agentic app's API routes still require an owner-authentication design before they can safely expose AI execution or revenue telemetry. See the P0 security issue in that repository.

# JARVIS Runtime Reconciliation Audit

**Audit date:** 2026-11-25  
**Scope:** Read-only inspection of the AutoAI GitHub repository, the Hermes repository, and the connected Supabase project.  
**Production changes:** None. No production records were inserted, updated, or deleted. No Edge Function was invoked.

## Executive decision

Keep AutoAI as the Next.js application and JARVIS as the orchestration/control plane. Keep Hermes as a separate execution runtime behind an authenticated ACP boundary. Supabase remains the operational source of truth. Do not create another mission/dispatch schema and do not relabel the unrelated Railway Shiplify services.

## Confirmed database state

The connected Supabase project already contains a canonical `jarvis` schema with:

- `jarvis.missions`, `jarvis.tasks`, `jarvis.agents`
- `jarvis.executions`, `jarvis.verifications`, `jarvis.approvals`
- `jarvis.events`, `jarvis.mission_evidence`, `jarvis.memories`
- `public.jarvis_system_state` as a separate public state projection

There are overlapping legacy/parallel models in `public` and `agency`, including `public.jarvis_missions`, `agency.missions`, `agency.tasks`, and `agency.task_executions`. These models must not be treated as interchangeable with `jarvis.missions` and `jarvis.tasks`. New runtime work should target the canonical `jarvis` schema unless a deliberate migration plan says otherwise.

The live database currently reports seven rows in `public.jarvis_agency_dispatch_queue` with status `pending`. Existing canonical records include six execution rows with status `succeeded`, but a stored status alone does not establish that Hermes performed the work.

## Confirmed application mismatch

The repository README describes the intended AutoAI/JARVIS architecture. However, `app/page.tsx` currently renders a lead-generation and lead-scoring landing page, queries `public.leads`, and labels the workflow as a live system. It does not render the canonical JARVIS mission, task, approval, execution, evidence, and verification state.

The `public.leads` table is real and has nine rows, so the query is not necessarily a missing-table bug. The mismatch is product identity and operational visibility: lead pipeline metrics are being presented in place of JARVIS runtime health.

## Hermes ACP implementation found

A repository named `alovato007-oss/hermes-agent` exists in the connected GitHub account. Its `pyproject.toml` declares the `acp` extra with `agent-client-protocol==0.9.0` and exposes the `hermes-acp` executable through `acp_adapter.entry:main`. The inspected `acp_adapter/entry.py` starts `HermesACPAgent` with `acp.run_agent`; `acp_adapter/server.py` implements that ACP agent and wraps the Hermes `AIAgent`.

This confirms there is a real ACP server implementation in the Hermes repository. It does **not** yet confirm that a reachable Hermes process is deployed, authenticated, configured with the required model/provider credentials, or able to accept a JARVIS task from the current environment. The repository identifies Nous Research as the upstream project; do not treat the existence of this source tree as proof that our JARVIS integration is already wired.

## Execution-path defects and risks

1. `jarvis-orchestrator-v3` creates a canonical mission and task, then calls `jarvis-agent-execute-v3` with `success: true`, a caller-provided result, and caller-provided evidence. This records an execution result but does not call Hermes or prove an external runtime executed the task.
2. `jarvis-agent-execute-v3` accepts the result/evidence payload and writes it as a successful execution. It is an execution recorder, not a Hermes adapter.
3. `jarvis-verifier-v4` checks completed tasks, succeeded execution records, and persisted mission evidence. Those checks are useful consistency checks, but evidence supplied by the orchestrator can still be fabricated unless it is bound to a trusted Hermes execution receipt.
4. `jarvis-agency-service` expects the orchestrator response to contain nested `mission.id` and `task.id`, while the inspected `jarvis-orchestrator-v3` returns `mission_id` and `task_id` at the top level. This response-contract mismatch can break the service workflow.
5. Multiple one-time E2E Edge Functions are deployed with JWT verification disabled, including `jarvis-e2e-runner-once`, `jarvis-e2e-runner-once-v2`, `jarvis-agency-e2e-once`, and `jarvis-agency-verifier-once`. One inspected agency E2E runner contains a hardcoded lead ID and a static run key. Do not invoke these public test endpoints or rely on them as production test harnesses.
6. The `jarvis-outbound-dispatch` function can send real email when its provider credentials are configured. It is not the Hermes mission dispatcher and must remain separately gated.

## Required target contract

A trustworthy JARVIS mission lifecycle should be:

1. JARVIS creates a mission and one or more queued tasks in `jarvis`.
2. Approval policy is evaluated before any side effect. Tasks requiring approval remain blocked until an approval record is approved.
3. A dedicated worker claims eligible tasks atomically and sends a signed, idempotent execution request to Hermes over ACP.
4. Hermes returns a verifiable execution receipt containing the task/mission identifiers, runtime identity, request hash, result reference, timestamps, and outcome.
5. JARVIS stores the receipt and evidence without allowing the caller to self-assert successful execution.
6. The verifier checks the trusted receipt, expected postconditions, and persisted evidence. Only a passing verification may transition the mission to `VERIFIED`.
7. Failed, timed-out, or unverifiable work remains failed/retryable and is never silently marked complete.

## Safe implementation sequence

- **Phase 1: contract and visibility.** Document the canonical schema and runtime contracts; change the AutoAI dashboard to show actual JARVIS state rather than claiming unverified live operation.
- **Phase 2: worker.** Implement a separate, authenticated, idempotent dispatch worker. Do not drain or mutate the seven existing pending queue rows until their intended contract and age are understood.
- **Phase 3: Hermes adapter.** Connect the JARVIS worker to the existing Hermes ACP server. Define authentication, request identity, timeout/cancellation behavior, and a trusted receipt format before permitting execution.
- **Phase 4: isolated test.** Bring up a dedicated Hermes test process and use a disposable JARVIS mission with no email, payment, CRM, or production side effects. Confirm a Hermes receipt is persisted and independently verified.
- **Phase 5: rollout.** Only after tests pass, consider queue migration/consumption and production deployment with explicit approval.

## Deployment constraints

- Vercel project creation for this repository was previously denied by the connected account's permissions. The visible Vercel team does not currently show this repository as a linked project.
- Railway's prior trial-expired state prevented creating a dedicated worker project. Existing Shiplify services have malformed configuration and must not be renamed or repurposed without confirming their source and ownership.
- No deployment, database migration, production function update, or outbound action was performed during this audit.

## Immediate next engineering task

Prepare the AutoAI feature branch for a read-only JARVIS operations dashboard and define the Hermes ACP request/receipt contract. Then validate the Hermes process in isolation before adding a real dispatch worker. Keep all runtime execution disabled until the receipt contract and isolated test pass.

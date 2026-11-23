# JARVIS → Hermes ACP pre-test

## What this proves

The one-shot Edge Function in `supabase/functions/jarvis-hermes-pretest/index.ts` creates a dedicated JARVIS mission and task, calls the authenticated Hermes ACP sidecar with a fixed mission key, persists the actual Hermes response as an execution and mission evidence, then invokes `jarvis-verifier-v4`.

It deliberately does **not** call `jarvis-agent-execute-v3`, because that deployed function currently accepts a caller-supplied success flag/result and therefore cannot prove Hermes ran.

## Paired Hermes component

The sidecar lives in the Hermes repository under `integrations/jarvis_acp_bridge/` on branch `jarvis/dispatch-bridge-pretest`. It runs next to Hermes because the current ACP entry point is stdio, not a network endpoint.

## Required Supabase Edge Function secrets

Set these only in an isolated pre-test project/environment before deployment:

- `JARVIS_PRETEST_ENABLED=true`
- `JARVIS_PRETEST_CALLER_SECRET` — secret sent in `x-jarvis-pretest-secret`
- `JARVIS_PRETEST_MISSION_KEY=jarvis-hermes-pretest-v1`
- `HERMES_ACP_BRIDGE_URL` — full HTTPS URL ending in `/v1/pretest`
- `HERMES_ACP_BRIDGE_TOKEN` — must match the sidecar's `JARVIS_DISPATCH_TOKEN`

The Hermes sidecar must use the same mission key as `JARVIS_PRETEST_MISSION_ID`.

The function also requires the normal Supabase `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` runtime secrets. It must be deployed with JWT verification enabled.

## Safety and current state

- The function is one-shot: it refuses to create a second mission with the configured mission key.
- It records success only after the bridge returns the exact response token from Hermes.
- It records the execution and evidence before asking the existing verifier to verify the mission.
- A bridge failure is recorded as a failed task and a retryable mission; no synthetic success is written.
- The sidecar is disabled by default and accepts only the configured mission key.
- The sidecar prompt requests no tool use, but does not yet hard-disable every built-in Hermes tool. Use a disposable Hermes profile/workspace without production tool credentials.
- The sidecar's local idempotency cache is process-local. The durable one-shot mission key in JARVIS is the duplicate guard for this pre-test.

## Not yet done

Neither component has been deployed or invoked. The live ACP handshake, Edge Function runtime behavior, evidence persistence, and verifier result remain untested. Do not enable the feature or run the pre-test until the sidecar is hosted behind authenticated HTTPS and configured with a disposable Hermes profile.

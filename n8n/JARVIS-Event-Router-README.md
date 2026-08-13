# JARVIS n8n Core Event Router

This folder contains the first n8n orchestration layer for the JARVIS agency.

## Role

n8n is the workflow/orchestration layer. Supabase remains the machine-readable system of record; Stripe owns billing; Linear owns mission/task state; the JARVIS orchestrator executes agent work; the Command Center displays live state.

## Import

Import `JARVIS-Event-Router.json` into the n8n instance.

## Environment values

Configure these n8n environment variables or replace the placeholders with credentials managed by n8n:

- `SUPABASE_EVENT_INGEST_URL` — authenticated endpoint that persists normalized events.
- `SUPABASE_SERVICE_ROLE_KEY` — server-side secret; never expose client-side.
- `JARVIS_ORCHESTRATOR_URL` — authenticated JARVIS orchestrator endpoint.
- `JARVIS_INTERNAL_TOKEN` — internal service credential.
- `LINEAR_EVENT_URL` — endpoint/adapter that maps event state to Linear missions/issues.
- `LINEAR_API_KEY` — server-side Linear credential.

## Canonical event envelope

```json
{
  "event_id": "uuid",
  "event": "lead.created",
  "received_at": "2026-08-13T00:00:00.000Z",
  "source": "website",
  "payload": {}
}
```

## Supported routes in v1

- `lead.created`
- `lead.missed_call`
- `appointment.booked`
- `stripe.subscription.updated`
- `verification.completed`

Additional routes should follow the same event-envelope contract.

## Operating rule

EXECUTED is not VERIFIED.

Mission lifecycle:

`PLAN → EXECUTE → CAPTURE EVIDENCE → VERIFY → UPDATE MEMORY → REPORT`

## Deployment status

The workflow package has been committed to GitHub. n8n itself is not connected to this ChatGPT session, so activation/import into the user's live n8n workspace must be performed in that n8n instance.

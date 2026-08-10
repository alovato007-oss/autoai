# JARVIS Batch Approval Schema

Each approval batch should contain:

- `batch_id`
- `created_at`
- `asset_id`
- `summary`
- `risk_level`
- `actions[]`
- `reason`
- `expected_effect`
- `rollback_or_recovery`
- `expires_at`

Each action should contain:

- `action_id`
- `category`
- `description`
- `target`
- `impact`
- `reversible`
- `requires_approval`
- `status`

Allowed statuses: `queued`, `approved`, `rejected`, `executing`, `completed`, `failed`, `cancelled`.

Approval policy:
- Routine reversible diagnostics/maintenance may be autonomous when explicitly configured.
- Consequential actions are queued together and require explicit owner approval before execution.
- Failed actions must be reported and must not silently retry destructive operations.

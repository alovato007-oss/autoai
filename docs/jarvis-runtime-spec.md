# JARVIS Runtime Infrastructure Specification

## Mission
JARVIS is a separate operations, intelligence, and asset-development system. Phase 1 manages AutoAI (Asset #1) and the Creative Platform (Asset #2) without merging either asset into JARVIS.

## Runtime truth
JARVIS must never fabricate live status, revenue, agent activity, health, completion, or telemetry. If a source is unavailable, the UI must show an explicit unavailable/unknown state.

## Architecture

Real systems -> Integration/service layer -> Event + state store -> JARVIS orchestrator -> Mission Control UI

The orchestrator coordinates specialized agents, missions, approvals, and verification.

## Action lifecycle

Plan -> approval when required -> execute -> verify -> record -> display

## Specialized agents

- Operations Agent: mission/task coordination
- Intelligence Agent: research and analysis
- Developer Agent: code changes and tests
- Revenue Agent: revenue and KPI analysis
- DevOps Agent: deployment and infrastructure diagnostics
- Database Agent: approved database operations
- Creative Director Agent: cinematic creative planning
- QA Agent: verification and regression checks
- Approval Agent: batch consequential actions for owner approval
- Chief JARVIS Agent: orchestration and reporting; not unrestricted authority

## Managed assets

- Asset #1: AutoAI — business automation/revenue platform
- Asset #2: Creative Platform — independent cinematic image/video platform

## Permission model

Integrations must distinguish read-only access from write/execute access. Consequential external actions require explicit owner approval. Credentials and data remain isolated by asset.

## Learning system

JARVIS may learn from approved operational data by maintaining a versioned knowledge base of observations, outcomes, failures, verified fixes, and user-approved operating rules. Learning must be auditable, source-linked, and reversible. JARVIS must not silently rewrite its own authority, permissions, safety rules, or production code based on learned data.

## Event and state requirements

Events should capture source, event type, asset ID, timestamp, correlation/mission ID, payload metadata, and verification status. State should be derived from recorded events and current provider checks where applicable.

## Mission requirements

Every mission records creation, plan, agent assignments, proposed actions, approval batches, executions, verification results, events, and final report.

## Operational requirement

A production deployment is not considered fully operational until real integrations, persistent state, background execution, health checks, authentication/authorization, audit logging, tests, and browser verification are connected and passing. Until then, Mission Control must clearly identify unconnected capabilities.

# Staging Baseline Reconstruction Audit

Date: 2026-11-27
Repository: alovato007-oss/autoai
Production project: gdlhatzkipcjycsiufes
Staging project: xwnyixtgybtmiekltpag

## Verified source state

- Production Supabase migration history: 123 entries (read-only inspection).
- Staging Supabase migration history: 2 entries (read-only inspection).
- Staging public schema: 1 table (read-only inspection).
- Production public schema inventory: 75 base tables, 9 views, 192 indexes, 244 constraints, 69 RLS policies, 11 non-internal triggers, and 157 public functions.
- The repository `main` branch's `supabase/migrations` directory currently exposes only one SQL migration file.
- The PR #21 branch contains the AI scoring rate-limit migration.
- The PR #19 branch contains the AI reports organization-scope migration.
- These feature-branch migrations are not a complete historical source for the 123 production migration records.

## Safety decision

Do not replay the production migration history blindly and do not mark the staging baseline complete based on migration-count reconciliation alone. The available repository migration directory does not contain the complete historical source set. Some historical migrations may include data changes, external side effects, assumptions about existing roles/extensions, or environment-specific operations.

No production schema, data, migration history, or deployment was changed during this audit.

## Next safe reconstruction steps

1. Export a schema-only definition from the production catalog: tables, columns, defaults, generated/identity definitions, sequences, constraints, indexes, views, functions, triggers, grants, RLS enablement, and policies. Do not export table data, secrets, auth users, or storage objects.
2. Separate schema objects from environment-specific configuration and data migrations.
3. Build an ordered, reviewed staging baseline from the schema-only export and repository-owned migration sources.
4. Apply the baseline only to the separate staging project.
5. Compare object inventories and definitions between production and staging.
6. Run authenticated tests for AI scoring quota enforcement and organization isolation, including cross-organization negative tests.
7. Only after those checks pass, use staging results to review and merge PRs.

## Known blockers

- Full historical migration SQL is not present in the repository's current main migration directory.
- A complete schema-only export and dependency-ordered baseline have not yet been generated.
- Staging has not passed schema parity or security regression testing.

This file is an audit record, not a migration and not authorization to modify production.

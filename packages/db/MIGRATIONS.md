# Database Migration Policy (Phase 00 / F-DV-01)

> Ratified 2026-08-23 (D1–D4). This incident cost the platform its reproducibility: six driver migrations were created but never committed, while shared environments received their schema via `prisma db push`. Result: production ran a schema no migration could reproduce and every driver status write failed. This document is the guardrail.

## Rules

1. **Migrations are the only way schema reaches a shared environment.** `prisma db push` is permitted ONLY against a disposable local database you alone own. It must never touch dev-shared, staging, or production databases.
2. **Every `schema.prisma` change ships with its migration in the same PR.** The CI drift gate (`db-drift.yml`) enforces this mechanically — it fails when migrations replay into anything other than exactly the schema.
3. **Never edit an applied migration.** Add a new one. Timestamps order execution lexicographically; keep names prefixed with the phase/finding for traceability.
4. **Enum labels cannot be dropped in PostgreSQL.** When retiring a label (e.g. baseline's `EN_ROUTE`, license `'A'`), leave it in place unused and map data forward in a follow-up step of the same release.
5. **New enum values cannot be USED in the transaction that adds them.** Split value-addition and data-mapping into two migrations (see `20260823000000_phase00_driver_enum_repair_values` → `_data`).

## Playbook — committing previously-untracked migrations to an existing environment

If migrations were applied to some environment *without* being in git (via push, console, or manual SQL), committing them makes the next `migrate deploy` attempt to re-execute them there. Before that deploy runs:

```sh
# 1. Inspect what the environment actually recorded (read-only):
pnpm --filter @moja/db exec tsx scripts/inspect-migration-state.ts

# 2. For every untracked-but-already-applied migration NOT shown as RECORDED:
pnpm --filter @moja/db exec prisma migrate resolve --applied <migration_name>

# 3. Re-run inspect — everything committed must read RECORDED before deploying.
```

Never `resolve --applied` a migration whose SQL has NOT run on that environment — that lies to the ledger.

## Verification tooling

- **Drift gate:** `.github/workflows/db-drift.yml` — replays all migrations into an empty PostGIS 16.3 shadow and fails on any divergence from `schema.prisma`. Runs on PRs and master pushes.
- **Clean-volume rehearsal:** `deploy/maintenance/rehearse-clean-deploy.sh` — destroys the local compose stack, rebuilds from scratch, migrates, checks enum sets + ledger + `/api/health`. Run before any release touching migrations.

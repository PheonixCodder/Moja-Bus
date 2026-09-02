# Database Migration Policy (Phase 00 / F-DV-01)

> Ratified 2026-08-23 (D1–D4). This incident cost the platform its reproducibility: six driver migrations were created but never committed, while shared environments received their schema via `prisma db push`. Result: production ran a schema no migration could reproduce and every driver status write failed. This document is the guardrail.

## Rules

1. **Migrations are the only way schema reaches a shared environment.** `prisma db push` is permitted ONLY against a disposable local database you alone own. It must never touch dev-shared, staging, or production databases.
2. **Every `schema.prisma` change ships with its migration in the same PR.** The CI drift gate (`db-drift.yml`) enforces this mechanically — it fails when migrations replay into anything other than exactly the schema.
3. **Never edit an applied migration.** Add a new one. Timestamps order execution lexicographically; keep names prefixed with the phase/finding for traceability.
4. **Enum labels cannot be dropped in PostgreSQL.** When retiring a label (e.g. baseline's `EN_ROUTE`, license `'A'`), leave it in place unused and map data forward in a follow-up step of the same release.
5. **New enum values cannot be USED in the transaction that adds them.** Split value-addition and data-mapping into two migrations (see `20260823000000_phase00_driver_enum_repair_values` → `_data`).
6. **Never use a pooler URL for migration commands.** `prisma migrate dev`, `prisma migrate deploy`, `prisma migrate diff`, and `prisma db pull` require a direct (non-pooler) PostgreSQL connection. Always use `DATABASE_URL_DIRECT` for CLI commands. The runtime `DATABASE_URL` may point to a Neon pooler — that is correct for the application, not for the CLI.

## Connection URL Setup (Neon)

Two variables are required in `.env.local`:

```env
# Pooler URL — runtime app queries only (PgBouncer transaction mode)
DATABASE_URL="postgresql://...@...-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Direct URL — prisma migrate / diff / pull / db pull only
DATABASE_URL_DIRECT="postgresql://...@....c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

The `schema.prisma` datasource uses both: `url` for runtime, `directUrl` for CLI commands. Prisma selects the right one automatically.

## Known Anomalies

### Duplicate timestamp: 20260822000000
Two migrations share this timestamp:
- `20260822000000_phase17_user_role_driver_enum`
- `20260822000000_phase18_assignment_race_safety`

Ordering is deterministic (lexicographic by full directory name, `phase17` < `phase18`) and has been applied correctly in all environments. **Do NOT rename either directory** — it would break the migration ledger. For all future migrations on the same date, use a unique suffix: `20260822000001_...`.

### Naming inconsistency: phase3_ (should be phase03_)
Migration `20260826000000_phase3_one_active_exclusive_per_driver` uses a non-padded phase number. Cannot be renamed. All future phase numbers must be zero-padded: `phase01_`, `phase02_`, ... `phase09_`, `phase10_`.

### Modified migration checksums (resolved 2026-09-01)
Migrations `20260816120000_voucher_schedule_scope` and `20260818000000_remove_legacy_monetary_vouchers` had their SQL files modified after being applied to the Neon testing DB (defensive `IF NOT EXISTS` / `DO $$ BEGIN ... EXCEPTION` guards were added Aug 20). The production DB was migrated after the edits so its checksum is correct. The Neon testing DB checksum was corrected by direct `UPDATE _prisma_migrations SET checksum = '...'` on 2026-09-01.

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

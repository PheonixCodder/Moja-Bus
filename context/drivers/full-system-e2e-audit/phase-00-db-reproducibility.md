# Phase 00 — Database Reproducibility & Migration Drift

> **Closes:** F-DV-01 (P0) · **Wave 1 — must run before everything else.**
> **Status: 🟡 CODE LANDED (branch `phase-00-db-reproducibility`) — verification pending** (D10 introspection + rehearsal run + CI drift gate first pass).
> **Ratified 2026-08-23:** D1-A forward-fix · D2-A defensive mapping · D3-A `migrate diff` shadow gate · D4-A manual-first rehearsal. Tracker-reconciliation moved OUT to Phase 36.
> Evidence: `03-driver-registration-auth.md` §Findings; baseline `migration.sql:15-40` vs `schema.prisma:229-255`; **six** untracked dirs (audit said five); prod impact confirmed — CI images build from git checkouts, so untracked migrations never reached the `migrate` image, and every master push runs `migrate deploy` against production, which is live with legacy enums today.

## Objective
A clean machine running `docker compose run --rm migrate` against an empty volume produces a database the entire application works against; no environment can silently diverge from `schema.prisma` again.

## Tasks (final, ratified)
- [x] Write durable read-only introspection script → `packages/db/scripts/inspect-migration-state.ts`
      (enum label sets, `_prisma_migrations` ledger w/ per-untracked-migration RECORDED flag, driver-table row counts).
- [ ] **Run it on every live environment** (D10): `pnpm --filter @moja/db exec tsx scripts/inspect-migration-state.ts`.
      For any env where an untracked migration shows NOT_RECORDED but its objects exist:
      `prisma migrate resolve --applied <name>` BEFORE that env's next deploy (phase18 contains destructive duplicate-repair DELETEs).
- [x] Commit the six untracked migration dirs (phase09, phase11, phase12, phase17_user_role_enum, phase18_race_safety, phase17_cleanup).
- [x] Enum repair per D1-A/D2-A, split per repo precedent (new values can't be USED in their adding transaction):
      - `20260823000000_phase00_driver_enum_repair_values` — adds ON_DUTY/ON_TRIP/RESTING/EXPIRED/CONTRACTOR_URBAN/HYBRID (`IF NOT EXISTS`, idempotent for db-push'd envs); `'A'` license label documented as unrecoverable-but-harmless.
      - `20260823000001_phase00_driver_enum_repair_data` — defensive mapping EN_ROUTE→AVAILABLE, ON_BREAK→RESTING, IN_REVIEW→PENDING, SHARED_CONTRACTOR/CASUAL→CONTRACTOR_URBAN (affiliations + offers).
- [x] Drift gate per D3-A → `.github/workflows/db-drift.yml`: replays all migrations into empty `postgis/postgis:16-3.4-alpine` shadow (compose-parity engine) and fails on ANY divergence (`migrate diff --exit-code`). Runs on PRs + master pushes.
- [x] Clean-volume rehearsal per D4-A → `deploy/maintenance/rehearse-clean-deploy.sh` (down -v → build → migrate → enum assertions → zero-pending-ledger assert → health). Manual, per-release.
- [x] Root-cause guardrail → `packages/db/MIGRATIONS.md`: migrations-only policy for shared envs, db-push ban, never-edit-applied rule, resolve-playbook.

## Acceptance criteria
- Fresh empty-volume deploy boots the full app with zero migration errors and zero manual SQL. *(rehearsal script)*
- `startTrip`, `toggleShift`, `updateMyStatus`, offer creation, preference save succeed on the fresh DB. *(post-deploy smoke)*
- CI fails when a schema change lacks a migration. *(db-drift workflow — prove once with a deliberate break)*

## Remaining to close the phase
1. ~~Run introspection on dev Neon (+ any staging) → apply resolves if needed.~~ **DONE 2026-08-23**: dev introspected — all six NOT_RECORDED; legacy enums; `service_preference`/`offer` tables missing ⇒ nothing to resolve, everything must RUN.
2. Merge branch → watch `db-drift.yml` go green; one deliberate red run to prove the gate bites.
3. User runs rehearsal script locally before next release.
4. Green gates: `turbo typecheck` unaffected (scripts/ excluded from db tsconfig).

## Rehearsal findings & fixes (2026-08-23, this session)
- **Rehearsal FAILED initially**: `relation "Operator" does not exist` at phase17_driver_operator_cleanup. Root cause NOT a tree/table-case divergence as first read — schema.prisma @@maps Operator→`"operator"` (line 796), but the hand-written migration referenced `"Operator"/"User"/"DriverProfile"`. **Fixed by editing the migration in place** (documented exception: these six dirs were untracked + RECORDED nowhere + had never replayed anywhere; file header carries the ruling).
- **Drift enumeration exposed more holes** → new final migration `20260823235959_phase00_schema_convergence`: creates `promo_banner`+`BannerActionType` (model existed with NO migration!), rebuilds DriverEmploymentType/DriverStatus/DriverVerificationStatus/LicenseCategory/InstrumentType/RefundChannel to exact datamodel label sets (ADD VALUE can't remove legacy labels), aligns driver-family updatedAt defaults + referral_program.id default, maps license 'A'→'B' defensively before casts.
- **RESULT: clean-volume replay completes AND drift diff = EMPTY (exit 0)** on real Postgres 16 (Neon scratch `moja_probe_tmp`). End-state enums verified exact incl. UserRole+DRIVER.
- **db-drift.yml updated for current Prisma CLI** (`--from-url`/`--shadow-database-url` removed → replay via `migrate deploy` into shadow then `--from-config-datasource --to-schema --exit-code`). Old flag set would have errored at runtime — second latent gate bug caught before first CI run.
- Scratch DB `moja_probe_tmp` now holds a FULLY CONVERGED empty database → use it as the target for Phase 02–06 service-level probes; drop after probes/staging land.

## Risks / rollback
Enum ADD VALUE cannot run in a tx that uses the value — solved by the two-step split. `resolve --applied` must only ever mark migrations whose SQL truly ran (playbook warning). Rehearsal destroys local compose volume by design — banner-documented.

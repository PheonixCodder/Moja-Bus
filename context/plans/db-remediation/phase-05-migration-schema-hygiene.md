# Phase 5 — Migration Tree & Schema Hygiene

> **Priority**: 🟠 HIGH — Execute within 2 weeks  
> **Findings addressed**: DB-07, DB-08, DB-09, DB-11, DB-21, DB-22, DB-23, DB-24, DB-25  
> **Goal**: Clean up migration naming inconsistencies, eliminate dual sources of truth, document abandoned legacy code, plan for schema growth  
> **Estimated effort**: 4–6 hours  
> **Risk**: Low-Medium — naming changes are documentation/metadata only; schema/model changes require new migrations

---

## Task 5.1 — Document and Annotate Duplicate Timestamp Issue

> **Addresses**: DB-07

Two migrations share timestamp `20260822000000`:
```
20260822000000_phase17_user_role_driver_enum
20260822000000_phase18_assignment_race_safety
```

### Why this cannot be renamed

Prisma's `_prisma_migrations` table records the migration by its directory name. If the directory name changes, Prisma sees a new migration that hasn't been applied, and `prisma migrate deploy` will try to re-run it, failing because the SQL is idempotent only in some places.

### Solution — Annotate in MIGRATIONS.md, not rename

Add to `packages/db/MIGRATIONS.md`:

```markdown
## Known Anomalies

### Duplicate timestamp: 20260822000000
Two migrations share this timestamp:
- `20260822000000_phase17_user_role_driver_enum`
- `20260822000000_phase18_assignment_race_safety`

Ordering is deterministic (lexicographic by full directory name, phase17 < phase18)
and has been applied correctly in all environments. Do NOT rename either directory.
For all future migrations on the same date, increment the time component by at least
1 second (e.g., `20260822000001_...`).
```

### Enforcement for future migrations

Add to the PR checklist from Phase 3:
```markdown
- [ ] Migration timestamp is unique — no two migration directories share the same prefix
```

---

## Task 5.2 — Document Naming Inconsistency: `phase3_` vs `phase03_`

> **Addresses**: DB-08

Migration `20260826000000_phase3_one_active_exclusive_per_driver` uses `phase3_` without zero-padding. This is inconsistent with all other migrations (`phase00_`, `phase02_`, etc.).

### Why it cannot be renamed

Same reason as DB-07 — renaming breaks Prisma's migration ledger.

### Solution — Annotate in MIGRATIONS.md

```markdown
### Naming inconsistency: phase3_ (should be phase03_)
Migration `20260826000000_phase3_one_active_exclusive_per_driver` uses a non-padded
phase number. This was a typo at creation time. The directory cannot be renamed (it
is recorded in _prisma_migrations by name). All future migrations must use zero-padded
phase numbers: phase01_, phase02_, ... phase09_, phase10_, etc.
```

---

## Task 5.3 — Audit and Document the Abandoned Legacy SQL Runner

> **Addresses**: DB-11

The Dockerfile comment (lines 87–95) states:
> "The legacy `apps/web/migrations/001_foundation_constraints.sql` runner is NOT executed here: it targets PascalCase tables that no longer exist. None of its objects (AuditLog, version columns, UTC/timezone functions) are referenced by app code."

### Steps

**1. Read the abandoned file** to document exactly what it defined:

```powershell
cat apps/web/migrations/001_foundation_constraints.sql
```

**2. For each object it defined, verify whether it's needed:**

| Object | Status | Action |
|:---|:---|:---|
| AuditLog table | Likely replaced by `admin_staff_activity_log` | Confirm, then mark as superceded |
| UTC timezone enforcement | May be important for data integrity | If needed, re-create via a new Prisma migration |
| Version columns | Unknown — check if any code reads them | Check codebase for references |

**3. Create a decision record** in `packages/db/MIGRATIONS.md`:

```markdown
## Legacy SQL Runner (001_foundation_constraints.sql)
Located at `apps/web/migrations/001_foundation_constraints.sql`. This file was
written before the `@@map` refactor and targets PascalCase table names that no
longer exist. It was deliberately excluded from the migrate service Dockerfile
(see Dockerfile lines 87–95).

Status of each object:
- AuditLog table → superceded by `admin_staff_activity_log` (migration 20260807090000)
- UTC timezone functions → [NEEDS AUDIT: determine if timezone enforcement is needed]
- Version columns → [NEEDS AUDIT: determine if any code reads these]

Action: Schedule a review of this file before any compliance/audit work. If any
constraints are genuinely needed, create a new Prisma migration to add them.
```

**4. If the file is definitively dead** — move it to `docs/legacy/` or delete it to prevent confusion.

---

## Task 5.4 — Add `url` and `directUrl` to Datasource Block

> **Addresses**: DB-21

Currently:
```prisma
datasource db {
  provider = "postgresql"
}
```

The URL is read from `prisma.config.ts`. While this works, the schema is not standalone — any `prisma` CLI invocation without `prisma.config.ts` loaded fails confusingly.

### Update `packages/db/prisma/schema.prisma`

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_DIRECT")
}
```

This makes the schema self-documenting about its connection requirements and provides the `directUrl` which Prisma uses automatically for migration commands (bypassing the pooler) when defined.

> [!NOTE]
> This change is coordinated with Phase 2 Task 2.1 where `DATABASE_URL_DIRECT` is added to `.env.local`. Both must land in the same commit.

---

## Task 5.5 — Resolve `BookingStatus.COMPLETED` Dual Truth

> **Addresses**: DB-22

```prisma
/// Phase 33 (F-PS-10 D4 ruling): INTENTIONALLY UNSTAMPED.
COMPLETED
```

The `COMPLETED` enum value exists in the DB but is never written. Booking completion is tracked via `booking.completedAt IS NOT NULL` instead. This creates dual sources of truth.

### Decision required (not a code change — needs architectural decision)

Option A — **Remove `COMPLETED` from the enum** (breaking if any external system reads it)
- Requires a new migration: `ALTER TYPE "BookingStatus" RENAME VALUE 'COMPLETED' ...` — PostgreSQL doesn't support removing enum values in a simple way
- Risk: Any external system or analytics that reads the enum definition will break

Option B — **Start writing `COMPLETED`** (breaking for all `CONFIRMED`-gated consumers)
- Requires auditing every consumer of `CONFIRMED` status before switching
- The comment in the schema explicitly warns against this

Option C — **Document the intentional dual truth and leave it** (no code change)
- Add a clear `context/domain-specs/booking-lifecycle.md` explaining the architecture decision
- Add a test that asserts `COMPLETED` is never written to any booking record

**Recommended**: Option C in the short term, with a formal design review for Option A in a future sprint. Document the decision in `context/domain-specs/`.

---

## Task 5.6 — Audit `NotificationOutbox` Cascade Semantics

> **Addresses**: DB-24

The transactional outbox pattern stores jobs that reference domain entities. If a booking is deleted before the outbox worker processes it, the worker must handle the orphaned record gracefully.

### Steps

**1. Find the outbox model in schema.prisma:**
```bash
grep -n "outbox\|Outbox" packages/db/prisma/schema.prisma
```

**2. For each foreign key on the outbox model, document the cascade policy:**

| FK | Current cascade | Should be |
|:---|:---|:---|
| `bookingId` | Unknown | `ON DELETE SET NULL` (null = booking gone, skip gracefully) |
| `userId` | Unknown | `ON DELETE SET NULL` |
| `tripId` | Unknown | `ON DELETE SET NULL` |

**3. Verify the outbox worker handles `null` FK values** (skips gracefully without crashing).

**4. If FK is `RESTRICT` or `NO ACTION`** — deleting a booking will throw a foreign key violation if an outbox record references it. Create a migration to change to `SET NULL`.

---

## Task 5.7 — Plan for `driver_location_ping` Partitioning and TTL

> **Addresses**: DB-25

This is a **design and planning task** only — implementation requires a separate migration and testing.

### Growth projection

| Drivers | Pings/day | Rows/year |
|:---|:---|:---|
| 10 | 57,600 | 21M |
| 100 | 576,000 | 210M |
| 500 | 2.88M | 1B |

### Recommended strategy — PostgreSQL range partitioning by month

```sql
-- Convert driver_location_ping to partitioned table (requires full migration with data copy)
-- Schema: partition by RANGE(recordedAt) monthly
-- Retention: drop partitions older than 90 days (configurable)
-- Archive: dump old partitions to S3 before dropping
```

**Create a design document** at `context/plans/db-remediation/phase-07-telemetry-partitioning.md` (deferred work) with:
- Current row count and growth estimates
- Partitioning strategy (range by month)
- Archive policy (dump to S3, retain 90 days live)
- Impact on existing queries and indexes
- Migration path (no in-place partitioning — requires table recreation)

**Short-term mitigation** (implement now, no schema change required):
- Add a cron job that deletes pings older than 90 days:
  ```sql
  DELETE FROM driver_location_ping WHERE recordedAt < NOW() - INTERVAL '90 days';
  ```
- Add this to `deploy/cron/crontab.template`:
  ```
  0 4 * * * psql "$DATABASE_URL" -c "DELETE FROM driver_location_ping WHERE \"recordedAt\" < NOW() - INTERVAL '90 days';"
  ```

---

## Completion Checklist

- [ ] MIGRATIONS.md updated with duplicate timestamp annotation (DB-07)
- [ ] MIGRATIONS.md updated with phase3_ naming inconsistency annotation (DB-08)
- [ ] `001_foundation_constraints.sql` audited — each object documented as superceded or needed
- [ ] Legacy file moved to `docs/legacy/` or deleted if confirmed dead
- [ ] `schema.prisma` datasource block updated with `url` and `directUrl` (coordinate with Phase 2)
- [ ] `BookingStatus.COMPLETED` decision documented in `context/domain-specs/booking-lifecycle.md`
- [ ] NotificationOutbox FK cascade policies audited and documented
- [ ] Migration created if any outbox FK needs to change to `SET NULL`
- [ ] Telemetry partitioning design doc created (Phase 7 deferred)
- [ ] 90-day TTL cron added to `deploy/cron/crontab.template` as short-term mitigation

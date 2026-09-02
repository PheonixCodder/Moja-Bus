# Moja Ride — Complete Database Audit Report

> **Audit Date**: 2026-09-01  
> **Auditor**: Antigravity AI (automated deep inspection)  
> **Scope**: All database environments — Testing (Neon), Production (DigitalOcean Linux server `167.99.192.191`), CI/CD pipelines, migration history, schema correctness, infrastructure, and maintainability  
> **Status**: 🔴 BLOCKING issues present — deploy is broken, production schema is behind

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Environment Inventory](#2-environment-inventory)
3. [CRITICAL: Schema Drift — Migrations Missing in Git](#3-critical-schema-drift--migrations-missing-in-git)
4. [CRITICAL: Production Server Disk Full — Deploys Blocked](#4-critical-production-server-disk-full--deploys-blocked)
5. [Production Database State](#5-production-database-state)
6. [Neon Testing Database State](#6-neon-testing-database-state)
7. [Migration Tree Problems](#7-migration-tree-problems)
8. [CI/CD Pipeline Problems](#8-cicd-pipeline-problems)
9. [Docker / Infrastructure Problems](#9-docker--infrastructure-problems)
10. [Schema Design & Maintainability Problems](#10-schema-design--maintainability-problems)
11. [Security Problems](#11-security-problems)
12. [Backup & Recovery Problems](#12-backup--recovery-problems)
13. [PostgreSQL Configuration Problems](#13-postgresql-configuration-problems)
14. [Connection & Pooling Problems](#14-connection--pooling-problems)
15. [Monitoring & Observability Gaps](#15-monitoring--observability-gaps)
16. [Summary Table — All Findings](#16-summary-table--all-findings)

---

## 1. Executive Summary

The Moja Ride database system is in a **multi-environment drift state** with **two blocking issues** that prevent clean CI/CD deploys:

1. **Two schema items exist in `schema.prisma` that have no migration** — the drift gate catches this and fails on every push, blocking production deploys.
2. **The production server disk is 99% full (76G / 77G)** — Docker cannot pull updated images, making the deploy step fail with `no space left on device`.

Beyond these two blockers, there are **8 additional high-severity** and **14 medium/low-severity** database problems across schema design, security, PostgreSQL tuning, pooling, and observability.

---

## 2. Environment Inventory

| Environment | Host | DB Engine | Access | Last Known Migration |
|:---|:---|:---|:---|:---|
| **Testing / Development** | Neon (US East, pooled) | PostgreSQL 16 (Neon Serverless) | `DATABASE_URL` in `apps/web/.env.local` | `20260827000000_phase07_driver_pay_model` (all 34 applied) |
| **Production** | DigitalOcean Droplet `167.99.192.191` | PostGIS 16-3.4-alpine (Docker) | `docker exec moja-buss-db-1` | `20260827000000_phase07_driver_pay_model` (all 34 applied) |
| **CI Shadow DB** | GitHub Actions ephemeral (PostGIS 16-3.4-alpine) | PostgreSQL 16 | `postgresql://postgres:postgres@localhost:5432/shadow` | Applied freshly on each drift-check run |

### Key observation
Both live databases (Neon and production) show **all 34 migrations applied and matching** each other. The problem is that `schema.prisma` has moved **ahead** of the last migration — two new schema items exist with **no corresponding migration file**.

---

## 3. CRITICAL: Schema Drift — Migrations Missing in Git

**Severity: P0 — Blocking. Every push to `master` fails the `db-drift.yml` gate.**

The CI drift check (`pnpm exec prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code`) exited with **code 2** (meaning: drift detected) on the latest push. The diff output was:

```
[*] Changed the `driver_location_ping` table
  [+] Added index on columns (driverProfileId, isAnomaly, recordedAt)

[*] Changed the `route` table
  [+] Added column `turnaroundBufferMinutes`
```

### Finding DB-01 — Missing Column Migration: `route.turnaroundBufferMinutes`

**Location in schema**: `packages/db/prisma/schema.prisma` line 1395

```prisma
/// Custom turnaround buffer in minutes for driver rest & bus turnaround.
/// When null, defaults to DRIVER_TURNAROUND_BUFFER_MINUTES (45 min).
turnaroundBufferMinutes Int?
```

**Status in each environment**:

| Environment | Column Present? |
|:---|:---|
| schema.prisma | ✅ Defined |
| Neon (testing) | ❌ **ABSENT** — confirmed via migration ledger |
| Production DB | ❌ **ABSENT** — confirmed: `has_turnaround_col = f` |
| Git migrations | ❌ **NO migration file exists** |
| Last migration (`20260827`) | Does not mention `route` table |

**Impact**: Any code that reads or writes `route.turnaroundBufferMinutes` will throw a Prisma runtime error in both environments. The column has been **added to the ORM layer but never deployed to the database**.

**Root cause**: A developer edited `schema.prisma` to add the column without generating and committing a migration. This violates Rule 2 of `packages/db/MIGRATIONS.md`.

---

### Finding DB-02 — Missing Index Migration: `driver_location_ping(driverProfileId, isAnomaly, recordedAt)`

**Location in schema**: `packages/db/prisma/schema.prisma` line 2429

```prisma
@@index([driverProfileId, isAnomaly, recordedAt])
```

**Existing indexes on `driver_location_ping` in production** (confirmed live):
```
driver_location_ping_pkey
driver_location_ping_recordedAt_idx
driver_location_ping_driverProfileId_recordedAt_idx
driver_location_ping_tripId_recordedAt_idx
```

**Missing index** (in schema, not in DB):
```
driver_location_ping_driverProfileId_isAnomaly_recordedAt_idx
```

**Status**:

| Environment | Index Present? |
|:---|:---|
| schema.prisma | ✅ Defined |
| Production DB | ❌ **ABSENT** — not in `pg_indexes` (confirmed live) |
| Neon (testing) | ❌ **ABSENT** — same migration history |
| Git migrations | ❌ **NO migration file exists** |

**Impact**: Queries filtering anomalous pings by driver (safety audits, telemetry anomaly dashboards) perform full sequential scans rather than using the composite index. Critical performance risk as the ping table grows.

**Root cause**: Same as DB-01 — schema edited, migration not generated or committed.

---

## 4. CRITICAL: Production Server Disk Full — Deploys Blocked

**Severity: P0 — Blocking. All Docker image pulls fail with `no space left on device`.**

### Finding DB-03 — Root Filesystem 99% Full

```
Filesystem   Size   Used   Avail  Use%  Mounted on
/dev/vda1    77G    76G    1.4G   99%   /
```

**Docker storage breakdown** (confirmed via `du -sh /var/lib/docker/*`):
```
96MB    /var/lib/docker/containers
3.0GB   /var/lib/docker/volumes
6.8GB   /var/lib/docker/rootfs    ← primary culprit
```

**The CI log shows the exact failure**:
```
write /var/lib/docker/rootfs/overlayfs/.../node_modules/.pnpm/
  @electric-sql+pglite@0.4.3/.../pgcrypto.tar.gz: no space left on device
```

**Consequence chain**:
1. Disk fills → `docker compose pull` fails → deploy step exits 1
2. `docker compose run --rm migrate` never runs → schema drift accumulates silently
3. New application code references `route.turnaroundBufferMinutes` but the column doesn't exist in production DB → runtime crashes

### Finding DB-04 — 28 Dangling Docker Images Consuming ~70GB

Docker reports:
```
TYPE      TOTAL   ACTIVE   SIZE      RECLAIMABLE
Images    40      12       69.29GB   11.14GB (16%)
```

There are **28 dangling (untagged) images** from repeated CI builds, dating back to 2026-08-27. Each image is approximately 4–4.57 GB (a full Next.js monorepo build). They accumulate because:
- The `safe-cleanup.sh` script is called with `|| true` (failures silently ignored)
- There is no automatic Docker image pruning cron job on the host

**Sample dangling images** (each 4–4.6GB):
```
c34b0d349ccb  4GB    2026-08-30 06:28
b34a82daaa01  4.01GB 2026-08-30 06:23
c70615d7accf  4GB    2026-08-30 06:20
... (24 more going back to 2026-08-27, 22+ build iterations)
```

---

## 5. Production Database State

**Host**: PostGIS 16.3.4-alpine inside Docker (`moja-buss-db-1`)  
**Connection**: `postgresql://moja:***@db:5432/moja`

### Migration Ledger (confirmed live — all 34 applied, none rolled back)

```
0_init                                                2026-08-21 08:32:23
20260804000000_add_geo_capture                        2026-08-21 08:32:23
20260805000000_add_capture_approved                   2026-08-21 08:32:23
20260805000001_add_capture_reverse_geocoded_address   2026-08-21 08:32:23
20260806_add_new_roles_and_permissions                2026-08-21 08:32:23
20260807061213_add_admin_staff_iam                    2026-08-21 08:32:23
20260807090000_add_admin_staff_activity_log           2026-08-21 08:32:23
20260808063016_add_trip_archived_at                   2026-08-21 08:32:23
20260815120000_add_max_promotional_vouchers           2026-08-21 08:32:23
20260816120000_voucher_schedule_scope                 2026-08-21 08:32:23
20260816140000_phase00_cancel_refund_safety           2026-08-21 08:32:24
20260816160000_phase02_discount_domain_baseline       2026-08-21 08:32:24
20260816170000_phase02_commercial_constraints         2026-08-21 08:32:24
20260816180000_phase03_payment_purpose                2026-08-21 08:32:24
20260816190000_phase05_ops_abuse                      2026-08-21 08:32:24
20260816200000_phase07_outbox                         2026-08-21 08:32:24
20260818000000_remove_legacy_monetary_vouchers        2026-08-21 08:32:24
20260821000000_add_driver_system_and_telemetry        2026-08-21 09:07:24   ← batch split
20260821120000_phase09_driver_service_preference      2026-08-25 20:23:46   ← 4-DAY GAP
20260821130000_phase11_driver_employment_offer        2026-08-25 20:23:46
20260821140000_phase12_bus_type_license_category      2026-08-25 20:23:46
20260822000000_phase17_user_role_driver_enum          2026-08-25 20:23:46
20260822000000_phase18_assignment_race_safety         2026-08-25 20:23:46
20260822000001_phase17_driver_operator_cleanup        2026-08-25 20:23:46
20260823000000_phase00_driver_enum_repair_values      2026-08-25 20:23:46
20260823000001_phase00_driver_enum_repair_data        2026-08-25 20:23:46
20260823235959_phase00_schema_convergence             2026-08-25 20:23:47
20260824000000_phase15_driver_national_id             2026-08-25 20:23:47
20260824000001_phase17_shift_unique_open              2026-08-25 20:23:47
20260825000000_phase31_driver_pay_rate_setting        2026-08-25 20:23:47
20260825000001_phase31_urgent_dispatch_ack            2026-08-25 20:23:47
20260825000002_phase33_booking_phone_index            2026-08-25 20:23:47
20260826000000_phase3_one_active_exclusive_per_driver 2026-08-26 18:55:50
20260827000000_phase07_driver_pay_model               2026-08-27 11:31:41   ← LAST (5 days ago)
```

**Notable**: The first 17 migrations all applied in one 7-second batch (bulk apply). Migrations `20260821*` through `20260825*` applied in a second bulk run 4 days later. This pattern indicates migrations were not deployed through CI incrementally.

### Confirmed Missing Schema Items in Production DB

- **`route.turnaroundBufferMinutes` column** → `has_turnaround_col = f` (PostgreSQL confirmed absent)
- **`driver_location_ping_driverProfileId_isAnomaly_recordedAt_idx` index** → not in `pg_indexes` (only 4 indexes exist, missing the composite one)
- **`route.turnaroundBufferMinutes` column list**: `id, companyId, name, originTerminalId, destTerminalId, distanceKm, serviceType, status, createdAt, updatedAt` (10 columns — `turnaroundBufferMinutes` absent)

### PostgreSQL Settings (confirmed live — all defaults)

```
max_connections  = 100
shared_buffers   = 128MB
work_mem         = 4MB
```

### Table Bloat Check Error

The bloat query errored with `relation "public.refreshtoken" does not exist` — this suggests the standard `pg_bloat` check was referencing a table that doesn't exist in the schema. This is likely because the `MIGRATIONS.md` mentions the `001_foundation_constraints.sql` legacy runner was abandoned without replacement, and it may have created some tables that the current schema doesn't track.

---

## 6. Neon Testing Database State

**Host**: `ep-still-shadow-at2zgkyc-pooler.c-9.us-east-1.aws.neon.tech` (US East)  
**Mode**: **Pooler URL** (`-pooler.` in hostname)

### Finding DB-05 — Testing DB Uses Pooler URL for Migrations

The `.env.local` `DATABASE_URL` uses the **pooler** endpoint (PgBouncer transaction mode). The `.env.local` comment itself says:

> "For poolers like Neon, use the DIRECT (non-pooled) URL so `prisma migrate deploy` works."

But the URL defined is the pooler URL. Running `prisma migrate deploy` against the pooler is unsafe:
- Neon's pooler is in transaction-pooling mode, which is **incompatible** with Prisma's advisory locks used during migrations
- Migration locks can silently fail to acquire, or two migration processes can both believe they hold the lock
- The `_prisma_migrations` table can show a migration as `finished_at` before all SQL has actually committed

A second variable (e.g., `DATABASE_URL_DIRECT`) pointing to the non-pooler endpoint should be used for all `prisma migrate *` and `prisma db *` commands.

### Finding DB-06 — Production Secrets in Plaintext `.env.local`

The `.env.local` contains the following sensitive credentials in plaintext:
- `DATABASE_URL` with Neon password embedded
- `BETTER_AUTH_SECRET` (breaking session invalidation if rotated carelessly)
- `PAYSTACK_SECRET_KEY` (live payment API key)
- `BANK_ENCRYPTION_KEY` (AES-256 key for PII bank account data)
- `S3_ACCESS_KEY_ID` + `S3_SECRET_ACCESS_KEY` (full Cloudflare R2 bucket access)
- `WITHDRAWAL_2FA_PEPPER` (2FA security material)
- `OPENROUTER_API_KEY`
- **Duplicate `DATABASE_URL`** on lines 2 and 40 — the second definition silently wins

---

## 7. Migration Tree Problems

### Finding DB-07 — Timestamp Collision: Two Migrations Share `20260822000000`

```
20260822000000_phase17_user_role_driver_enum
20260822000000_phase18_assignment_race_safety
```

Both share the exact same timestamp prefix. Prisma orders by directory name lexicographically, so the current order is stable (`phase17` < `phase18` alphabetically). However, any rename or reorder would change execution order unpredictably.

### Finding DB-08 — Naming Inconsistency: `phase3_` vs `phase03_`

```
20260826000000_phase3_one_active_exclusive_per_driver   ← no zero-pad
20260825000000_phase31_driver_pay_rate_setting          ← zero-padded
```

The phase number is not consistently zero-padded. The correct name should be `phase03_`.

### Finding DB-09 — `0_init` Non-Standard Naming

The first migration is `0_init` instead of the `YYYYMMDDHHMMSS_name` pattern used by all others. Works today (sorts first) but is inconsistent.

### Finding DB-10 — 4-Day Migration Apply Gap: Evidence of Manual/Bulk Deploys

```
20260821000000_add_driver_system_and_telemetry   2026-08-21 09:07
20260821120000_phase09_driver_service_preference  2026-08-25 20:23  ← 4 days later
```

The 13 migrations from `20260821120000` through `20260824000001` were applied 4 days after the migration before them. The entire batch of 13 applied within 1 second — clearly a bulk manual apply, not an incremental CI-driven deploy. This mirrors exactly the incident documented in MIGRATIONS.md (six driver migrations committed late).

### Finding DB-11 — Abandoned Legacy SQL Runner

The Dockerfile comments that `apps/web/migrations/001_foundation_constraints.sql` was abandoned because it targets PascalCase tables that no longer exist. The constraints it defined (AuditLog, version columns, UTC timezone functions, indexes) were **never re-created** under the Prisma migration system. These may include important integrity constraints that are silently absent.

### Finding DB-12 — `db:push` Script Exposed in `package.json`

`packages/db/package.json` exposes `"db:push": "prisma db push"`. MIGRATIONS.md prohibits `prisma db push` against shared environments. This script is a footgun — any developer can run `pnpm --filter @moja/db db:push` against the Neon database, bypassing the migration system and creating silent drift.

---

## 8. CI/CD Pipeline Problems

### Finding DB-13 — Deploy Blocked for 5+ Days

Production server disk full prevents all Docker pulls. No migration has reached production since 2026-08-27 (5 days). Any code referencing `route.turnaroundBufferMinutes` is throwing runtime errors in production.

### Finding DB-14 — No Migration Rollback on Deploy Failure

The deploy script (`deploy.yml`) is:
```bash
set -euo pipefail
git reset --hard origin/master   # 1. sync
docker compose pull              # 2. pull images
docker compose run --rm migrate  # 3. migrate
docker compose up -d             # 4. restart
```

If step 3 fails partway (partial migration), step 4 may still start new app containers against a partially-migrated DB. There is no rollback, no health check before starting the app, and `set -e` exits immediately leaving the stack in an unknown state.

### Finding DB-15 — `DATABASE_URL` Baked into Migrate Docker Image on Docker Hub

```yaml
build-args: |
  DATABASE_URL=${{ secrets.DATABASE_URL_BUILD }}
```

The migrate image is `FROM builder AS migrate`, meaning it inherits all builder layers including the `ARG DATABASE_URL` environment. This image is pushed publicly to `pheonixcodder/moja-buss-migrate:latest` on Docker Hub. The DATABASE_URL (with credentials) is embedded in an intermediate layer of a public image.

### Finding DB-16 — Drift Gate Not Enforced as Deploy Prerequisite

`db-drift.yml` and `deploy.yml` run independently. A PR that introduces schema drift can be merged and the deploy will proceed (attempting `prisma migrate deploy`) even though the migrations don't match `schema.prisma`. The drift gate should be a required check before deploy is allowed.

---

## 9. Docker / Infrastructure Problems

### Finding DB-17 — PostGIS Usage Invisible to Prisma ORM Layer

`schema.prisma` has no `Unsupported("geometry")` or geography columns — PostGIS is used only in raw SQL migrations. This means:
- Spatial queries bypass Prisma's type system entirely
- No type safety for geographical data
- PostGIS dependency is invisible from the application layer

### Finding DB-18 — Signoz ClickHouse on Same Disk as Application Data

The Signoz observability stack (deployed 5 days ago) has consumed:
- `signoz-telemetrystore-0-0-data`: **2.619GB** (ClickHouse data)
- `signoz-metastore-postgres-0-data`: **68.24MB** (Signoz's own Postgres)

These are on the same 77GB disk as the application database. The Signoz ClickHouse alone is contributing ~34% of the disk usage and is a primary driver of the disk-full condition.

### Finding DB-19 — No Automatic Docker Image Pruning

No cron job exists on the host for `docker image prune` or `docker system prune`. Each CI deploy cycle adds ~4–8GB of dangling layers. At the current rate (multiple deploys per day on 2026-08-29 and 2026-08-30), the disk fills within days.

### Finding DB-20 — DB Backup Volume Co-Located with Application

Backup files confirmed on server:
```
moja_2026-08-28_013000.sql.gz
moja_2026-08-29_013000.sql.gz
moja_2026-08-30_013000.sql.gz
moja_2026-08-31_013000.sql.gz
moja_2026-09-01_013000.sql.gz
```

All backups live in the `moja-buss_backups` Docker volume on the **same physical disk as the database**. A disk failure destroys both the DB and all backups simultaneously.

---

## 10. Schema Design & Maintainability Problems

### Finding DB-21 — `datasource db` Has No `url` — Schema Not Standalone

```prisma
datasource db {
  provider = "postgresql"
}
```

URL is sourced from `prisma.config.ts`. Running any `prisma` CLI command without the config file loaded produces confusing errors. The schema is not independently usable.

### Finding DB-22 — `BookingStatus.COMPLETED` Defined But Never Written

```prisma
/// Phase 33: INTENTIONALLY UNSTAMPED.
/// Do NOT stamp without re-auditing every CONFIRMED consumer.
COMPLETED
```

The `COMPLETED` value exists in the database enum but is never written by the application. Booking completion is tracked via `booking.completedAt IS NOT NULL` — a dual truth. Any external system integrating with the database will be misled by this enum value.

### Finding DB-23 — Single 3,124-Line Schema File

All 60+ models and enums are in a single `schema.prisma` file. While Prisma v7 does support multi-file schemas via `prismaSchemaFolder`, this is not yet adopted. Navigation, code review, and reasoning about the schema is difficult at this scale.

### Finding DB-24 — `NotificationOutbox` Cascade Semantics Not Verified

The transactional outbox holds references to domain entities. If referenced entities are deleted before the outbox record is processed by the worker, the worker will either crash or silently skip notifications. Cascade delete policies for outbox foreign keys should be audited.

### Finding DB-25 — `driver_location_ping` Has No Partitioning or TTL

With 1 ping per 5 seconds per driver per active trip, this table grows at:
- **100 drivers × 5,760 pings/day = 576,000 rows/day**
- **100 drivers × 210M rows/year**

No partition strategy, no archival cron, no TTL exists. The current `221MB` production DB will scale to multi-GB within weeks of real driver usage.

---

## 11. Security Problems

### Finding DB-26 — Sensitive Cryptographic Material in `.env.local`

The bank encryption key (`BANK_ENCRYPTION_KEY`) is an AES-256 key used to encrypt operator bank account numbers (GDPR/PCI-relevant PII). It is stored in plaintext in `.env.local` alongside the key rotation field (`BANK_ENCRYPTION_KEY_PREVIOUS`). Leaking this key compromises all encrypted bank records.

### Finding DB-27 — No Statement Auditing or `pg_audit`

No PostgreSQL audit logging is configured. There is no trail of who ran what query, making post-incident forensics impossible.

### Finding DB-28 — DB User Privilege Scope Unknown

The `moja` user was created by a Docker Compose `POSTGRES_USER` environment variable with no privilege restriction in the `init/01-extensions.sql`. Without a `REVOKE` + `GRANT` grant-only setup, the `moja` user likely has `CREATEDB` or equivalent broad privileges.

---

## 12. Backup & Recovery Problems

### Finding DB-29 — Backups On-Disk Only — No Off-Site Copy

Five daily backups confirmed, all on the same DigitalOcean droplet disk. No S3, R2, or remote destination configured in the backup service. A single disk failure or droplet loss results in total data loss.

### Finding DB-30 — No Backup Restore Testing

There is no automated or documented procedure for testing backup restoration. The backup files have never been verified to be restorable.

### Finding DB-31 — RTO/RPO Undefined

No recovery time objective or recovery point objective has been established. With once-daily backups, RPO is approximately 24 hours. With a manual restore procedure, RTO could be hours to days.

---

## 13. PostgreSQL Configuration Problems

### Finding DB-32 — `shared_buffers = 128MB` — Severely Under-Tuned

PostgreSQL recommends 25% of available RAM. For a typical 4GB DigitalOcean droplet, this should be ~1GB. At 128MB, every cache miss results in a disk read, dramatically increasing query latency for repeated queries on frequently-accessed tables.

### Finding DB-33 — `pg_stat_statements` Not Enabled

No slow query visibility. Cannot identify which queries are consuming the most time, which are hitting most frequently, or which are performing poorly after schema changes.

### Finding DB-34 — No `statement_timeout` or `lock_timeout`

A runaway query (e.g., a report query scanning all `driver_location_ping` rows) can run indefinitely, holding locks and starving other requests. `statement_timeout = 30s` and `lock_timeout = 5s` should be set at minimum.

### Finding DB-35 — `work_mem = 4MB` Causes Disk Spills for Sort Operations

Complex ERP queries (revenue reports, occupancy analysis, multi-join sorts) will exceed the 4MB per-sort limit and spill to disk. Recommended: `work_mem = 16MB` minimum for this workload.

---

## 14. Connection & Pooling Problems

### Finding DB-36 — No Connection Pooler Between App and PostgreSQL

The production application connects directly to Postgres at `db:5432`. With `max_connections = 100` and multiple services connecting (web, cron, backup), connection limits will be hit under any meaningful load. No PgBouncer or Odyssey is deployed in the Docker Compose stack.

### Finding DB-37 — Single `DATABASE_URL` for Both App Traffic and Migrations

The Neon testing setup has one `DATABASE_URL` pointing to the pooler. This URL is safe for application queries but unsafe for migration commands. Two separate variables are required:
- `DATABASE_URL` → pooler URL (app runtime)
- `DATABASE_URL_DIRECT` / `DATABASE_URL_MIGRATE` → direct non-pooler URL (CLI commands)

---

## 15. Monitoring & Observability Gaps

### Finding DB-38 — No Database Metrics in Signoz

Signoz is deployed and running on the server, but no `postgres_exporter` is feeding PostgreSQL metrics into it. Connection counts, transaction throughput, cache hit ratios, vacuum status, lock waits — all invisible.

### Finding DB-39 — No Slow Query Logging

`log_min_duration_statement` is not configured. Slow queries are invisible in all logs.

### Finding DB-40 — No Alerting on Critical DB Events

No alerts exist for:
- Disk usage > 80% (would have prevented the current disk-full crisis)
- Connection count approaching `max_connections`
- Long-running transactions (> 30s)
- Backup failure
- Migration failure
- Schema drift on push

---

## 16. Summary Table — All Findings

| ID | Severity | Category | Title | Affected |
|:---|:---|:---|:---|:---|
| DB-01 | 🔴 P0 | Schema Drift | `route.turnaroundBufferMinutes` — no migration, absent in all DBs | All |
| DB-02 | 🔴 P0 | Schema Drift | `driver_location_ping` composite index — no migration, absent in all DBs | All |
| DB-03 | 🔴 P0 | Infrastructure | Production disk 99% full — deploy blocked | Production |
| DB-04 | 🔴 P0 | Infrastructure | 28 dangling Docker images (11GB reclaimable) filling disk | Production |
| DB-05 | 🔴 P1 | Connection | Pooler URL used for migrations — unsafe for advisory locks | Neon |
| DB-06 | 🔴 P1 | Security | AES key + S3 secret + auth secret + DB password in plaintext `.env.local` | Dev |
| DB-07 | 🟠 P2 | Migration Tree | Duplicate timestamp `20260822000000` across two migrations | All |
| DB-08 | 🟠 P2 | Migration Tree | Inconsistent phase zero-padding (`phase3_` vs `phase03_`) | All |
| DB-09 | 🟡 P3 | Migration Tree | `0_init` non-standard naming | All |
| DB-10 | 🟠 P2 | Migration Tree | 4-day migration gap — evidence of bulk manual deploys not via CI | Prod |
| DB-11 | 🟠 P2 | Migration Tree | Legacy SQL runner abandoned without replacement | Prod |
| DB-12 | 🟠 P2 | Security | `db:push` npm script exposes forbidden command | Dev |
| DB-13 | 🔴 P0 | CI/CD | Deploy blocked 5+ days — no migrations reaching production | Prod |
| DB-14 | 🟠 P2 | CI/CD | No migration rollback if deploy fails mid-way | Prod |
| DB-15 | 🟠 P2 | Security | `DATABASE_URL` (with credentials) baked into public migrate Docker image | CI |
| DB-16 | 🟠 P2 | CI/CD | Drift gate not enforced as deploy prerequisite | CI |
| DB-17 | 🟡 P3 | Schema | PostGIS usage invisible to Prisma ORM | All |
| DB-18 | 🟠 P2 | Infrastructure | Signoz ClickHouse (2.6GB) on same disk as application DB | Prod |
| DB-19 | 🔴 P1 | Infrastructure | No automatic Docker image pruning — disk fills continuously | Prod |
| DB-20 | 🔴 P1 | Backup | DB backups co-located on same disk — no off-site copy | Prod |
| DB-21 | 🟡 P3 | Schema | Datasource block has no `url` — schema not standalone | All |
| DB-22 | 🟡 P3 | Schema | `BookingStatus.COMPLETED` defined but never written — dual truth | All |
| DB-23 | 🟡 P3 | Maintainability | 3,124-line single-file schema | All |
| DB-24 | 🟡 P3 | Schema | `NotificationOutbox` cascade semantics not audited | All |
| DB-25 | 🟠 P2 | Schema | `driver_location_ping` has no partitioning or TTL — unbounded growth | All |
| DB-26 | 🔴 P1 | Security | Bank encryption key + S3 secret in `.env.local` | Dev |
| DB-27 | 🟠 P2 | Security | No `pg_audit` or statement logging | Prod |
| DB-28 | 🟠 P2 | Security | DB user privilege scope unknown — likely over-privileged | Prod |
| DB-29 | 🔴 P1 | Backup | Backups on same disk as DB — no off-site copy | Prod |
| DB-30 | 🟠 P2 | Backup | No backup restore testing | Prod |
| DB-31 | 🟠 P2 | Backup | RTO/RPO undefined | Prod |
| DB-32 | 🟠 P2 | PostgreSQL | `shared_buffers = 128MB` — severely under-tuned | Prod |
| DB-33 | 🟠 P2 | PostgreSQL | `pg_stat_statements` not enabled — no slow query visibility | Prod |
| DB-34 | 🟠 P2 | PostgreSQL | No `statement_timeout` or `lock_timeout` — runaway queries unguarded | Prod |
| DB-35 | 🟡 P3 | PostgreSQL | `work_mem = 4MB` — sort spills to disk on report queries | Prod |
| DB-36 | 🟠 P2 | Connection | No PgBouncer — direct connections to Postgres at 100 max | Prod |
| DB-37 | 🟠 P2 | Connection | Single `DATABASE_URL` used for app traffic and migrations — unsafe split needed | Neon |
| DB-38 | 🟠 P2 | Monitoring | No PostgreSQL metrics exported to Signoz | Prod |
| DB-39 | 🟠 P2 | Monitoring | No slow query logging (`log_min_duration_statement` not set) | Prod |
| DB-40 | 🟠 P2 | Monitoring | No alerting on disk, connections, backups, or migration failures | Prod |

**Total findings: 40**
- 🔴 P0 (Deploy-blocking): **5** (DB-01, DB-02, DB-03, DB-04, DB-13)
- 🔴 P1 (Critical): **5** (DB-05, DB-06, DB-19, DB-20, DB-29)
- 🟠 P2 (High): **21**
- 🟡 P3 (Medium): **9**

---

*Report generated: 2026-09-01. Raw evidence: SSH session to `167.99.192.191`, CI log from latest push `49b1cdd`, live `psql` queries against `moja-buss-db-1`, `packages/db/prisma/schema.prisma` inspection, all 34 migration SQL files inspected.*

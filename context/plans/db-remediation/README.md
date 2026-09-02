# DB Remediation — Master Plan

> **Created**: 2026-09-01  
> **Source**: [`context/audits/database-audit-2026-09-01.md`](file:///C:/dev/moja-buss/context/audits/database-audit-2026-09-01.md)  
> **Status**: Phase 1 ready to execute

This document is the index for the 8-phase database remediation plan. All 40 findings from the audit are distributed across phases by severity and logical dependency.

---

## Phase Overview

| Phase | Name | Priority | Effort | Findings | Status |
|:---|:---|:---|:---|:---|:---|
| [Phase 1](./phase-01-unblock-cicd.md) | Unblock CI/CD | 🔴 P0 — Today | 1–2h | DB-01, 02, 03, 04, 13 | ⬜ Not started |
| [Phase 2](./phase-02-stabilize-environments.md) | Stabilize Environments | 🔴 P1 — 1-2 days | 3–4h | DB-05, 06, 12, 19, 20, 26, 29 | ⬜ Not started |
| [Phase 3](./phase-03-harden-cicd.md) | Harden CI/CD Pipeline | 🟠 P2 — 1 week | 3–5h | DB-10, 14, 15, 16 | ⬜ Not started |
| [Phase 4](./phase-04-postgresql-tuning.md) | PostgreSQL Tuning & Pooling | 🟠 P2 — 1-2 weeks | 4–6h | DB-32, 33, 34, 35, 36, 37 | ⬜ Not started |
| [Phase 5](./phase-05-migration-schema-hygiene.md) | Migration & Schema Hygiene | 🟠 P2 — 2 weeks | 4–6h | DB-07, 08, 09, 11, 21, 22, 23, 24, 25 | ⬜ Not started |
| [Phase 6](./phase-06-security-hardening.md) | Security Hardening | 🔴 P1 — 1 week (parallel) | 4–8h | DB-06, 15, 26, 27, 28 | ⬜ Not started |
| [Phase 7](./phase-07-monitoring-observability.md) | Monitoring & Observability | 🟠 P2 — 2 weeks | 4–6h | DB-38, 39, 40 | ⬜ Not started |
| [Phase 8](./phase-08-backup-recovery.md) | Backup, Recovery & Resilience | 🟠 P2 — 2 weeks | 4–6h | DB-20, 29, 30, 31 | ⬜ Not started |

**Total estimated effort**: 27–43 hours across 2–3 weeks

---

## Finding → Phase Cross-Reference

| Finding | Phase | Title |
|:---|:---|:---|
| DB-01 | Phase 1 | `route.turnaroundBufferMinutes` — missing migration |
| DB-02 | Phase 1 | `driver_location_ping` composite index — missing migration |
| DB-03 | Phase 1 | Production disk 99% full |
| DB-04 | Phase 1 | 28 dangling Docker images |
| DB-05 | Phase 2 | Pooler URL used for migrations |
| DB-06 | Phase 2 + 6 | Secrets in plaintext `.env.local` |
| DB-07 | Phase 5 | Duplicate migration timestamp `20260822000000` |
| DB-08 | Phase 5 | `phase3_` naming inconsistency |
| DB-09 | Phase 5 | `0_init` non-standard naming |
| DB-10 | Phase 3 | 4-day migration apply gap — bulk manual deploys |
| DB-11 | Phase 5 | Abandoned legacy SQL runner |
| DB-12 | Phase 2 | `db:push` script exposed in package.json |
| DB-13 | Phase 1 | Deploy blocked for 5+ days |
| DB-14 | Phase 3 | No migration rollback on deploy failure |
| DB-15 | Phase 3 + 6 | DATABASE_URL baked into public migrate Docker image |
| DB-16 | Phase 3 | Drift gate not enforced as deploy prerequisite |
| DB-17 | Phase 5 | PostGIS usage invisible to Prisma ORM |
| DB-18 | Phase 7 | Signoz ClickHouse on same disk as application |
| DB-19 | Phase 2 | No automatic Docker image pruning |
| DB-20 | Phase 2 + 8 | DB backup co-located on same disk |
| DB-21 | Phase 5 | Datasource block has no `url` |
| DB-22 | Phase 5 | `BookingStatus.COMPLETED` dual truth |
| DB-23 | Phase 5 | 3,124-line single-file schema |
| DB-24 | Phase 5 | NotificationOutbox cascade semantics |
| DB-25 | Phase 5 | `driver_location_ping` no partitioning or TTL |
| DB-26 | Phase 2 + 6 | Bank encryption key in `.env.local` |
| DB-27 | Phase 6 | No statement audit logging |
| DB-28 | Phase 6 | DB user privilege over-provisioned |
| DB-29 | Phase 2 + 8 | Backups on same disk as DB |
| DB-30 | Phase 8 | No backup restore testing |
| DB-31 | Phase 8 | RTO/RPO undefined |
| DB-32 | Phase 4 | `shared_buffers = 128MB` — under-tuned |
| DB-33 | Phase 4 | `pg_stat_statements` not enabled |
| DB-34 | Phase 4 | No `statement_timeout` or `lock_timeout` |
| DB-35 | Phase 4 | `work_mem = 4MB` — sort spills |
| DB-36 | Phase 4 | No PgBouncer — direct connections |
| DB-37 | Phase 4 | Single URL for app + migrations |
| DB-38 | Phase 7 | No PostgreSQL metrics in Signoz |
| DB-39 | Phase 7 | No slow query logging |
| DB-40 | Phase 7 | No alerting on disk/connections/backups |

---

## Execution Order Notes

- **Phase 1 must be done first** — it unblocks the deploy pipeline and is a prerequisite for everything else
- **Phase 2 and Phase 6 can run in parallel** after Phase 1 — both are urgent but independent
- **Phase 3 depends on Phase 2** — the direct URL split (Phase 2) is needed before the CI pipeline changes (Phase 3)
- **Phase 4 depends on Phase 3** — PgBouncer and pooling changes should go through the hardened pipeline
- **Phase 5, 7, 8 are independent** and can run concurrently with Phases 3/4
- **Phase 8 has a soft dependency on Phase 2** (off-site backup upload needs to be implemented first, then Phase 8 verifies and extends it)

---

## Recommended Sprint Schedule

### Sprint 1 (Days 1–3)
- ✅ Phase 1 complete
- Start Phase 2 (env URLs, auto-pruning, off-site backup)
- Start Phase 6 (secrets audit, `.gitignore` check, privilege audit)

### Sprint 2 (Days 4–7)
- ✅ Phase 2 complete
- ✅ Phase 6 complete (except secrets manager migration — that's ongoing)
- Phase 3 (CI/CD hardening — merge drift gate into deploy, fix Dockerfile)

### Sprint 3 (Days 8–14)
- Phase 4 (PostgreSQL tuning + PgBouncer)
- Phase 5 (migration hygiene, legacy audit, schema docs)
- Phase 7 (monitoring — postgres_exporter + Signoz + alerts)
- Phase 8 (backup restore test, runbook, RTO/RPO definition)

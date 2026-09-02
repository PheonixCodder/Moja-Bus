# Phase 1 — Unblock CI/CD (P0 Blockers)

> **Priority**: 🔴 IMMEDIATE — Execute today  
> **Findings addressed**: DB-01, DB-02, DB-03, DB-04, DB-13  
> **Goal**: Restore passing CI and working production deploys  
> **Estimated effort**: 1–2 hours  
> **Risk**: Low — migration adds new nullable column + index; disk cleanup is non-destructive

---

## Context

The deploy pipeline has been broken for 5+ days. Every push to `master` fails because:
1. The drift gate (`db-drift.yml`) detects two schema items in `schema.prisma` that have no migration file
2. Even if the drift gate passed, the production server disk is 99% full — `docker compose pull` fails with `no space left on device`

These two issues must both be fixed before any future push can deploy successfully.

---

## Task 1.1 — Generate the Missing Migration

> **Addresses**: DB-01 (`route.turnaroundBufferMinutes`), DB-02 (`driver_location_ping` composite index)

### What's missing

`schema.prisma` defines two things that have no migration SQL:

1. **Column** — `route.turnaroundBufferMinutes Int?` ([schema.prisma line 1395](file:///C:/dev/moja-buss/packages/db/prisma/schema.prisma#L1393-L1395))
2. **Index** — `@@index([driverProfileId, isAnomaly, recordedAt])` on `DriverLocationPing` ([schema.prisma line 2429](file:///C:/dev/moja-buss/packages/db/prisma/schema.prisma#L2426-L2430))

Both are absent in Neon (testing) and production DB — confirmed via live `psql` queries.

### Why the current DATABASE_URL won't work for migrate dev

The `DATABASE_URL` in `apps/web/.env.local` is a **pooler** URL (contains `-pooler.` in hostname). Neon's pooler runs in transaction mode, which is incompatible with Prisma's advisory locks during `migrate dev`. **You must use the direct (non-pooler) URL.**

Get your direct URL from [Neon Console](https://console.neon.tech) → Connection Details → toggle "Pooled" OFF. It looks like:
```
postgresql://neondb_owner:<password>@ep-still-shadow-at2zgkyc.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require
```
(Note: no `-pooler` in the hostname.)

### Steps

```powershell
# 1. Set the DIRECT (non-pooler) URL for this command only
$env:DATABASE_URL = "postgresql://neondb_owner:npg_bXSI34rVHAke@ep-still-shadow-at2zgkyc.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"

# 2. Generate the migration
pnpm --filter @moja/db exec prisma migrate dev --name "phase35_route_turnaround_and_ping_anomaly_index"
```

### Expected output

Prisma will generate a new folder under `packages/db/prisma/migrations/` with a name like `20260901xxxxxx_phase35_route_turnaround_and_ping_anomaly_index/migration.sql`.

### Verify the generated SQL contains

```sql
-- AlterTable
ALTER TABLE "route" ADD COLUMN "turnaroundBufferMinutes" INTEGER;

-- CreateIndex
CREATE INDEX "driver_location_ping_driverProfileId_isAnomaly_recordedAt_idx"
  ON "driver_location_ping"("driverProfileId", "isAnomaly", "recordedAt");
```

> [!WARNING]
> Do NOT run `prisma db push` instead. Do NOT use the pooler URL. Review the generated SQL before committing — if it contains unexpected drops or alters, do not proceed.

### Commit

```bash
git add packages/db/prisma/migrations/
git commit -m "fix(db): add missing migration for route turnaround buffer and ping anomaly index"
```

---

## Task 1.2 — Clean the Production Server Disk

> **Addresses**: DB-03 (disk 99% full), DB-04 (28 dangling images)

### What's happening

Docker has accumulated 28+ dangling images (untagged builds) from iterative CI runs, each 4–4.6GB. `docker system df` confirms:
```
Images: 40 total, 69.29GB used, 11.14GB reclaimable
```

The running containers and their volumes are NOT affected by `docker system prune`.

### Steps

```powershell
# SSH into the production server
ssh root@167.99.192.191

# Inside the server:

# 1. Verify disk state before
df -h

# 2. Prune ALL dangling images, stopped containers, and unused build cache
# (does NOT remove running containers or named volumes)
docker system prune -af

# 3. Verify disk state after
df -h

# 4. Exit
exit
```

### Expected result

Disk usage should drop from ~99% to approximately 50–60% (dangling images are ~11GB reclaimable minimum, likely more).

> [!NOTE]
> `docker system prune -af` is safe here. It removes:
> - Stopped containers ✅ (only the exited `migrate` container)
> - Dangling images ✅ (all 28 untagged intermediate builds)
> - Unused build cache ✅
> It does NOT remove: running containers, named volumes (db_data, backups, caddy_data, kuma_data), or tagged images that are in use.

---

## Task 1.3 — Verify CI/CD Fully Restored

> **Addresses**: DB-13 (no migrations reaching production for 5+ days)

### Steps

```bash
# Push the migration commit to master (or open a PR and merge)
git push origin master
```

Watch the three GitHub Actions jobs:
1. **quality-gate** — TypeScript check, lint, drift gate must all pass ✅
2. **build-and-push** — Docker build + push to Docker Hub must succeed ✅
3. **deploy** — `docker compose pull` + `run --rm migrate` + `up -d` must all succeed ✅

### After deploy, confirm on production

```powershell
ssh root@167.99.192.191 "docker exec moja-buss-db-1 psql -U moja -d moja -c 'SELECT column_name FROM information_schema.columns WHERE table_name=$$route$$ AND column_name=$$turnaroundBufferMinutes$$;'"
```

Expected: `(1 row)` — column now exists in production.

```powershell
ssh root@167.99.192.191 "docker exec moja-buss-db-1 psql -U moja -d moja -c 'SELECT indexname FROM pg_indexes WHERE tablename=$$driver_location_ping$$;'"
```

Expected: 5 indexes now, including `driver_location_ping_driverProfileId_isAnomaly_recordedAt_idx`.

---

## Completion Checklist

- [ ] Direct Neon URL obtained from Neon Console
- [ ] `prisma migrate dev` run successfully — new migration file generated
- [ ] Generated SQL reviewed and confirmed correct (column + index only, no unexpected changes)
- [ ] Migration committed and pushed to `master`
- [ ] `docker system prune -af` run on production server
- [ ] Production disk usage below 70%
- [ ] CI passes all three jobs on next push
- [ ] Production DB confirmed to have `route.turnaroundBufferMinutes` column
- [ ] Production DB confirmed to have the composite ping index

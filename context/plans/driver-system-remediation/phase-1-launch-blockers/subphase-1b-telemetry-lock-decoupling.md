# Subphase 1B: Telemetry Ingestion Lock Decoupling

## 1. Problem Statement & Findings Addressed

* **Finding Addressed**: `DRV-P0-02 (High-Frequency Telemetry Row-Lock Contention)`.
* **Current Defect**: `persistPingBatch` in `apps/web/server/telemetry-flush.ts#L105-L135` executes `SELECT id FROM driver_profile WHERE id IN (...) FOR UPDATE` on every 5-second batch to calculate daily safety penalty caps.
* **Operational Failure**: Under 500 concurrent buses, hundreds of transactions lock the `driver_profile` table simultaneously, causing connection pool exhaustion, `P2028` lock timeouts, and platform-wide request latency.

---

## 2. Architecture & Scope of Changes

```mermaid
graph TD
    subgraph Hot Ingest Path (Zero Row Locks)
        PING[Incoming GPS Fix Batch] --> VALIDATE[Validate Physical & Jump Gate]
        VALIDATE --> INSERT_RAW[Bulk INSERT into DriverLocationPing]
        INSERT_RAW --> ATOMIC_UPDATE[Atomic UPDATE DriverProfile last* Coords]
        ATOMIC_UPDATE --> REDIS_PUB[Publish to Redis telemetry Channels]
    end

    subgraph Asynchronous / Nightly Path
        DAILY_CRON[Nightly Reconcile Cron /api/cron/reconcile-driver-stats]
        DAILY_CRON --> AGG_CAPS[Aggregate daily safety penalties w/ 20 pt cap]
        AGG_CAPS --> UPDATE_SCORE[Update DriverProfile.safetyScore atomically]
    end
```

---

## 3. Implementation Steps & File Checklist

### Step 1: Refactor `persistPingBatch` (`apps/web/server/telemetry-flush.ts`)
- [ ] Remove the `SELECT ... FOR UPDATE` query block on `driver_profile`.
- [ ] Insert telemetry fixes into `DriverLocationPing` using Prisma `createMany`.
- [ ] Update latest driver coordinates (`lastLatitude`, `lastLongitude`, `lastHeading`, `lastSpeedKmh`, `lastPingAt`) using direct non-locking `prisma.driverProfile.updateMany`.

### Step 2: Update Safety Penalty Evaluation (`apps/web/lib/driver-scoring.ts`)
- [ ] Record `isAnomaly` and `anomalyReason` directly on `DriverLocationPing`.
- [ ] Decouple in-flight score deduction from the hot HTTP ping flush loop.
- [ ] Ensure the nightly reconcile cron (`/api/cron/reconcile-driver-stats`) remains the authoritative evaluator of lifetime safety scores and daily caps.

### Step 3: Add Database Index on `DriverLocationPing` (`packages/db/prisma/schema.prisma`)
- [ ] Add single-column index `@@index([recordedAt])` to `DriverLocationPing`.
- [ ] Run `prisma generate` to update the Prisma Client.

---

## 4. Verification & Testing Criteria

* [ ] Run simulated load test sending 500 concurrent telemetry batches per second to `/api/v1/telemetry/ping`.
* [ ] Verify that zero `P2028` lock timeout errors occur.
* [ ] Verify database connection pool utilization remains healthy ($< 30\%$).
* [ ] Confirm that `DriverLocationPing` records are inserted and `DriverProfile.last*` coordinates update in real time.
* [ ] Run `/api/cron/reconcile-driver-stats` and verify driver safety scores match expected daily capped totals.

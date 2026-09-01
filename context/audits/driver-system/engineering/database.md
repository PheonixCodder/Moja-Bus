# Engineering Audit: Database, Models & Constraints

## 1. Schema & Relational Structure

Models reside in `packages/db/prisma/schema.prisma`.

---

## 2. Database Anomalies & Indexing Gaps

### 2.1 Redundant Composite Index on `DriverShift`
* **Location**: `packages/db/prisma/schema.prisma#L2444`.
* **Index**: `@@index([companyId, startedAt])` and `@@index([driverProfileId, startedAt])`.
* **Analysis**: `companyId` is rarely queried without filtering by `driverProfileId` or date range in operator reports.

### 2.2 Missing Index on `DriverLocationPing.recordedAt` Alone
* **Location**: `packages/db/prisma/schema.prisma#L2424-L2425`.
* **Problem**: Indexes are composite: `[driverProfileId, recordedAt]` and `[tripId, recordedAt]`. The nightly prune cron `/api/cron/prune-telemetry` deletes rows where `recordedAt < cutoff` without a leading index on `recordedAt`, forcing table scans during large delete batches.
* **Fix**: Add single-column index `@@index([recordedAt])`.

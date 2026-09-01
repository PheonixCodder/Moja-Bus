# Engineering Audit: Concurrency, Locks & Deadlocks

## 1. Concurrency Controls & Locking Invariants

The Driver Operations Domain implements database concurrency controls for trip assignments, offer negotiations, and telemetry ingestion.

---

## 2. Concurrency Vulnerabilities

### 2.1 Telemetry Row-Lock Storm (`P0-2`)
* **Location**: `apps/web/server/telemetry-flush.ts#L110-L130`.
* **Issue**: The telemetry worker processes batches of up to 100 pings. For every batch, it sorts driver IDs and executes:
  ```sql
  SELECT id, safety_score FROM driver_profile WHERE id IN (...) ORDER BY id FOR UPDATE;
  ```
* **Failure Mode**: Under 500 active buses sending pings every 5 seconds, hundreds of concurrent database connections contend for the exact same rows in `driver_profile`. This saturates the database connection pool, leading to `P2028: Transaction timed out waiting for lock` errors and blocking unrelated web and mobile users.
* **Fix**: Remove `FOR UPDATE` from the telemetry ping flush path. Record pings in `driver_location_ping` as append-only records, and update `driver_profile` using atomic non-locking increments:
  ```sql
  UPDATE driver_profile SET last_latitude = $1, last_longitude = $2, last_ping_at = $3 WHERE id = $4;
  ```
  Move daily safety score penalty capping to an asynchronous worker or calculate during nightly reconciliation.

### 2.2 Double-Booking Check Race Condition
* **Location**: `apps/web/trpc/routers/trips.ts#L1894-L1903`.
* **Analysis**: `trips.assignDriver` correctly locks `Trip` (`FOR UPDATE`) and `DriverProfile` (`FOR UPDATE`). However, if an operator creates a new trip *while* an assignment check is running, the interval overlap query could miss the new uncommitted trip. The row lock on `DriverProfile` mitigates this for existing trips.

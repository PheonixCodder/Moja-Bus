# Workflow Audit: GPS Telemetry & High-Frequency Ingest

## 1. Telemetry Pipeline Evaluation

Audits:
1. Mobile GPS acquisition: `Expo TaskManager` (`telemetry.ts`).
2. HTTP ingest: `POST /api/v1/telemetry/ping`.
3. Stateless HMAC token validation: `verifyTelemetryDispatchToken`.
4. Haversine jump-gate filter: `validateTelemetryPing`.
5. Redis pub/sub distribution: `trip:{tripId}:telemetry` & `operator:{companyId}:fleet`.

---

## 2. Identified Telemetry Defects

### 2.1 Database Connection Pool Exhaustion on High Load (`P0-2`)
* **Location**: `apps/web/server/telemetry-flush.ts#L105-L135`.
* **Problem**: Processing 100 pings locks `driver_profile` rows with `FOR UPDATE`. Under 500 active buses, database query queues spike, causing API request timeouts across the entire platform.
* **Fix**: Remove `FOR UPDATE` row locks from the high-frequency telemetry flush path.

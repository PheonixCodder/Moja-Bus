# Workflow Audit: QR Ticket Scanning & Boarding Pipeline

## 1. Boarding Verification Pipeline

Audits:
1. QR token decoding: `parseTicketToken`.
2. Guard checks in `DriverCheckInService` (Tenancy, Intent, Status, Window).
3. Offline scan queue and batch sync: `drivers.batchSyncCheckIns`.

---

## 2. Identified Boarding Defects

### 2.1 Stale Offline Overwrite on Concurrent Crew Scans (`P1-02`)
* **Location**: `apps/web/features/driver/services/driver-check-in-service.ts#L150-L195`.
* **Issue**: When multiple crew members scan tickets in an offline terminal, the second batch flush overwrites the first `boardedAt` timestamp without verifying if the ticket was already boarded by another device.
* **Fix**: Use atomic conditional updates: `UPDATE booking SET boarded_at = $1 WHERE id = $2 AND boarded_at IS NULL`.

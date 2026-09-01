# Workflow Audit: Multi-Crew Departure Models

## 1. Crew Roster & Assignment Architecture

Audits:
1. Multi-role assignment junction: `TripDriverAssignment`.
2. Primary Driver vs. Relief Driver vs. Conductor.
3. Access boundaries and operational authority.

---

## 2. Identified Crew Defects

### 2.1 Impossible Crew Role Combinations
* **Location**: `apps/web/trpc/routers/trips.ts#L1830-L1890`.
* **Issue**: A driver can be assigned as both `PRIMARY` and `CONDUCTOR` on the same trip by submitting two separate assignment requests (since the unique constraint is `@@unique([tripId, driverProfileId, role])`).
* **Fix**: Enforce that a `driverProfileId` can hold at most ONE active crew role per `tripId`.

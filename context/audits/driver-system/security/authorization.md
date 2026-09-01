# Security Audit: Authorization & RBAC Procedures

## 1. Procedure Authorization Matrix

Audits:
1. `driverProcedure`: Enforces suspended and unverified read-only restrictions.
2. `operatorCompanyProcedure`: Scopes queries to `ctx.companyId`.
3. `adminProcedure`: Enforces admin IAM permissions (`drivers:verify.manage`).

---

## 2. Identified Authorization Gaps

### 2.1 Unverified Driver In-Flight Mutation Leak (`P1-08`)
* **Location**: `apps/web/trpc/init.ts#L335-L345`.
* **Issue**: `NON_VERIFIED_DENIED_MUTATIONS` only contains `startTrip` and `toggleShift`. An unverified driver can still call `reportTripDelay` or `manualCheckInPassenger` if they obtain a valid `tripId`.
* **Fix**: Expand `NON_VERIFIED_DENIED_MUTATIONS` to include all operational mutations: `reportTripDelay`, `recordStopArrival`, `recordStopDeparture`, `checkInPassenger`, and `manualCheckInPassenger`.

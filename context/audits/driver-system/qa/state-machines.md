# QA Audit: State Machine Integrity & Violations

## 1. State Machine Rigor & Violations

Audits:
1. `DriverStatus`: `OFFLINE` $\rightarrow$ `AVAILABLE` $\rightarrow$ `ON_TRIP`.
2. `DriverVerificationStatus`: `PENDING` $\rightarrow$ `VERIFIED` $\rightarrow$ `EXPIRED`.
3. `DriverOfferStatus`: `PENDING` $\rightarrow$ `COUNTERED` $\rightarrow$ `ACCEPTED`.

---

## 2. Identified Invariant Violations

### 2.1 Driver Unverified Mutation Leak
* **Violation**: An unverified driver (`verificationStatus === "PENDING"`) cannot start trips, but can invoke `reportTripDelay` or `manualCheckInPassenger` if they obtain valid IDs.
* **Fix**: Enforce `canOperateRuns` across all operational mutations.

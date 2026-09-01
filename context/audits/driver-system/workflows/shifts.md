# Workflow Audit: Duty Shifts & Active Work Tracking

## 1. Shift System & Working Hours

Audits:
1. Duty switch toggle: `drivers.toggleShift`.
2. Open shift tracking and live earnings accrual.
3. Shift closure and anti-strand convergence.

---

## 2. Identified Shift Defects

### 2.1 Concurrent Shift Toggle Race Condition (`P1-03`)
* **Location**: `apps/web/trpc/routers/drivers.ts#L2670-L2720`.
* **Issue**: When closing a shift (`onDuty: false`), the procedure verifies `driver.currentTripId === null`, but does not acquire a `FOR UPDATE` lock on `driver_profile`. If a trip is concurrently started from another device, the shift is closed while the trip starts, corrupting shift wage accruals.
* **Fix**: Wrap `toggleShift` in an interactive transaction with `FOR UPDATE` on `driver_profile`.

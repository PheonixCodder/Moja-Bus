# Workflow Audit: Trip Completion & Run Convergence

## 1. Run-End Convergence & Arrival Protocol

Audits:
1. Driver completion: `drivers.completeTrip`.
2. Operator completion: `trips.updateTripStatus(ARRIVED)`.
3. Anti-strand convergence: `convergeDriversAfterRunEnd`.

---

## 2. Identified Completion Defects

### 2.1 Missing Partial Fuel / Incident Post-Trip Log
* **Location**: `apps/driver-app/features/live/screens/live-view.tsx#L70-L80`.
* **Issue**: Tapping "Complete Run" immediately finishes the trip without offering an optional post-trip log (e.g. ending odometer reading, fuel consumed, passenger incident summary).
* **Fix**: Add an optional post-trip summary modal before final completion.

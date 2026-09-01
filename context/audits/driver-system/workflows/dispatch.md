# Workflow Audit: Urgent Dispatch & Pre-Departure Alerts

## 1. Urgent Dispatch Architecture

Audits:
1. Urgent window calculation: $<2$ hours before departure.
2. Mobile modal gate: `UrgentDispatchGate.tsx`.
3. Server-side persistent acknowledgment: `TripDriverAssignment.urgentDispatchAckAt`.

---

## 2. Identified Dispatch Defects

### 2.1 Clock Drift Denial Vulnerability (`P0-3`)
* **Location**: `apps/driver-app/features/dispatch/components/urgent-dispatch-modal.tsx#L45-L60`.
* **Issue**: The countdown timer and visibility guard calculate `new Date(departureDate).getTime() - new Date().getTime()`. If an Android device clock is 15 minutes slow, an urgent departure occurring in 10 minutes evaluates to $-5$ minutes (already departed), suppressing the acknowledgment modal and leaving the driver unable to open the trip.
* **Fix**: Use server-provided UTC reference time returned in `getMyUrgentDispatches` payload.

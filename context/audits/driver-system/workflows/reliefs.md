# Workflow Audit: Relief Drivers & Handover Mechanics

## 1. Relief Driver Sub-Segment Architecture

Audits:
1. Relief driver assignment: `Trip.reliefDriverId` and `TripDriverAssignment.role = "RELIEF"`.
2. Waypoint stop spans: `startStopOrder` to `endStopOrder`.
3. Nightly distance scaling: `computeSegmentDistanceKm`.

---

## 2. Identified Relief Defects

### 2.1 Complete Absence of Mid-Route Handover Mutation (`P0-4`)
* **Location**: `apps/web/trpc/routers/drivers.ts` & `apps/driver-app/features/live/screens/live-view.tsx`.
* **Defect**: While the database supports relief drivers, **there is no endpoint to transfer active run ownership** (`currentTripId`) from primary to relief driver mid-trip.
* **Operational Failure**: When the primary driver gets tired and the relief driver takes the wheel, the relief driver's app cannot stream GPS telemetry or confirm stop arrivals without physically taking the primary driver's phone.
* **Fix**: Implement `drivers.handoverTripControl({ tripId, targetDriverProfileId })`.

# Subphase 3A: Configurable Route Turnaround Buffers

## 1. Problem Statement & Findings Addressed

* **Findings Addressed**: `DRV-P2-13 (Fixed Global Turnaround Buffer Underestimation)` & `DRV-P2-18 (Double-Booking Fallback Speed)`.
* **Current Defect**: Turnaround buffers are fixed globally at 45 minutes (`DRIVER_TURNAROUND_BUFFER_MINUTES = 45`), and fallback speeds are hardcoded to 35 km/h.
* **Operational Friction**: High-congestion terminals (e.g. Adjamé Gare) need 90 minutes for turnaround, while regional shuttles need only 20 minutes.

---

## 2. Architecture & Scope of Changes

1. Add `turnaroundBufferMinutes Int?` to the `Route` model in `packages/db/prisma/schema.prisma`.
2. Update `apps/web/lib/driver-assignment.ts` to use `route.turnaroundBufferMinutes ?? DRIVER_TURNAROUND_BUFFER_MINUTES`.
3. Update fallback speed for intercity highways to 55 km/h (reflecting actual Côte d'Ivoire autoroute speeds).

---

## 3. Implementation Steps & File Checklist

- [ ] Update `packages/db/prisma/schema.prisma` (`Route.turnaroundBufferMinutes`).
- [ ] Update `packages/schemas/src/drivers.ts` (`driverInterval` calculation).
- [ ] Update `apps/web/lib/driver-assignment.ts` to respect route-specific turnaround buffers.
- [ ] Add field to Operator Route Edit UI in `apps/web/features/operator`.

---

## 4. Verification & Testing Criteria

* [ ] Set a Route's turnaround buffer to 90 minutes.
* [ ] Attempt to assign a driver to a subsequent trip departing 60 minutes after arrival.
* [ ] Verify the double-booking engine detects the conflict and prevents assignment.

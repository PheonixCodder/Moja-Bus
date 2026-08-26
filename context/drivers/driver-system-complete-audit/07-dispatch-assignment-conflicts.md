# 07 — Dispatch: Trip Assignment & Conflict Engine

> Audit date: 2026-08-26 · Sources: `trips.ts:1727-2170` (assign/unassign), `drivers.ts:3082-3414` (listAssignableDrivers, urgent dispatch), `lib/driver-assignment.ts`, operator trips view (dispatch board).

## 1. `trips.assignDriver` (perm `trips:update`) — full guard chain

1. Trip owned by company, not archived; status ∈ SCHEDULED/DELAYED/BOARDING (pre-departure only).
2. Driver affiliated ACTIVE with company (NOT_FOUND otherwise).
3. `verificationStatus === VERIFIED`.
4. Licence class ≥ bus type's `requiredLicenseCategory` (B<C<D<E ordering via `licenseMeetsRequirement`).
5. Licence valid **through estimatedArrival** (`isLicenseUsableThrough`; F-OP-03 — expiring mid-trip ≈ expired).
6. Transaction with row locks in FIXED ORDER: trip row FOR UPDATE → driver row FOR UPDATE (P2-8 race safety; unassign mirrors the order — never invert).
7. Role handling:
   - PRIMARY: same-driver-other-role refused; existing PRIMARY displaced only with `replacePrimary:true` else CONFLICT `PRIMARY_ASSIGNED::<name>` (consent-gated slot replacement); deletes old assignment row, sets `trip.driverId`.
   - RELIEF: mirror logic on `reliefDriverId` (CONFLICT `RELIEF_ASSIGNED::`).
   - CONDUCTOR: junction-only record.
8. Double-booking engine (below) → CONFLICT with busy-until message incl. turnaround.
9. Upsert assignment (P2002 → friendly "another operator just confirmed" race error); partial unique indexes are the backstop.
10. Notifications in-tx: `enqueueDriverTripAssigned` (urgent variant when departure ≤ URGENT_DISPATCH_WINDOW_HOURS) + `enqueueDriverTripUnassigned` to any displaced driver.

## 2. Conflict engine (`lib/driver-assignment.ts`)

- `driverInterval`: [departure, estimatedArrival]; when arrival missing → route distance ÷ conservative 35 km/h; else service-type default minutes (`URBAN_TRIP_DEFAULT_MINUTES` vs `INTERCITY_TRIP_DEFAULT_MINUTES` from @moja/schemas). Over-long busy window is deliberate (safe-side blocking).
- `findTripConflict(target, candidates)`: pure overlap check with `DRIVER_TURNAROUND_BUFFER_MINUTES` on BOTH sides. Shared by single-driver scan and roster batch scan (Phase 27 F-OP-14 — one math source so paths can't diverge).
- `getDriverTripConflict`: scans assignments cross-COMPANY (urban contractors legitimately hold multiple affiliations), ±16 h fetch window, live statuses only (SCHEDULED/BOARDING/DEPARTED/DELAYED, not archived), deterministic order (departure asc, id asc), take 50.

## 3. `drivers.listAssignableDrivers` — roster eligibility feed

One batched conflict query over the whole active VERIFIED roster inside the same ±16 h window (N+1 eliminated, Phase 27). Per driver returns: licence fit (`licenseOk` = class match AND expiry-through-arrival — the Phase-14 ride-along fixed a missing select that silently passed everyone), conflict descriptor, rolesOnTrip, live status. Sorted eligible-first then rating. Powers greyed-ineligible combobox rows on trip cards.

## 4. Urgent dispatch loop

- Feed: `drivers.getMyUrgentDispatches` — PRIMARY/RELIEF assignments, unacked, trip SCHEDULED/DELAYED/BOARDING, departing within +2 h (15-min just-departed grace), licence-through-arrival filter, take 5, deterministic order.
- Ack: `acknowledgeUrgentDispatch` persists `urgentDispatchAckAt` on the driver×trip×role assignment row (server-side since F-DV-14; AsyncStorage acks didn't survive reinstalls). ACK-RESET ruling recorded in-code: delays that push departure OUT of the window drop the row naturally; delays INSIDE the window stay silent deliberately (trips surface owns delay comms).
- Client: gate polls every 60 s across tabs; modal blocks until acknowledged.

## 5. Unassign

Mirrors assign's status window + lock order; clears driverId/reliefDriverId, deletes the assignment row, notifies the driver (`enqueueDriverTripUnassigned`). ARRIVED/CANCELLED immutable (Phase-26 window mirror).

## 6. Gaps

1. **No employmentType↔serviceType enforcement**: nothing prevents assigning a CONTRACTOR_URBAN-affiliated driver to an INTERCITY run (or an EXCLUSIVE_INTERCITY driver to urban loops) — grep of trips.ts shows zero employmentType references. The dual-mode model is enforced socially, not in code (see 13).
2. Conflict engine ignores RESTING/OFFLINE preferences (no minimum-rest rule beyond turnaround buffer).
3. No driver consent step for non-urgent assignments (notification is informational; acceptance implicit).
4. `startStopOrder/endStopOrder/distanceKm` duty-segment fields are stored but never used by scoring/earnings.

# Phase 03 — Check-in Authorization Binding

> **Closes:** F-IN-01 ≡ F-DV-03 (P1) · Evidence: `09-security-iam-crons-infra.md` F-IN-01; `04-driver-trip-execution.md` trace 3.
> **Status: ✅ CODE COMPLETE 2026-08-23** (verified this session) — all guards live in `features/driver/services/driver-check-in-service.ts`, wired into all three procedures; 30-case suite green (`web` 413/413); gates green (`turbo typecheck`+`test` 18/18). **Staging probes pending** per checklist: cross-tenant scan blocked · unpaid booking unboardable · manifest inspected for token absence.

## Objective
Only a driver actively assigned to a trip can board its passengers; unpaid, cancelled, and refunded bookings can never be boarded; passenger ticket tokens stop leaking through the manifest payload.

## Implementation shape (as landed)
Shared guard pipeline `DriverCheckInService.assertBoardable`, used by **all three paths**
(`checkInPassenger` scan / `manualCheckInPassenger` / `batchSyncCheckIns` via `syncOne`),
with `ctx.driver.id` session-derived at every call site (never client-supplied):

1. **Tenancy** — `tripDriverAssignment.findFirst({ driverProfileId, tripId: booking.tripId })`; row existence IS the active assignment (unassign deletes rows) → `FORBIDDEN`.
2. **Intent** — client-declared `tripId`, when present, must equal the ticket's trip → `BAD_REQUEST` on mismatch.
3. **Status** — only `CONFIRMED` boards → `PRECONDITION_FAILED` with honest copy for PENDING_PAYMENT vs cancelled/refunded.
4. **Window** — trip ∈ {SCHEDULED, BOARDING, DELAYED, DEPARTED}; CANCELLED/ARRIVED → `BAD_REQUEST`. Deliberately not the operator's formal window: gate boarding happens while still SCHEDULED, before Start Run.

Failures are explicit per-item in batch (`REJECTED` outcomes with reasons; unexpected non-TRPC errors propagate loudly) — replaces the old swallow-all empty catch.

## Tasks — disposition against the ratified spec
- [x] All three procedures resolve the caller's active `TripDriverAssignment` for the booking's `tripId` → FORBIDDEN otherwise. *(Role-blind by design: PRIMARY/RELIEF/**CONDUCTOR** all board — mirrors `getMyTripManifest`; spec said "PRIMARY or RELIEF", conductor inclusion ratified as manifest-consistent.)*
- [x] ~~Make `tripId` required in `driverCheckInPassengerSchema`; update `scanner.tsx` to send the active trip id~~ **DEVIATION (ratified as landed):** `tripId` stays **optional** in both schemas. Tenancy is derived entirely server-side from the assignment↔booking.trip join — the server never trusts the client's trip claim; a declared mismatch is rejected (guard 2), and `scanner.tsx:95` sends `activeTripId ?? undefined` as a hint only. Strictly stronger than requiring the field.
- [x] Enforce `status === CONFIRMED` in scan and manual paths + same guard on batch items (per-item loud failure). *(Spec's "optional short post-arrival grace" NOT taken — ARRIVED rejects boarding outright; stricter than spec.)*
- [x] Stop returning `ticketToken` in `getMyTripManifest` payload (`drivers.ts:1324` — bookingReference + boarded state suffice).
- [x] Tests: unassigned/cross-trip driver → FORBIDDEN; PENDING_PAYMENT/CANCELLED/REFUND_PENDING (+EXPIRED) rejected on all three paths; batch reports each item independently; offline scan time honored; pt.-token interplay covered (Phase 02 suite section).

## Test matrix (driver-check-in-service.test.ts, 30 cases)
Scan: assigned boards · matching tripId accepted · alreadyBoarded idempotent (no write) · unknown token NOT_FOUND · unassigned FORBIDDEN (no write) · cross-trip declaration BAD_REQUEST · PENDING_PAYMENT/CANCELLED/REFUND_PENDING/EXPIRED PRECONDITION_FAILED · trip CANCELLED/ARRIVED BAD_REQUEST · DEPARTED boards. Manual: boards on declared trip · wrong-trip NOT_FOUND · unassigned FORBIDDEN · CANCELLED/PENDING_PAYMENT rejected (guards previously absent — the audit finding) · idempotent. Binding: assignment query role-blind. Batch: 6-item mixed matrix (ghost/mismatch/unassigned/unpaid/boarded/ok) → per-item outcomes, single write with original scan time · db error propagates. Phase 02: pt. resolve/reject/passthrough + batch per-item.

## Acceptance criteria
- Driver B scanning a trip-Y ticket → explicit FORBIDDEN. *(unit-proven; staging probe pending)*
- All boarding paths reject non-CONFIRMED bookings. *(unit-proven ×3 paths)*
- Manifest payload contains no token field. *(verified in code)*

## Verification
Staging probes (Gate A): cross-tenant scan blocked; unpaid booking unboardable; manifest inspected for token absence.

## Dependencies
Executed after Phase 02 (same file cluster — composed into the same service refactor); pairs with Phase 06 for the suspended-driver surface rules.

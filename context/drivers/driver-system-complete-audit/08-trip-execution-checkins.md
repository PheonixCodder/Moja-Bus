# 08 — Driver Trip Execution (start · check-ins · delay · completion)

> Audit date: 2026-08-26 · Sources: `drivers.ts` mobile procedures, `features/driver/services/driver-check-in-service.ts`, `lib/trip-arrival.ts`, `apps/driver-app/app/(tabs)/{trips,live,scanner}.tsx`.

## 1. Run lifecycle state machine

```
SCHEDULED ── startTrip ──▶ DEPARTED ── completeTrip ──▶ ARRIVED
    ▲                          │  ▲                        (terminal)
    │        reportTripDelay   │  └── resume path: DEPARTED→DEPARTED
    └── DELAYED (pre-departure)+ keeps DEPARTED status mid-route
```

- **startTrip** (`drivers.ts:1690-1788`): assignment required; VERIFIED-only (`canOperateRuns`); licence through arrival; transition guard rejects ARRIVED/CANCELLED re-starts; stamps `actualDeparture` ONCE (resume never overwrites); sets driver ON_TRIP + currentTripId; mints dispatch telemetry token (claims d/t/c).
- **completeTrip** (`:1834-1910`): DEPARTED-only (double-tap safe); stamps actualArrival; post-run status = open shift ? AVAILABLE : OFFLINE (`resolvePostRunStatus` — same rule as forced convergence paths); clears currentTripId; `totalTripsCompleted++`; then `finalizeTripArrival`.
- **reportTripDelay** (`:1912-2168`): live-status guard; 5-min per-trip throttle implemented as a synthetic anomaly ping (`DELAY_<REASON>` prefix query); writes incident ping at last known coords; applies the OPERATOR-IDENTICAL formula (cumulative delayMinutes, DELAYED pre-departure / DEPARTED keeps status, departureDate + estimatedArrival shifted); revalidates every PRIMARY/RELIEF assignment for newly created conflicts (`getDriverTripConflict`) and alerts operators; fans out TRIP_DELAYED outbox notices to all CONFIRMED bookings (guest emails synthesized as `<phone>@guest.mojaride.ci`).

**finalizeTripArrival** (`lib/trip-arrival.ts`) — shared by operator ARRIVED and driver completion: stamps booking.completedAt (review + escrow eligibility key) + per-booking `passenger-review-request` Novu trigger with idempotent transactionIds. This is why COMPLETED BookingStatus stays intentionally unstamped (schema note :31-37).

## 2. Boarding & check-ins (DriverCheckInService)

Shared guard pipeline `assertBoardable` for ALL three paths:
1. Tenancy — active TripDriverAssignment for this driver on the trip → else FORBIDDEN.
2. Declared tripId mismatch → BAD_REQUEST (scanner binds ACTIVE_TRIP_ID_KEY).
3. CONFIRMED-only boarding → PRECONDITION_FAILED otherwise.
4. Boarding-window status set → BAD_REQUEST outside it.
Failures are explicit typed errors, never collapsed (token-vs-network disambiguation).

- `checkInPassenger`: schema preprocess normalizes scanned URLs/`?token=`/JSON-wrapped/bare forms (canonical `parseTicketToken` in @moja/schemas/ticket-token, regex-only for Hermes); `pt.` presentation tokens resolve server-side via injected resolver — durable ticketTokens never leave the server (Phase 02+03).
- `manualCheckInPassenger`: same guards, reference-based fallback.
- `batchSyncCheckIns`: per-item outcomes (not swallow-all) for the future offline scan queue.
- Manifest: `getMyTripManifest` strips ticketTokens; search by name/phone/reference; boardedCount computed from boardedAt.

## 3. What the driver app actually renders

trips list (30 s poll, TODAY/UPCOMING/COMPLETED/ALL + service-type chips) → Start Run → live HUD (Mapbox corridor, speedometer, ETA-or-approximate chip, delay modal, Complete Run) + scanner tab bound to the active trip. No per-stop waypoint checklist exists (design-doc aspiration; TripStop actuals unwritten by drivers).

## 4. Operator/driver parity guarantees

- Arrival: both surfaces call finalizeTripArrival → identical review fan-out + escrow timing.
- Delay: both surfaces share one cumulative formula → no double-counting.
- Forced convergence (operator ARRIVED, cancel, suspension): lib/driver-run-state.ts tears down run state; the app's zombie-watch stops GPS streaming within one profile poll.

## 5. Gaps

1. No stop-level execution (above).
2. `reportTripDelay` throttle stores incidents in the ping table — analytics queries must keep excluding `DELAY_*` reasons from scoring/anomaly stats (they do via explicit reason filters today).
3. completeTrip does not verify proximity to destination (a driver can "complete" anywhere); acceptable v1 trust model worth recording.
4. Guest review requests go to synthetic email keys — deliverable via email channel only; no SMS fallback despite phone present.

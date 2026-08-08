# OT — Offer / Booking Trip-Time Derivation Bug (CONFIRMED "0h 0m everywhere")

## Symptom (reporter-confirmed)
Every searched trip shows **0h 0m duration** and **identical departure/arrival times** on the search
results (`offer-card.tsx`) and in the booking dialog (`TripSummaryCard` in the booking flow). User
reports: "I get 0h 0m everywhere".

## Root cause
The destination stop's `scheduledArrival` (and `trip.estimatedArrival`) is derived from the **last
intermediate waypoint's** `departureOffsetMinutes`, with a hard `?? 0` fallback:

- `apps/web/lib/trip-generator.ts:138-140`
  ```ts
  const lastWp = route.waypoints[route.waypoints.length - 1];   // undefined when no waypoints
  const lastTiming = lastWp ? timingMap.get(lastWp.id) : undefined;
  const destDepartureOffset = lastTiming?.departureOffsetMinutes ?? 0;
  ```
- `apps/web/trpc/routers/trips.ts:53-55` (manual create) — identical logic.
- Dest stop written with that offset: `trip-generator.ts:207-219`, `trips.ts:123-136`.

`computeScheduleWaypoints` (`apps/web/trpc/routers/schedules.ts:28-91`) only walks **intermediate**
route waypoints — the destination terminal is never a waypoint. For a route with **zero waypoints**
(direct origin→dest):
- `scheduleWaypoints` is empty → `destDepartureOffset = 0`
- destination `scheduledArrival == scheduledDeparture == departureTimestamp`
- `trip.estimatedArrival == departureTimestamp`
- → `durationMinutes = 0`, arrival == departure.

This affects **every direct route**, i.e. ALL urban routes (same-city origin→dest, no waypoints) and
any intercity route without intermediate stops.

## Why the operator-entered duration never applies
The full-route fare's `durationMinutes` (entered in the Pricing step, e.g. 240 for a 4h run) is used
in `computeScheduleWaypoints` ONLY as a **proportional allocator** for waypoint travel when waypoints
exist (schedules.ts:46-70). It is never mapped onto the destination stop's arrival or
`estimatedArrival`. So a direct 4-hour intercity trip still renders 0h 0m.

## Secondary (LG2, same family)
Even on routes WITH waypoints, destination arrival == last waypoint's **departure** offset (includes
that waypoint's dwell) with no additional travel time for the final leg waypoint→destination terminal.
Arrivals are systematically understated whenever the last waypoint isn't at the destination terminal.

## Display path (confirmed consistent — not a formatting bug)
- `offer-card.tsx:90,118`: `formatDepartureTime(offer.departureTime)` / `arrivalTime` /
  `formatTripDuration(offer.durationMinutes)`.
- Values set in `search-service.ts:118-122,152-153` from `originStop.scheduledDeparture` /
  `destStop.scheduledArrival`.
- Booking dialog uses the SAME values via `trip-details-service.ts:128-132,166-167` →
  `trip-summary-card.tsx:325,353`.
- Timezone is correct: `formatTime` (`lib/format-date.ts:56-66`) renders in `Africa/Abidjan`
  (UTC+0, no DST); departure hour is right. The defect is purely the arrival/duration offsets.

## Suggested fix directions (not implemented — audit only)
1. Map the full-route fare `durationMinutes` onto the destination stop's `scheduledArrival` /
   `estimatedArrival` when there are no waypoints (i.e. `destArrivalOffset = fullRouteFare.durationMinutes`
   fallback instead of `?? 0`).
2. For waypoint routes, add a final-leg travel time (distance-based share of the full-route fare)
   between the last waypoint and the destination terminal instead of reusing the last waypoint's
   departure offset.
3. Keep `computeScheduleWaypoints` + dest offset logic in ONE place (both `trip-generator.ts` and
   `trips.create` duplicate it) so both bulk generation and manual creation stay in sync.

## Files
- `apps/web/lib/trip-generator.ts:138-151, 207-219`
- `apps/web/trpc/routers/trips.ts:53-55, 123-136`
- `apps/web/trpc/routers/schedules.ts:28-91, 596-599`
- `apps/web/features/search/services/search-service.ts:118-122, 152-153`
- `apps/web/features/booking/services/trip-details-service.ts:128-132, 166-167`
- `apps/web/features/search/components/offer-card.tsx:90,118`
- `apps/web/features/booking/components/trip-summary-card.tsx:325,353`

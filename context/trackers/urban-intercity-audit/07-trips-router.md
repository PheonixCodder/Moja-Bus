# T — trips.ts Router Findings

File: `apps/web/trpc/routers/trips.ts` (1255 lines, full read).

## T1 — `list` serviceType filter present (inconsistent with schedules.list R1)
`trips.list` accepts optional `serviceType: "INTERCITY" | "URBAN"` and filters `filters["serviceType"]`.
`schedules.list` has no equivalent. Confirms inconsistency (see R1). Trips list also filters by
`routeId` via nested `schedule.routeId`, and `q` across terminal name/city/cityRelation.

## T2 — `list` window uses `getAppRollingTripWindow(14)`; page defaults pageSize=50
Default window today→+14d matches schedules window (M1 in memory says schedules window today→+14d
too). OK.

## T3 — `statusCounts` has no window filter
`statusCounts` counts ALL trips for companyId (optionally scheduleId/routeId) — no start/end date
window. If dispatch-board chips should reflect the same 14-day window as the list, this is a
discrepancy (memory M2: "global status counts so the dispatch-board chips reflect every trip" — by
design, but note it).

## T4 — `trips.create` routeSnapshotJson shape
`serviceType: schedule.route.serviceType` snapshot (comment says match bulk generator). Includes
`scheduleWaypoints` under the spread route. Verify bulk generator (`lib/trip-generator.ts`) snapshots
the exact same shape/`version: 1`.

## T5 — `trips.create` timingMap vs scheduleWaypoints (destDepartureOffset)
`destDepartureOffset = lastSw?.departureOffsetMinutes ?? 0`. If a schedule's `scheduleWaypoints` don't
include the destination stop (dest terminal = stopOrder lastWp+1, and scheduleWaypoints keyed by
routeWaypointId which never includes destination), then destDepartureOffset is always 0 and
`estimatedArrival` = departureTimestamp. Same in bulk generator? (Verify `trip-generator.ts`.)

## T6 — `assignBus` compatibility uses seat LABEL matching
Booked seats are re-mapped by label to the new bus; incompatible if a label missing. Uses
`SELECT ... FOR UPDATE`. Good. Novu trigger after commit (fine).

## T7 — `delay` uses `assertTripTransition(trip.status, "DELAYED")` then increments all tripStops
FOR UPDATE on `trip` only (not tripStops); stops updated individually in a tx. Race window between
lock read and stop updates is fine within tx. `delayMinutes` accumulates (previousDelay + delay).

## T8 — `cancel` delegates to `cancelTripWithRefunds` (to read).
## T9 — `updateStatus` blocks CANCELLED/DELAYED via explicit string checks (redundant w/ zod) and
`ARRIVED` marks bookings completedAt. Also has **mis-indented body** (`updateStatus:` line 920) —
another formatting artifact (R2 family).

## T10 — `toggleSingleTripSeatStatus` recomputes `totalSeats` with `seat.isBookable` but the create path
filters `seatType !== DRIVER_AREA/EMPTY_SPACE` as well — **inconsistent totalSeats definitions**:
- create/assignBus: count = seats where `isActive && isBookable && seatType not DRIVER_AREA/EMPTY_SPACE`
- toggleSingleTripSeatStatus sync: count = tripSeats where `isActive && seat.isBookable` (no
  seatType exclusion)
Flag for consistency.

## T11 — get/getManifest include identical heavy includes; getManifest omits seats (L1 split) — good.

## Open
- `cancelTripWithRefunds` (lib) — booking status transitions, refund creation, Novu notify.
- `assertTripTransition` (lib/trip-status).
- `getAppRollingTripWindow` / `getCalendarDateKey` (lib/timezone).

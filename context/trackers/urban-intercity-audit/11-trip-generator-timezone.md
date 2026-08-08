# L — trip-generator.ts + timezone.ts Findings

Files: `apps/web/lib/trip-generator.ts` (253 lines, full), `apps/web/lib/timezone.ts` (117 lines, full).

## LG1 — T4/T5 RESOLVED: parity between bulk generator and `trips.create`
`generateTripsForSchedule` (trip-generator.ts) and `trips.create` produce IDENTICAL trip shapes:
- `totalSeats`: seats where `isActive && isBookable && seatType not DRIVER_AREA/EMPTY_SPACE` ✓
- `serviceType: route.serviceType` snapshot ✓
- `routeSnapshotJson: { ...route, scheduleWaypoints, version: 1 }` ✓
- `estimatedArrival = departureTimestamp + destDepartureOffset*60000` where
  `destDepartureOffset = lastWpTiming?.departureOffsetMinutes ?? 0` ✓ (both)
- tripStop creation: origin(order 0, pickup), waypoints, dest (lastWp+1, dropoff) ✓
- tripSeat creation from bus.seats `isActive: seat.isActive` ✓
Good — the memory note "match the bulk generator" is honored.

## LG2 — `estimatedArrival` == last waypoint departure, not real destination arrival (SEMANTIC)
Both generator and `trips.create` set `estimatedArrival = departureTimestamp + lastWpDepartureOffset`.
`computeScheduleWaypoints` accumulates travel+dwell per waypoint; the last waypoint's
`departureOffsetMinutes` equals the total cumulative to that point, and the **destination stop's
arrival is set to the SAME value**. So the destination scheduledArrival == last intermediate stop's
scheduledDeparture — there is no additional travel time from the final waypoint to the destination
captured. If routes have a meaningful last leg (e.g. last waypoint far from dest terminal), arrival
times are understated. This is a modeling choice but should be documented/verified against expected
ETAs. Same in both paths so not a divergence — flag as product-level.

## LG3 — Mis-indented line (formatting artifact)
`trip-generator.ts:172` `const lastWaypointOrder =` has wrong indentation (inside tx callback but
aligned oddly). Cosmetic.

## LG4 — Generator clears `preferredBusId` when preferred bus unusable AND no override (GOOD)
trip-generator.ts:63-74. Clears preferredBusId so the health warning surfaces. Confirmed.

## LG5 — `daysCount` default 14; `getCandidateDepartureDates` (lib/schedule-trip-window) drives window.
Consistent with schedules `list` 14-day future window and trips `list` window.

## TZ1 — timezone.ts helpers (full): all UTC-anchored, correct for Abidjan UTC+0
- `getZonedDateParts` uses Intl with `timeZone: Africa/Abidjan`.
- `startOfAppCalendarDay` = UTC midnight of the Abidjan day.
- `endOfAppCalendarDay` inclusive 23:59:59.999.
- `getAppRollingTripWindow` = start of today → end of today+daysAhead.
- `buildAppDepartureTimestamp(calendarDay, h, m)` = UTC timestamp for Abidjan day + HH:mm.
- `isOnOrAfterCalendarDay` / `isOnOrBeforeCalendarDay` compare `YYYY-MM-DD` keys lexicographically.
- `getWeekdayKey` maps Intl weekday short label → key.

## TZ2 — R6 (getUTCDay in schedules.addException) — correct only because UTC+0
`getCalendarDateKey`/`getWeekdayKey` are the canonical helpers; if `addException` uses `getUTCDay`
instead of `getWeekdayKey`, it's duplicative. Re-verify the schedules router body (lines 1200+).

## TZ3 — `getZonedDateParts` does Number(...) on possibly-undefined part values
`Number(parts.find((p) => p.type === "year")?.value)` → if a part is missing, `Number(undefined)` =
NaN. Intl with these options always yields the parts, so safe in practice. Minor robustness note.

## Open
- Re-read schedules.ts remainder (lines 130–330, 450–1505) to confirm updateBasic/updateCalendar/
  reconcile/addException/removeException internals captured earlier and verify R3/R6 precisely.
- `lib/cancel-trip-with-refunds.ts`, `lib/trip-status.ts`, `lib/permissions/authorize.ts`, `lib/geo/*`,
  `lib/rate-limit.ts` (used by capture service), `lib/novu.ts`.

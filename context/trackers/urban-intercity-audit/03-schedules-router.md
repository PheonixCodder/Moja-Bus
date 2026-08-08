# R — schedules.ts Router Findings

> **STATUS: FIXED** — R1 (serviceType filter), R5 (updateFare overlap guard), and R7b
> (safe trip archive-on-delete) are resolved. See `docs/plans/2026-08-07-schedule-search-audit-fixes.md`
> (Tasks 3, 6, 7).

File: `apps/web/trpc/routers/schedules.ts` (1505 lines, fully read line-by-line).

## R1 — No serviceType / urban filter on `schedules.list` (CONFIRMED — FIXED)
`list` (schedules.ts:330-428) reads `routeId`, `isActive`, `q`, `page/pageSize`, `sort` from
`listSchedulesSchema` (`packages/schemas/src/schedules.ts:371-380`). There is **no `serviceType` /
`isUrban` filter** in the schema or the query. `trips.list` DOES support `serviceType` — inconsistent.
- V1 resolved: the view maps `status=active|inactive` → `isActive: true|false`; the router reads
  `isActive` correctly. **No mismatch.**
- Recommendation: add optional `serviceType` to `listSchedulesSchema` + query + toolbar.

## R2 — Mis-indented mutation bodies (cosmetic but noisy)
`updateBasic` (750-751), `updateCalendar` (893-897), `reconcileFutureTrips` (~997-998),
`addException` (1304-1306), `removeException` (1466-1468) have mis-indented handler bodies.
Not a runtime bug; likely an editor/formatting artifact. Biome/prettier would flag.

## R3 — `updateBasic` cadence sync + `Object.fromEntries` partial-filter (RESOLVED)
- `updateBasic` (schedules.ts:746-886) patches `departureTime = departureTimes[0]!` when cadence
  changes (line 820-826) — keeps the single-legacy column in sync. Good.
- Reconciles future trips when times or bus change (line 866-883).
- `Object.fromEntries(... .filter(([, v]) => v !== undefined))` (line 814-816): predicate keeps
  explicit `null` (null !== undefined) — so `preferredBusId: null` to clear DOES survive. **R3 concern
  resolved.** Line 817-819 additionally forces `name` to `null` when empty string.
- Note: `departureTime = departureTimes[0]!` uses non-null assertion; if an empty array somehow
  arrived, `[0]!` is `undefined` and Prisma would silently skip the field. Schema `min(1)` guards
  this — no action needed.
- Capacity-downgrade guard (line 783-811): refuses bus whose `layoutTemplate.totalSeats` is less than
  the max active-booking count across future non-cancelled trips. Good.

## R4 — `create` guards (verified OK)
- `validFrom >= todayStart` (app calendar day).
- Overlap guard `checkScheduleOverlap` (same route, weekday intersection, shared departureTimes,
  date-window overlap).
- Duplicate fare segment+type guard; full-route fare required; computes `scheduleWaypoints`;
  `generateTripsForSchedule` wrapped, warning M12 on failure (partial trip generation still saves
  schedule — by design but worth an audit note).

## R5 — `addFare`/`updateFare` overlap logic (verified — FIXED)
- `addFare` (1083-1155): overlap check covers always-valid AND date-ranged combos (line 1124-1140).
  Always-valid duplicate throws; date-window overlap throws.
- **FIXED:** overlap logic extracted into a shared `assertNoFareOverlap` helper and now re-run in
  `updateFare` whenever the fare `type` changes (the only field that can introduce a new conflict).
  `addFare` calls the same helper. `updateFare` (1037-1081): same `Object.fromEntries`
  undefined-filter (null survives); validates `fromStopOrder < toStopOrder`.
- `deactivateFare` (1157-1211): blocks deactivating the last active full-route fare. Good.

## R6 — `addException` bounds/day checks (verified; UTC-only caveat)
- Bounds-checked vs calendar validFrom/validUntil using UTC midnight/23:59:59.999 (1328-1346).
- Active-day check uses `targetDate.getUTCDay()` (line 1347) — **correct only while the app timezone
  stays UTC+0** (Africa/Abidjan has no DST). `exceptionDate` built via `buildAppDepartureTimestamp`
  (1317-1321) — consistent with app-calendar-day helpers. Flag for future-proofing only.
- `CANCELLED` (1394-1441) cancels booked day trips via `cancelTripWithRefunds`, deletes unbooked
  SCHEDULED. `EXTRA_SERVICE`/`MODIFIED` (1443-1457) reconcile — but **only when
  `schedule.preferredBusId` is set** (1444); schedules without a preferred bus get no trip
  reconciliation. Minor.
- `removeException` (1462-1504) reconciles on same condition.

## R7 — `delete` blocks on CONFIRMED / PENDING_PAYMENT bookings (OK — FIXED R7b)
- `delete` (699-744) counts bookings via `trip: { scheduleId }` + active statuses; throws if >0.
- **FIXED (R7b):** `delete` no longer `deleteMany`s trips. It partitions trips by booking count:
  trips with **no** bookings are hard-deleted; trips that still carry historical booking rows are
  detached (`scheduleId → null` via `onDelete: SetNull`, added `Trip.archivedAt`) and soft-archived,
  so `Booking.trip` `Restrict` (schema.prisma:1814) never fires. The schedule itself is then deleted.
  `Booking.trip` FK is left as `Restrict` (no cascade) per the team's booking-lifecycle concern.

## R8 — `retire` (verified)
- `retire` (666-697) sets `isActive=false`, then `pruneUnbookedFutureTrips`.
- **R8 note:** booked future trips are NOT cancelled/refunded — they remain SCHEDULED and will still
  depart (comment at 120 says "handled by cancelTripWithRefunds later", but retire never calls it).
  Likely an intentional grace period, but operators get no warning; document as behavior.
- Same behavior in `updateBasic` `isActive:false` path (860-865).

## R9 — `reconcileScheduleTrips` (verified)
- (134-245) prunes unbooked future trips; computes allowed departure timestamps from
  `getCandidateDepartureDates` (lib, 14-day window); deletes unbooked mismatches; cancels booked
  mismatches with refunds (`forceAfterDeparture: false`); regenerates via `generateTripsForSchedule`.
- `reconcileFutureTrips` proc (990-1035) requires active schedule + busId (input or preferredBusId).
- `regenerateTrips` (1213-1295): busId selection order `preferredBusId || defaultBusId ||
  schedule.preferredBusId` (1242-1245); validates bus active+company-owned; persists preferredBusId
  only if none set or `persist` flag (1270-1275); generates hard-coded 14 days.
- **R9 note:** `updateCalendar` (888-986) merges day patch, guards "at least one active day"
  (925-944), re-runs overlap check when schedule active, reconciles trips when preferredBusId set.

## R10 — `checkScheduleOverlap` (verified)
- (252-327) only checks `isActive: true` schedules; exact time-string equality for shared times; date
  window overlap; weekday intersection. Minute-level differences avoid conflict (by design).

## Files needing cross-check (next)
- `apps/web/features/operator/lib/schedules/schedule-search-params.ts` (already read — nuqs parsers,
  DAYS, formatTime, parseLocalDate; `scheduleListParsers` exposed for `q, routeId, status, page, sort,
  new, step, routePick, edit`).
- Verify `Booking.tripId` FK `onDelete` in `packages/db/prisma/schema.prisma` (R7b).
- Check `create` (480-665) busId field vs `regenerateTrips` dual `defaultBusId`/`preferredBusId` input.

# Urban + Intercity System Audit — Final Report

Consolidated from trackers 01–13 (`context/trackers/urban-intercity-audit/`). Audit-only: **zero code
changes made**. Scope: terminals, schedules (all wizard steps), schemas, tRPC routers (schedules,
trips, routes, fleet, terminals, captures, search, locations), capture service, trip generator,
timezone helpers, and the public search pipeline.

## Executive Summary

The urban/intercity discriminator (`ServiceType`) is implemented consistently end-to-end: persisted on
`Route` (derived server-side from terminal `cityId` geography, explicit overrides rejected),
snapshotted onto `Trip` at generation, and the public search derives `isUrban = origin.cityId ===
destination.cityId`. These three agree in every path audited. The bulk trip generator and `trips.create`
produce byte-identical trip shapes.

Three **confirmed bugs** stand out: the reported manual "Add time" bug (B1), a `schedules.delete` FK
crash on historical bookings (R7b), and a newly found dead `isExpress` search filter (S10). Beyond
those, findings are consistency/robustness issues rather than functional breakage.

## Confirmed Bugs

### B1 (High) — Calendar Step: manual "Add time" doesn't register
- `DepartureTimesEditor`'s `draft` state changes **only** via the `TimePicker`'s hour/minute
  `Select`s, which are Base UI `Select` popups **portaled to `document.body`** (`select.tsx` Portal)
  nested *inside* the `TimePicker`'s Base UI `Popover` (`time-picker.tsx:105,120`). This matches known
  Base UI nested-popup regressions (mui/base-ui#2480, #5408) where the outer popover dismisses
  pre-commit, so `onValueChange` never fires and `draft` stays `"07:00"`.
- The cadence preset works because it reads state defaults (`06:00`→`22:00` every 30) and never
  requires a picker interaction — consistent with the reporter's "cadence works."
- **Secondary:** duplicate add is a silent `return` (no feedback); after an add `setDraft("")`
  disables the Add button until a re-pick.
- Affects both the wizard (`calendar-step.tsx`) and the edit drawer (`schedule-edit-drawer.tsx`) —
  same component.
- **Fix:** replace the nested Select-in-Popover pattern in `time-picker.tsx` (plain time input, quick
  chips, or a non-portaled listbox); add duplicate feedback in `addDraft`.
- **Runtime confirmation pending** — no test infra exists in the monorepo (no vitest/jest/Playwright/
  testing-library).

### R7b (High) — `schedules.delete` crashes on schedules with historical bookings
- `schedules.delete` (schedules.ts:699-744) blocks only CONFIRMED/PENDING_PAYMENT bookings, then runs
  `tx.trip.deleteMany({ scheduleId })`. `Booking.trip` (schema.prisma:1814) has **no `onDelete`** →
  Prisma default `Restrict`. Any trip that still has booking rows (even COMPLETED/CANCELLED) throws an
  FK error — the exact case the code's message (717-718) says should be clean.
- **Fix options:** `onDelete: Cascade` on `Booking.trip` (needs booking-lifecycle review), or
  soft-delete/archive trips instead of `deleteMany`.

### S10 (Medium) — "Express only" search filter is a silent no-op
- `search-page-client.tsx` tracks `isExpress` in `localFilters` (sidebar checkbox, badge count,
  criteriaKey) but **never passes it to the `search.search` query** (input 102-119). The router
  (`search.ts:33,125`) and service (`search-service.ts:179-180`) fully support it.
- **Fix:** add `isExpress: localFilters.isExpress ? ["true"] : undefined` to the query input.

## Medium Severity Findings

| ID | Finding | Location | Recommended action |
|----|---------|----------|--------------------|
| R1 | `schedules.list` has no `serviceType`/urban filter; `trips.list` does | schedules.ts:330, schemas 371-380 | Add optional `serviceType` filter + toolbar |
| R5 | `updateFare` never re-runs the overlap check vs other fares; an update can create a conflict `addFare` blocks | schedules.ts:1037-1081 | Re-run overlap check on update |
| D1 | Drawer converts dates via `toISOString().slice(0,10)` — correct only while UTC+0 | schedule-edit-drawer.tsx:126 | Use `getCalendarDateKey`/app-calendar helpers |
| N4 | Main search uses `fares.find` (first match); `cheapestByDate` uses min price — overlapping fares can yield different prices | segment-fare-match.ts:17-26 vs search.ts:230 | Align to cheapest-match or prove no overlaps |
| G2 | `routes.update` waypoint replace deletes/recreates `RouteWaypoint` rows — verify `ScheduleWaypoint.routeWaypoint` FK cascade vs restrict (timings can go stale / update can throw) | routes.ts update | Verify schema FK; reconcile schedule waypoints |
| S9 | `locations.suggestQuarter` is a public mutation (no auth/rate-limit) | locations.ts:185-209 | Gate or rate-limit |

## Low Severity / Notes (selected)

- **R8** — `schedules.retire` (and `updateBasic isActive:false`) deactivates but never cancels/refunds
  booked future trips; documented as intentional grace period but operators get no warning.
- **R6/TZ2** — `addException` uses `getUTCDay()`; correct only while app TZ stays UTC+0 (Abidjan, no
  DST). Same for all UTC-anchored day/hour bounds in search (S2/S3, N2). Future-proofing only.
- **RTE1** — `routes.update` urban stray-waypoint guard only inspects submitted waypoints; existing
  out-of-city intermediate stops are missed when origin/dest change reclassifies to URBAN.
- **RTE4** — `routes.delete` only counts CONFIRMED bookings; PENDING_PAYMENT/holds don't block.
- **RTE5** — waypoint replace returns `needsReconciliation` but nothing reconciles trips/fares
  (stale-fare count is report-only).
- **T10/F2** — `totalSeats` computed two ways: create/assignBus exclude DRIVER_AREA/EMPTY_SPACE
  seatTypes; `toggleSingleTripSeatStatus`/`toggleSeatStatus` don't (in practice isBookable=false
  covers it, but align definitions).
- **F3** — `updateBus` retire guard omits DELAYED (delete does include it) — inconsistent.
- **C3** — `rejectCapture` regresses a once-COMPLETE terminal to PENDING_CAPTURE; operator loses
  "keep old geo" option.
- **C1** — `approveCapture` requires resolved municipality; a city with no municipality resolution
  can't be approved (no `ensureTerminalGeography` fallback at approval).
- **TM4** — terminal deactivate/demote doesn't check future `TripStop`s (delete does).
- **D2** — drawer only runs `updateCalendar` when `schedule.calendar` exists; null-calendar extend
  path unclear.
- **V2** — wizard `calConfig` is NOT reset when route changes mid-wizard (timings/fares are).
- **V9** — routes "ALL" tab includes ARCHIVED routes; **V12** — no urban/serviceType filter anywhere
  in the operator area (routes/schedules toolbars).
- **LG2** — `estimatedArrival` == last waypoint's departure; no final-leg travel time to destination
  (same in generator and `trips.create` — modeling choice, not divergence).
- **R2/LG3/T9** — several mis-indented bodies (formatting artifacts only).
- **S6** — duplicated `normalize`/cuid-heuristic across locations.ts/search.ts (drift risk).

## Verified Good (no action)

- `schedules.list` `isActive` filter works (V1 resolved); `Object.fromEntries` preserves explicit
  `null` clears (R3 resolved); cadence `departureTime` sync (R3).
- `addFare` overlap guard, `deactivateFare` last-full-route guard, `addException` bounds/day checks,
  `checkScheduleOverlap` (exact-time + weekday + window), `reconcileScheduleTrips` prune/cancel/
  regenerate (R4/R5/R6/R9/R10).
- Trip generator == `trips.create` (LG1); preferredBus cleared when unusable (LG4); 14-day windows
  consistent across trips/schedules/search.
- Search `isUrban` derivation == Route.serviceType == Trip snapshot; geography-only matching is sound
  (S1, N1). Occupancy counts holds only while unexpired (S3). Sort/pagination OK.
- Routes create/update geo-completeness, URBAN waypoint city guard, serviceType override rejection
  (RTE/G1).
- Fare/segment occupancy (N3); buildSearchEntries dedup + pass-through suppression (N7);
  same-city search requires municipality/quarter refinement (N8).

## Decision Items for the Team

1. **Booking.trip FK** — cascade vs soft-delete (R7b): affects booking lifecycle, refunds, reporting.
2. **TimePicker rewrite** (B1): confirm runtime behavior, then replace nested Select-in-Popover.
3. **isExpress filter** (S10): one-line client fix; also `maxPrice` has no UI control (dead).
4. **serviceType filtering** (R1/V12): add to schedules/routes lists + toolbars for the "urban chips"
   feature.
5. **TZ robustness**: consolidate on `lib/timezone` helpers; deprecate `CompanyLocation.city` string
   (dual source of truth, M note).

## Still Open (verification only)

- B1 runtime confirmation (no browser/test infra in repo).
- G2 `ScheduleWaypoint.routeWaypoint` FK cascade/restrict check.
- Final skim of `operator-trips-view.tsx` / `operator-terminals-view.tsx` remains (covered mostly in
  07/09).

## Tracker Index

01 overview · 02 B1 · 03 schedules router (R) · 04 wizard/drawer (D) · 05 search+locations (S) ·
06 schema reference (M) · 07 trips router (T) · 08 pending · 09 routes/fleet/terminals/captures +
operator views (G/F/TM/C/V) · 10 search pipeline (N) · 11 trip generator + timezone (L/TZ) ·
12 routes router + drawer (RTE) · 13 public search page (S/S10) · 14 this report.

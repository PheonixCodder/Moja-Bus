# Pending Investigations (open items)

## Files still to read
- `apps/web/features/operator/views/operator-terminals-view.tsx` (rest),
  `operator-trips-view.tsx`, `operator-fleet-view.tsx` (fleet view fully read; trips/terminals mostly
  covered in 07/09 — final skim only).
- Existing trackers to cross-ref: `context/trackers/search-erp-urban-intercity-architecture.md`,
  `geography-search-ui-audit.md`, `ivory-coast-geo-capture-plan.md`, `search-operations-full-walkthrough.md`.

## Open verification items
1. [B1] Runtime confirmation of TimePicker Select-in-Popover behavior in browser (does
   `onValueChange` fire? popover dismiss pre-commit? duplicate silent return?).
2. [S10] Confirm `isExpress` is genuinely never sent to `search.search` (verified — query
   input 102-119 omitted it; only fix is client-side — no server change needed). **FIXED** in
   `search-page-client.tsx` (now sends the field).
3. [D4] Server-side guard for empty `departureTimes` array in `updateBasic`.
4. [T10] totalSeats definition parity (seatType filter) across create/assignBus/toggle.
5. [G2] `ScheduleWaypoint.routeWaypoint` FK onDelete behavior on routes.update waypoint replace.
6. [C3] RejectCapture regresses a once-COMPLETE terminal to PENDING_CAPTURE (UX check).
7. [S9] `suggestQuarter` public mutation — permission/rate-limit.
8. Wizard container — `calConfig` NOT reset on route change (V2, noted in 09).
9. `ServiceCalendar` null case (D2) — `updateCalendar` only runs when `schedule.calendar` exists.
10. `trips.statusCounts` window semantics vs dispatch chips.

## How to run checks
- From workspace root: `pnpm typecheck` (packages), `pnpm lint` (biome), targeted `tsc --noEmit` in
  apps/web and packages/ui.
- No test files found for these components yet; consider adding a React Testing Library test for
  TimePicker/DepartureTimesEditor.

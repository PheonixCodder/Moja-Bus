# R2 — routes.ts, fleet.ts, terminals.ts, captures.ts Router Findings

## routes.ts (`apps/web/trpc/routers/routes.ts`, 508 lines, full read)

### G1 — Route create/update require geo-complete terminals (good)
`create` Phase 1: builds `cityByTerminal` from terminal `cityId`; rejects if any terminal lacks a
city; `resolveRouteServiceType` validates explicit toggle against derived type; URBAN routes reject
waypoints whose terminal city != originCityId. Solid.

### G2 — `update` waypoint replace deletes + recreates in a tx (no soft-delete of scheduleWaypoints)
`routes.update` with `data.waypoints` deletes ALL `routeWaypoint` rows then recreates with normalized
1..N stopOrder. Risk: **`ScheduleWaypoint` rows reference `routeWaypointId`**. Deleting a
`RouteWaypoint` with a FK to `ScheduleWaypoint` — if FK has `onDelete: Cascade` it silently drops
schedule timing offsets; if `Restrict` the update throws. Need to check schema relations
(`ScheduleWaypoint.routeWaypoint`). The router never re-derives scheduleWaypoints after route
waypoint changes, so timings can go stale. (Verify schema + confirm behavior.)

### G3 — `update` stale-fare check only counts `toStopOrder > newLastStopOrder`
Fine, but orphaned *segments* (e.g. fare 2→5 when waypoints shrunk to 3 stops) with `toStopOrder <=
newLast` but an intermediate waypoint that no longer exists are still active/bookable. Lower
severity; note.

### G4 — `update` serviceType re-derivation comment says "covers the case where only waypoints changed
but classification could shift" — but for INTERCITY routes with waypoints, serviceType only depends
on origin/dest cities. OK. Persists `serviceType` when waypoints change even if classification same.

### G5 — `delete` archiving heuristic
If `confirmedBookingsCount > 0` → PRECONDITION_FAILED (archive instead). Else if `anyTripCount > 0`
→ soft archive (status ARCHIVED + schedules deactivated), else hard delete. Reasonable; note that
`route.status` ARCHIVED is set but schedule trips remain (by design, "already-booked future trips are
unaffected").

### G6 — `list` orders by name asc; no pagination (returns all routes). OK for small operator counts.

### G7 — `getCities` uses `requireAnyPermission([routes:read, terminals:read])` (good).

## fleet.ts (`apps/web/trpc/routers/fleet.ts`, 651 lines, full read)

### F1 — `createBus` seeds `Seat.isActive = isBookable`
Non-bookable positions (DRIVER_AREA/EMPTY_SPACE) get isActive=false. totalSeats counts exclude those
at trip creation. Consistent.

### F2 — `toggleSeatStatus` + `toggleSingleTripSeatStatus` totalSeats sync uses `seat.isBookable` only
Reconfirms T10: both sync paths count `isActive && seat.isBookable` WITHOUT the
`seatType !== DRIVER_AREA/EMPTY_SPACE` filter, while create/assignBus exclude those seatTypes.
Divergence exists but in practice isBookable=false for those types anyway (F1). Low severity — still
flag for consistency; safer to align on one definition.

### F3 — `updateBus` RETIRE guard only checks `SCHEDULED`/`BOARDING` (not DELAYED)
`fleet.ts:246-251` `status: { in: ["SCHEDULED", "BOARDING"] }`; `deleteBus` uses
`status: { notIn: ["CANCELLED", "ARRIVED"] }` (includes DELAYED). Inconsistent — a DELAYED trip bus
can be retired but not deleted. Flag.

### F4 — `getBuses({ slim })` returns layoutTemplate always (documented comment) — uniform type. Good.
### F5 — `createBus` plate conflict is global (no company scoping) — deliberate per error message.

## terminals.ts (`apps/web/trpc/routers/terminals.ts`, 291 lines, full read)

### TM1 — `list` includes captures where status in OPEN/PENDING_CONFIRMATION/CONFIRMED (take 1)
Note: **APPROVED captures are excluded** from the latest-capture include, so the editor cannot show
the approved attempt's metadata (e.g. to copy resolved address). Verify against editor expectations.

### TM2 — `create` auto-assigns single pass-through municipality (`ensureTerminalGeography`)
Only when exactly one active municipality for the city. Good. But the `city` legacy string is still
accepted/kept (dual source of truth, see M note).

### TM3 — `update` geo-complete guard
Blocks making/keeping a terminal without cityId only when `geoCaptureStatus === COMPLETE`. A terminal
in PENDING_CAPTURE may legitimately have no city — good. But `isOrBecomingTerminal` uses
`data.isTerminal === true || existingLocation.isTerminal`; if the operator clears cityId on an
existing COMPLETE terminal while it stays a terminal → blocked. Good.

### TM4 — `update` deactivation/demotion guard checks non-ARCHIVED routes + waypoints. Good.
Does NOT check **tripStops** on deactivate/demote (delete does). A deactivated/demoted terminal that
appears in future `TripStop`s would orphan those stops. Lower severity; verify trip regeneration.

### TM5 — `delete` checks route, waypoint, tripStop. Good.

## captures.ts (`apps/web/trpc/routers/captures.ts`, 110 lines, full read)
- `createCapture`: operator-only, requires terminals:update|terminals:geocapture. Idempotent.
- `getInfo`/`submit`/`confirm`: public (token capability).
- `approveCapture`/`rejectCapture`: operator-only, company-scoped via service.
- All delegate to `CaptureService`. Fine.

## capture-service.ts (`apps/web/features/capture/services/capture-service.ts`, 660 lines, full read)

### C1 — `approveCapture` requires `resolvedMunicipalityId && resolvedCityId`
A capture resolved to a city with NO municipality (city without munis, or muni resolution failed)
cannot be approved. `geocodePoint` may return municipality null for city-center points. Operator is
stuck unless resolve improves. Note: `ensureTerminalGeography` in terminals.ts auto-assigns muni when
exactly one exists — but that only runs on terminal create/update, not during capture approval.
Consider fallback in approve.

### C2 — `approveCapture` sets `cityId`/`municipalityId`/`quarterId` directly (no ensureTerminalGeography)
If the resolved municipality belongs to a different city than resolved city, or quarter mismatched,
no validation. geocodePoint presumably returns consistent triple; low risk.

### C3 — `sweepExpired` reverts to COMPLETE if `terminal.cityId` set, else PENDING_CAPTURE
After sweep, `captureToken`/`captureExpiresAt` cleared. A terminal that was COMPLETE and later had a
fresh capture minted reverts to COMPLETE on expiry — correct. But a terminal that was COMPLETE and
whose capture was REJECTED → rejectCapture sets PENDING_CAPTURE (not COMPLETE) — meaning a once-good
terminal loses its COMPLETE status until re-captured. **Potential UX regression**: operator can't
"keep old geo" once a capture attempt is rejected. Flag.

### C4 — `confirm` when status === APPROVED throws BAD_REQUEST; when OPEN throws "share location first". Good.
### C5 — `markExpired` doesn't revert terminal (only sweeper does) — by design.
### C6 — `createCapture` reuses any live attempt regardless of submitter → idempotent. Good.
### C7 — Token stored raw (capability); high entropy; TTL 7d. `captureToken` unique on CompanyLocation. Good.

## operator-schedules-view.tsx (566 lines, full read)

### V1 — `listInput` sends `isActive` based on status filter (RESOLVED)
```
isActive: status === "active" ? true : status === "inactive" ? false : undefined
```
Confirmed: `schedules.list` (schedules.ts:341) builds `...(input?.isActive !== undefined ? { isActive: input.isActive } : {})`.
`listSchedulesSchema` has `isActive` optional. Filter works as intended.

### V2 — Wizard state resets `setCalConfig(defaultCalendarConfig())` on route select? No —
`onSelect` resets `setTimings([]); setFares([])` but NOT `calConfig`. If the operator picks a new
route mid-wizard, departure times/days persist. Possibly intended; note.

### V3 — `canProceed` Calendar requires `preferredBusId` set — matches server guard (trip-generator
requires preferredBusId). Good.

### V4 — `handlePublish` sends `defaultBusId: calConfig.preferredBusId` AND `preferredBusId` — verify
`createScheduleSchema` has both and semantics (memory: create uses preferredBusId; defaultBusId
maybe legacy). Cross-check schemas.

### V5 — Edit drawer data flow confirmed: `editId` → `schedules.get` → `ScheduleEditDrawer`.
Drawer's `DepartureTimesEditor` uses `editDepartureTimes` state seeded from schedule. **Manual
"Add time" bug applies to BOTH the wizard (CalendarStep) and the edit drawer** — same component.

### V6 — `handleExtend` fallback: if schedule has no preferredBusId, picks first ACTIVE bus and warns.
Good UX. Uses `regenerateTrips({ persist: true })`.

### V7 — No `serviceType`/urban filter in the schedules list toolbar (reconfirm R1).

### V8 — List pagination pageSize=24 (grid of cards). OK.

## operator-routes-view.tsx (264 lines, full read)

### V9 — `showArchived` when statusFilter is "ALL"
`routes.list({ showArchived: statusFilter === "ARCHIVED" || statusFilter === "ALL" })` (52-56) —
the "ALL" tab includes archived routes in the list/grid (cards presumably show an ARCHIVED badge).
Minor UX choice; note.

### V10 — terminals fetch gated on `canManageRoute` (good)
`terminals.list({ bookableOnly: true })` only enabled when `can("routes:create") || can("routes:update")`
(60-63) — read-only users don't error on the drawer control. Comment S2 in file.

### V11 — Edit/Delete permission gating (good)
`handleEdit` only when `can("routes:update")` (236), delete only when `can("routes:delete")` (237).
RouteSuccessPanel shown after create only (handleCreated), not after update (handleUpdated just closes
the drawer). Minor: no success toast on update. Low.

### V12 — No serviceType/urban filter in routes toolbar
Status tabs are ALL/ACTIVE/DRAFT/SUSPENDED/ARCHIVED only; search matches name/origin/dest terminal
names (69-89). No way to filter to URBAN routes only in the routes view (consistent with R1/V7 — the
whole operator area has no serviceType filter, despite routes being the canonical discriminator owner).
Note for the "urban chips" feature idea.

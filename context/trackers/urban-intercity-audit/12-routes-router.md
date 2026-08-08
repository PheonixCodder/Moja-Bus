# RTE — routes.ts Router + RouteFormDrawer Findings

Files: `apps/web/trpc/routers/routes.ts` (508 lines, fully read),
`apps/web/lib/route-service-type.ts` (54 lines, fully read),
`apps/web/features/operator/components/routes/route-form-drawer.tsx` (712 lines, fully read),
`packages/schemas/src/routes.ts` (263 lines, fully read).

## Design (verified GOOD)
- `ServiceType` persisted on `Route` from terminal `cityId` geography — never names. `resolveRouteServiceType`
  (route-service-type.ts:23-54) derives URBAN iff `originCityId === destCityId`, INTERCITY otherwise. An
  explicit operator toggle is validated and REJECTED when it contradicts geography. So
  `route.serviceType` can never diverge from search `isUrban`. Confirmed consistent with the
  architecture note.
- `create` (routes.ts:62-194): requires all terminals geo-complete (cityId set, else BAD_REQUEST
  "no city assigned"), validates terminals owned+active+isTerminal, unique name per company,
  origin≠dest, URBAN route → no waypoint in a different city. Waypoint stopOrder normalized 1..N
  (M13). Good.
- `update` (routes.ts:196-456): re-derives serviceType whenever origin/dest/waypoints/serviceType
  submitted; reactivation guard (all terminals active+bookable); cascade deactivates schedules on
  SUSPENDED/ARCHIVED; stale-fare count reported (orphaned toStopOrder). Returns
  `{ route, needsReconciliation, deactivatedSchedules, staleFareCount }`.

## RTE1 — `update` re-derivation skips existing waypoints (FINDING, low)
When origin/dest change to reclassify a route as URBAN but `waypoints` are NOT submitted in the
update, the URBAN stray-waypoint guard (routes.ts:342-353) only inspects `data.waypoints` (empty),
and `geoTerminalIds` (292-298) excludes existing waypoints. An existing intermediate stop in a
different city is therefore NOT flagged → a URBAN route with an out-of-city stop can be persisted.
The UI warns but does not block (route-form-drawer.tsx:436-441). Fix: also load existing waypoints'
cities when serviceType resolves to URBAN and waypoints omitted.

## RTE2 — Client vs server urban derivation fallback (FINDING, low)
Drawer computes `originCityId = cityRelation?.id ?? city` (route-form-drawer.tsx:114-115) and may
show the "Urban Route" badge / allow URBAN when both terminals share a free-text `city` but have no
`cityRelation`. The server requires `cityId` (routes.ts:122-129) and would reject with "no city
assigned". Minor divergence: UI badge can be wrong for geo-incomplete terminals. Recommend showing
a "city required" hint instead.

## RTE3 — Edit seeds serviceType then immediately clears it (NOTE, by-design-ish)
On edit, `setServiceType(editingRoute.serviceType); setServiceTypeUserSet(false)` (229-251), but the
re-sync effect (255-259) fires when origin/dest change and resets serviceType to null, so the stored
value is discarded and the toggle re-derives from geography. Since the server guarantees stored
serviceType always matches geography, the behavior is correct — but the seed is dead code and
confusing. Consider `setServiceTypeUserSet(true)` when loading for edit if explicit override should
be preserved (it never can be, by design).

## RTE4 — `delete` only checks CONFIRMED bookings (NOTE)
routes.ts:470-478 counts only status CONFIRMED on future trips. PENDING_PAYMENT / held seats on
upcoming trips do NOT block deletion; the route is archived and schedules deactivated, but the
upcoming trips themselves remain (they are not cancelled/refunded here). Consistent with
schedules.delete intent but worth documenting for operators.

## RTE5 — `update` with waypoints replace does NOT reconcile existing trips (NOTE)
Replacing route waypoints does not cancel/reconcile future trips or fares beyond the stale-fare
count (report-only, 437-448). `needsReconciliation: futureTripsCount > 0` is returned but the UI
must call something (e.g. schedules.reconcileFutureTrips) — verify operator-schedules-view wiring.

## RTE6 — Schema details verified
- `createRouteSchema` (schemas/src/routes.ts:100-149): origin≠dest; waypoint unique terminals;
  waypoint terminal cannot equal origin or dest; strictly-increasing distanceFromOriginKm;
  waypoint distance ≤ route distanceKm; max 50 waypoints.
- `updateRouteSchema` (151-185): partial; same cross-checks when waypoints present.
- `serviceType` is OPTIONAL in both — server always derives+validates, so omission is safe.

## Files needing cross-check (next)
- `apps/web/trpc/routers/public.ts` + `features/search/lib/*` + `app/[locale]/search/page.tsx`
  (public urban-chips / serviceType flow).
- Trip `serviceType` snapshot on regenerate vs route reclassification (T-side).

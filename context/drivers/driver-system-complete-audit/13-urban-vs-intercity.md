# 13 — Urban vs Intercity Differentiation (end-to-end)

> Audit date: 2026-08-26 · Sources: schema enums, `routes.ts` derivation, `trip-generator` snapshot, `search.ts`, employment model, dispatch engine, driver-app dual-mode.

## 1. Where the split is DEFINED

- `ServiceType { INTERCITY, URBAN }` (schema :971-974). Derived server-side at route create/update from terminal geography: origin/dest terminal cityIds differ ⇒ INTERCITY, same city ⇒ URBAN (`resolveRouteServiceType` in routes.ts:135-153 & 326-332 — requested type that diverges from geometry is REJECTED so search's isUrban can never disagree). Backfill script mirrors: `originCity === destCity ? URBAN : INTERCITY`.
- `Trip.serviceType` snapshot frozen at generation (schema :1584-1586) — search and every consumer reads the trip row, never re-derives.

## 2. Passenger-facing consequences

Level-aware search (city/municipality/quarter combos incl. cross-city quarter pairs); label convention flips (urban `"Cocody – Riviera 3"` vs intercity `"Abidjan (Cocody)"` via shared formatLocationLabel); urban badge component shared app-wide; fares NOT separated per mode (locked scope decision); seat maps kept for both (open seating deferred v2+); intermediate-stop boarding works for both.

## 3. Employment-model consequences (the third side)

| Axis | EXCLUSIVE_INTERCITY | CONTRACTOR_URBAN | HYBRID |
|---|---|---|---|
| Affiliations | ONE active (platform rule, auto-terminate on new exclusive w/ consent + displaced-operator notice) | MANY simultaneous | follows exclusive rule for intercity side |
| Marketplace filter | preferredType match | preferredType match | matches either intent |
| Conflict engine intervals | INTERCITY_TRIP_DEFAULT_MINUTES fallback duration | URBAN_TRIP_DEFAULT_MINUTES (shorter) | n/a |
| Shift record | serviceType=INTERCITY | URBAN loops | either |
| Earnings | global-across-carriers totals w/ per-shift labels | same | same |

## 4. Where differentiation is ENFORCED in code today

1. Route creation/update (geometry derivation, above).
2. Trip generation snapshot.
3. Conflict-engine default durations per service type.
4. Driver-app trips list dual-mode filter chips (getMyTrips serviceType param, P3-13).
5. Urgent-dispatch feed and manifests render stop hierarchies identically (mode-agnostic).

## 5. Where it is NOT enforced (gaps)

1. **Assignment**: no check ties affiliation employmentType to trip serviceType — an urban contractor can be rostered onto an intercity run and vice-versa (verified: zero employmentType references in trips.ts assignment paths). The one-active-exclusive rule protects intercity exclusivity socially, but nothing stops an operator with a HYBRID/URBAN-affiliated driver from dispatching them intercity.
2. Urban loop operations unbuilt: no headway calculation, no loop-runner cadence, no line-shift model — urban today is just short intercity-style scheduled trips (overview §3B remains design aspiration).
3. Fare/pricing identical pipeline (deliberate v1 decision, but removes a differentiator).
4. Telemetry cadence does not vary by mode ("high-cadence urban breadcrumbs" not implemented — fixed 5 s both modes).
5. Driver preference `preferredType` is advisory only — dispatch doesn't rank/filter candidates by it.

## 6. Assessment

The data model carries the distinction cleanly and search/labels/snapshots honor it faithfully; the OPERATIONS layer (who may drive what, urban-specific tooling) is where the two modes still collapse into one. If urban contractor pools become real supply, add: employmentType↔serviceType guard in assignDriver/listAssignableDrivers (soft warning first), preferredType-aware candidate ranking, and eventually the loop/headway execution model.

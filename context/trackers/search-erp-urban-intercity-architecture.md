# Tracker: Search + Operator ERP Architecture — Urban vs Intercity (ServiceType)

**Date:** 2026-08-02
**Scope:** Deep dive into the complete passenger search and operator ERP system (terminals, routes, fleet + fleet templates, schedules, trips, geo hierarchy, tRPC flows), with a focused audit of how URBAN vs INTERCITY service is modeled, derived, snapshotted, filtered, displayed, and enforced.
**Method:** Read-only investigation (schema, tRPC routers, search feature libs, operator ERP components/views). No code changed.

> **Companion docs:** This tracker complements (does not duplicate):
> - `context/trackers/geography-search-ui-audit.md` — the audit of City → Municipality → Quarter handling across search/booking/ERP, including the approved 4-phase first-class urban design and its implementation logs.
> - `docs/plans/2026-08-02-fix-search-fleet-gaps.md` — the production-gap plan (gaps 1,2,3,4,6,7 fixed; gap 5 out of scope).
>
> Read those two alongside this file for the full picture.

---

## 1. Executive Summary

- The platform is a **single-tenant-per-company bus booking app for Côte d'Ivoire** (currency XOF). Monorepo: `apps/web` (Next.js 16, tRPC v11, Prisma, Zod, React 19, Tailwind v4, next-intl, nuqs), `packages/db` (schema + seed), `packages/schemas` (zod), `packages/types`, `packages/ui`.
- **`ServiceType` (`INTERCITY | URBAN`) is the single urban/intercity discriminator.** It is persisted on `Route` (derived server-side from terminal cityIds at create/update) and **snapshotted onto `Trip`** at generation time so search/tickets filter on a stored value without joining terminal geometry.
- **`isUrban` at search time = `origin.cityId === destination.cityId`** (refinements municipality/quarter are optional, not prerequisites) — `apps/web/features/search/lib/places.ts:22-24`.
- Everything urban/intercity derives from terminal geography; the legacy free-text `CompanyLocation.city` string is display fallback only.
- Search does **not** filter on `serviceType` directly today — it matches stops by geo place at the deepest level given (city → muni → quarter). `serviceType` rides along on the `SearchOffer` for display/badge/score purposes.

---

## 2. Geography Data Model (`packages/db/prisma/schema.prisma`)

| Model | Line | Notes |
|---|---|---|
| `City` | 734 | `name`, `nameEn`, `region`, `district`, `isMajorHub`, lat/lng, `isActive`. |
| `Municipality` | 761 | `cityId`, `name`, **`isPassThrough`** (UI-only: city acts as single unit → muni selector skipped), `isActive`. |
| `Quarter` | 779 | `municipalityId`, `name`, `isActive`. |
| `CompanyLocation` | 801 | = **terminal/depot**. Has `cityId`/`municipalityId`/`quarterId` FK relations **plus legacy free-text `city`**. `isTerminal` flag. |

Seed reality (`packages/db/prisma/seed.ts`): **Abidjan is the only multi-municipality city** (11+ munis, each with quarters). Every other city has exactly **one pass-through municipality** named after the city.

---

## 3. Service Type Model & Derivation (the core of urban vs intercity)

### 3.1 Schema (`packages/db/prisma/schema.prisma`)

- `enum ServiceType` — check enum block (~L450 region).
- `Route.serviceType ServiceType @default(INTERCITY)` — `schema.prisma:998`, `@@index([serviceType])` at 1010. Doc comment (996-997): "INTERCITY = terminals in different cities; URBAN = same city. Derived server-side from terminal cityIds at create/update."
- `Trip.serviceType ServiceType @default(INTERCITY)` — `schema.prisma:1192`, `@@index([serviceType])` at 1222. Doc comment (1190-1191): "Snapshot of the route's service type at generation — search filters on this instead of re-deriving from terminal geometry."
- **No `serviceType` on `Schedule`** — inherits via `Route`.

### 3.2 Derivation points (all ID-based, never names)

| # | Location | Rule |
|---|---|---|
| 1 | `trpc/routers/routes.ts:124-125` (create) | `originCityId === destCityId ? "URBAN" : "INTERCITY"` |
| 2 | `trpc/routers/routes.ts:292` (update) | same, re-derived when origin/dest/waypoints change |
| 3 | `lib/trip-generator.ts:163` (bulk generation) | snapshots `route.serviceType` onto `Trip` |
| 4 | `trpc/routers/trips.ts:79` (manual trip create) | snapshots `schedule.route.serviceType` onto `Trip` |
| 5 | `features/search/lib/places.ts:22-24` | search-time `isUrban(o,d) = origin.cityId === destination.cityId` |
| 6 | `features/operator/components/routes/route-form-drawer.tsx:110-115` | operator badge `isUrbanRoute` = same `cityRelation.id`, falling back to legacy `city` string **only when both lack a city relation** |
| 7 | `lib/format-location-label.ts` | label formatting branch on `isUrban` |

### 3.3 Validation / guards

- `routes.ts` create (90-140): fetches all route terminals (`companyId` + `isTerminal: true` + `isActive`), requires every terminal to have a `cityId` (else `BAD_REQUEST` "assign a city before creating the route"). **URBAN routes reject any waypoint in a different city** (129-140).
- `routes.ts` update (266-323): same re-derivation + same-city waypoint guard on terminal change.
- Backfill: `packages/db/scripts/backfill-service-type.ts` (idempotent) snaps `Route.serviceType` (cityId-derived) and `Trip.serviceType` for all trips.

---

## 4. Search Pipeline (end-to-end)

### 4.1 Entry & params

- **Public route** `app/[locale]/search/page.tsx` → `SearchPageClient` (nuqs `searchParamsSchema`).
- URL params (`features/search/lib/params.ts`): `from`, `to`, `fromMuni`, `toMuni`, **`fromQuarter`, `toQuarter`**, `date`, `passengers`, `sort`, `page`, plus filter params (operators, amenities, departureTime, seatClass, isExpress, maxPrice).
- `from`/`to` carry a **city cuid** OR a normalized city display name (deep links / popular chips).

### 4.2 tRPC `trpc/routers/search.ts`

- `search` procedure (public, lines 82-…): zod `searchInputSchema` (15-43) includes `originCityId`, `destinationCityId`, optional `originMunicipalityId`/`destinationMunicipalityId`, **`originQuarterId`/`destinationQuarterId`**, date, passengers, filters, sort, page.
- `resolveCityId` (53-66): non-cuid name → city id via `normalize()` (lowercase, NFD-strip accents, strip non-alphanumerics) matching `name` or `nameEn`.
- `toGeoPlace` (68-79): builds `GeoPlace` with `level` = quarter > municipality > city.
- `cheapestByDate` procedure: 7-day UTC window using `findTripsInWindow` (lean include) + `placeMatchesTerminal` + shared `matchSegmentFare`.

### 4.3 `features/search/lib/places.ts` (36 lines — verified)

- `PlaceLevel = "city" | "municipality" | "quarter"`.
- `GeoPlace { cityId, municipalityId?, quarterId?, level }` — municipality/quarter are **refinements, not prerequisites**.
- `GeoTerminal { cityId, municipalityId, quarterId }`.
- `isUrban(origin, dest) = origin.cityId === dest.cityId` (line 22-24).
- `placeMatchesTerminal(place, terminal)` (27-36): city must match; if place has muni it must match; if place has quarter it must match → deepest-level narrowing.

### 4.4 `features/search/repositories/search-read-repository.ts` (292 lines — verified)

- `terminalWhere(place)` (17-23): `cityId` + optional muni + optional quarter → `CompanyLocationWhereInput`.
- `buildTripWhere(originPlace, destinationPlace, start, end, filters)` (61-129): exported pure factory.
  - Base: `status ∈ [SCHEDULED, DELAYED]`, `schedule.isActive`.
  - SQL-expressible filters pushed down: `operators` → `companyId in`; `seatClass` → `bus.seatClass in`; `amenities` → `bus.layoutTemplate.is { hasAC/hasWifi/hasToilet/hasLuggage }` (mapping at 10-15); `departureTime` → hour-window branches on the origin stop (`departureHourRanges` 30-54: MORNING 5-12, AFTERNOON 12-17, EVENING 17-22, LATE_NIGHT 22-24 + 0-5).
  - Origin constraint: `tripStops.some { terminal: terminalWhere(origin), isPickup: true, scheduledDeparture in [start, end] (or hour OR) }`.
  - Dest constraint: `AND.tripStops.some { terminal: terminalWhere(dest), isDropoff: true }`.
  - **`maxPrice` / `isExpress` are NOT here** — they depend on fare resolution after stop-order mapping and stay in JS.
- `findTrips(originPlace, destinationPlace, date, filters)` (174-197): `findMany` with heavy `tripInclude` (company, bus+busType+layoutTemplate, tripStops+terminal with `cityRelation/municipality/quarter`, schedule+fares filtered `isActive: true`). **No `seats` include** — availability uses stored `Trip.totalSeats` (Gap 4b fix).
- `findTripsInWindow(originPlace, destinationPlace, windowStart, windowEnd)` (203-240): lean include (terminal cityId/muni/quarter only, no company/bus) for the price strip.
- `getSegmentOccupancy(candidateTrips)` (246-291): `booking.groupBy` by tripId with segment-overlap conditions (`boardingStopOrder < destOrder && dropoffStopOrder > originOrder`); CONFIRMED + PENDING_PAYMENT with unexpired `holdExpiresAt`. Returns `Map<tripId, occupiedCount>`.

### 4.5 `features/search/services/search-service.ts` (233 lines — verified)

`SearchService.execute(ctx)`:
1. `const urban = isUrban(ctx.origin, ctx.destination)` (line 30).
2. `findTrips(origin, destination, travelDate, filters)` (33-38).
3. Stop resolution (43-71): per trip, `originStop` = first stop where `placeMatchesTerminal(origin, stop.terminal) && isPickup && scheduledDeparture`; `destStop` = first `placeMatchesTerminal(dest) && isDropoff`. Candidate only if `originStop.stopOrder < destStop.stopOrder`.
4. `getSegmentOccupancy` over candidate segments (74-80).
5. Fare: `matchSegmentFare(trip.schedule.fares, searchOriginOrder, searchDestinationOrder, departureDate)` — shared helper `features/search/lib/segment-fare-match.ts` (finds first active covering fare respecting `validFrom`/`validUntil`, boundary-inclusive). **No matching fare → offer omitted.**
6. Availability: `computeAvailabilityStatus(remainingSeats, passengerCount)` from `features/search/lib/availability.ts` — `remaining===0 || remaining<passengerCount → SOLD_OUT`; `remaining<=5 → FEW_LEFT`; else `AVAILABLE` (Gap 6).
7. Filters kept in JS: `maxPrice`, `isExpress` (stop-count based).
8. Sort (incl. BEST-score with urban normalization keyed on `isUrban`), paginate 15/page.
9. Output: `SearchResponse { offers: SearchOffer[], total, page, ... }`. `SearchOffer` carries `serviceType: trip.serviceType` (stored snapshot).

### 4.6 Price strip

`cheapestByDate` uses the SAME `matchSegmentFare` predicate (Gap 2 fix) — no stale/expired fares in the strip.

### 4.7 Search-page client

`search-page-client.tsx`: nuqs state, sessionStorage filters (`search_filters`), prefetch + `criteriaKey` includes quarter params; `SearchDateStrip` + `use-cheapest-by-date.ts` pass `fromQuarter`/`toQuarter` through.

---

## 5. Operator ERP Flows

### 5.1 Terminals (`trpc/routers/terminals.ts` + `terminal-editor-sheet.tsx`)

- Editor: city `<select>` → muni → quarter cascades; auto-selects the single pass-through municipality when the city has exactly one.
- `createTerminalSchema` (`packages/schemas/src/routes.ts`): **`cityId` now REQUIRED when `isTerminal: true`** (alongside lat/lng) — R10. `municipalityId`/`quarterId` optional.
- `ensureTerminalGeography` helper auto-assigns the pass-through muni on create/update; update blocks promoting a location to terminal without a city.
- `terminals.list` includes `cityRelation`, `municipality`, `quarter`.

### 5.2 Routes (`trpc/routers/routes.ts` + operator UI)

- `Route` = origin terminal + dest terminal + `RouteWaypoint[]` (`stopOrder` 1..N sequential, origin implicit 0, dest = lastWaypointOrder+1 — M13 normalization). `@@unique([companyId, name])`.
- `serviceType` derivation + URBAN same-city waypoint guard at create (110-140) and update (266-323). See §3.2/§3.3.
- `routes.list`/`get` include terminal `cityRelation/municipality/quarter`.
- Operator UI: `route-form-drawer.tsx` (live editor) shows the "Urban" badge from ID-based `isUrbanRoute` (110-115); `route-card.tsx`/`routes-table.tsx` read persisted `route.serviceType`; both use shared `apps/web/components/urban-badge.tsx`.

### 5.3 Schedules (`trpc/routers/schedules.ts` + wizard)

- Wizard `WIZARD_STEPS = ["Route","Stops","Calendar","Pricing","Preview"]` (`features/operator/lib/schedules/types.ts`).
- `Schedule` (schema 1041+): `routeId`, `departureTime` (primary/first), **`departureTimes String[]`** (full cadence — Phase 3), `preferredBusId`, `ServiceCalendar` (weekdays + `validFrom`/`validUntil`), `ServiceException[]` (CANCELLED / EXTRA_SERVICE / MODIFIED with `overrideDepartureTime`), `ScheduleWaypoint[]` (arrival/departure offset minutes per stop), `Fare[]` (`fromStopOrder`/`toStopOrder`/`priceXOF`/`durationMinutes`/`validFrom`/`validUntil`/`isActive`).
- `checkScheduleOverlap` compares **time sets** per active route; `reconcileScheduleTrips` prunes unbooked future trips and regenerates via `getCandidateDepartureDates` (calendar days × cadence; a MODIFIED exception replaces the whole day's cadence with its single override).
- Cadence preset editor: `departure-times-editor.tsx` (start / every 15-90 min / end → generates list, merged with manual adds).

### 5.4 Trips (`trpc/routers/trips.ts`, `lib/trip-generator.ts`)

- Trip = per-trip bus, `departureDate` full timestamp, `serviceType` snapshot, `routeSnapshotJson` (frozen at creation, protects historical bookings), `totalSeats`, `TripStop[]` (instantiated from RouteWaypoints: `stopOrder`, `scheduledArrival`/`scheduledDeparture` from offset minutes, `isPickup`/`isDropoff`), `TripSeat[]`, `@@unique([scheduleId, departureDate])`.
- **Manual create** (`trips.ts:79`): `serviceType: schedule.route.serviceType` (Gap 1 fix).
- **Bulk generator** (`trip-generator.ts:163`): `serviceType: route.serviceType`; `totalSeats` = active+bookable+non-DRIVER_AREA+non-EMPTY_SPACE seats (152-159); TripSeat cloned with `isActive: seat.isActive`.
- Operator trip list: `features/operator/lib/trips/trip-search-params.ts` (status/scheduleId/q/startDate/endDate/page; pageSize 50).

### 5.5 Fleet (schema + `trpc/routers/fleet.ts`)

Models (`schema.prisma`):
- `BusType` (862): name, `companyId` nullable (null = platform default, set = operator custom), `@@unique([companyId, name])`.
- `SeatLayoutTemplate` (880): `busTypeId`, `companyId` nullable, `name`, `seatClass`, **`totalSeats`**, `rows`, `columns`, amenity flags (`hasAC/hasWifi/hasToilet/hasLuggage`).
- `SeatTemplate` (907): `layoutId`, `row/col/deck`, `label` ("1A"), `seatType` (default `PASSENGER_WINDOW`), `isBookable` (default true).
- `Bus` (927): `companyId`, `busTypeId`, `layoutTemplateId`, `registrationPlate @unique`, `seatClass`, `status (ACTIVE/MAINTENANCE/INACTIVE/RETIRED)`, `deletedAt` soft delete, `preferredForSchedules`.
- `Seat` (956): copied from SeatTemplate at bus creation — `isBookable` **immutable copy**, `isActive` mutable (operator can disable broken seats).

Routers (`trpc/routers/fleet.ts`, 650 lines):
- `getBusTypes` (11): platform + company types.
- `getLayoutTemplates` (33): platform defaults + company custom, with ordered `seatTemplates`.
- `getCustomLayouts` (50): company-owned only, with `_count.buses`.
- `getBuses` (65): always includes `layoutTemplate` (uniform return shape); `_count.seats` slim-only; stats incl. `totalSeats` from `layoutTemplate.totalSeats`.
- `getBusDetails` (99): bus + layoutTemplate + ordered `seats`.
- `createBus` (119): clones `Seat` rows from template, `isActive: isBookable`.
- `createCustomLayout` (~443): validates the grid, computes `totalSeats` = **bookable passenger cells only** (middle column auto-`EMPTY_SPACE` aisle via `buildDefaultGrid` in `layout-builder-sheet.tsx`).
- `toggleSeatStatus` (~355): flips `Seat.isActive`; for future trips syncs `TripSeat.isActive` **and recomputes `Trip.totalSeats`** (active+bookable+non-structural) inside a transaction.

**Fleet chain (verified correct — must not break):** template → `createBus` clones seats → operator disables via `toggleSeatStatus` (syncs Trip.totalSeats) → trip generation clones TripSeat (`isActive: seat.isActive`) + computes totalSeats → search availability = `Trip.totalSeats - getSegmentOccupancy`. Consistent end-to-end.

### 5.6 Fleet UI

- `layout-builder-sheet.tsx` (active builder, used by `operator-fleet-view` + `add-bus-modal`): now supports `PASSENGER_MIDDLE` (Gap 3), i18n keys `middleSeat`/`middleSeatDesc`.
- `features/operator/components/fleet/seat-grid-matrix.tsx` = **dead code** (unused; do not modify).

---

## 6. Label Conventions (`apps/web/lib/format-location-label.ts` — verified)

- `formatLocationLabel({ cityName, municipalityName, quarterName, isUrban })`:
  - **urban** → `"Cocody"` or `"Cocody – Riviera 3"` (quarter shown when known; city fallback).
  - **intercity** → `"Abidjan (Cocody)"` (quarter never shown).
- `formatCityWithMuni(cityName, municipalityName)` = always `"City (Muni)"` — operator surfaces.
- Applied everywhere (search offer card, trip summary, checkout, digital ticket, passenger views, booking map/card/details, operator booking detail drawer). Ticket secondary line `Terminal · Quarter` unchanged.
- Shared badge: `apps/web/components/urban-badge.tsx` on offer card (`SearchOffer.serviceType`), trip summary (`TripDetails.serviceType`), digital ticket (`DigitalTicketDTO.serviceType`), operator schedule cards (`route.serviceType`), admin routes table, operator route card/table.

---

## 7. Booking / Availability Integrity

- `BookingHoldService.createHold` guards actual overbooking (hold expiry for `PENDING_PAYMENT`).
- Search shows `SOLD_OUT` when `remaining < passengerCount` (search-layer correctness; booking detail keeps per-seat seat-count status intentionally — `trip-details-service.ts`).
- Occupancy overlap test: a booking on seat X counts against any searched segment whose stop window overlaps the booked boarding/dropoff segment (correct for intermediate stops).

---

## 8. Production Gaps Resolved (2026-08-02, plan `docs/plans/2026-08-02-fix-search-fleet-gaps.md`)

- **Gap 1** — manual `trips.create` now snapshots `serviceType`; backfill script run. ✅
- **Gap 2** — shared `matchSegmentFare` (validity window + isActive) used by both `search` and `cheapestByDate`. ✅
- **Gap 3** — `PASSENGER_MIDDLE` added to active layout builder + i18n. ✅
- **Gap 4** — SQL-level filters (operators/seatClass/amenities/departureTime) in `buildTripWhere`; dropped `seats` include (uses stored `Trip.totalSeats`); EARLIEST/LATEST ordered in SQL, JS sort kept as backstop. ✅
- **Gap 6** — passenger-count-aware availability (`computeAvailabilityStatus`). ✅
- **Gap 7** — local-time default date (`toLocalISODate`). ✅
- **Gap 5 (out of scope):** dead constants (`maxPrice`/`FALLBACK_OPERATORS`/`PRICE_RANGE`), `SORT_OPTIONS` vs `SORT_OPTIONS_UI` divergence. Explicitly excluded.

Test suites (in `apps/web`): search pair validation (16), schedule trip window (multi-time cadence + MODIFIED), segment fare match (6), search-where (5), availability (4), local-date (2), trip-generator dates — plus the rest. Commands: `pnpm test`, `pnpm typecheck`, `pnpm lint`.

---

## 9. Key Files Index

- Schema: `packages/db/prisma/schema.prisma`
- Search: `apps/web/trpc/routers/search.ts`, `features/search/services/search-service.ts`, `features/search/repositories/search-read-repository.ts`, `features/search/lib/{places,params,segment-fare-match,availability,local-date,validate-search-pair}.ts`, `app/[locale]/search/page.tsx`
- ERP routers: `apps/web/trpc/routers/{routes,schedules,trips,fleet,terminals,locations}.ts`
- Generation/helpers: `apps/web/lib/{trip-generator,schedule-trip-window,timezone,format-location-label}.ts`
- Operator UI: `features/operator/components/routes/route-form-drawer.tsx`, `components/terminals/terminal-editor-sheet.tsx`, `components/layout-builder-sheet.tsx`, `components/schedules/departure-times-editor.tsx`, `lib/schedules/types.ts`, `lib/trips/trip-search-params.ts`, `app/[locale]/dashboard/operator/(dashboard)/{fleet,schedules,trips}/page.tsx`
- Shared UI: `apps/web/components/urban-badge.tsx`
- Docs: `context/trackers/geography-search-ui-audit.md`, `docs/plans/2026-08-02-fix-search-fleet-gaps.md`

---

## 10. Open Threads / Next Steps (no code started)

1. **Gap 5** (explicitly out of scope, re-openable): dead constants cleanup + sort-option divergence.
2. **Deferred sugar:** urban price-range hint in operator `PricingStep`.
3. `serviceType` is currently a **display/score** field in search — search does not filter `serviceType` directly. If "show urban vs intercity tabs" or "urban-only results" is ever desired, add a filter on `Trip.serviceType` (already indexed, 1222) — cheap.
4. Confirm whether intra-city service in **single-municipality cities** (same city, different terminals) is a product goal — search already supports it via place-level matching; only the seed/validation angle would need review (covered in §6.5 of the geography audit).

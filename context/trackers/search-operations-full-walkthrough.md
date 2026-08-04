# Tracker: Search + Operator ERP — Full Walkthrough (Routes, Terminals, Fleet, Schedules, Trips, Booking)

**Date:** 2026-08-04
**Scope:** End-to-end, read-only walkthrough of the complete Search + Operator ERP stack: `apps/web/trpc/routers/*`, `apps/web/features/search`, `apps/web/features/operator`, `apps/web/features/booking`, `apps/web/lib/*`, and the Prisma schema (`packages/db/prisma/schema.prisma`, 1647 lines). Focus: urban vs intercity setup + every operational process/flow/pattern.
**Method:** Read-only file investigation. No code changed.

> **Companion docs:** This is a *full walkthrough* tracker. For the focused urban/intercity ServiceType architecture + search pipeline audit, read `context/trackers/search-erp-urban-intercity-architecture.md` (2026-08-02). For geo-hierarchy UX, read `context/trackers/geography-search-ui-audit.md`.

---

## 1. System Context

- Single-tenant-per-company bus booking platform for **Côte d'Ivoire**, currency **XOF**. Timezone everywhere: **`Africa/Abidjan` (UTC+0, no DST)**.
- Monorepo: `apps/web` (Next.js 16, tRPC v11, Prisma, Zod, React 19, Tailwind v4, next-intl, nuqs, TanStack Query), `packages/db` (schema+seed), `packages/schemas` (zod), `packages/types` (shared TS types incl. `buildOfferId`/`parseOfferId`), `packages/ui` (`@moja/ui` components).
- Auth: Better Auth. Permission system: `apps/web/lib/permissions/authorize.ts` — `requirePermission`, `requireAnyPermission`, `operatorHasPermission`. Permissions via `apps/web/lib/permissions/staff-hierarchy.ts` (OWNER/MANAGER/... with role mapping).
- Notifications: Novu via `apps/web/lib/novu.ts` (`getNovuClient()`), workflows: `operator-bus-assigned`, `passenger-trip-delayed`, `passenger-trip-boarding`, `passenger-review-request`, `passenger-trip-gate-updated`, `passenger-hold-created`, `passenger-ticket-shared`.
- Guest email convention for notifications: `${passengerPhone.replace(/\s+/g,"")}@guest.mojaride.ci`.

---

## 2. Prisma Schema — Model Map (verified line numbers)

Enums: `BookingStatus`, `PaymentStatus`, `HoldGroupStatus`, `PaymentRecordStatus`, `RefundChannel`, `RefundRecordStatus`, `AccountOwnerType`, `AccountCategory`, `AccountStatus`, `TransactionStatus`, `LedgerEntrySide`, `LedgerEntryStatus`, `ReservationStatus`, `OnboardingStatus`, `OnboardingStep`, `OnboardingEventType`, `BusinessType`, `CompanyStatus`, `DocumentType`, `DocumentStatus`, `StaffRole`, `ContactInquiryStatus`, `BusStatus`, `SeatType`, `SeatClass`, `RouteStatus`, `ServiceType` (L682: `INTERCITY|URBAN`), `RecurrenceType`, `ExceptionType` (CANCELLED/EXTRA_SERVICE/MODIFIED), `ExceptionReason`, `FareType`, `TripStatus` (SCHEDULED/BOARDING/DELAYED/DEPARTED/ARRIVED/CANCELLED).

| Model | Line | Key notes |
|---|---|---|
| `User`/`Session`/`Account`/`Verification`/`RateLimit`/`RefreshToken` | 198-347 | Better Auth + rate limiting. |
| `Company` | 349 | `CompanyLocation` FKs via `originLocations`/`destLocations`?; operator relations. |
| `Operator` | 536 | Staff record; `role` (OWNER/MANAGER/etc.), `isActive`. |
| `City` | 734 | `name`, `nameEn`, `region`, `district`, `isMajorHub`, lat/lng, `isActive`. |
| `Municipality` | 761 | `cityId`, `name`, `isPassThrough` (UI: city acts as single unit → muni selector skipped), `isActive`. |
| `Quarter` | 779 | `municipalityId`, `name`, `isActive`. |
| `CompanyLocation` | 801 | = **terminal/depot**. `cityId/municipalityId/quarterId` FKs + **legacy free-text `city`** + `isTerminal`. |
| `BusType` | 862 | platform (`companyId null`) or company-owned. |
| `SeatLayoutTemplate` | 880 | `companyId null`=platform; `totalSeats`, `rows`, `columns`, `hasAC/hasWifi/hasToilet/hasLuggage`, `seatClass`. |
| `SeatTemplate` | 907 | row/col/deck/label/seatType/isBookable per layout. |
| `Bus` | 927 | `registrationPlate` (soft-delete via compound unique `(registrationPlate, deletedAt IS NULL)`), `status`, `seatClass`, `deletedAt`. |
| `Seat` | 956 | per-bus seat rows. |
| `Route` | 981 | `serviceType @default(INTERCITY)` @L998, `@@index([serviceType])` @L1010; origin/dest `CompanyLocation` FKs; `status`. |
| `RouteWaypoint` | 1017 | `stopOrder`, `isPickup`, `isDropoff`, `distanceFromOriginKm`. |
| `Schedule` | 1041 | `departureTime` (primary) + `departureTimes` (cadence array); `isActive`; `preferredBusId`; NO `serviceType` (inherits via Route). |
| `ServiceCalendar` | 1082 | mon-sun bools + `validFrom/validUntil`. |
| `ServiceException` | 1101 | `type`, `reason`, `notes`, `overrideDepartureTime` (MODIFIED only). |
| `ScheduleWaypoint` | 1123 | per-schedule stop timing: `arrivalOffsetMinutes`, `departureOffsetMinutes`, `dwellMinutes`. |
| `Fare` | 1148 | `fromStopOrder/toStopOrder`, `type`, `durationMinutes`, `priceXOF`, `validFrom/validUntil`, `isActive`. |
| `Trip` | 1176 | `serviceType @default(INTERCITY)` @L1192 `@@index([serviceType])` @L1222; `routeSnapshotJson Json`; `totalSeats`; `delayMinutes`; `gate`; `actualDeparture/actualArrival`; `@@unique([scheduleId, departureDate])`. |
| `TripStop` | 1231 | `stopOrder`, `scheduledArrival/Departure`, `isPickup`, `isDropoff`. Origin stopOrder=0, dest = lastWaypointOrder+1. |
| `TripSeat` | 1257 | `@@unique([tripId, seatId])`, `isActive`. |
| `PlatformSettings` | 1284 | commission/fee config. |
| `HoldGroup` | 1337 | `offerId`, `seatCount`, `baseFareXOF`, `status`, `holdExpiresAt`. |
| `PricingSnapshot` | 1367 | full pricing breakdown (commissionBps, convenienceFeeBps, subtotalBaseXOF, convenienceFeeXOF, chargeAmountXOF, commissionXOF, operatorNetXOF, platformGrossXOF). |
| `ExternalPayment`/`PaymentAttempt`/`PaymentEvent`/`WebhookEvent`/`Refund` | 1390-1487 | payments. |
| `FinancialAccount`/`FinancialAccountSnapshot`/`FinancialTransaction`/`LedgerEntry`/`WalletReservation`/`SettlementPolicy` | 1488-1621 | escrow/ledger. |
| `Booking` | 1622 | `seatId`, `originTripStopId/destinationTripStopId`, `boardingStopOrder/dropoffStopOrder`, `status`, `holdExpiresAt`, `holdGroupId`, `farePaid`, `paymentStatus`, `bookingReference`, `ticketToken`, `passengerName/Phone`, `completedAt`. |
| `Review`, `PassengerProfile`, `SavedPassenger`, `StaffInvitation`, `ActivityLog` | 1683-1789 | |
| Blog models | 1825-1960 | `BlogCategory/Tag/Post/Revision/SlugHistory/Redirect`. |

---

## 3. Trip Generation Pipeline (the heart of urban/intercity snapshots)

### 3.1 `lib/timezone.ts` (117 lines — full)
- `APP_TIMEZONE = "Africa/Abidjan"`. `getZonedDateParts(date)` via `Intl.DateTimeFormat`. `getCalendarDateKey(date)` → `YYYY-MM-DD`.
- `startOfAppCalendarDay(date)` = UTC midnight of Abidjan calendar day (UTC+0 so date math == UTC). `endOfAppCalendarDay` = +24h−1ms.
- `addAppCalendarDays`, `buildAppDepartureTimestamp(calendarDay, hours, minutes)` = `Date.UTC(y,m-1,d,h,min)`.
- `getAppRollingTripWindow(daysAhead=14)` → `{startDate, endDate}`. `getWeekdayKey(date)` → `"sunday".."saturday"`.
- `isOnOrAfterCalendarDay/isOnOrBeforeCalendarDay/datesMatchCalendarDay` compare date keys.

### 3.2 `lib/schedule-trip-window.ts` (137 lines — full) — SINGLE SOURCE OF TRUTH for which departures exist
- `getCandidateDepartureDates({departureTimes, calendar, exceptions, daysCount=14})`:
  - Window = Abidjan today … today+daysCount−1.
  - Each operating day → one candidate per departure time (cadence). Sort times asc.
  - `CANCELLED` exception → day skipped entirely. `EXTRA_SERVICE` → day runs even if weekday inactive.
  - `MODIFIED` with valid `HH:MM` override → **replaces that day's entire cadence** with a single departure.
  - Respects `validFrom/validUntil` (inclusive calendar-day compare).
- `getPreviewDepartureDateStrings()` → for UI calendars.

### 3.3 `lib/trip-generator.ts` (253 lines — full) — `generateTripsForSchedule(scheduleId, busIdOverride, daysCount=14)`
- Guard chain: schedule exists + calendar configured → `schedule.isActive` → bus resolved (`busIdOverride ?? schedule.preferredBusId`) → bus must be ACTIVE + owned + not deleted; **if preferred bus unusable and no override → clears `preferredBusId: null`** so operators see the health warning.
- Computes `timingMap` from `scheduleWaypoints` (schedule-specific timings override).
- Candidates from `getCandidateDepartureDates`; skips any whose ISO timestamp already exists in the window (`existingKeys`).
- Per candidate, in a `$transaction`:
  - `trip.create`: `departureDate`, `estimatedArrival = departure + destDepartureOffset*60000`, `totalSeats` = count of bus seats that are `isActive && isBookable && seatType ∉ {DRIVER_AREA, EMPTY_SPACE}`, `status: SCHEDULED`, **`serviceType: route.serviceType` (snapshot)**, **`routeSnapshotJson: { ...route, scheduleWaypoints, version: 1 }`**.
  - `tripStop.createMany`: origin (stopOrder 0, isPickup, scheduledArrival=Departure=departure), waypoints (offset-based times, pickups per waypoint flags), dest (stopOrder = lastWaypointOrder+1, isDropoff, scheduledArrival=Departure=departure+destOffset).
  - `tripSeat.createMany`: clone every bus seat (`isActive` copied).
- P2002 (unique `(scheduleId, departureDate)`) race → treated as already-created, continue.
- Returns `tripsCreated`.

### 3.4 `trpc/routers/trips.ts` (1255 lines — full)
- **create** (22-149): mirrors bulk generator exactly (snapshot serviceType + routeSnapshotJson). Validates schedule exists, bus ACTIVE, no existing trip for `(scheduleId, departureTimestamp)` → CONFLICT. Builds timingMap from scheduleWaypoints.
- **list** (151-300): filters: status, `serviceType` (INTERCITY/URBAN), routeId (via `schedule.routeId`), scheduleId, `startDate/endDate` (default `getAppRollingTripWindow(14)`), q (matches trip id, bus plate, route origin/dest terminal name/city/cityRelation). Include: bus+busType+layoutTemplate, schedule.route with geo on terminals, `_count.bookings` where CONFIRMED or (PENDING_PAYMENT with unexpired hold). Order departureDate asc, page/pageSize default 50, returns `window {startDate, endDate}` keys.
- **statusCounts** (304-330): `groupBy status` global counts (dispatch-board chips) — no pagination.
- **get** (332-405) / **getManifest** (410-473) / **getSeatMap** (477-505): heavy include (route+geo, tripStops+geo, seats ordered deck/row/col, bookings with seat + origin/dest stops where active). getManifest skips seats; getSeatMap is lean (id, busId, seats) lazy-loaded for the Seat Map tab.
- **assignBus** (507-713): `SELECT ... FOR UPDATE` row lock; allowed statuses `{SCHEDULED, BOARDING, DELAYED}`. If bus actually changes: loads active bookings with seats, verifies all booked seat labels exist on new bus (else BAD_REQUEST), remaps `booking.seatId` to new bus seat by label (throws if missing), deletes+recreates TripSeats, recomputes `totalSeats`. After commit → Novu `operator-bus-assigned` to OWNER/MANAGER operators.
- **delay** (715-875): `assertTripTransition(status, "DELAYED")`; row lock; `totalDelay = previous + incremental`; shifts ALL tripStops' scheduledArrival/Departure forward; updates `departureDate`, `estimatedArrival`, `delayMinutes`, `notes`, status=DELAYED. Novu `passenger-trip-delayed` to each CONFIRMED booking (guest email fallback).
- **cancel** (877-918): `assertTripTransition` then `cancelTripWithRefunds` → returns `{id, status:CANCELLED, cancelReason, refundResults}`.
- **updateStatus** (920-1077): accepts BOARDING/DEPARTED/ARRIVED only (CANCELLED→use cancel, DELAYED→use delay). BOARDING requires busId. DEPARTED sets `actualDeparture`, ARRIVED sets `actualArrival` + `booking.completedAt` for CONFIRMED. Novu: BOARDING→`passenger-trip-boarding`; ARRIVED→`passenger-review-request`.
- **updateNotes** / **setGate** (1079-1173): setGate triggers `passenger-trip-gate-updated` when gate set.
- **toggleSingleTripSeatStatus** (1175-1254): rejects CANCELLED/ARRIVED; disallow disabling a seat with an active booking; `tripSeat.upsert`; resyncs `Trip.totalSeats` = count of active tripSeats with `seat.isBookable`.

### 3.5 `trpc/routers/schedules.ts` (1497 lines — full)
- **computeScheduleWaypoints** (28-91): builds `ScheduleWaypoint` timings from **adjacent fare durations** (`toStopOrder === fromStopOrder+1`). Missing adjacent segment → proportional allocation from full-route fare by `distanceFromOriginKm`. Dwell via `dwells` map. cumulative arrival/departure offsets.
- **pruneUnbookedFutureTrips** (93-132): deletes future SCHEDULED trips (from today) with zero active bookings. Booked trips NOT deleted here.
- **reconcileScheduleTrips** (134-245): guard schedule active + has calendar → prune → `getCandidateDepartureDates` → allowed set → delete mismatched unbooked trips in window → `cancelTripWithRefunds` on mismatched BOOKED trips → `generateTripsForSchedule(scheduleId, busId, 14)`. Returns `{prunedTrips, tripsCreated}`.
- **checkScheduleOverlap** (252-327): active schedules on same route: conflict if any shared departure time AND shared weekday AND overlapping valid date windows. Excludes `excludeScheduleId` (for updates).
- **list** (330-428): filters q/routeId/isActive; sorts departureTime|name|updatedAt; window = today..+14 for `futureTripsInWindow` via `trip.groupBy`. Returns paged `{items,total,page,pageSize,pageCount}`.
- **get** (430-478): full detail incl. route+waypoints+geo, calendar, preferredBus, exceptions, fares.
- **create** (480-664): requires route ACTIVE + full-route fare present (`fromStopOrder===0 && toStopOrder===lastStopOrder+? && priceXOF>0`); bus ACTIVE+not deleted; `validFrom >= todayStart`; overlap check; duplicate-fare check (same from:to:type). Transaction: create schedule (isActive:true, departureTimes), ServiceCalendar, ScheduleWaypoints (from computeScheduleWaypoints), Fares. Then `generateTripsForSchedule` (wrapped — **M12: on failure keep the schedule, surface `warning`** so operator uses "Extend Trips"). Returns schedule + `tripsCreated` + `warning`.
- **retire** (666-697): set isActive false + prune unbooked future trips.
- **delete** (699-744): block if any CONFIRMED/PENDING_PAYMENT booking on schedule's trips → delete trips + schedule in tx.
- **updateBasic** (746-884): preferredBus must be ACTIVE; **capacity-downgrade guard** (if schedule active, new bus capacity < max future bookings → CONFLICT). DepartureTimes patch: full list replaces, `departureTime` syncs to first. Overlap re-check when active + times/isActive change. `isActive:false` → prune; times/bus change + active → `reconcileScheduleTrips`.
- **updateCalendar** (886-982): patch days/validFrom/validUntil; guard ≥1 active day; overlap check with merged calendar; then reconcile trips if preferredBus set.
- **reconcileFutureTrips** (984-1029): explicit "Extend Trips" — requires active + bus.
- **updateFare / addFare / deactivateFare** (1031-1205): `fromStopOrder < toStopOrder`; addFare overlap check vs existing same segment/type fares (date-range overlap incl. forever); deactivateFare blocks removing last active full-route fare.
- **regenerateTrips** (1207-1289): resolve bus (preferred ?? default ?? schedule.preferred), validate active+owned; persist `preferredBusId` if none or `persist`; `generateTripsForSchedule(...,14)`.
- **addException** (1291-1453): guard date within calendar bounds + on active weekday; unique per date; `overrideDepartureTime` only for MODIFIED. CANCELLED → `cancelTripWithRefunds` booked day trips + delete empty SCHEDULED ones. EXTRA_SERVICE/MODIFIED → reconcile trips. `removeException` (1455-1496) → delete + reconcile.

### 3.6 `trpc/routers/routes.ts` (508 lines — full)
- **list** (9-27): company routes, `showArchived` toggles `status not ARCHIVED`; include origin/dest terminal geo + `_count waypoints/schedules`; orderBy name.
- **getCities** (29-35): active cities (for terminal editors).
- **get** (37-60): route + geo terminals + waypoints (orderBy stopOrder).
- **create** (62-194): origin≠dest; unique name per company (non-archived); ALL terminals must be company-owned + isTerminal + isActive; every terminal must have `cityId` (else BAD_REQUEST "assign a city…"); **service-type resolution via `resolveRouteServiceType`** (rejects contradictory operator toggle); **URBAN route rejects any waypoint in a different city**. stopOrder normalized 1..N (M13). Route `serviceType` derived server-side.
- **update** (196-456): re-derive + same-city waypoint guard; reactivating route requires all associated terminals active+bookable; endpoint/waypoint change reclassifies `serviceType`. Waypoint replacement = deleteMany + recreate (1..N). Returns `{route, needsReconciliation (futureTripsCount>0), deactivatedSchedules (SUSPENDED/ARCHIVED cascade), staleFareCount (fares with toStopOrder > new last)}`.
- **delete** (458-507): block if confirmed future bookings (PRECONDITION_FAILED); if any trip exists → archive route + deactivate schedules (return `archived:true`); else hard delete.

### 3.7 `lib/route-service-type.ts` (54 lines — full)
- `resolveRouteServiceType`: derived `originCityId === destCityId ? "URBAN" : "INTERCITY"`. If operator `requestedServiceType` contradicts → `{ok:false, message}` explaining why. Never diverges from search `isUrban`.

### 3.8 `trpc/routers/terminals.ts` (270 lines — full)
- `ensureTerminalGeography(tx, cityId, municipalityId)` (12-28): if no muni provided, auto-assign the city's **single** active municipality (the pass-through); else leave undefined. Used in create + update.
- **list** (31-53): company locations; `bookableOnly` → `isTerminal:true, isActive:true`; include `cityRelation/municipality/quarter`; orderBy name. Requires `terminals:read`.
- **create** (55-107): sets `isPrimary` — clears prior primary in same tx; auto-assigns geo muni; writes legacy free-text `city` alongside cityId.
- **update** (109-208): guards — deactivating OR demoting (`isTerminal→false`) blocked if used as route origin/dest or as a route waypoint (CONFLICT). Promoting `isPrimary` clears prior primary. **A terminal (existing or becoming) must have a `cityId`** (BAD_REQUEST "passenger terminal must have a city"). Re-runs `ensureTerminalGeography` and applies auto-assigned muni.
- **delete** (210-269): blocked if used as route origin/dest, route waypoint, or any `tripStop` (past or future). Else hard delete.

### 3.9 `trpc/routers/fleet.ts` (650 lines — full)
- `getBusTypes` (platform `companyId:null` + own), `getPermissions` (`canManageFleet`), `getLayoutTemplates` (platform + own, seatTemplates ordered row/col), `getCustomLayouts` (own only + `_count.buses`), `getBuses` (slim flag; **always include layoutTemplate for uniform type**; stats computed client-side), `getBusDetails`.
- **createBus** (119-214): busType must be active; `registrationPlate` globally unique (CONFLICT); template must exist, accessible, and match busType; tx creates Bus (seatClass default STANDARD) + Seat rows from seatTemplates (`isBookable` immutable, `isActive = isBookable`).
- **updateBus** (216-291): retire guard (no SCHEDULED/BOARDING trip); **non-ACTIVE status → disassociate `preferredBusId` from schedules atomically + `warning`** (§2.2).
- **deleteBus** (293-353): block if assigned to future trips or has active bookings; soft delete (`deletedAt`, status RETIRED); **does NOT rename plate** (§2.1, compound unique index handles plate reuse).
- **toggleSeatStatus** (355-439): booking check INSIDE tx (§4.2 race fix); disabling blocked when seat booked on future trips; syncs TripSeat + resyncs `Trip.totalSeats` for all future trips.
- **createCustomLayout** (443-533): unique name; totalSeats ≥1 (bookable, non-structural); busType accessible; creates layout + seatTemplates. **deleteCustomLayout** (535-566): block if active (non-deleted) buses use it (§4.1). **createBusType/deleteBusType** (570-649): unique across platform+own; delete guarded by bus/layout references.

---

## 4. Search Pipeline (full)

### 4.1 `trpc/routers/search.ts` (244 lines — full)
- `searchInputSchema`: originCityId+destinationCityId (strings; cuid OR display name), optional municipality/quarter ids both sides, `date`, `passengers` (preprocess ""→undefined, coerce, min1 default1), operators[]/amenities[]/departureTime[](MORNING/AFTERNOON/EVENING/LATE_NIGHT)/seatClass[](ECONOMY/STANDARD/VIP)/isExpress[](["true"])/maxPrice, `sort` default "BEST", `page` default 1.
- `normalize(str)` (45-50): lowercase + NFD strip accents + strip non-alphanumerics.
- `resolveCityId` (53-66): cuid detection (`startsWith("c") && length>=20`); else normalized name/nameEn match → id.
- `toGeoPlace` (68-79): `level` = quarter>municipality>city.
- `search` (82-131): if either city ref non-cuid, load cities for resolution; build GeoPlaces; `TripSearchReadRepository.findTrips`; `SearchService.execute`. Output typed as `SearchResponse`.
- `cheapestByDate` (133-243): 7-day UTC window centered on `centerDate` (day−3..+3); `findTripsInWindow` lean; per trip resolve origin/dest stops via `placeMatchesTerminal` + `isPickup`/`isDropoff` + order guard; `matchSegmentFare`; `toSafeDisplayNumber`; returns `[{date, priceXOF|null}]`.

### 4.2 `features/search/lib/places.ts` (36 lines — full)
- `GeoPlace{cityId, municipalityId?, quarterId?, level}`; `isUrban = origin.cityId === destination.cityId`; `placeMatchesTerminal` deepest-level narrowing.

### 4.3 `features/search/repositories/search-read-repository.ts` (292 lines — full)
- `terminalWhere(place)`, `buildTripWhere(origin,dest,start,end,filters)` (pure, exported): base `status in [SCHEDULED,DELAYED]` + `schedule.isActive`; operators→companyId in; seatClass→bus.seatClass in; amenities→`bus.layoutTemplate.is {hasX}` via AMENITY_TO_FIELD (AC→hasAC, WIFI→hasWifi, TOILET→hasToilet, LUGGAGE→hasLuggage); departureTime→`tripStops.some` hour-window OR on origin stop (`departureHourRanges`: MORNING 5-12, AFTERNOON 12-17, EVENING 17-22, LATE_NIGHT 22-24+0-5); dest→`AND.tripStops.some` dropoff at dest place. **maxPrice/isExpress stay in JS** (fare-dependent).
- `findTrips` heavy include (company, bus+busType+layoutTemplate, tripStops+terminal geo, schedule+fares isActive); **no seats include** (uses `Trip.totalSeats`).
- `findTripsInWindow` lean include (terminal id fields only).
- `getSegmentOccupancy(candidates)`: two `booking.groupBy` (CONFIRMED, and PENDING_PAYMENT with unexpired hold) with segment-overlap conditions (`boardingStopOrder < destOrder && dropoffStopOrder > originOrder`), count seatId → Map<tripId,count>.

### 4.4 `features/search/services/search-service.ts` (233 lines — full)
`execute(ctx)`:
1. `urban = isUrban(o,d)` (line 30).
2. `findTrips`.
3. Stop resolution: originStop (`placeMatchesTerminal && isPickup && scheduledDeparture`), destStop (`placeMatchesTerminal && isDropoff`); require `originStop.stopOrder < destStop.stopOrder`.
4. `getSegmentOccupancy`.
5. `matchSegmentFare(trip.schedule.fares, fromOrder, toOrder, departureDate)` → **no fare ⇒ offer omitted**.
6. `priceXOF = baseFare * passengerCount`.
7. Amenities from `bus.layoutTemplate` flags.
8. Availability: `remaining = max(0, totalSeats - occupied)`; `computeAvailabilityStatus(remaining, passengerCount)` — SOLD_OUT if `remaining===0 || remaining<passengerCount`, FEW_LEFT if ≤5, else AVAILABLE.
9. `isExpress = stopCount === 0`; `durationMinutes` from stop times; `stopCount = destOrder - originOrder - 1`.
10. Offer fields incl. `serviceType: trip.serviceType`, full geo names, `offerId = ${tripId}_${originStopId}_${destStopId}`.
11. JS filters: maxPrice, isExpress.
12. Sort: CHEAPEST/FASTEST/EARLIEST/LATEST/MOST_AVAILABLE, or **BEST weighted score** `(price/norm)*0.4 + (duration/norm)*0.4 - (remaining/norm)*0.2` with **urban normalization** (`priceNorm 1000, durationNorm 60, seatsNorm 30`) vs intercity (`5000/180/50`).
13. Paginate 15/page; returns `{offers, total, hasNextPage, nextCursor}`.

### 4.5 `features/search/lib/segment-fare-match.ts` (27 lines — full)
`matchSegmentFare(fares, from, to, departureDate)`: first active fare with `fromStopOrder <= from && toStopOrder >= to` and validFrom/validUntil inclusive on the departure date.

### 4.6 `features/search/lib/params.ts` (51 lines — full, nuqs)
Criteria: `from/to/fromMuni/toMuni/fromQuarter/toQuarter/date/passengers`. Filters (sessionStorage, not URL): `operators/amenities/departureTime/seatClass/isExpress/maxPrice`. Sort: `sort` default BEST. `page` default 1. `bookingOfferId` (booking modal state).

### 4.7 Search UI (`app/[locale]/search/page.tsx` + `features/search/components/*`)
- **Server page** (67 lines): nuqs `searchParamsCache.parse`; prefetch `locations.getCityDetails` for from/to; when full criteria present prefetch `search.search` + `search.cheapestByDate`; `<HydrateClient><SearchPageClient user/>`.
- **SearchPageClient** (413 lines): `useQueryStates(searchParamsSchema, {shallow:true, history:"push"})`; localFilters persisted to `sessionStorage "search_filters"`; `searchEnabled = from && to && date`; react-query `trpc.search.search` with `staleTime 10s`. **Load-more accumulation**: `allOffers` reset when `criteriaKey` changes, else append deduped by offerId. Prefetch passenger list+wallet for logged-in users. Resume toast for `bookingOfferId` (sessionStorage key `moja:search-resume-toast`). Handlers reset filters + page on new search; filter changes bump page→1. Renders HomeHeader, SearchForm, SearchDateStrip (hero rose-50), then SortBar + FiltersSidebar + PromoCard + SearchResults, SearchMobileFilters drawer, BookingDialog.
- **SearchForm** (258 lines): CityAutocompleteField (origin/dest), swap button, date picker (disabled past days), passengers 1..10; submits via `validateSearchPair` — rejects same city when both at same level / same quarter / same muni; **same-city with one-sided refinement = valid urban search**; on submit, muni/quarter only sent when `origin.id === destination.id`.
- **CityAutocompleteField** (115 lines): uses `useCitySearch` (locations.searchCities), badge for `isMajorHub`, selection stores `municipalityId/quarterId/level`.
- **SearchDateStrip** (159 lines): `useCheapestByDate` (search.cheapestByDate); 7 days centered on selected/today; shows price or "—"; "Best" badge on cheapest day; day selectable if has trips or is selected or no route.
- **OfferCard** (182 lines): company initials avatar, Express badge, busType + seatClass badge (VIP amber/STANDARD blue/else slate), route timeline with stop count, times via `formatDepartureTime`, labels via `formatLocationLabel` with `isUrban = offer.serviceType === "URBAN"`, price `formatPriceXOF`, availability badge (SOLD_OUT slate / FEW_LEFT amber pulse / available emerald), AmenityChips, prefetches `booking.getTripDetails` + `booking.getSeatAvailability` on hover, "Select Seats" → `setBookingOfferId(offer.offerId)` (nuqs push).
- **useCheapestByDate / useCitySearch / useCityDetails** hooks wrap the three public queries.

---

## 5. Booking & Hold Pipeline (full)

### 5.1 `features/booking/services/trip-details-service.ts` (207 lines — full)
- `BOOKABLE_TRIP_STATUSES = ["SCHEDULED","DELAYED","BOARDING"]`.
- `getTripDetails(offerId)`: `parseOfferId` → tripId/originTripStopId/destinationTripStopId. Loads trip with company/bus(+layout)/active seats/tripStops(+geo)/schedule+fares(isActive). Guards: trip exists, `schedule.isActive`, trip status bookable, stops exist, `originStop.stopOrder < destStop.stopOrder`.
- Segment fare: `fare.find(fromStopOrder <= boarding && toStopOrder >= dropoff && isActive)` else fallback `fares.find(isActive)` else `5000`.
- Occupancy via `getSegmentOccupancy`; `totalSeats` = active bookable non-structural TripSeats; availability status recomputed (SOLD_OUT/FEW_LEFT ≤5).
- Returns full `TripDetails` incl. `serviceType: trip.serviceType`, `tripStatus`, `stops[]` (segment), `isExpress = stopCount===0`.

### 5.2 `features/booking/services/seat-availability-service.ts` (103 lines — full)
- `getSeatAvailability(offerId)`: trip + bus/layout + seats (deck/row/col ordered) + active bookings (CONFIRMED + unexpired PENDING_PAYMENT) with segment info. Seat status: DRIVER_AREA→DRIVER, EMPTY_SPACE→EMPTY, !active/!isBookable→BLOCKED, conflicting active booking→HELD (PENDING_PAYMENT) / SOLD (CONFIRMED), else AVAILABLE. Returns rows/columns/deck/priceXOF/seats.

### 5.3 `features/booking/services/booking-hold-service.ts` (310 lines — full)
- `HOLD_DURATION_MS = 15*60*1000`.
- `createHold({offerId, passengers[{seatId, savedPassengerId?, passenger?}], userId})`:
  1. `getTripDetails` → SOLD_OUT guard; unique seats; each seat has exactly one passenger.
  2. `getSeatAvailability` → all selected seats AVAILABLE (CONFLICT if not).
  3. `uniqueSeatIds.length > details.availability.remaining` → BAD_REQUEST.
  4. `SavedPassengerService.resolveSeatPassenger` per passenger.
  5. Trip re-check: exists, schedule active, status not CANCELLED/ARRIVED/DEPARTED.
  6. Pricing: `loadPlatformSettings` + `resolvePricing({baseFareXOF, seatCount, distanceKm, settings, tiers})` (live recompute — stale search price never reaches hold).
  7. Transaction with **`SELECT id FROM "trip" WHERE id=... FOR UPDATE`** (serializes per-trip seat-conflict check — F-16 over-sale fix) → overlapping bookings check (CONFIRMED or unexpired PENDING_PAYMENT, same seat + `segmentsOverlap`) → create HoldGroup (ACTIVE) + PricingSnapshot + one Booking per passenger (PENDING_PAYMENT, `holdExpiresAt`, `farePaid=details.priceXOF`, unique `bookingReference`, paymentStatus UNPAID, boarding/dropoff stop orders + trip stop ids).
  8. Returns `{holdId, holdExpiresAt, bookingReferences, totalAmountXOF, subtotalBaseXOF, convenienceFeeXOF}`.
- `confirmBooking(holdId, userId)` → dynamic import `BookingConfirmationService.confirmFromPayment`. `releaseHold` → expire bookings + hold.
- Helpers: `features/booking/lib/segment-overlap.ts` (`segmentsOverlap`, `isActiveBookingStatus`), `features/booking/lib/hold-group.ts` (`holdGroupWhere`), `features/booking/lib/booking-reference.ts` (`generateBookingReference`), `features/booking/lib/assert-hold-ownership.ts`.

### 5.4 `trpc/routers/booking.ts` (308 lines — full)
- Public: `getTripDetails`, `getSeatAvailability`, `getTicketByToken`.
- Protected: `createHold` (+Novu `passenger-hold-created` with hold expiry + amount), `initiatePayment` (resolveHoldGroup + `assertHoldOwnedByUser` + `PaymentService.initiateForHold`), `verifyPayment` (PaymentService.verifyAndConfirm), `confirmBooking` (assert hold paid → confirm), `releaseHold`, `listMyBookings`/`getBooking`/`getTicket` (BookingReadService), `checkoutWithWallet` (`confirmFromWallet`), `shareTicket` (Novu `passenger-ticket-shared`).

---

## 6. Operator ERP UI (routes/fleet/trips/schedules/terminals)

### 6.1 `features/operator/views/operator-routes-view.tsx` (230 lines)
- `useSuspenseQueries([routes.list({showArchived}), terminals.list({bookableOnly:true})])`; client search + status filter chips (ALL/ACTIVE/DRAFT/SUSPENDED/ARCHIVED); stat cards (total/active/drafts/suspended); RouteCard grid; RouteFormDrawer (create/edit); DeleteRouteDialog; RouteSuccessPanel.

### 6.2 `features/operator/views/operator-fleet-view.tsx` (1196 lines; first 600 read)
- Tabs: Buses / Layouts. BusCard (plate, internalName, status config, type/config, notes, seats, actions plan/edit/delete). CustomLayoutCard + PlatformLayoutCard (read-only, ShieldCheck). LayoutPreviewCanvas (seat grid with driver gauge, entrance door). LayoutsPanel (createCustomLayout via LayoutBuilderSheet, delete with bus-use guard, preview). AddBusModal / AddBusTypeDialog / SeatMapPreview.

### 6.3 `features/operator/views/operator-trips-view.tsx` (304 lines)
- `useQueryStates(tripListParsers)` (q,status,serviceType,scheduleId,manifest,page,startDate,endDate); debounced q (300ms). `trips.list` (pageSize 50) + `trips.statusCounts` + `fleet.getBuses({slim:true})` (gated on canReadFleet && canUpdate). Status chips with global counts; trips grouped by Abidjan calendar day; TripCard; TripsToolbar (status/query/schedule/serviceType/date range); ManifestDrawer (lazy `manifest` param). Permissions via `useStaffPermissions().can(...)`.

### 6.4 `features/operator/views/operator-schedules-view.tsx` (540 lines) + wizard steps
- Wizard: `features/operator/lib/schedules/types.ts` — `WIZARD_STEPS = ["Route","Stops","Calendar","Pricing","Preview"]`; StopLabel; FareDraft; TimingDraft; CalendarConfig (departureTimes cadence); `buildStopsFromRoute`; `hasRequiredFullRouteFare`.
- Step components: `route-picker-step` (pick route + preferredBus), `calendar-step` (weekdays + validFrom/Until + departureTimes editor), `timing-step` (dwell), `pricing-step` (fares incl. full-route guard), `preview-step` (departure calendar via `getPreviewDepartureDateStrings`). Schedule list (cards), ScheduleEditDrawer, delete/retire dialogs, `schedule-success-banner`.

### 6.5 Terminals
- `operator-terminals-view.tsx` (199): `useSuspenseQueries([terminals.list, routes.getCities])`; nuqs search/typeFilter/drawer; TerminalsTable + TerminalEditorSheet + StatCard.
- `terminal-editor-sheet.tsx` (513): city→municipality→quarter cascades, combobox, auto-assigns single pass-through muni.

---

## 7. Noteworthy Patterns & Conventions

- **Date math**: all trip windows/departures computed in Abidjan calendar days via `lib/timezone.ts`; DB stores UTC (same as Abidjan).
- **Locking**: `SELECT ... FOR UPDATE` on `trip` for `assignBus`, `delay`, and `createHold` (per-trip hold serialization).
- **Soft delete**: `Bus.deletedAt` + compound unique `(registrationPlate, deletedAt IS NULL)`; never rename plate.
- **Transactional integrity**: preferredBus disassociation + bus update atomic; seat toggle + booking check atomic; route waypoint replace + serviceType + stale-fare count.
- **Guards cluster**: overlapping schedules, duplicate fares, last-full-route-fare protection, capacity downgrade protection, active-booking-on-seat protection, bus incompatible-layout swap protection.
- **I18n**: everything through `next-intl` `useTranslations("search"|"operatorDashboard.*")`; English only per AGENTS.md.
- **tRPC + TanStack Query**: `useTRPC().xxx.queryOptions()` + `useSuspenseQuery/useSuspenseQueries`; prefetch on server page via `prefetch(trpc.x.queryOptions())` + `HydrateClient`.
- **Permissions**: every operator procedure calls `requirePermission(ctx, "perm")` first; `requireAnyPermission` for cross-cutting (e.g. `routes.getCities`).
- **Novu**: every trip lifecycle event triggers email workflows; failures swallowed with `.catch(() => {})` + console.error.
- **M13 stopOrder**: waypoints normalized to 1..N; origin=0; dest=N+1 — fares reference these stop orders.
- **Route→Trip snapshot**: `serviceType` + `routeSnapshotJson {..., version:1}` so search/tickets display without geometry joins.

---

## 8. Open Threads / Where to Pick Up

- Operator schedules wizard step internals (`calendar-step`, `pricing-step`, `departure-times-editor`, `schedule-edit-drawer`) read at high level only.
- `features/operator/views/operator-fleet-view.tsx` lines 601-1196 (bus tab list, AddBusModal wiring) not fully read.
- Booking checkout UI flow (`booking-checkout-form.tsx`, `booking-dialog-flow.tsx`, `digital-ticket-card.tsx`, payment providers) read at high level; payments internals (`PaymentService`, `BookingConfirmationService`, `pricing-resolver`) referenced but not fully traced.
- `trpc/routers/operator.ts` (2190 lines), `admin.ts` (2215), `staff.ts` (849), `payments.ts` (428), `wallet.ts`, `passenger.ts` not walked (out of scope for this pass).
- Schema lines 1647+ do not exist (verified: schema is 1647 lines total).

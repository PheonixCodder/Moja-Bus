# Audit: City / Municipality / Quarter (Geography) Handling Across Search, Booking & Operator ERP

**Date:** 2026-08-01
**Scope:** Complete audit of how the `City → Municipality → Quarter` hierarchy is managed, differentiated, and derived across the customer search UI, booking/ticket UI, and the operator ERP (terminals, routes, schedules, trips). Goal: find every place that needs changes so urban vs intercity is clearly, consistently, and correctly presented to users.

---

## 1. Terminology & Data Model

### 1.1 Geography hierarchy (`packages/db/prisma/schema.prisma`)

- `City` — top level. Fields: `name`, `nameEn`, `region`, `district`, `isMajorHub`, `latitude`, `longitude`, `isActive`.
- `Municipality` — belongs to one `City` (`cityId`). Fields: `name`, **`isPassThrough`**, `isActive`.
- `Quarter` — belongs to one `Municipality` (`municipalityId`). Fields: `name`, `isActive`.
- `CompanyLocation` (**terminal** or depot) — optional `cityId`, `municipalityId`, `quarterId` FK relations **plus a legacy free-text `city` string** (dual system — see §7.2).

### 1.2 Seed data (`packages/db/prisma/seed.ts`)

- 7 major hubs: Abidjan, Bouaké, Yamoussoukro, San-Pédro, Daloa, Korhogo, Man + secondary cities (Gagnoa, Divo, Soubré, Abengourou, Duekoué, Odienné, …).
- **Abidjan** is the only city seeded with multiple municipalities (Abobo, Adjamé, Attécoubé, Cocody, Koumassi, Marcory, Plateau, Port-Bouët, Treichville, Yopougon, Anyama, Bingerville, Brodoukou), each with quarters (e.g. Cocody → Riviera 2/3/4, Deux-Plateaux, Angré…).
- **All other cities get exactly one pass-through municipality** (`isPassThrough: true`, lines 475-495), named after the city (Yamoussoukro → "Yamoussoukro", others → city name).
- `isPassThrough` means: *the city behaves as a single unit — the municipality selector is skipped in UI*.

**Consequence:** true urban (intra-city, municipality-to-municipality) search is only possible in **Abidjan**. Everywhere else there is exactly one municipality per city, so intra-city travel is a no-op (see §6.5).

### 1.3 Who sets geography

- **Public search**: `locations.searchCities` (autocomplete), `locations.getCityDetails`, `locations.searchMunicipalities`, `locations.searchQuarters`, `locations.suggestQuarter`.
- **Operator ERP**: `terminals.*` (terminal editor city/municipality/quarter selects), `routes.*`, `schedules.*`, `trips.*`.

---

## 2. The Core Finding: "Urban" Is Derived in 5 Different Places With 3 Different Rules

There is **no `isUrban` flag** anywhere in the DB (`Route`, `Schedule`, `Trip`, `Fare` have no service-type field). "Urban" is recomputed at every layer with **inconsistent rules**:

| # | Location | Rule | Basis |
|---|----------|------|-------|
| 1 | `features/search/services/search-service.ts:29-32` | `originCityId === destinationCityId && !!originMunicipalityId && !!destinationMunicipalityId` | **IDs** (server, canonical) |
| 2 | `trpc/routers/search.ts:136` (`cheapestByDate`) | `originId === destId && originMunicipalityId && destinationMunicipalityId` | **IDs** (server) |
| 3 | `features/search/components/offer-card.tsx:32` | `offer.originCityName === offer.destinationCityName` | **Names** (client string comparison!) |
| 4 | `features/operator/components/routes/route-form-drawer.tsx:108` | `(cityRelation?.name ?? city) === (cityRelation?.name ?? city)` | **Names** (operator badge only) |
| 5 | `search-form.tsx:99-107` + `hero-search-bar-2.tsx:64-72` | `origin.id === destination.id` + granularity checks | **IDs** (client validation only) |

### 2.1 Rule conflicts (bugs waiting to happen)

- **offer-card rule 3 is name-based** while the server rule 1 is ID-based. If a terminal's `cityRelation` is missing, search-service falls back to `"Côte d'Ivoire"` (search-service.ts:154-167) — so an intercity offer whose terminals lack cityRelation would render `"Côte d'Ivoire"` on both ends → offer-card's `isUrban` becomes `true` → shows only municipality (or city fallback) → **wrong layout for a cross-city trip**.
- **route-form-drawer rule 4** uses the *legacy free-text `city` string* as fallback — two terminals in different cities that both carry only a free-text `city` value equal to the same string would badge as "Urban Route".
- **Validation rule 5** uses `origin.id === destination.id` — but popular chips (`hero-search-bar-2.tsx:194`) store the **city NAME** in `id` (`{ id: "San Pedro", text: "San Pedro" }`), not a cuid. Mixing a dropdown-picked origin (cuid) with a chip-picked destination (name) makes `sameCity` false even for the same city → the same-city guard is bypassed (see §4.4).

**Recommendation (R1):** Persist/derive `isUrban` once, server-side, ID-based, and return it on the `SearchOffer` type; remove the name-equality checks from offer-card.

---

## 3. How the Search Flow Works Today (End-to-End)

### 3.1 Autocomplete — `CityAutocompleteField` + `useCitySearch` + `locations.searchCities`

`features/search/components/city-autocomplete-field.tsx`:

- `CityValue = { id, text, municipalityId?, quarterId?, level?: "city" | "municipality" | "quarter" }`.
- **`id` is ALWAYS the city cuid** — even when the user picks a municipality or quarter (searchCities returns `city.id` as the result id at every level; municipality/quarter are carried only via `municipalityId`/`quarterId`).
- `text` = `hierarchyLabel`: `"Abidjan"` (city), `"Abidjan (Cocody)"` (municipality), `"Abidjan (Cocody - Riviera 3)"` (quarter).
- Quarter matches carry BOTH `municipalityId` and `quarterId` (line 87-89).

`trpc/routers/locations.ts:16-93` (`searchCities`):

- Three sequential queries (city → municipality → quarter), each `take: 10`, merged into a `Map` **keyed by city.id** — **first match wins per city**.
- Consequence: typing "Abidjan" returns only the *city* entry — the municipality "Abidjan (Cocody)" is **suppressed** because the city match already occupies the map slot. You can only see a municipality/quarter entry if the city name itself did NOT match your query.
- Result: the dropdown never shows "all municipalities of Abidjan"; users must know the municipality name to type it. **This is a UX gap (R9): there is no way to browse a city's municipalities/quarters from the search box.**

`features/search/hooks/use-city-search.ts` — debounced 250ms, enabled at ≥2 chars.

### 3.2 URL → params (`features/search/lib/params.ts`)

```
from:      city cuid OR normalized city name (e.g. "yamoussoukro", "San-Pédro")
to:        city cuid OR normalized city name
fromMuni:  municipality cuid  ← set ONLY when same-city & municipality selected
toMuni:    municipality cuid  ← set ONLY when same-city & municipality selected
date, passengers, sort, page, bookingOfferId, filters…
```

**There are NO `fromQuarter`/`toQuarter` params.** `quarterId` is captured in `CityValue` but **silently dropped** when navigating to `/search` (search-form.tsx:117-124, hero-search-bar-2.tsx:82-89 only set `fromMuni`/`toMuni`).

**Finding (B1):** Selecting "Riviera 3" in the autocomplete gives the user the impression of quarter-level precision, but the search is executed at **municipality level** (quarterId is discarded). Either implement true quarter-level search (params + repo filtering) or stop offering quarters in the autocomplete (map quarter → its municipality and label it accordingly).

### 3.3 Name resolution (deep links & chips)

`getCityDetails` (locations.ts:95-124) and `search.ts` router (search.ts:35-69, 115-134) both normalize input via `normalize()` (lowercase, NFD-strip accents, strip non-alphanumeric) and resolve `name`/`nameEn` → city.

- Handles "San-Pédro" ↔ "San-Pédro", "San Pedro" chip, "yamoussoukro" slugs. Good.
- If unresolved, the string is passed through as a cityId → `findCandidateTrips` returns nothing (silent empty result).

### 3.4 Search execution (server)

`trpc/routers/search.ts` → `SearchService.execute` (`features/search/services/search-service.ts`):

1. `isUrban` per rule 1.
2. `findCandidateTrips` (intercity, city-level) **or** `findUrbanTrips` (intra-city, municipality-level) — `features/search/repositories/search-read-repository.ts:57-127`. Both require `status ∈ [SCHEDULED, DELAYED]`, `schedule.isActive`, pickup stop in origin (city or city+muni) within the day window, dropoff stop in destination.
3. Stop resolution: origin = first `isPickup` stop in origin city (matching muni when urban) with `scheduledDeparture`; destination = first `isDropoff` stop in dest city (matching muni); requires `originStop.stopOrder < destStop.stopOrder` (chronological).
4. Occupancy: `getSegmentOccupancy` — bookings overlap-tested per segment (`boardingStopOrder < searchDestinationOrder && dropoffStopOrder > searchOriginOrder`), CONFIRMED + unexpired PENDING_PAYMENT.
5. Fare: segment-aware `f.fromStopOrder <= originOrder && f.toStopOrder >= destOrder && isActive && validFrom/Until window` (search-service.ts:97-104). **No matching fare → offer omitted.**
6. Filters (operators/amenities/seatClass/time buckets/maxPrice/isExpress), sort (incl. urban-normalized BEST score), paginate 15/page.

`cheapestByDate` (search.ts:94-251) mirrors this with a 7-day UTC window; urban branch needs **both** munis (rule 2).

### 3.5 Search page client (`search-page-client.tsx`)

- nuqs `searchParamsSchema` state, sessionStorage filters (`search_filters`), 10s staleTime.
- `SearchForm` receives `initialFromId/initialToId/initialFromMuni/initialToMuni` — on the search page the box is re-initialized from URL.
- `SearchDateStrip` gets munis only when **either** is present (line 333-335) → cheapestByDate may be called with ONE muni → `isUrban` false → **intercity branch for a same-city search → returns city-wide intra-city trips, municipality ignored** (B2, see §4.3).

### 3.6 Booking flow (`features/booking/*`)

- `BookingDialog` (`bookingOfferId` nuqs param) → `BookingDialogFlow` → `TripSummaryCard` (`getTripDetails` → `trip-details-service.ts`).
- `TripDetailsService.getTripDetails` returns origin/dest city, municipality, **quarter names** (trip-details-service.ts:140-194) — but the summary card only renders city + municipality.
- `BookingHoldService` resolves segment + price inside transactions; `SeatAvailabilityService` re-checks segment overlap availability.

---

## 4. Search UI Touchpoint Inventory (What the User Actually Sees)

### 4.1 Home page

| Component | Location | What it shows | Issue |
|---|---|---|---|
| `hero-search-bar-2.tsx` (used by `home-hero.tsx` + `dashboard-quick-search.tsx`) | lines 100-119 | Two `CityAutocompleteField`s | After picking, box shows full hierarchyLabel: "Abidjan (Cocody - Riviera 3)" — informative but cluttered; quarter label is fake precision (B1) |
| `hero-search-bar.tsx` | — | Legacy tabs version (Buses/Flights/Hotels/Trains/Packages) | **DEAD CODE** — nothing imports it (home-hero uses `hero-search-bar-2`) |
| Popular chips | hero-search-bar-2.tsx:188-199 | `{ id: "San Pedro", text: "San Pedro" }` | `id` = **name**, not cuid → sameCity guard broken (B4); no municipality support |

### 4.2 Search page (`app/[locale]/search/page.tsx` + `SearchPageClient`)

| Component | Location | What it shows | Issue |
|---|---|---|---|
| `SearchForm` | search-form.tsx:51-76 | On deep link: `text` initialized to **city name only** (via `useCityDetails`) | Municipality/quarter selection is **invisible** after navigation — box shows "Abidjan" while `fromMuni` is set. Inconsistent with hero box which keeps the full label (B3) |
| `SearchForm` swap | lines 78-83 | Swaps full `CityValue` | Correct |
| `SearchResults` → `OfferCard` | offer-card.tsx:86-123 | City line: urban → **municipality only** ("Cocody"); intercity → "Abidjan (Cocody)" | Quarter **never** shown even though `SearchOffer.originQuarterName` is populated (B5); urban hides the city entirely |
| `SearchDateStrip` | search-date-strip.tsx:31-36 | 7-day cheapest strip | Munis passed only when either present → half-urban search misrouted (B2) |
| `SearchEmptyState` | search-empty-state.tsx:14-19 | Hard-coded popular routes ("Abidjan ➔ Bouaké") | City-level only, fine |

### 4.3 Validation logic in the two forms (search-form.tsx:99-115, hero-search-bar-2.tsx:64-81)

```
sameCity          = origin.id === destination.id
bothCityLevel     = both levels are city (undefined treated as city)
sameMunicipality  = both municipalityIds equal
mixedGranularity  = sameCity && (city↔municipality)   ← QUARTERS NOT COVERED
blocked:          (!sameCity && texts equal) || (sameCity && (bothCityLevel || sameMunicipality))
toast:            sameCity / refineUrban (city↔muni mix)
```

**B6 (validation hole):** `mixedGranularity` only handles city↔municipality. A **quarter↔city** same-city pair passes (quarter level isn't "municipality"), `fromMuni` gets set for the quarter side only, `toMuni` stays empty → server `isUrban = false` → **intercity branch for same-city search → returns ALL intra-city trips in the city, ignoring the chosen municipality** (or empty if none). Same for quarter↔quarter in the *same* municipality — actually that's caught by `sameMunicipality`. The dangerous combos: quarter↔city, city↔quarter, and quarter↔quarter across different municipalities is fine (both munis set).

**B4 (popular chip id bug):** `sameCity` compares cuids; chips store names. Picking "Abidjan" from dropdown (cuid) + clicking chip "Abidjan" → `sameCity=false`, text comparison `originVal === destVal` is cuid vs "Abidjan" → **no guard fires** → navigates to `/search?from=c…&to=Abidjan` → both resolve to Abidjan → same-city intercity search, no munis → returns city-wide intra-city trips unfiltered.

### 4.4 Summary of search-side display inconsistencies

| Context | Format |
|---|---|
| Autocomplete dropdown | "Abidjan" / "Abidjan (Cocody)" / "Abidjan (Cocody - Riviera 3)" |
| Hero search box (after pick) | full hierarchyLabel |
| Search page box (after deep link) | city name only |
| Offer card, urban | "Cocody" |
| Offer card, intercity | "Abidjan (Cocody)" |
| Ticket / booking summary | "Abidjan (Cocody)" + "Terminal · Quarter" secondary |

---

## 5. Booking / Ticket UI Touchpoint Inventory

All these use the `"City (Municipality)"` pattern, always — **no urban/intercity branch anywhere in booking UI**:

| Component | Location | Pattern |
|---|---|---|
| `trip-summary-card.tsx` | 118, 132, 160 | `City (Muni) → City (Muni)` — urban shows city too (inconsistent with offer card) |
| `trip-summary-card.tsx` stops list | 200 | `Terminal (City · Muni)` — "·" separator inside parens |
| `booking-checkout-form.tsx` | 290-291 | `Company · City (Muni) → City (Muni)` |
| `digital-ticket-card.tsx` | 48, 51 | `City (Muni) → City (Muni)` + **`Terminal · Quarter`** secondary |
| `passenger-tickets-view.tsx` | 297-309 | same as above |
| `booking-route-map.tsx` | 92-96, 113-114, 188-192 | `City (Muni)` + `Terminal · Quarter` |
| `booking-card.tsx` | 115-126 | `City (Muni)` |
| `booking-details.tsx` | 177-183 | `City (Muni)` + `Terminal · Quarter` |
| `passenger-trip-card.tsx` | 111, 138 | `City (Muni)` |
| operator `booking-detail-drawer.tsx` | 137-141 | `City (Muni) → City (Muni)` + `Terminal · Quarter` |

**B5 (quarter only on tickets):** Quarter names ARE returned by `trip-details-service`, `booking-read-service` (lines 330-338, 408-416) and `operator-booking-service` (356-358), and rendered as "Terminal · Quarter" — but only on the ticket/detail surfaces. Search results never show quarter. The hierarchy depth users see depends entirely on which screen they're on.

**B7 (separator chaos):** `"City (Muni)"`, `"City (Muni - Quarter)"`, `"Terminal · Quarter"`, `"Terminal (City · Muni)"` — four different formats across the app.

---

## 6. Operator ERP Touchpoint Inventory

### 6.1 Terminals (`terminals.ts` + `terminal-editor-sheet.tsx`)

- Editor: city `<select>` → municipality `<select>` → quarter `<select>` (lines 324-409). **Auto-selects municipality when the city has exactly one pass-through municipality** (lines 117-128) — good UX for Bouaké etc.
- `createTerminalSchema` (`packages/schemas/src/routes.ts:182-238`): `cityId`, `municipalityId`, `quarterId` are all **optional**; only latitude/longitude required when `isTerminal`.
- **B8 (data-quality gap):** a terminal can be created with NO city relation (just the legacy free-text `city`). Such terminals render in operator lists (`cityRelation?.name ?? city`) but are **invisible to search** — `findCandidateTrips`/`findUrbanTrips` filter on `terminal.cityId`/`municipalityId`. Nothing in the UI warns about this.
- `terminals.list` includes `cityRelation, municipality, quarter` — good.
- `terminals-table.tsx:91` shows only `City` (muni hidden) — operator list could show "City (Muni)".

### 6.2 Routes (`routes.ts` + route components)

- `Route` = origin terminal + dest terminal + waypoints (`stopOrder` 1..N; origin is implicit 0; dest = N+1). **No geography knowledge at route level** — no urban/intercity field, no city grouping.
- **"Urban Route" badge is client-side only** (route-form-drawer.tsx:108,319-323) — derived from terminal city names. The server never classifies a route as urban → downstream (search, fares, admin) can't rely on it.
- `routes.list`/`get` include cityRelation/municipality/quarter on terminals (routes.ts:17-23, 42-51) — good.
- `routes-table.tsx:72-79` + `route-card.tsx`: "City → City" only (muni hidden).
- Terminal combobox labels in route-form-drawer: `"Name — City (Muni)"` (lines 350, 376…) — quarter hidden.

### 6.3 Schedules (`schedules.ts` + wizard)

- Wizard `RoutePickerStep` (route-picker-step.tsx:100-109): "City → City".
- `buildStopsFromRoute` (`features/operator/lib/schedules/types.ts:49-80`): `StopLabel = { order, name: terminal name, city }` — **municipality/quarter not part of the label**.
- `PricingStep` (pricing-step.tsx:154-167): rows show `TerminalName` + `city` — for an urban route (same city, e.g. Cocody → Yopougon) the fare grid shows the same city twice; stops are only distinguishable by terminal name. **Confusing for operators setting segment fares on urban routes (B9).**
- Fares are segment-anchored (`fromStopOrder`/`toStopOrder`) — no geography. Duration computation from adjacent fares + dwells (`computeScheduleWaypoints`, schedules.ts:28-91).
- `schedule-card.tsx:59-65`: "City → City".
- Trip generation: `trip-generator.ts` creates TripStops for every route stop (terminalId, stopOrder, pickup/dropoff), TripSeats from bus seats, `routeSnapshotJson` snapshot; 14-day rolling window via `getCandidateDepartureDates`.

### 6.4 Admin (`trpc/routers/admin.ts`)

- Uses `cityRelation` (includes at 2014-2015, 2057-2058…) and legacy `city` fallback in `routeLabel` (line 855: `originTerminal.city || name`). `admin.listRoutes` search filters on free-text `city` (2190-2191) — **inconsistent with the rest of the app which searches `cityRelation.name`** (B10).
- Admin "Routes & Terminals" page copy says "intercity bus routes" (app/[locale]/dashboard/admin/operations/routes/page.tsx:27) — copy that pre-dates urban support.

### 6.5 The single-municipality city problem (B11)

Cities other than Abidjan have exactly ONE pass-through municipality. In the search form, selecting the same city twice → `sameCity && bothCityLevel` → blocked; selecting the pass-through municipality twice → `sameMunicipality` → blocked. **Intra-city (urban) travel in Bouaké, Yamoussoukro, San-Pédro, etc. is impossible to search**, and since the autocomplete suppresses pass-through municipality entries anyway (city match wins), the "urban" feature effectively only exists in Abidjan. If intra-city service in single-municipality cities is desired (terminal A → terminal B within the same city), the validation + isUrban rule must be relaxed to allow same-city/same-municipality **different-terminal** pairs.

---

## 7. Cross-Cutting Issues

### 7.1 Five derivation points of "urban" (see §2) — consolidation needed

### 7.2 Legacy dual city field

`CompanyLocation` has free-text `city` (schema legacy) AND `cityId → City` FK. Display everywhere uses `cityRelation?.name ?? city`; search uses only the FK. Admin search uses only the free-text. Terminal editor writes both (`city` free text from… nothing — the editor never sets the legacy `city` string, terminals.ts:52 sets `city: data.city ?? null` from the schema's optional `city`). Three different consistency states are possible.

### 7.3 Dead code found

- `features/home/components/hero-search-bar.tsx` — legacy tabbed search bar; unused.
- `features/operator/components/routes/route-editor-sheet.tsx` — legacy route editor; unused (route-form-drawer is live).
- `features/search/components/search-hero.tsx` — legacy pink banner; unused.

---

## 8. Recommended Changes (Priority Order)

**P0 — correctness (server & validation):**
1. **(R1)** Add `isUrban: boolean` to the `SearchOffer` type, computed server-side with the ID-based rule; delete `offer.originCityName === offer.destinationCityName` from offer-card.
2. **(R2)** Fix `mixedGranularity` validation to include quarter combos (quarter↔city, city↔quarter) in BOTH search forms; extract the validation into one shared lib (`features/search/lib/validate-search-pair.ts`).
3. **(R3)** Fix popular chips: store `id: ""` and let text-resolution handle names, or resolve to cuid via `getCityDetails` before setting `CityValue`; never put a display name in `id`.
4. **(R4)** Guard the search page: if `fromMuni` XOR `toMuni` is set (half-urban), either auto-fill the missing municipality client-side or force intercity semantics explicitly (currently misrouted silently).
5. **(R5)** Make `Route` carry `serviceType` (URBAN/INTERCITY) auto-derived from its terminals at create/update (server-side), used by the operator badge, admin, and future fare logic; remove the client-side name-equality badge in route-form-drawer.

**P1 — display consistency:**
6. **(R6)** Build one shared formatter, e.g. `formatLocationLabel({ cityName, municipalityName, quarterName, isUrban })` with a single convention — recommend: urban → `"Cocody"` (or `"Cocody – Riviera 3"` when quarter known), intercity → `"Abidjan (Cocody)"` — and use it in offer-card, trip-summary-card, booking-checkout-form, digital-ticket-card, passenger-tickets-view, booking-route-map, booking-card, booking-details, passenger-trip-card, operator booking-detail-drawer. Kills B5/B7 and the offer-card-vs-ticket mismatch.
7. **(R7)** Show the municipality label in the search page `SearchForm` after deep link: extend `getCityDetails` (or add `searchMunicipalities`-based resolution) so the box displays `"Abidjan (Cocody)"` when `fromMuni` is present.
8. **(R8)** Show quarter on the offer card when available (data already present in `SearchOffer`) — or deliberately hide quarters everywhere for consistency.
9. **(R9)** Autocomplete UX: when a city match exists, append a "— all municipalities —" section (grouped results) instead of suppressing muni/quarter entries; visually separate hierarchy levels.

**P2 — data quality & operator UX:**
10. **(R10)** Require `cityId` (and ideally `municipalityId`) in `createTerminalSchema` when `isTerminal: true`; add a validation/backfill for legacy free-text `city`; warn in terminal editor when a terminal lacks a city relation.
11. **(R11)** Include municipality in operator surfaces: `PricingStep` stop labels (`Terminal — City (Muni)`), route lists, schedule cards, terminals table.
12. **(R12)** Fix admin route search to use `cityRelation.name`; update "intercity bus routes" copy.
13. **(R13)** Decide the quarter strategy: either implement `fromQuarter`/`toQuarter` params + repo filtering, or strip quarter entries from the autocomplete (map them to municipality) so the UI never promises quarter-level search it doesn't deliver.
14. **(R14)** Evaluate enabling urban search in single-municipality cities (same city + same municipality + different terminals) if intra-city service is a product goal; adjust isUrban rule + validation + seed accordingly.
15. **(R15)** Delete dead code: `hero-search-bar.tsx`, `route-editor-sheet.tsx`, `search-hero.tsx`.

---

## 9. Appendix — Label Format Inventory (current state)

| Surface | City | Municipality | Quarter | Format |
|---|---|---|---|---|
| Autocomplete item | ✓ | ✓ | ✓ | `City` / `City (Muni)` / `City (Muni - Quarter)` |
| Hero search box (selected) | ✓ | ✓ | ✓ | hierarchyLabel |
| Search page box (deep-linked) | ✓ | ✗ | ✗ | `City` |
| Offer card — urban | ✗ | ✓ | ✗ | `Muni` (city fallback if muni missing) |
| Offer card — intercity | ✓ | ✓ | ✗ | `City (Muni)` |
| Trip summary / checkout | ✓ | ✓ | ✗ | `City (Muni)` |
| Ticket / boarding views | ✓ | ✓ | ✓ | `City (Muni)` + `Terminal · Quarter` |
| Trip stops list | ✓ | ✓ | ✗ | `Terminal (City · Muni)` |
| Operator route/schedule lists | ✓ | ✗ | ✗ | `City → City` |
| Terminal combobox (route form) | ✓ | ✓ | ✗ | `Terminal — City (Muni)` |
| Operator fare grid | ✓ (terminal + city) | ✗ | ✗ | `Terminal / City` |
| Admin lists | ✓ (cityRelation or free-text) | ✗ | ✗ | `City` |

**Legend:** ✓ = present, ✗ = absent.

---

## 10. First-Class Urban Design (approved approach, 2026-08-01 — design only, no code yet)

**Core principle:** persist what is currently re-derived at runtime, at the earliest stable point in the domain (`Route`), and cascade it down. Derivation at write-time; read at query-time (same snapshot philosophy as `departureDate`/`busId`/`routeSnapshotJson`).

**Phase 0 — Data integrity (enabler):**
- `cityId` required when `CompanyLocation.isTerminal = true` (schema + `createTerminalSchema` + editor guard). Recommended: `municipalityId` required too, except pass-through cities (auto-fill already exists).
- Backfill legacy free-text `city` → `cityId` via the `normalize()`-based resolver (`getCityDetails`).
- Demote `isPassThrough` to pure UI concern (skip municipality dropdown only) — never search-blocking logic.
- → maps to R10.

**Phase 1 — Persist service type (the model change):**
- `Route.serviceType: INTERCITY | URBAN`, auto-derived server-side at create/update from `originTerminal.cityId === destinationTerminal.cityId` (ID-based, never names). Stored, not re-derived.
- Validation rule: URBAN routes require all waypoint terminals in the same city as the endpoints.
- `Trip.serviceType` — copy taken at trip generation (indexed; search filters on it, no geometry join). Survives later route edits via snapshot.
- No column on `Schedule` (inherits via route). Booking/tickets derive from trip (or snapshot next to already-snapshotted names).
- → kills derivation points 1, 2, 4 (server + operator badge); enables R1/R5 cleanly.

**Phase 2 — Search over "places", not "cities + optional muni" (semantic fix):**
- Origin/destination modeled as level-aware place: `{ level: city | municipality | quarter, cityId, municipalityId?, quarterId? }` — same shape as `CityValue` already in the UI. URL/params carry all three (add `fromQuarter`/`toQuarter`).
- New rule: `isUrban = originCityId === destinationCityId` — municipality/quarter are refinements, not prerequisites. Automatically fixes: single-municipality cities (B11), half-urban misrouting (R4), quarter drop (R13).
- One repository query (`findTrips(originPlace, destPlace, date)`) instead of the `findCandidateTrips`/`findUrbanTrips` branch; terminal matching at deepest level given. `cheapestByDate` shares it.
- `SearchOffer.serviceType` server-side (kills name-equality in offer-card, R1).
- → maps to R2, R3, R4, R13, R14.

**Phase 3 — First-class urban product behaviors (payoff):**
- ~~Urban fares~~ — **struck 2026-08-01 (product decision):** the segment fare model already serves urban routes identically (fare matching in search is stop-order based, serviceType-agnostic); no urban pricing convention needed. If peak/off-peak pricing is ever wanted it's a general `FareType` feature for both service types. Optional-only leftover: a price-range hint in the operator `PricingStep` for URBAN routes (UI sugar, deferred).
- Urban seating: ~~conscious decision~~ — **decided 2026-08-01: keep seat maps for all trips** (urban behaves exactly like intercity; no checkout changes). Recorded from user decision; the open-seating shortcut is a v2+ product option, not in scope.
- ~~Urban cadence: shared frequency presets (every 30/60 min) in schedule wizard — pure UI add.~~ — **implemented 2026-08-01 (full cadence support, per user choice):** one schedule now carries ALL departure times (`Schedule.departureTimes String[]`, primary `departureTime` kept as first element). Wizard + edit drawer have a cadence preset editor (start / every-N-min / end → generates the time list, merged with manual adds); trip generator, reconcile, and the overlap guard are time-set aware; MODIFIED exceptions replace the day's whole cadence with one override.
- ~~Badges everywhere from one source: offer card, trip summary, digital ticket, operator schedule cards, admin.~~ — **implemented 2026-08-01:** shared `apps/web/components/urban-badge.tsx`; surfaces: offer card (`SearchOffer.serviceType`), trip summary (`TripDetails.serviceType`), digital ticket (`DigitalTicketDTO.serviceType` via `booking.trip.serviceType`), operator schedule cards (`route.serviceType`), admin routes table; operator route-card/routes-table deduped onto the shared badge.

**Phase 4 — Consistency layer (UI):**
- Shared `GeoPlace` type + one `formatLocationLabel(city, muni, quarter, serviceType)` used on every surface (kills the 4 label formats + quarter-only-on-tickets split; B5/B7).
- Shared pair-validation lib (fixes quarter↔city hole + popular-chip id bug; R2/R3).
- Admin route search switches to `cityRelation.name` (R12); dead code removed (R15).
- → maps to R6, R7, R8, R9, R11, R12, R15.

**What NOT to do:** no separate `UrbanRoute`/`UrbanFare` tables; no per-Schedule serviceType; `isPassThrough` never in search logic; never derive from names.

**What stays derived (correctly dynamic):** availability (booking overlap), fare matching, stop times, `isExpress` (stop count), ETA.

**Effort shape:** schema (`serviceType` on Route + Trip, required `cityId` on terminals) + backfill migration → routes router derivation + waypoint-city validation → trip-generator snapshot → unified place-based search repo + quarter params + `SearchOffer.serviceType` → shared validation + chips fix + label formatter → UI badges → admin + dead code.

**Status:** ✅ **Phase 0 + 1 implemented (2026-08-01).** ✅ **Phase 2 implemented (2026-08-01).** ✅ **Phase 3 implemented (2026-08-01).** ✅ **Phase 4 implemented (2026-08-01).**

### Post-Phase 4 follow-up — Intercity municipality/quarter search expansion (2026-08-04)

User asked to expand level-aware search to intercity (quarter→quarter, muni→quarter, etc.) pairs. The search engine already honored every combination server-side; the blockers were (a) the two forms stripping refinements for non-same-city pairs, (b) the intercity label convention hiding quarters, and (c) the autocomplete first-match-per-city de-dupe. Resolution:

- **Form pass-through (both forms):** `search-form.tsx` + `hero-search-bar-2.tsx` dropped the `sameCity &&` guard — `fromMuni/toMuni/fromQuarter/toQuarter` now travel unconditionally for intercity pairs. Engine, params, `cheapestByDate`, date strip, and `validateSearchPair` required no change (they already support every level combo across cities; same-city identical pairs still blocked).
- **Intercity quarter labels:** `format-location-label.ts` intercity branch now renders `"Abidjan (Cocody - Riviera 3)"` (quarter shown when known) instead of always `"Abidjan (Cocody)"`. Applies everywhere via the shared function (offer-card, trip-summary-card, checkout, tickets, etc.).
- **Autocomplete de-dupe fix (R9):** `locations.searchCities` now keys results by the full `(city, municipality, quarter, level)` triple with an `add()` helper instead of first-match-per-city; `city-autocomplete-field.tsx` button `key` changed to a unique composite key. Multiple quarters of the same city are now reachable.
- **Verification:** web `pnpm typecheck` clean; 32 search unit tests pass.
- **Follow-up fixes (2026-08-04):**
  - **R9a — pass-through duplicate:** `searchCities` skips pass-through municipalities whose city already matched. Pass-through munis always share their city's name (seed: `isPassThrough: true`, no quarters), so the city row already represents them — typing "Yamoussoukro" no longer returns both `Yamoussoukro` and `Yamoussoukro (Yamoussoukro)`.
  - **R9b — chip-vs-cuid sameCity hole (B4):** `validate-search-pair.ts` now compares **normalized display text** (lowercase, NFD-strip accents, drop non-alnum — mirroring server `normalize`) when at least one side lacks a resolved id. Popular chips / history hints submit `id:""`, so a dropdown-picked "Abidjan" (cuid) + chip "Abidjan" (`id:""`) previously returned `originVal(cuid) !== destVal("Abidjan")` → passed validation → searched city-wide. Now normalized-equal → blocked. Accent-insensitive ("San-Pédro" dropdown + "San Pedro" chip). All 10 existing `validateSearchPair` tests still pass.
  - **B3 — deep-link hierarchy label:** new `locations.getGeoPlaceLabel({cityId, municipalityId?, quarterId?})` (reuses `getCityDetails` name→cuid resolution for the city) + `useGeoPlaceLabel` hook; `search-form.tsx` now renders `Abidjan (Cocody - Riviera 3)` in the box for `?fromQuarter=...` deep links instead of plain city name.
- **Verification (follow-up):** web `pnpm typecheck` clean; 157/157 tests pass.
- **Tests finalized (2026-08-04):** Extracted the de-dupe + pass-through suppression logic from `searchCities` into a pure `features/search/lib/build-search-entries.ts` (`buildSearchEntries(cities, municipalities, quarters, limit)`); the router delegates to it, so the exact rules are unit-testable. New shared fixtures `features/search/lib/__tests__/geo-fixtures.ts` mirror the seed dataset (30 cities incl. major hubs, Abidjan's 13 municipalities + all quarters, pass-through cities). New test files registered in the hardcoded `apps/web/package.json` test list:
  - `format-location-label.test.ts` — urban/intercity label conventions across every seeded municipality, every quarter, and every pass-through city (+ empty/partial inputs, `formatCityWithMuni`).
  - `build-search-entries.test.ts` — pass-through suppression (city wins, no `City (City)`), suppression NOT over-triggered when city missing, real municipality never suppressed, de-dupe by full `(city, muni, quarter, level)` key (identical quarter deduped, sibling quarters kept, quarter never collapses into city), full dataset reachability.
  - `search-pair-validation.test.ts` gained 6 cases: dropdown cuid vs same-named chip → blocked, accent-insensitive ("San-Pédro"/"San Pedro"), different city/different chip → allowed, refined-quarter chip vs city pick → allowed.
  - Web typecheck clean, **184/184** tests pass (was 157).

### Phase 0 + 1 implementation log (2026-08-01)

**Schema (`packages/db/prisma/schema.prisma`):**
- Added `enum ServiceType { INTERCITY URBAN }`.
- `Route.serviceType ServiceType @default(INTERCITY)` + `@@index([serviceType])`.
- `Trip.serviceType ServiceType @default(INTERCITY)` + `@@index([serviceType])`.
- Pushed to Neon dev DB via `prisma db push`; client regenerated.

**Backfill (`packages/db/scripts/backfill-service-type.ts`, run once):**
- Resolved legacy free-text `city` → `cityId` via normalized-name match (0 locations needed it — all terminals already geo-complete).
- Derived `Route.serviceType` from origin/dest terminal cityIds: 2 URBAN / 4 INTERCITY.
- Snapped `Trip.serviceType` onto all 89 existing trips.

**Validation layer:**
- `createTerminalSchema` (`packages/schemas/src/routes.ts`): `cityId` now required when `isTerminal` (alongside lat/lng).
- `terminals.ts` router: `ensureTerminalGeography` helper auto-assigns a city's single pass-through municipality on create/update; update blocks promoting/editing a location to terminal without a city.
- `terminal-editor-sheet.tsx`: inline error + live hint when `isTerminal` without a city.

**Routes router (`apps/web/trpc/routers/routes.ts`):**
- `create`: fetches terminal `cityId`s, derives `serviceType` (ID-based, never names), rejects routes with geo-incomplete terminals, rejects URBAN routes whose waypoints leave the endpoint city.
- `update`: re-derives `serviceType` when origin/dest/waypoints change, same geo + same-city waypoint validation.

**Trip generation (`apps/web/lib/trip-generator.ts`):**
- `Trip.serviceType` snapshotted from `route.serviceType` at creation.

**Operator UI:**
- `route-form-drawer.tsx`: Urban badge now ID-based (`cityRelation?.id`), not name-based.
- `route-card.tsx` / `routes-table.tsx`: "Urban" badge reads persisted `route.serviceType`.

**Verification:** `pnpm --filter web typecheck` ✅, `pnpm --filter schemas typecheck` ✅, web unit tests 71/71 ✅. Lint noise in schemas package is pre-existing (CRLF/import-order), untouched by this work.

**Remaining:** all Phase 4 items are now done (see Phase 4 log below); only deferred sugar remains: urban price-range hint in `PricingStep`.

### Phase 4 implementation log — Consistency layer (2026-08-01)

**Shared label formatter (`apps/web/lib/format-location-label.ts`, new — R6):**
- `formatLocationLabel({ cityName, municipalityName, quarterName, isUrban })`: urban → `"Cocody"` / `"Cocody – Riviera 3"` (quarter shown when known, city fallback); intercity → `"Abidjan (Cocody)"`. `formatCityWithMuni` = intercity form for operator surfaces (R11).
- Kills the 4 ad-hoc label formats + the offer-card-vs-ticket mismatch (B5/B7). Applied on all R6 surfaces: `offer-card` (now shows quarter on urban offers — R8 "show" option), `trip-summary-card`, `booking-checkout-form`, `digital-ticket-card`, `passenger-tickets-view`, `booking-route-map`, `booking-card`, `booking-details`, `passenger-trip-card`, operator `booking-detail-drawer`. Ticket secondary lines (`Terminal · Quarter`) unchanged — already consistent.
- Plumbing: `PassengerBookingSummary.serviceType` + `OperatorBookingListItem.serviceType` added (`packages/types/src/booking.ts`); mapped from `booking.trip.serviceType` in `booking-read-service.ts` (`toSummary`) and `operator-booking-service.ts` (`toListItem`/`toDetail`, include selects `trip.serviceType`).

**R11 — municipality in operator surfaces:**
- `StopLabel` gains `municipality` (`features/operator/lib/schedules/types.ts`); `buildStopsFromRoute` populates it (routes `list`/`get` already include `municipality`).
- `pricing-step.tsx` stop labels → `Terminal — City (Muni)`; `route-card.tsx`/`routes-table.tsx` → `City (Muni) → City (Muni)`; `schedule-card.tsx` same; `terminals-table.tsx` city cell → `City (Muni)` (all via `formatCityWithMuni`, empty → "—"/noData fallback preserved).

**R12 — admin route search + copy:**
- `admin.listRoutes` search switches from free-text `originTerminal.city` to `cityRelation.name` (both ends), matching operator `routes.list` (B10 fixed).
- Copy de-urbanized: admin routes page description, `routes.metaDescription`, `routes.noRoutesDesc`, `terminals.metaDescription` in `en.json` + `fr.json` (fr mirror normalized to English per project language rule).

**R15 — dead code removed (verified zero imports):**
- Deleted `features/home/components/hero-search-bar.tsx` (v1), `features/search/components/search-hero.tsx`, `features/operator/components/routes/route-editor-sheet.tsx`. Live code uses `hero-search-bar-2.tsx`.

**Verification:** `pnpm --filter web typecheck` ✅ (one `exactOptionalPropertyTypes` fix on `LocationLabelParts`), web tests 89/89 ✅. Biome noise on touched files is pre-existing style-only (CRLF/a11y/import-order), outside web `lint` scope.

**Deferred (unchanged):** urban price-range hint in `PricingStep` (UI sugar).

### Phase 2 implementation log — Search over level-aware places (2026-08-01)

**Shared libs (`apps/web/features/search/lib/`):**
- `places.ts`: `GeoPlace { cityId, municipalityId?, quarterId?, level }`, `isUrban(origin, dest) = origin.cityId === dest.cityId` (refinements optional), `placeMatchesTerminal(place, terminal)` (terminal shape `GeoTerminal`).
- `validate-search-pair.ts`: shared `validateSearchPair(origin, dest) → "sameCity" | null`. Rejects only indistinguishable pairs (identical unresolved names, same city w/o refinement, same municipality/quarter); one-sided refinements (city→muni, city→quarter) are now VALID urban searches. Replaces the duplicated `mixedGranularity`/`bothCityLevel` logic in search-form + hero (R2); `refineUrban` message keys no longer used.
- Tests: `lib/__tests__/search-pair-validation.test.ts` (16 cases; added to web test script) — suite now 87/87.

**Search API:**
- `SearchOffer.serviceType: "INTERCITY" | "URBAN"` added in `packages/types/src/search.ts` (R1); `offer-card.tsx` `isUrban` now reads `offer.serviceType` — name-equality check deleted.
- `search-read-repository.ts`: `findCandidateTrips`/`findUrbanTrips` replaced by one `findTrips(originPlace, destinationPlace, date)` (full include) + `findTripsInWindow(...)` (lean include for the price strip), sharing `buildTripWhere` + `terminalWhere` (matches at deepest level given).
- `search-service.ts`: `SearchContext.origin/destination` are `GeoPlace`; single `findTrips` call; stop matching via `placeMatchesTerminal`; `serviceType` from the `trip.serviceType` snapshot; BEST-sort normalization keyed on `isUrban` = same cityId.
- `trpc/routers/search.ts`: added `originQuarterId`/`destinationQuarterId` to `search` + `cheapestByDate`; shared `resolveCityId` (name→cuid) + `toGeoPlace` helpers; `cheapestByDate` now uses `findTripsInWindow` + `placeMatchesTerminal` (kills the old isUrban branch and `tripWhere: any`).
- `app/[locale]/search/page.tsx` + `search-page-client.tsx`: quarter params wired into prefetch, query, `criteriaKey`, `handleSearch`, form/date-strip props.

**UI plumbing:**
- `lib/params.ts`: `fromQuarter`/`toQuarter` (R13 — URL carries all three levels).
- `search-form.tsx`: `initialFromQuarter`/`initialToQuarter` props; initial `CityValue` level = quarter > municipality > city; uses shared validation; submits quarter ids.
- `hero-search-bar-2.tsx`: uses shared validation; popular chips now `setDestination({ id: "", text })` — never a display name in `id` (R3); pushes `fromQuarter`/`toQuarter`.
- `search-date-strip.tsx` + `use-cheapest-by-date.ts`: quarter params passed through.

**Semantics fixed by design (R4, R13, R14):** half-urban (`fromMuni` XOR `toMuni`) can no longer misroute — same-city half-refinement is a valid urban search, different cities ignore the stray muni; quarter selection is honored end-to-end; single-municipality cities support urban search without both-munis prerequisite.

**Verification:** `pnpm --filter web typecheck` ✅, web tests 87/87 ✅ (16 new). Biome diagnostics on touched files are pre-existing style noise (CRLF, a11y, import-order) — same class as the untouched `params.ts`/`offer-card.tsx`; none of these files are in the web `lint` scope.

### Phase 3 implementation log — Urban cadence + badges everywhere (2026-08-01)

**Cadence data model:**
- `Schedule.departureTimes String[] @default([])` added (Postgres text array, pushed via `prisma db push`); `departureTime` kept as the primary/first time for list sorting and back-compat (documented in schema).
- `packages/db/scripts/backfill-schedule-departure-times.ts` (idempotent): seeds `departureTimes = [departureTime]` where empty; ran clean — 6/6 schedules seeded.

**Server (cadence-aware):**
- `packages/schemas/src/schedules.ts`: `createScheduleSchema` accepts `departureTimes: string[]` (or deprecated `departureTime` alias — superRefine requires at least one), transform sorts+dedupes and keeps `preferredBusId` alias; `updateScheduleBasicSchema` gains `departureTimes`.
- `lib/schedule-trip-window.ts`: `getCandidateDepartureDates`/`getPreviewDepartureDateStrings` take `departureTimes: string[]`; one candidate per time per operating day; a MODIFIED exception replaces the day's cadence with its single override (documented).
- `lib/trip-generator.ts`: iterates `schedule.departureTimes` (fallback `[departureTime]`).
- `trpc/routers/schedules.ts`: `create` stores both (`departureTime = times[0]`); `checkScheduleOverlap` now compares time SETS per active route (fetch drops the old `departureTime` equality where) and lists the conflicting times in the error; `reconcileScheduleTrips` + `updateCalendar` pass the full list; `updateBasic` accepts a `departureTimes` patch, syncs the primary time, and re-runs overlap/reconcile on change.
- Tests: `lib/__tests__/schedule-trip-window.test.ts` updated to the new API + 2 new cases (multi-time cadence per day, MODIFIED replaces whole cadence) — suite now 89/89.

**Wizard/edit UI:**
- `features/operator/components/schedules/departure-times-editor.tsx` (new, shared by wizard + edit drawer): time chips with remove, manual add via TimePicker, and a **cadence preset** box (start / every 15-90 min / end → generates the full list, deduped, merged with manual entries).
- `CalendarConfig.departureTime` → `departureTimes: string[]` (`features/operator/lib/schedules/types.ts`, default `["08:00"]`); `calendar-step.tsx`, `operator-schedules-view.tsx` (`canProceed`, `handlePublish`), `preview-step.tsx` (marker desc shows all times), `schedule-edit-drawer.tsx` (multi-time editing + `updateBasic` payload), `schedule-card.tsx` (shows up to 3 times + "+N").
- i18n keys added under `operatorDashboard.schedules.wizard` in `en.json` + `fr.json` (English text per project language rule; fr mirror added to avoid missing-key crashes).

**Badges everywhere (one source):**
- `apps/web/components/urban-badge.tsx` (new): shared emerald "Urban" badge.
- `packages/types/src/booking.ts`: `TripDetails.serviceType` + `DigitalTicketDTO.serviceType` (`SearchServiceType`).
- `trip-details-service.ts`: `serviceType: trip.serviceType`; `booking-read-service.ts`: `bookingInclude` adds `trip: { select: { serviceType: true } }`, both mappers set the field.
- Surfaces: `trip-summary-card.tsx` (+ `TripSummaryData.serviceType`), `digital-ticket-card.tsx`, operator `schedule-card.tsx` (`route.serviceType`), `admin-routes-table.tsx`; operator `route-card.tsx`/`routes-table.tsx` swapped to the shared badge. Offer card badge was already `SearchOffer.serviceType` (Phase 2).

**Verification:** `pnpm --filter web typecheck` ✅, web tests 89/89 ✅. Biome noise on touched files is pre-existing style-only (CRLF/a11y/import-order), outside web `lint` scope.

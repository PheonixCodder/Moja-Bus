# S — Public Search Pipeline Findings

Files: `apps/web/trpc/routers/search.ts` (244), `services/search-service.ts` (233),
`repositories/search-read-repository.ts` (292), `lib/places.ts` (36), `lib/params.ts` (51),
`lib/constants.ts` (34), `app/[locale]/search/page.tsx` (67), `hooks/use-city-search.ts` (27).

## S1 — isUrban derivation vs stored serviceType (VERIFIED CONSISTENT)
- Search derives `urban = origin.cityId === destination.cityId` (places.ts:22-24).
- Route serviceType derives the same way (`resolveRouteServiceType`, route-service-type.ts:31).
- Offers expose `serviceType: trip.serviceType` (snapshot, search-service.ts:133); BEST-sort
  normalization uses the derived `urban` (search-service.ts:30, 205-207).
- **Consistent.** Since route.serviceType is validated to equal geography at create/update, and
  `buildTripWhere` matches purely on terminal cityId, geography itself enforces the discriminator
  (an urban search can only ever match urban routes). No explicit serviceType filter in SQL is
  needed or present — by design.
- **Caveat:** `findTrips` matches on `terminal.cityId` regardless of `trip.serviceType` snapshot.
  If a trip's route is reclassified (routes.update can re-derive serviceType), the trip snapshot is
  only refreshed on regenerate/reconcile — but since matching is geographic, a stale snapshot only
  affects the returned `serviceType` label + any consumer that filters on it client-side. Low risk.

## S2 — UTC day bounds (NOTE)
`dayBounds` (search-read-repository.ts:160-166) uses UTC midnight/23:59:59.999 — correct while app
TZ stays UTC+0. Same TZ future-proofing caveat as R6/TZ2. `departureHourRanges` (30-54) also uses
UTC hours (upper bound exclusive `lt`) — matches the JS predicate.

## S3 — Occupancy counts PENDING_PAYMENT only when unexpired (VERIFIED OK)
`getSegmentOccupancy` (246-291): CONFIRMED always counted; PENDING_PAYMENT counted only when
`holdExpiresAt > now`. Good.

## S4 — Fare match timing (VERIFIED OK)
`matchSegmentFare` uses `trip.departureDate` (search-service.ts:91) vs `originStop.scheduledDeparture`
(cheapestByDate, search.ts:221). Both consistent with schedule fare validFrom/validUntil windows.
`cheapestByDate` dedupes per-route? No — per trip; returns cheapest per date across operators.

## S5 — No serviceType/isUrban param in search schema (NOTE)
`searchInputSchema` (search.ts:15-43) and `searchParamsSchema` (params.ts:20-49) have no urban/
serviceType flag — it is derived server-side from the two cityIds. The reporter's "urban chips" idea
would be a UI affordance only; backend already handles it. Confirmed no mismatch.

## S6 — Sorting (VERIFIED OK)
- CHEAPEST/FASTEST/EARLIEST/LATEST/MOST_AVAILABLE/BEST implemented. BEST uses urban-aware
  normalization (search-service.ts:204-217). Pagination pageSize=15.

## S7 — Public router (public.ts) — reviewed
Only notification token + operator listing procs. `listOperators` / `getOperator` expose routes with
`city` free-text AND `cityRelation` — fine. No search-related urban logic here.

## S8 — Public page prefetch (page.tsx) — reviewed
Prefetches `locations.getCityDetails` + `search.search` + `search.cheapestByDate` when from/to/date
present. Search params cache handles `fromMuni/toMuni/fromQuarter/toQuarter`. Good.

## S9 — Nuqs/sessionStorage filters (RESOLVED, verified)
`search-page-client.tsx` (413) uses `useQueryStates(searchParamsSchema, { shallow, history: "push" })`
for **route params only** (from/to/muni/quarter/date/passengers/sort/page/bookingOfferId). The filter
values (operators/amenities/departureTime/seatClass/isExpress) live in `localFilters` React state
seeded from **sessionStorage** (`FILTER_STORAGE_KEY = "search_filters"`, lines 23-45, 64-72),
persisted via `persistFilters` on every toggle. So the comment at params.ts:31 is correct: filters
are session-scoped, NOT in the URL. `searchParamsSchema` still declares operators/amenities/... keys
for the route-level nuqs parsing, but the client reads filters exclusively from `localFilters`.
- `handleSearch` clears filters + `setParams({ page: 1, bookingOfferId: null })` (192-208).
- Resume toast keyed on `params.bookingOfferId` via sessionStorage guard (76-88).
- "Load More" accumulates offers; criteriaKey excludes `page`, includes `isExpress` (129-145).
- No urban-chip rendering exists on this page (consistent with S5 — discriminator is invisible
  to the public UI; offer/serviceType is surfaced per-offer in offer-card.tsx:63).

## S10 — `isExpress` filter is a NO-OP (BUG, NEW)
`handleToggleExpress` (262-269) flips `localFilters.isExpress`, the sidebar checkbox renders it
(search-filters-sidebar.tsx:196), the badge count includes it (179), and criteriaKey includes it
(143) — but the `search.search` query input (102-119) NEVER passes `isExpress`. Server fully
supports it: `searchInputSchema.isExpress = z.array(z.enum(["true"]))` (search.ts:33) →
`isExpress: input.isExpress?.includes("true") ?? false` (search.ts:125) →
`offers = offers.filter((o) => o.isExpress)` (search-service.ts:179-180).
- **Effect:** toggling "Express only" changes no query → the UI filters nothing. Users get the
  full list including non-express trips while the checkbox shows checked.
- **Fix:** add `isExpress: localFilters.isExpress ? ["true"] : undefined` to the query input
  (line ~116). Also note `maxPrice` (116) is wired in the query but no UI control sets
  `localFilters.maxPrice` — dead today, harmless (sidebar has no price input; low).
- Severity: Medium (public search filter silently broken). Also the filter is session-only, so a
  fresh visit has `isExpress:false` regardless of URL — consistent with S9.

## Files cross-checked (done)
- `features/search/components/search-page-client.tsx` (413, full) — S9 resolved, S10 found.
- `lib/segment-fare-match.ts`, `lib/build-search-entries.ts`, `lib/validate-search-pair.ts` — OK.

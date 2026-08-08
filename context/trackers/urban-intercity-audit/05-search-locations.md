# S — Search + Locations Router Findings

Files: `apps/web/trpc/routers/search.ts`, `apps/web/trpc/routers/locations.ts` (both fully read).

## S1 — `search.isUrban` vs `Route.serviceType` divergence
`TripSearchReadRepository` + `SearchService` determine `isUrban = origin.cityId === destination.cityId`
(per memory/architecture doc), while `Trip.serviceType` is snapshotted from `Route.serviceType` at
generation. If a route has mismatched terminal cityIds vs derived serviceType (route-service-type
guard enforces consistency at create/update — see route-service-type.ts), the two agree. But the
search derives urban from **requested** origin/dest, not from the trip's stored `serviceType`:
- Edge: `Route.serviceType = URBAN` but a trip has same-city pickup/dropoff with **municipality**
  granularity. `isUrban` computed on cityId alone is correct here.
- Edge: intercity route where origin/dest happen to share cityId → blocked by route-service-type guard.
- Real divergence risk: **search isUrban uses cityId equality, but some URBAN routes might have
  terminals in different cities** (no—guard forbids). Record as "verify TripSearchReadRepository
  actually uses serviceType or cityId equality"; note both must agree.

## S2 — `cheapestByDate` computes the 7-day window in UTC, not app timezone
`search.ts:174-190` builds dates from `Date.UTC(parts[0], parts[1]-1, parts[2])` and uses
`toISOString().split("T")[0]` for keys. For Abidjan (UTC+0) this is correct **today**, but the code
claims "7 UTC dates" deliberately. If app TZ ever changes, or if a deployment runs where the DB
timestamps are stored in UTC but the user expects local dates, the price-by-date map could shift.
Low severity now; recommend `getCalendarDateKey`/`buildAppDepartureTimestamp` reuse for consistency.

## S3 — `search` parses `date` with `new Date(input.date)` (naive)
`search.ts:118`: `travelDate: new Date(input.date)`. `input.date` is `"YYYY-MM-DD"`; `new Date` of a
date-only string parses as **UTC midnight**. In Abidjan that equals local midnight. OK today; flag
same TZ fragility as S2. Also note `passengers`, `maxPrice`, `page` use `z.preprocess` with
`val === ""` → undefined; empty-string handling consistent.

## S4 — `search` input schema vs UI parser mismatch (partial)
Search input allows `originQuarterId`/`destinationQuarterId`; `toGeoPlace` sets `level` from them.
But `citySearchResultSchema` in locations.ts returns `municipalityId`/`quarterId` **nullable**, and
`buildSearchEntries` (in `features/search/lib/build-search-entries`) needs review for how it maps
hierarchyLabel + ids for level=city/municipality/quarter. (To read.)

## S5 — `locations.searchCities` requires q length ≥ 2
`locations.ts:24`: returns `[]` for `q.length < 2`. Reasonable; note the public search page may
expect partial matches from 1 char (verify against search UI).

## S6 — `getCityDetails` / `getGeoPlaceLabel` duplicate `normalize` logic
Both define an identical local `normalize()` and a "cuid starts with 'c' and length >= 20" heuristic.
Duplicated across locations.ts AND search.ts (`resolveCityId`). Recommend extracting to
`lib/city-reference.ts` shared helper to avoid drift (e.g. if CUID prefix rules change).

## S7 — `geocodePoint` returns municipalityId as non-null string but city may resolve without muni
`locations.ts:218-228` output schema declares `municipalityId: z.string()` (non-null) but
`geocodePoint()` in `lib/geo` may return municipality as nullable for non-municipal city centers.
Verify `loadGeoDataset` + `geocodePoint` return types; if null possible, schema/UI must handle it.

## S8 — `searchMunicipalities` orders `isPassThrough: "asc"` (false first) — matches UI expectation? verify
## S9 — `suggestQuarter` (mutation) is a publicProcedure
`locations.ts:185-209`: any anonymous user can create a Quarter. Not permission-gated. Low/medium:
public data-modification surface; recommend rate-limit or auth.

## Open Questions
- `apps/web/features/search/lib/places.ts` `placeMatchesTerminal`, `GeoPlace`; `segment-fare-match.ts`;
  `search-read-repository.ts`; `search-service.ts` — all to read (determine isUrban derivation, fare
  matching, sort, pagination).
- `apps/web/lib/geo/geocode-point.ts`, `load-geo-dataset.ts` — types.

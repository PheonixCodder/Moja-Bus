# S2 — Search Pipeline Findings (deep dive)

Files read fully: `features/search/services/search-service.ts`,
`features/search/repositories/search-read-repository.ts`, `features/search/lib/places.ts`,
`features/search/lib/segment-fare-match.ts`, `features/search/lib/build-search-entries.ts`,
`features/search/lib/validate-search-pair.ts`. Existing tests in `lib/__tests__/`.

## S1 — isUrban derivation (RESOLVED — consistent)
- `isUrban(origin, destination)` = `origin.cityId === destination.cityId` (places.ts:22-24).
- `Route.serviceType` is derived server-side from terminal cityIds (routes.ts create/update Phase 1,
  `resolveRouteServiceType`), snapshotted onto `Trip.serviceType` at generation.
- `SearchService.execute` computes `urban` from the **requested** places, and the offer carries
  `serviceType: trip.serviceType` (search-service.ts:133). Since both are city-equality based and the
  routes router forbids divergence, they agree. **Note**: search does NOT filter offers by
  `serviceType`; it filters by geography (`buildTripWhere`). A URBAN route's trip could in theory be
  returned for a same-city search only — fine. No bug.

## S2 — cheapestByDate UTC window (still relevant, low severity)
Confirmed in search.ts:174-190. Same UTC-centering; `findTripsInWindow` uses
`buildTripWhere(... windowStart, windowEnd, {departureTime: []})` → origin stop
`scheduledDeparture: { gte: start, lte: end }`. Day bounds are UTC midnight → 23:59:59.999.
Correct for Abidjan today; fragile if TZ changes.

## S3 — `new Date(input.date)` (low, see 05)
search.ts:118. Fine for UTC+0.

## N1 — `buildTripWhere` origin stop with departureTime filter vs without (EDGE BUG)
In `search-read-repository.ts:100-118`:
- With `departureTime` filter: `where.tripStops = { some: { OR: hourBranches } }` where each branch is
  `{...originStopWhere, scheduledDeparture: {gte, lt}}` — originStopWhere includes `isPickup: true`
  and terminal match. Good.
- Without filter: `where.tripStops = { some: { ...originStopWhere, scheduledDeparture: { gte: start, lte: end } } }`. Good.
- `where.AND = { tripStops: { some: { terminal: terminalWhere(destination), isDropoff: true } } }`.
  **Potential issue**: an `AND.tripStops.some` combined with a top-level `tripStops.some` — Prisma
  merges these as separate `some` constraints on the same relation. A single TripStop row cannot
  simultaneously be the origin AND the destination stop, but `some` on separate conditions allows
  different rows. OK — matches stop resolution in service. No bug.
- **BUT**: the `scheduledDeparture` window in the origin `some` is not applied to the destination
  `some`; fine (arrival may be later). OK.

## N2 — `departureHourRanges` uses UTC hours (correct for UTC+0, flagged)
search-read-repository.ts:30-54. `MORNING = 5..12`, `AFTERNOON = 12..17`, `EVENING = 17..22`,
`LATE_NIGHT = 22..24 ∪ 0..5`. Consistent with the service's expectations. Timezone-fragile.

## N3 — `getSegmentOccupancy` counts segment-overlapping bookings (GOOD)
`booking.boardingStopOrder < destOrder && dropoffStopOrder > originOrder`. Correct overlapping-segment
occupancy; counts CONFIRMED + unexpired PENDING_PAYMENT holds. **Note**: counts `_count.seatId` —
seats unique per booking, so fine.

## N4 — `matchSegmentFare` uses `fares.find` (first match), not best/cheapest
segment-fare-match.ts:17-26. Returns the FIRST active fare whose segment covers `[from,to]` within
validFrom/validUntil. If a schedule has overlapping fares (e.g. a full-route fare AND a segment fare
both matching), the order of `schedule.fares` (Prisma include, default order) decides which is used —
could return the more expensive full-route fare for a sub-segment. Compare: search router's
`cheapestByDate` picks the MIN price (search.ts:230). **Inconsistency**: main search uses
first-match; cheapestByDate uses min. If fares overlap, main search may show a higher price than the
cheapest-by-date strip. Flag for review (recommend cheapest-match in main pipeline too, or ensure no
overlapping active fares per segment — schedules router's addFare overlap guard should prevent
same-segment overlap).

## N5 — `SearchService` sorts with `urban` normalization constants (OK)
BEST score: urban uses priceNorm 1000, durationNorm 60, seatsNorm 30; intercity 5000/180/50.
Reasonable.

## N6 — `priceXOF = baseFare * passengerCount` (whole-price multiply)
search-service.ts:97. Price per seat × count — standard. Booking flow must compute the same; note the
offer `priceXOF` is total for the party, `baseFare` is per seat.

## N7 — `buildSearchEntries` dedup key uses city id + muni + quarter + level (OK)
Pass-through municipality suppression logic (lines 63-82) skips a municipality entry when the city
already matched. Verified against format-location-label conventions. Fine.

## N8 — `validateSearchPair` blocks same-city searches without refinement
Returns "sameCity" for identical city → forces the user to pick municipality/quarter for urban
searches. This is the **intended** UX: origin + destination same city must refine to different
munis/quarters. Confirms urban search relies on municipality/quarter-level places.

## N9 — Search input allows `isExpress` as `["true"]` array (weird but works)
search.ts:33 `z.array(z.enum(["true"]))`; `isExpress: input.isExpress?.includes("true")`. Parser
should just be `z.boolean()`. Cosmetic.

## Open
- `features/search/lib/params.ts`, `constants.ts`, `format.ts`, `local-date.ts`, hooks — the search
  page (public) uses these; need to read `app/[locale]/search/page.tsx` + components for the urban
  chips flow and how municipality/quarter get chosen.
- Confirm schedules `addFare` overlap guard prevents the N4 overlap scenario (memory says overlap
  check exists for always-valid vs date-ranged; verify same-segment duplicates).

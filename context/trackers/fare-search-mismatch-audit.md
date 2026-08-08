# Fare-Search Mismatch Audit

## Summary
Search validates fares with a strict, date-aware segment rule (`matchSegmentFare`),
but three other surfaces — offer creation, receipts/shared-tickets, and archival
revenue analytics — use stale or divergent rules. A fare that passes search can
therefore be mismatched by the time a booking is priced, receipted, or reported.

## Findings

### F-1 Offer creation uses a 5000 XOF fallback (Fixed)
- **Location:** `apps/web/features/booking/services/trip-details-service.ts` (~L94-101)
- **Problem:** `segmentFare?.priceXOF ?? fallbackFare?.priceXOF ?? 5000` ignores
  `validFrom`/`validUntil` and silently prices unmatched segments at a hard-coded
  5000 XOF, so stale/unmatched offers can reach the hold service.
- **Fix:** use the shared `matchSegmentFare(...)` predicate (same one
  `SearchService` / `searchRouter.cheapestByDate` use); reject the offer when no
  active matching fare exists.

### F-2 Receipts + shared-ticket use schedule-derived route (Fixed)
- **Locations:**
  - `apps/web/features/payments/services/booking-receipt-email.ts` (~L58-60)
  - `apps/web/trpc/routers/booking.ts` (~L273-276)
- **Problem:** origin/destination cities are derived from
  `trip.schedule?.route`, which goes stale after route reclassification.
- **Fix:** derive them from the booking's persisted `originTripStop` /
  `destinationTripStop` terminals instead of the schedule.

### F-3 Archiving a schedule drops its trips from revenue analytics (Fixed)
- **Locations:**
  - `apps/web/trpc/routers/schedules.ts` (~L815-818) archive `updateMany`
  - `apps/web/trpc/routers/operator.ts` `getRevenueAnalytics` (~L1381-1461)
- **Problem:** the analytics query inner-joins `trip -> schedule -> route`; trips
  archived with `scheduleId: null` are excluded, so historical revenue vanishes
  after schedule deletion.
- **Fix:** join revenue to the booking's persisted origin/destination trip stops
  via LEFT JOINs so archived trips remain; extract the row aggregation into a
  pure, unit-tested helper (`features/payments/lib/revenue-analytics.ts`).

### F-4 `updateFare` only validates overlap when `type` changes (Fixed)
- **Location:** `apps/web/trpc/routers/schedules.ts` `updateFare` (~L1156-1169)
- **Problem:** `assertNoFareOverlap` only runs when `input.data.type` changes, so
  overlap-relevant patches slip past validation.
- **Fix:** derive the effective window by merging `input.data` onto the stored
  fare and run `assertNoFareOverlap` on every `updateFare` call.

## Verification
- `packages/ui` typecheck: 0 errors
- `web` typecheck: 0 errors
- `traveler-app` typecheck: only pre-existing errors in `features/auth/views/login-view.tsx`
  (Better Auth client type drift); no errors in touched booking files.
- Added unit test: `features/payments/lib/__tests__/revenue-analytics.test.ts`

## Status
All four fixed; regression test added for F-3.

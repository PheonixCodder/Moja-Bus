# Phase 04 — Search, quote integrity & concurrency

**Status:** Implemented (2026-08-16)  
**Depends on:** Phase 03 (freeze/release correct)  
**Unlocks:** Accurate availability; no budget oversell; checkout UI matches charged amount  
**Findings:** P1-3, P1-19, P2-1, P2-7, P2-11 · related P1-14/P3-2 if wiring applyTarget

## Goal

Align search capacity with seat reality, make campaign budget/coupon caps concurrency-safe, and make checkout display/method part of a **single server quote** (surgical per D5 default).

## Scope

### In
- Segment occupancy: distinct seats / max concurrent load on path (P1-3)
- Conditional budget/coupon increments (P1-19, P2-7)
- Versioned quote: payment method + instruments → freeze inputs match UI (P2-1)
- Align BOARDING search vs bookable (P2-11)

### Out
- Full PaymentIntent aggregate (unless D5 overrides)
- i18n (Phase 06)
- Seat map deck UI details beyond data correctness (deck field fix in Phase 06)

## Work items

### 04.1 — Occupancy (P1-3)
1. ✅ `maxPathOccupancy` + `getSegmentOccupancy` / `countSegmentOccupancy` distinct seats
2. ✅ Shared helper under `features/booking/lib/max-path-occupancy.ts`
3. ✅ Unit tests for mid-route reuse

### 04.2 — Budget / cap concurrency (P1-19, P2-7)
1. ✅ Conditional budget + coupon SQL on freeze
2. ✅ FINALIZED-only for campaign redemption eligibility — see [16-phase-04-cap-counting.md](./16-phase-04-cap-counting.md)
3. ✅ Guard unit tests (`budget-reserve-guard`)

### 04.3 — Versioned checkout quote (P2-1, D5 surgical)
1. ✅ `getCheckoutPricing` returns signed `quoteId` + `paymentMethod` + `payableXOF`
2. ✅ `createHold` requires `quoteId`; rejects stale / mismatched charge
3. ✅ Checkout UI uses server `payableXOF` / `displayFeeXOF`
4. ✅ Wallet fee waive expressed via `waiveConvenienceFee` on quote

### 04.4 — Trip status alignment (P2-11)
1. ✅ Search includes `BOARDING` (matches trip-details bookable)

### 04.5 — Optional applyTarget
1. Deferred to Phase 05 if needed

## Acceptance criteria

- [x] Mid-route seat reuse no longer false-sold-out vs seat map
- [x] Concurrent freezes cannot reserve beyond campaign budget
- [x] Changing payment method refreshes server quote; hold charge matches UI
- [x] BOARDING policy consistent between search and trip details

## Risks

- Occupancy change may increase available seats overnight — communicate to ops
- QuoteId adds UX for stale quote refresh

## Exit checklist

- [x] Concurrent unit tests for budget guard
- [ ] Search vs seat map QA on multi-stop trip (staging)

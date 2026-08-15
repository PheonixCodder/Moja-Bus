# Traveler-app Search / Booking / Auth Audit — Fix Tracker

Last updated: 2026-08-13  
Source: parity audit of traveler-app vs web (search, seat map, payments, guest login resume)

## Status legend

- `todo` — not started
- `doing` — in progress
- `done` — landed
- `wontfix` — deferred / accepted divergence

---

## Critical

| ID | Issue | Status | Notes |
|----|-------|--------|-------|
| C1 | Seat map 0-based vs API/layout 1-based; invented aisle; BLOCKED rendered as empty | `done` | `seat-grid.ts` + `passenger-seat-map.tsx` aligned with web |
| C2 | Paystack UI total omits convenience fee (`price × seats` vs `chargeAmountXOF`) | `done` | `getCheckoutPricing` + fee breakdown; booking refs on success |
| C3 | Load More replaces page instead of appending offers | `done` | `allOffers` accumulation in `search.tsx` |

## High

| ID | Issue | Status | Notes |
|----|-------|--------|-------|
| H1 | Wallet balance checked after `createHold` → orphaned hold | `done` | Pre-check + `releaseHold` on wallet/paystack init failure |
| H2 | Date strip omits municipality/quarter for `cheapestByDate` | `done` | `DateStrip` passes geo into `useCheapestByDate` |
| H3 | Home/search blocks valid same-city urban pairs; `validate-search-pair` unused | `done` | Web-parity validator; home + search wired |
| H4 | Paystack success navigates with payment ref, not booking refs | `done` | Prefer `createHold` / `verifyPayment` `MR-…` refs; never navigate with `moja_` Paystack ref (was still falling back to payment ref — caused "Failed to load ticket") |
| H5 | `pending-checkout` Zustand not persisted (lost on process death) | `done` | AsyncStorage via zustand `persist` + hydration gate |
| H6 | No operator filter UI; offer mapping drops `companyId` | `done` | Operators chips + `companyId` on offers |
| H7 | Passenger count up to 10 vs `createHold` max 6 | `done` | Cap at 6 in search form + route clamp |
| H8 | Web login resume drops selected seats | `done` | `seatIds` URL param + `BookingProvider` hydrate |
| H9 | Guest seat → login clears search from/to/results/sheets | `done` | Persist `search` snapshot + `returnTo` with query params; restore after hydrate |

## Medium

| ID | Issue | Status | Notes |
|----|-------|--------|-------|
| M1 | Default sort `CHEAPEST` vs web `BEST` | `done` | Default + sort sheet include `BEST` |
| M2 | No `getCityDetails` / `getGeoPlaceLabel` for deep links | `done` | Resolved when `fromText`/`toText` weak |
| M3 | Search state not synced to route | `done` | `router.setParams` when submitted |
| M4 | Offer card omits amenities, geo labels, remaining seats | `done` | Amenities chips, geo labels, remaining count |
| M5 | Seat sheet missing sold-out / error UX | `done` | Sold-out + error + retry |
| M6 | `PENDING_PAYMENT` detail: wallet retry only | `done` | Paystack button + WebView on booking detail |
| M7 | Dead `PaymentSheet` / `PaymentMethodSelector` | `done` | Deleted (live path = `PassengerFormSheet`) |
| M8 | Booking Paystack callback is web verify URL (fragile WebView) | `wontfix` | Deferred — WebView already intercepts `/api/payments/verify`; mobile-callback for booking is a larger payments change |
| M9 | No `releaseHold` on cancel/abort | `done` | Paystack cancel + sheet close releases active hold (mobile) |

## Low / info

| ID | Issue | Status | Notes |
|----|-------|--------|-------|
| L1 | Default payment method wallet (mobile) vs Paystack (web) | `wontfix` | Keep mobile WALLET default (zero-fee path) |
| L2 | Map is mobile-only enhancement | `wontfix` | Intentional |
| L3 | Deck handling hardcoded `deck: 1` on API | `wontfix` | Shared API limitation; layout builder always saves deck 1 today |

---

## Implementation order

1. ~~**C1** seat map parity~~  
2. ~~**C2** (+ H4) checkout pricing + booking refs on success~~  
3. ~~**C3** pagination accumulation~~  
4. ~~H1 wallet-before-hold~~  
5. ~~H2–H8~~  
6. ~~Medium cleanup~~  

## Verification checklist

- [x] Seat map places seats matching operator layout-builder (4-col 2+aisle+2) — code uses 1-based `buildSeatGrid`
- [x] BLOCKED seats visible and non-selectable
- [x] Checkout shows base + fee for Paystack; fee waived for wallet
- [x] Paystack charged amount matches displayed total (preview + hold snapshot)
- [x] Success screen uses booking reference (`MR-…`), never Paystack `moja_…`
- [x] Guest seat → login restores from/to/date + reopens passenger form
- [x] Load More appends page 2+ without dropping page 1
- [x] Criteria change (cities/date/filters/sort) resets accumulated list
- [x] Urban same-city pairs allowed when muni/quarter differ
- [x] Date strip uses geo for cheapest-by-date
- [x] Pending checkout survives process restart (AsyncStorage)
- [x] Operator filter from results
- [x] Passengers capped at 6
- [x] Web guest login restores selected seats via `seatIds`
- [ ] Manual device QA: book Paystack + wallet end-to-end (confirm REF is `MR-…` and boarding pass loads)
- [ ] Manual device QA: guest seat select → login → search fields + passenger sheet restore
- [ ] Manual device QA: urban layout with EMPTY_SPACE aisle column
- [ ] Manual device QA: kill app during login OTP and resume pending checkout

# Traveler App Search & Native Checkout Redesign Implementation Plan

## Objective
Fully redesign the complete search system in `@apps/traveler-app` (`app/(tabs)/search.tsx` and all components in `features/search/`), keeping `@apps/traveler-app/components/page-header.tsx` untouched. Upgrade the checkout flow to follow the `PaystackWebView` + Moja Wallet pattern from `app/wallet.tsx`, eliminating external web redirects.

---

## 1. Native Checkout Architecture (`PaystackWebView` & Wallet)

```
[SeatSelectionSheet] -> Select Seats -> [PassengerFormSheet]
                                                |
                                      `createHold` mutation
                                                |
                              +-----------------+-----------------+
                              |                                   |
                     (Moja Wallet Choice)              (Paystack Choice)
                              |                                   |
                  `checkoutWithWallet` mutation         `initiatePayment` mutation
                              |                                   |
                    Instant Confirmation              Launch `PaystackWebView` Modal
                              |                                   |
                              |                        Intercept Callback & Verify
                              |                                   |
                              +-----------------+-----------------+
                                                |
                                   Navigate `/booking/[reference]`
```

### Key Checkout Logic:
- `createHold` creates `HoldGroup` & `Booking` entries with 15-min expiration (`PENDING_PAYMENT`).
- **Moja Wallet Checkout**: `trpc.booking.checkoutWithWallet({ holdId })` executes double-entry debit with 0 XOF convenience fee.
- **Paystack Checkout**: `trpc.booking.initiatePayment({ holdId })` returns `authorizationUrl` & `reference`. `PaystackWebView` modal opens natively, intercepting callback redirects, verifying with `trpc.booking.verifyPayment`, and completing the booking.

---

## 2. Redesign Overview by Component

| File Path | Description of Redesign |
| :--- | :--- |
| `features/search/views/search-view.tsx` | Main search screen container with glassmorphic cards, floating filter/sort bar, smooth loading skeletons, and integrated modal states. |
| `features/search/components/search-form.tsx` | Redesigned search form card with vertical route connector line, 360° swap animation, date trigger, and tactile passenger counter pills. |
| `features/search/components/city-search-field.tsx` | Search modal with debounced tRPC city search, popular city chips, and region/commune badges. |
| `features/search/components/date-strip.tsx` | 7-day horizontal fare strip with cheapest price highlights and active date indicator rings. |
| `features/search/components/offer-card.tsx` | Bus offer card with operator branding avatar, badges (VIP/Express/AC), route timeline, seat availability pill, and price tag. |
| `features/search/components/seat-selection-sheet.tsx` | Interactive bus layout grid (Window/Aisle/Driver), legend status badges, selection counter, and sticky bottom checkout bar. |
| `features/search/components/passenger-form-sheet.tsx` | Multi-passenger card forms with saved passenger prefill dropdown, payment option selector (Wallet vs Paystack), and integrated `PaystackWebView` modal runner. |
| `features/search/components/filters-sheet.tsx` | Native bottom sheet filter drawer with multi-select chips for operators, amenities, departure times, and price controls. |
| `features/search/components/sort-sheet.tsx` | Polished bottom sheet for sorting by Cheapest, Fastest, Earliest, Latest, and Most Available. |
| `features/search/components/search-empty-state.tsx` | High-fidelity empty state card with popular route quick-booking shortcuts. |
| `features/search/components/search-skeleton.tsx` | Animated shimmer skeleton cards for search loading states. |

---

## 3. Execution Phases

1. **Phase 1: Native Checkout Engine in `PassengerFormSheet`**: Integrate `createHold`, `checkoutWithWallet`, `initiatePayment`, `verifyPayment`, and `PaystackWebView`.
2. **Phase 2: Core Search Components Redesign**: `SearchForm`, `CitySearchField`, `DateStrip`, `OfferCard`, `SearchSkeleton`, `SearchEmptyState`.
3. **Phase 3: Interactive Sheets Redesign**: `SeatSelectionSheet`, `PassengerFormSheet`, `FiltersSheet`, `SortSheet`.
4. **Phase 4: Main View Integration & Verification**: `SearchView` in `search-view.tsx`. Run checks to verify TypeScript compilation & design excellence.

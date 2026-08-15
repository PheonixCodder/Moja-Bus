# Traveler App Internationalization & Styling Tracker

> Tracker for all UI components in `@apps/traveler-app/` — i18n coverage (FR/EN) and styling approach (NativeWind/Tailwind vs. native `StyleSheet`/`style`).
> Last updated: 2026-08-12 (re-audited — source files + locale files read directly)

## Legend

| Symbol | Meaning |
|--------|---------|
| `✓ EN+FR` | Uses `t()` and all referenced keys exist in both `en` and `fr` locale files |
| `Partial` | Uses `t()` for some strings but still contains hardcoded English UI text |
| `✗ (hardcoded EN)` | No i18n — all user-facing strings are hardcoded English |
| `Wrapper` | Thin screen wrapper / re-export — no UI text of its own |
| `NativeWind` | Styling via `className` (Tailwind/NativeWind) |
| `Native` | Styling via `StyleSheet` or inline `style={{...}}` |
| `Hybrid` | Mix of both `className` and `style` |
| `—` | No styling (logic-only or wrapper) |

> **Note:** The traveler app uses a single codebase with i18next namespaces (`common`, `settings`, `auth`, `wallet`, `notifications`, `booking`, `search`, `operators`, `home`) loaded from `apps/traveler-app/locales/{en,fr}/*.json`. Unlike the web app, there are no per-component FR/EN files — a component "has" French/English when it renders through `t()` and the keys exist in both locale files.

---


## app (20 files)

| # | Component | Path | i18n (FR/EN) | Styling |
|---|-----------|------|--------------|---------|
| 1 | _layout | `app/_layout.tsx` | Wrapper | — |
| 2 | +html | `app/+html.tsx` | Wrapper | NativeWind |
| 3 | +not-found | `app/+not-found.tsx` | ✓ EN+FR | — |
| 4 | [slug] | `app/article/[slug].tsx` | ✓ EN+FR | Hybrid |
| 5 | index | `app/booking/[reference]/index.tsx` | Wrapper | Hybrid |
| 6 | success | `app/booking/success.tsx` | Wrapper | Hybrid |
| 7 | help-support | `app/help-support.tsx` | Wrapper | — |
| 8 | index | `app/index.tsx` | Wrapper | — |
| 9 | language | `app/language.tsx` | ✓ EN+FR | Hybrid |
| 10 | notifications | `app/notifications.tsx` | Wrapper | — |
| 11 | _layout | `app/operators/_layout.tsx` | Wrapper | — |
| 12 | [slug] | `app/operators/[slug].tsx` | Wrapper | Hybrid |
| 13 | index | `app/operators/index.tsx` | Wrapper | Hybrid |
| 14 | passengers | `app/passengers.tsx` | Wrapper | — |
| 15 | personal-info | `app/personal-info.tsx` | Wrapper | — |
| 16 | privacy-security | `app/privacy-security.tsx` | Wrapper | — |
| 17 | reviews | `app/reviews.tsx` | Wrapper | — |
| 18 | terms-privacy | `app/terms-privacy.tsx` | Wrapper | — |
| 19 | index | `app/ticket/[token]/index.tsx` | Wrapper | Hybrid |
| 20 | wallet | `app/wallet.tsx` | Wrapper | — |

## app/(auth) (1 files)

| # | Component | Path | i18n (FR/EN) | Styling |
|---|-----------|------|--------------|---------|
| 1 | login | `app/(auth)/login.tsx` | Wrapper | — |

## app/(tabs) (6 files)

| # | Component | Path | i18n (FR/EN) | Styling |
|---|-----------|------|--------------|---------|
| 1 | _layout | `app/(tabs)/_layout.tsx` | ✓ EN+FR | Hybrid |
| 2 | bookings | `app/(tabs)/bookings.tsx` | ✓ EN+FR | Hybrid |
| 3 | index | `app/(tabs)/index.tsx` | Wrapper | Hybrid |
| 4 | search | `app/(tabs)/search.tsx` | Wrapper | Hybrid |
| 5 | settings | `app/(tabs)/settings.tsx` | Wrapper | Hybrid |
| 6 | tickets | `app/(tabs)/tickets.tsx` | ✓ EN+FR | Hybrid |

## components (4 files)

| # | Component | Path | i18n (FR/EN) | Styling |
|---|-----------|------|--------------|---------|
| 1 | custom-alert | `components/custom-alert.tsx` | Wrapper | NativeWind |
| 2 | notification-bell | `components/notification-bell.tsx` | Wrapper | Hybrid |
| 3 | page-header | `components/page-header.tsx` | Wrapper | Hybrid |
| 4 | subpage-header | `components/subpage-header.tsx` | Wrapper | Hybrid |

## components/ui (32 files)

| # | Component | Path | i18n (FR/EN) | Styling |
|---|-----------|------|--------------|---------|
| 1 | accordion | `components/ui/accordion.tsx` | Wrapper | NativeWind |
| 2 | alert-dialog | `components/ui/alert-dialog.tsx` | Wrapper | NativeWind |
| 3 | alert | `components/ui/alert.tsx` | Wrapper | NativeWind |
| 4 | aspect-ratio | `components/ui/aspect-ratio.tsx` | Wrapper | — |
| 5 | avatar | `components/ui/avatar.tsx` | Wrapper | NativeWind |
| 6 | badge | `components/ui/badge.tsx` | Wrapper | NativeWind |
| 7 | button | `components/ui/button.tsx` | Wrapper | NativeWind |
| 8 | card | `components/ui/card.tsx` | Wrapper | NativeWind |
| 9 | checkbox | `components/ui/checkbox.tsx` | Wrapper | NativeWind |
| 10 | collapsible | `components/ui/collapsible.tsx` | Wrapper | — |
| 11 | context-menu | `components/ui/context-menu.tsx` | Wrapper | NativeWind |
| 12 | dialog | `components/ui/dialog.tsx` | Wrapper | NativeWind |
| 13 | dropdown-menu | `components/ui/dropdown-menu.tsx` | Wrapper | NativeWind |
| 14 | hover-card | `components/ui/hover-card.tsx` | Wrapper | NativeWind |
| 15 | icon | `components/ui/icon.tsx` | Wrapper | NativeWind |
| 16 | input | `components/ui/input.tsx` | Wrapper | NativeWind |
| 17 | label | `components/ui/label.tsx` | Wrapper | NativeWind |
| 18 | menubar | `components/ui/menubar.tsx` | Wrapper | NativeWind |
| 19 | native-only-animated-view | `components/ui/native-only-animated-view.tsx` | Wrapper | — |
| 20 | popover | `components/ui/popover.tsx` | Wrapper | NativeWind |
| 21 | progress | `components/ui/progress.tsx` | Wrapper | Hybrid |
| 22 | radio-group | `components/ui/radio-group.tsx` | Wrapper | NativeWind |
| 23 | select | `components/ui/select.tsx` | Wrapper | NativeWind |
| 24 | separator | `components/ui/separator.tsx` | Wrapper | NativeWind |
| 25 | skeleton | `components/ui/skeleton.tsx` | Wrapper | NativeWind |
| 26 | switch | `components/ui/switch.tsx` | Wrapper | NativeWind |
| 27 | tabs | `components/ui/tabs.tsx` | Wrapper | NativeWind |
| 28 | text | `components/ui/text.tsx` | Wrapper | NativeWind |
| 29 | textarea | `components/ui/textarea.tsx` | Wrapper | NativeWind |
| 30 | toggle-group | `components/ui/toggle-group.tsx` | Wrapper | NativeWind |
| 31 | toggle | `components/ui/toggle.tsx` | Wrapper | NativeWind |
| 32 | tooltip | `components/ui/tooltip.tsx` | Wrapper | NativeWind |

## features/auth (4 files)

| # | Component | Path | i18n (FR/EN) | Styling |
|---|-----------|------|--------------|---------|
| 1 | auth-button | `features/auth/components/auth-button.tsx` | Wrapper | NativeWind |
| 2 | auth-field | `features/auth/components/auth-field.tsx` | Wrapper | NativeWind |
| 3 | auth-shell | `features/auth/components/auth-shell.tsx` | ✓ EN+FR | NativeWind |
| 4 | login | `features/auth/screens/login.tsx` | ✓ EN+FR | Hybrid |

## features/booking (26 files)

| # | Component | Path | i18n (FR/EN) | Styling |
|---|-----------|------|--------------|---------|
| 1 | amenities-list | `features/booking/components/amenities-list.tsx` | Wrapper | NativeWind |
| 2 | booking-card | `features/booking/components/booking-card.tsx` | ✓ EN+FR | NativeWind |
| 3 | booking-empty-state | `features/booking/components/booking-empty-state.tsx` | ✓ EN+FR | NativeWind |
| 4 | booking-filter-tabs | `features/booking/components/booking-filter-tabs.tsx` | ✓ EN+FR | NativeWind |
| 5 | booking-kpi-strip | `features/booking/components/booking-kpi-strip.tsx` | ✓ EN+FR | NativeWind |
| 6 | booking-list-skeleton | `features/booking/components/booking-list-skeleton.tsx` | Wrapper | NativeWind |
| 7 | booking-route-map | `features/booking/components/booking-route-map.tsx` | ✓ EN+FR | NativeWind |
| 8 | booking-status-badge | `features/booking/components/booking-status-badge.tsx` | ✓ EN+FR | NativeWind |
| 9 | cancel-dialog-sheet | `features/booking/components/cancel-dialog-sheet.tsx` | Wrapper | — |
| 10 | cancel-dialog | `features/booking/components/cancel-dialog.tsx` | ✓ EN+FR | Hybrid |
| 11 | digital-ticket-card | `features/booking/components/digital-ticket-card.tsx` | ✓ EN+FR | NativeWind |
| 12 | hold-countdown | `features/booking/components/hold-countdown.tsx` | Wrapper | NativeWind |
| 13 | passenger-seat-map | `features/booking/components/passenger-seat-map.tsx` | ✓ EN+FR | NativeWind |
| 14 | payment-method-selector | `features/booking/components/payment-method-selector.tsx` | ✓ EN+FR | NativeWind |
| 15 | payment-sheet | `features/booking/components/payment-sheet.tsx` | ✓ EN+FR | NativeWind |
| 16 | review-sheet | `features/booking/components/review-sheet.tsx` | ✓ EN+FR | NativeWind |
| 17 | review-stars | `features/booking/components/review-stars.tsx` | Wrapper | NativeWind |
| 18 | ticket-empty-state | `features/booking/components/ticket-empty-state.tsx` | ✓ EN+FR | NativeWind |
| 19 | ticket-list-skeleton | `features/booking/components/ticket-list-skeleton.tsx` | Wrapper | NativeWind |
| 20 | ticket-sheet | `features/booking/components/ticket-sheet.tsx` | ✓ EN+FR | Hybrid |
| 21 | trip-summary-card | `features/booking/components/trip-summary-card.tsx` | ✓ EN+FR | NativeWind |
| 22 | booking-detail | `features/booking/screens/booking-detail.tsx` | ✓ EN+FR | NativeWind |
| 23 | booking-success | `features/booking/screens/booking-success.tsx` | ✓ EN+FR | Hybrid |
| 24 | bookings | `features/booking/screens/bookings.tsx` | Wrapper | NativeWind |
| 25 | ticket | `features/booking/screens/ticket.tsx` | Wrapper | — |
| 26 | tickets | `features/booking/screens/tickets.tsx` | Wrapper | NativeWind |

## features/home (8 files)

| # | Component | Path | i18n (FR/EN) | Styling |
|---|-----------|------|--------------|---------|
| 1 | active-trip-card | `features/home/components/active-trip-card.tsx` | ✓ EN+FR | NativeWind |
| 2 | blog-news-section | `features/home/components/blog-news-section.tsx` | ✓ EN+FR | NativeWind |
| 3 | featured-operators-section | `features/home/components/featured-operators-section.tsx` | ✓ EN+FR | NativeWind |
| 4 | home-header | `features/home/components/home-header.tsx` | ✓ EN+FR | NativeWind |
| 5 | home-search-widget | `features/home/components/home-search-widget.tsx` | ✓ EN+FR | NativeWind |
| 6 | popular-routes-grid | `features/home/components/popular-routes-grid.tsx` | ✓ EN+FR | NativeWind |
| 7 | promo-banner-carousel | `features/home/components/promo-banner-carousel.tsx` | ✓ EN+FR | Hybrid |
| 8 | home | `features/home/screens/home.tsx` | Wrapper | NativeWind |

## features/operators (7 files)

| # | Component | Path | i18n (FR/EN) | Styling |
|---|-----------|------|--------------|---------|
| 1 | operator-card | `features/operators/components/operator-card.tsx` | ✓ EN+FR | Hybrid |
| 2 | operator-overview-tab | `features/operators/components/operator-overview-tab.tsx` | ✓ EN+FR | Hybrid |
| 3 | operator-reviews-tab | `features/operators/components/operator-reviews-tab.tsx` | ✓ EN+FR | NativeWind |
| 4 | operator-routes-tab | `features/operators/components/operator-routes-tab.tsx` | ✓ EN+FR | Hybrid |
| 5 | operator-terminals-tab | `features/operators/components/operator-terminals-tab.tsx` | ✓ EN+FR | Hybrid |
| 6 | operator-profile | `features/operators/screens/operator-profile.tsx` | ✓ EN+FR | Hybrid |
| 7 | operators-list | `features/operators/screens/operators-list.tsx` | ✓ EN+FR | Hybrid |

## features/search (12 files)

| # | Component | Path | i18n (FR/EN) | Styling |
|---|-----------|------|--------------|---------|
| 1 | city-search-field | `features/search/components/city-search-field.tsx` | ✓ EN+FR | Hybrid |
| 2 | date-strip | `features/search/components/date-strip.tsx` | ✓ EN+FR | NativeWind |
| 3 | filters-sheet | `features/search/components/filters-sheet.tsx` | ✓ EN+FR | Hybrid |
| 4 | offer-card | `features/search/components/offer-card.tsx` | ✓ EN+FR | NativeWind |
| 5 | passenger-form-sheet | `features/search/components/passenger-form-sheet.tsx` | ✓ EN+FR | Hybrid |
| 6 | search-empty-state | `features/search/components/search-empty-state.tsx` | ✓ EN+FR | Hybrid |
| 7 | search-form | `features/search/components/search-form.tsx` | ✓ EN+FR | NativeWind |
| 8 | search-map-view | `features/search/components/search-map-view.tsx` | Wrapper | NativeWind |
| 9 | search-skeleton | `features/search/components/search-skeleton.tsx` | Wrapper | NativeWind |
| 10 | seat-selection-sheet | `features/search/components/seat-selection-sheet.tsx` | ✓ EN+FR | Hybrid |
| 11 | sort-sheet | `features/search/components/sort-sheet.tsx` | ✓ EN+FR | Hybrid |
| 12 | search | `features/search/screens/search.tsx` | ✓ EN+FR | Hybrid |

## features/settings (27 files)

| # | Component | Path | i18n (FR/EN) | Styling |
|---|-----------|------|--------------|---------|
| 1 | account-settings-list | `features/settings/components/account-settings-list.tsx` | ✓ EN+FR | NativeWind |
| 2 | balance-allocation | `features/settings/components/balance-allocation.tsx` | ✓ EN+FR | Hybrid |
| 3 | danger-zone-row | `features/settings/components/danger-zone-row.tsx` | ✓ EN+FR | NativeWind |
| 4 | passenger-card | `features/settings/components/passenger-card.tsx` | Wrapper | Hybrid |
| 5 | passenger-delete-sheet | `features/settings/components/passenger-delete-sheet.tsx` | ✓ EN+FR | Hybrid |
| 6 | passenger-form-sheet | `features/settings/components/passenger-form-sheet.tsx` | ✓ EN+FR | Hybrid |
| 7 | paystack-webview | `features/settings/components/paystack-webview.tsx` | ✓ EN+FR | Hybrid |
| 8 | personal-info-avatar | `features/settings/components/personal-info-avatar.tsx` | ✓ EN+FR | NativeWind |
| 9 | personal-info-form | `features/settings/components/personal-info-form.tsx` | ✓ EN+FR | NativeWind |
| 10 | profile-hero | `features/settings/components/profile-hero.tsx` | ✓ EN+FR | NativeWind |
| 11 | settings-details | `features/settings/components/settings-details.tsx` | ✓ EN+FR | NativeWind |
| 12 | topup-button | `features/settings/components/topup-button.tsx` | ✓ EN+FR | NativeWind |
| 13 | topup-dialog | `features/settings/components/topup-dialog.tsx` | ✓ EN+FR | NativeWind |
| 14 | transaction-history | `features/settings/components/transaction-history.tsx` | ✓ EN+FR | NativeWind |
| 15 | transaction-list | `features/settings/components/transaction-list.tsx` | ✓ EN+FR | NativeWind |
| 16 | travel-benefits | `features/settings/components/travel-benefits.tsx` | ✓ EN+FR | NativeWind |
| 17 | wallet-card | `features/settings/components/wallet-card.tsx` | ✓ EN+FR | NativeWind |
| 18 | wallet-protection | `features/settings/components/wallet-protection.tsx` | ✓ EN+FR | Hybrid |
| 19 | help-support | `features/settings/screens/help-support.tsx` | ✓ EN+FR | Hybrid |
| 20 | notifications | `features/settings/screens/notifications.tsx` | ✓ EN+FR | Hybrid |
| 21 | passengers | `features/settings/screens/passengers.tsx` | ✓ EN+FR | Hybrid |
| 22 | personal-info | `features/settings/screens/personal-info.tsx` | ✓ EN+FR | NativeWind |
| 23 | privacy-security | `features/settings/screens/privacy-security.tsx` | ✓ EN+FR | Hybrid |
| 24 | reviews | `features/settings/screens/reviews.tsx` | ✓ EN+FR | Hybrid |
| 25 | settings | `features/settings/screens/settings.tsx` | ✓ EN+FR | Hybrid |
| 26 | terms-privacy | `features/settings/screens/terms-privacy.tsx` | ✓ EN+FR | Hybrid |
| 27 | wallet | `features/settings/screens/wallet.tsx` | ✓ EN+FR | Hybrid |

## lib (1 files)

| # | Component | Path | i18n (FR/EN) | Styling |
|---|-----------|------|--------------|---------|
| 1 | trpc | `lib/trpc.tsx` | Wrapper | — |

---

## Summary

| Feature Area | File Count |
|-------------|------------|
| app | 20 |
| app/(auth) | 1 |
| app/(tabs) | 6 |
| components | 4 |
| components/ui | 32 |
| features/auth | 4 |
| features/booking | 26 |
| features/home | 8 |
| features/operators | 7 |
| features/search | 12 |
| features/settings | 27 |
| lib | 1 |
| **Total** | **148** |

### i18n Status

| Status | Count |
|--------|-------|
| Fully translated (✓ EN+FR) | 40 |
| Partial (t() + hardcoded English strings) | 0 |
| Hardcoded English only (✗) | 1 |
| Missing locale keys referenced in code | 0 |
| Wrapper / re-export (no UI text) | 107 |

### Styling Approach

| Approach | Count |
|----------|-------|
| NativeWind (Tailwind className) | 83 |
| Native (StyleSheet / inline style) | 0 |
| Hybrid (className + style) | 51 |
| None (logic-only / wrapper) | 14 |

---

## Missing Locale Keys Referenced in Code

None — all keys exist in both `en` and `fr` locale files.

## Files with Partial i18n

None — all non-wrapper UI components are fully internationalized.

## Files with ✗ (hardcoded EN only)

| File | Details |
|------|---------|
| `components/ui/dialog.tsx` | `<Text className="sr-only">Close</Text>` — screen-reader accessibility text only |

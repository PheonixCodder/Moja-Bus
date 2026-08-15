# Implementation Plan: Traveler App Folder Structure Refactoring

Refactor the file and folder structure of `apps/traveler-app` to strictly align with the architectural patterns and thin-routing standards of `design-reference/folder-structure-reference`, without using a `src/` wrapper directory.

---

## 🎯 Architectural Goals & Boundaries

1. **No `src/` wrapper**: Keep root level directories as `app/`, `features/`, `components/`, `hooks/`, `lib/`, `locales/`, `types/`, `constants/` directly under `apps/traveler-app/`.
2. **`views/` $\rightarrow$ `screens/` Migration**: Move all screen implementation views in `features/<domain>/views/` to `features/<domain>/screens/` to mirror `folder-structure-reference`.
3. **Paper-Thin Routes (`app/`)**: Standardize every route inside `app/` so it acts purely as a thin 5-line router wrapper pointing directly to screen components inside `features/<domain>/screens/`.
4. **Zero Functional/Logic Changes**: Absolutely no code changes are made to application logic, JSX structures, styling, state management, or hooks. **Only file locations and import paths are updated**.
5. **100% Complete File Coverage**: Every single file across `app/`, `features/`, `components/`, `hooks/`, `lib/`, `locales/`, `constants/`, and `types/` is accounted for.

---

## 📁 Complete File Audit & Mapping

### 1. `features/` Layer Refactoring (`views/` $\rightarrow$ `screens/` & `components/`)

| Current File Path | New Refactored File Path | Purpose |
| :--- | :--- | :--- |
| `features/auth/views/login-view.tsx` | `features/auth/screens/login.tsx` | Auth Login Screen |
| `features/booking/views/booking-detail-view.tsx` | `features/booking/screens/booking-detail.tsx` | Booking Detail Screen |
| `features/booking/views/booking-success-view.tsx` | `features/booking/screens/booking-success.tsx` | Booking Success Screen |
| `features/booking/views/bookings-view.tsx` | `features/booking/screens/bookings.tsx` | Bookings List Screen |
| `features/booking/views/ticket-view.tsx` | `features/booking/screens/ticket.tsx` | Ticket Screen |
| `features/booking/views/tickets-view.tsx` | `features/booking/screens/tickets.tsx` | Active Tickets Screen |
| `features/booking/views/cancel-dialog.tsx` | `features/booking/components/cancel-dialog-sheet.tsx` | Cancel Dialog Sheet |
| `features/booking/views/payment-sheet.tsx` | `features/booking/components/payment-sheet.tsx` | Payment Modal Sheet |
| `features/booking/views/review-sheet.tsx` | `features/booking/components/review-sheet.tsx` | Rating Review Sheet |
| `features/home/views/home-view.tsx` | `features/home/screens/home.tsx` | Home Dashboard Screen |
| `features/operators/views/operator-profile-view.tsx` | `features/operators/screens/operator-profile.tsx` | Operator Profile Screen |
| `features/operators/views/operators-list-view.tsx` | `features/operators/screens/operators-list.tsx` | Operators Directory Screen |
| `features/search/views/search-view.tsx` | `features/search/screens/search.tsx` | Trip Search Screen |
| `features/settings/views/help-support-view.tsx` | `features/settings/screens/help-support.tsx` | Help & Support Screen |
| `features/settings/views/notifications-view.tsx` | `features/settings/screens/notifications.tsx` | Notifications Settings Screen |
| `features/settings/views/passengers-view.tsx` | `features/settings/screens/passengers.tsx` | Saved Passengers Screen |
| `features/settings/views/personal-info-view.tsx` | `features/settings/screens/personal-info.tsx` | Personal Info Screen |
| `features/settings/views/privacy-security-view.tsx` | `features/settings/screens/privacy-security.tsx` | Privacy & Security Screen |
| `features/settings/views/reviews-view.tsx` | `features/settings/screens/reviews.tsx` | Passenger Reviews Screen |
| `features/settings/views/settings-view.tsx` | `features/settings/screens/settings.tsx` | Main Settings Screen |
| `features/settings/views/terms-privacy-view.tsx` | `features/settings/screens/terms-privacy.tsx` | Terms & Privacy Screen |
| `features/settings/views/wallet-view.tsx` | `features/settings/screens/wallet.tsx` | Wallet Dashboard Screen |

---

### 2. `app/` Thin Route Layer Mapping

All route files under `app/` will be updated to be paper-thin exports pointing to `features/*/screens/*`:

- `app/_layout.tsx` $\rightarrow$ Root App Layout & Providers
- `app/index.tsx` $\rightarrow$ Root Redirect Entry Point
- `app/+html.tsx` $\rightarrow$ Expo Web HTML Template
- `app/+not-found.tsx` $\rightarrow$ 404 Screen
- `app/(auth)/login.tsx` $\rightarrow$ Thin wrapper around `features/auth/screens/login.tsx`
- `app/(tabs)/_layout.tsx` $\rightarrow$ Bottom Tab Bar Layout
- `app/(tabs)/index.tsx` $\rightarrow$ Thin wrapper around `features/home/screens/home.tsx`
- `app/(tabs)/search.tsx` $\rightarrow$ Thin wrapper around `features/search/screens/search.tsx`
- `app/(tabs)/bookings.tsx` $\rightarrow$ Thin wrapper around `features/booking/screens/bookings.tsx`
- `app/(tabs)/tickets.tsx` $\rightarrow$ Thin wrapper around `features/booking/screens/tickets.tsx`
- `app/(tabs)/settings.tsx` $\rightarrow$ Thin wrapper around `features/settings/screens/settings.tsx`
- `app/article/[slug].tsx` $\rightarrow$ Blog Article Route
- `app/booking/[reference]/index.tsx` $\rightarrow$ Thin wrapper around `features/booking/screens/booking-detail.tsx`
- `app/booking/success.tsx` $\rightarrow$ Thin wrapper around `features/booking/screens/booking-success.tsx`
- `app/ticket/[token]/index.tsx` $\rightarrow$ Thin wrapper around `features/booking/screens/ticket.tsx`
- `app/operators/_layout.tsx` $\rightarrow$ Operators Stack Layout
- `app/operators/index.tsx` $\rightarrow$ Thin wrapper around `features/operators/screens/operators-list.tsx`
- `app/operators/[slug].tsx` $\rightarrow$ Thin wrapper around `features/operators/screens/operator-profile.tsx`
- `app/wallet.tsx` $\rightarrow$ Thin wrapper around `features/settings/screens/wallet.tsx`
- `app/passengers.tsx` $\rightarrow$ Thin wrapper around `features/settings/screens/passengers.tsx`
- `app/personal-info.tsx` $\rightarrow$ Thin wrapper around `features/settings/screens/personal-info.tsx`
- `app/privacy-security.tsx` $\rightarrow$ Thin wrapper around `features/settings/screens/privacy-security.tsx`
- `app/reviews.tsx` $\rightarrow$ Thin wrapper around `features/settings/screens/reviews.tsx`
- `app/terms-privacy.tsx` $\rightarrow$ Thin wrapper around `features/settings/screens/terms-privacy.tsx`
- `app/help-support.tsx` $\rightarrow$ Thin wrapper around `features/settings/screens/help-support.tsx`
- `app/notifications.tsx` $\rightarrow$ Thin wrapper around `features/settings/screens/notifications.tsx`
- `app/language.tsx` $\rightarrow$ Language Selection Route

---

### 3. Preserved Component & Feature Files Audit

#### `features/auth/`
- `components/auth-button.tsx`
- `components/auth-field.tsx`
- `components/auth-shell.tsx`

#### `features/booking/`
- `components/amenities-list.tsx`
- `components/booking-card.tsx`
- `components/booking-empty-state.tsx`
- `components/booking-filter-tabs.tsx`
- `components/booking-kpi-strip.tsx`
- `components/booking-list-skeleton.tsx`
- `components/booking-route-map.tsx`
- `components/booking-status-badge.tsx`
- `components/digital-ticket-card.tsx`
- `components/hold-countdown.tsx`
- `components/passenger-seat-map.tsx`
- `components/payment-method-selector.tsx`
- `components/review-stars.tsx`
- `components/ticket-empty-state.tsx`
- `components/ticket-list-skeleton.tsx`
- `components/ticket-sheet.tsx`
- `components/trip-summary-card.tsx`
- `hooks/use-booking-actions.ts`
- `hooks/use-booking-prefetch.ts`
- `hooks/use-bookings.ts`
- `hooks/use-dashboard-stats.ts`
- `hooks/use-hold-countdown.ts`
- `hooks/use-reviews.ts`
- `hooks/use-seat-availability.ts`
- `lib/format-time.ts`

#### `features/home/`
- `components/active-trip-card.tsx`
- `components/blog-news-section.tsx`
- `components/featured-operators-section.tsx`
- `components/home-header.tsx`
- `components/home-search-widget.tsx`
- `components/popular-routes-grid.tsx`
- `components/promo-banner-carousel.tsx`
- `hooks/use-home-data.ts`
- `constants.ts`
- `types.ts`

#### `features/operators/`
- `components/operator-card.tsx`
- `components/operator-overview-tab.tsx`
- `components/operator-reviews-tab.tsx`
- `components/operator-routes-tab.tsx`
- `components/operator-terminals-tab.tsx`

#### `features/search/`
- `components/city-search-field.tsx`
- `components/date-strip.tsx`
- `components/filters-sheet.tsx`
- `components/offer-card.tsx`
- `components/passenger-form-sheet.tsx`
- `components/search-empty-state.tsx`
- `components/search-form.tsx`
- `components/search-map-view.tsx`
- `components/search-skeleton.tsx`
- `components/seat-selection-sheet.tsx`
- `components/sort-sheet.tsx`
- `hooks/use-cheapest-by-date.ts`
- `hooks/use-debounce.ts`
- `hooks/use-search-cities.ts`
- `hooks/use-search-filters.ts`
- `hooks/use-search-trips.ts`
- `lib/constants.ts`
- `lib/format.ts`
- `lib/validate-search-pair.ts`
- `types.ts`

#### `features/settings/`
- `components/account-settings-list.tsx`
- `components/balance-allocation.tsx`
- `components/danger-zone-row.tsx`
- `components/passenger-card.tsx`
- `components/passenger-delete-sheet.tsx`
- `components/passenger-form-sheet.tsx`
- `components/paystack-webview.tsx`
- `components/personal-info-avatar.tsx`
- `components/personal-info-form.tsx`
- `components/profile-hero.tsx`
- `components/settings-details.tsx`
- `components/topup-button.tsx`
- `components/topup-dialog.tsx`
- `components/transaction-history.tsx`
- `components/transaction-list.tsx`
- `components/travel-benefits.tsx`
- `components/wallet-card.tsx`
- `components/wallet-protection.tsx`

#### `components/` UI & Shared Layer
- `components/custom-alert.tsx`
- `components/notification-bell.tsx`
- `components/page-header.tsx`
- `components/subpage-header.tsx`
- `components/ui/*` (36 primitives)

#### `hooks/`
- `use-load-fonts.ts`
- `use-passengers.ts`
- `use-personal-info.ts`
- `use-push-token.ts`
- `use-reviews.ts`
- `use-screen-transition.ts`
- `use-wallet.ts`

#### `lib/`
- `auth-client.ts`
- `format-location-label.ts`
- `i18n.ts`
- `posthog.ts`
- `theme.ts`
- `trpc.tsx`
- `user-helpers.ts`
- `utils.ts`

#### `locales/`
- `en/*.json`
- `fr/*.json`

#### `constants/`, `types/`
- `constants/theme.ts`
- `types/i18n.d.ts`

---

## 🛠️ Execution Plan & Steps

### Step 1: Create `screens/` Directories & Move Views
Create `screens/` directory inside each feature folder (`features/auth/screens`, `features/booking/screens`, `features/home/screens`, `features/operators/screens`, `features/search/screens`, `features/settings/screens`) and relocate all view files. Remove old `views/` directories once emptied.

### Step 2: Update All Imports
Update relative and aliased imports across all modified screen files, components, and routes to point to `@/features/<domain>/screens/...`.

### Step 3: Verify TypeScript Compilation
Run `npx tsc --noEmit` on `apps/traveler-app` to guarantee zero compilation errors or broken imports.

---

## 🧪 Verification Plan

### Automated Verification
Run full TypeScript type checking:
```bash
cd C:\dev\moja-buss\apps\traveler-app && npx tsc --noEmit
```

### Manual Verification
- Verify Expo Router navigation compiles and all screens (tabs, search, booking details, settings, wallet) render properly without missing import runtime errors.

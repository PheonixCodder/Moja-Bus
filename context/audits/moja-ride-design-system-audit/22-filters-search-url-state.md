# Moja Ride Design & Design-Engineering Audit
## 22. Filters, Search & URL State Management

### 1. The Role of URL State in Operational Interfaces

In modern dashboard and search systems (benchmarked against Linear, Vercel, and GitHub), all filter, search, date range, pagination, and drawer selection states must be synchronized to the URL query string:
- **Shareability**: A station manager can copy a URL showing all "Delayed Departures for Today" and send it directly to dispatch via WhatsApp or email.
- **Persistence**: Refreshing the browser or pressing "Back" preserves the exact filter state without resetting the user's workflow.
- **Deep Linking**: Direct links to specific item drawers (e.g. `?detail=booking_123` or `?manifest=trip_456`).

---

### 2. Implementation Audit: `nuqs` Adoption

Moja Ride utilizes `nuqs` (type-safe search params for Next.js) extensively across `apps/web`.
- In `apps/web/app/[locale]/layout.tsx`: Properly wraps the entire tree in `<NuqsAdapter>`.
- In `apps/web/features/operator/lib/bookings/booking-search-params.ts`:
  ```ts
  export const bookingListParsers = {
    filter: parseAsStringLiteral(["today", "upcoming", "past"] as const).withDefault("today"),
    q: parseAsString.withDefault(""),
    status: parseAsStringLiteral(["ALL", "PENDING_PAYMENT", "CONFIRMED", "CANCELLED", "EXPIRED", "COMPLETED"] as const).withDefault("ALL"),
    tripId: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
    detail: parseAsString.withDefault(""),
  };
  export const bookingListParamsCache = createSearchParamsCache(bookingListParsers);
  ```
- **Evaluation**: **Excellent architectural decision**. Using server-side caching (`createSearchParamsCache`) combined with client hooks (`useQueryStates`) ensures seamless hydration without layout shift.

---

### 3. Filter UX & Interaction Anti-Patterns

#### 3.1 Hardcoded French Locale in Date Range Picker
In `apps/web/features/admin/components/withdrawals-filter-bar.tsx` lines 21, 91:
```tsx
import { fr } from "date-fns/locale";
...
format(new Date(from), "dd MMM, y", { locale: fr })
```
- **The Bug**: The date formatting hardcodes the French locale `{ locale: fr }`.
- **The Impact**: Even if an English-speaking platform administrator selects English as their system language, date filters continue to display French month names (e.g. `12 févr. 2026 - 18 mars 2026`).
- **Remediation**: Pass the active Next-Intl locale into date formatting functions dynamically.

#### 3.2 Search Debouncing Inconsistencies
- In `operator-bookings-view.tsx`: Uses custom `useDebounce(q, 300)`.
- In `search-filters-sidebar.tsx`: Triggers immediate URL updates on checkbox toggles (`shallow: false`), causing multiple quick tRPC network requests when users rapidly click multiple amenities or carrier checkboxes.
- **Recommendation**: Standardize search input debouncing at 300ms across all filter inputs, while batching multi-select filters.

#### 3.3 Missing Filter Reset Affordance
- In several filter toolbars (e.g. `admin-staff-filters-toolbar.tsx`, `staff-filters-toolbar.tsx`), when multiple filters are active (Status, Role, Search query), there is **no "Clear Filters" or "Reset" button**.
- To clear filters, the operator must manually click each dropdown, scroll to "All", and backspace out their search text.

---

### 4. Filter System Scorecard

| Dimension | Score | Comments |
| :--- | :---: | :--- |
| **URL State Synchronization** | `9.0 / 10` | Best-in-class `nuqs` integration across web views. |
| **Shareability & Deep Linking** | `8.5 / 10` | Drawer and manifest deep-links work reliably. |
| **Localization Parity** | `4.0 / 10` | Date formatters hardcode French locale, ignoring English users. |
| **Reset & Recovery UX** | `5.0 / 10` | Lacks one-tap "Clear All" affordance on several operational toolbars. |

---

### 5. Recommendations for Filters & Search

1. **Remove Hardcoded `{ locale: fr }`**:
   Replace static date-fns imports with dynamic locale resolution matching `useLocale()`.
2. **Standardize `<FilterBar>` Pattern**:
   Create a reusable `@moja/ui` composite `<FilterToolbar>` with built-in search debouncing, active filter chips, and a single "Reset all" trigger.
3. **Batch Multi-Select Filter Updates**:
   Use `nuqs` shallow batching to avoid firing duplicate tRPC server queries during rapid filter toggling.

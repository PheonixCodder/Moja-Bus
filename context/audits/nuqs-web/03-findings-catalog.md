# 📊 03 - Findings Catalog: Severity-Ranked Issue Register

This register ranks every discovery by severity (**P0** Blocker, **P1** Critical, **P2** Major, **P3** Minor/Polish) with reproduction risks and remediation instructions.

---

## Severity Breakdown

| Level | Count | Description |
| :--- | :--- | :--- |
| **P0** | 0 | System crash / Data corruption blockers. |
| **P1** | 4 | Severe hydration desynchronization, URL hammering on keypress, server type bundling leaks. |
| **P2** | 6 | Ephemeral `useState` on filter tables, missing shared parser schemas, redundant context adapters. |
| **P3** | 5 | Deprecated parser options API, missing clearOnDefault, sub-optimal array serialization. |

---

## 🔴 P1: Critical Issues

### `FINDING-P1-01`: Server Hydration Mismatch via Ignored Server `searchParams`
* **Affected Files**:
  * `apps/web/app/[locale]/dashboard/operator/(dashboard)/schedules/page.tsx`
  * `apps/web/app/[locale]/dashboard/operator/(dashboard)/staff/page.tsx`
* **Risk**: When a user opens a bookmarked or shared link with active filters (e.g. `?page=2&status=inactive`), the Next.js server pre-fetches the default page 1 data. Upon hydration, the client reads the actual URL, discards the server-rendered HTML, and triggers a full client-side refetch. This causes layout flashes, wasted server compute, and poor Core Web Vitals (LCP).
* **Fix**:
  1. Accept `searchParams: Promise<SearchParams>` in the page props.
  2. Parse via the corresponding `*SearchParamsCache.parse(await searchParams)`.
  3. Pass the parsed values directly to `prefetch(trpc.*.queryOptions({ ... }))`.

---

### `FINDING-P1-02`: Search Input Keypress URL Flooding (Missing Input Debouncing)
* **Affected Files**:
  * `apps/web/features/operator/views/operator-bookings-view.tsx`
  * `apps/web/features/admin/views/admin-users-view.tsx`
  * `apps/web/features/operator/views/operator-terminals-view.tsx`
* **Risk**: Calling `setParams({ q: e.target.value })` directly in an `<Input onChange>` updates the browser URL on every single keystroke. Typing a 15-character query triggers 15 browser history updates and micro-evaluations, degrading input performance on low-end devices and polluting the browser back button history.
* **Fix**:
  1. Hold the input value in a local string state (`localSearch`).
  2. Use a debounce hook (or `useEffect` with 300ms timeout) to push the debounced value to `setParams({ q: debouncedValue || null })`.
  3. Configure the parser with `.withOptions({ limitUrlUpdates: 300, history: "replace" })` or use local buffer input.

---

### `FINDING-P1-03`: Client-Side Type Import in Server Component
* **Affected Files**:
  * `apps/web/app/[locale]/dashboard/admin/financials/settlements/page.tsx`
* **Risk**: Imports `SearchParams` from `"nuqs"` instead of `"nuqs/server"`. While TypeScript may erase the type in production builds, bundlers can mistakenly pull client bundle dependencies into the Server Component AST.
* **Fix**: Replace `import { SearchParams } from "nuqs"` with `import type { SearchParams } from "nuqs/server"`.

---

### `FINDING-P1-04`: Navigation-Driven Tab Switching Instead of Query State
* **Affected Files**:
  * `apps/web/features/operator/views/operator-sent-offers-view.tsx`
* **Risk**: The component wraps status buttons in `<Link href="?status=...">` tags rather than using the `useQueryStates` setter. Clicking a tab triggers a Next.js soft navigation cycle instead of an instant, lightweight shallow state update.
* **Fix**: Replace `<Link>` wrappers with `onClick={() => void setParams({ status: tab.value, page: 1 })}`.

---

## 🟠 P2: Major Issues

### `FINDING-P2-01`: Core Operator Pages Lacking URL State (`useState` Only)
* **Affected Files**:
  * `apps/web/features/operator/views/operator-routes-view.tsx`
  * `apps/web/features/operator/views/operator-drivers-view.tsx`
  * `apps/web/features/operator/views/operator-fleet-view.tsx`
* **Risk**: Status filters, search keywords, and view tabs are stored in ephemeral React state (`useState`). Navigating to a detail drawer and pressing browser back, or refreshing the page, wipes out all user filters.
* **Fix**: Introduce standardized `routesSearchParams`, `driversSearchParams`, and `fleetSearchParams` using `nuqs`.

---

### `FINDING-P2-02`: Ad-Hoc Inline Parsers in Admin & Operator Views
* **Affected Files**:
  * `apps/web/features/admin/views/admin-users-view.tsx`
  * `apps/web/features/admin/views/admin-campaigns-view.tsx`
  * `apps/web/features/admin/views/admin-activity-logs-view.tsx`
  * `apps/web/features/operator/views/operator-terminals-view.tsx`
  * `apps/web/features/operator/views/operator-marketplace-view.tsx`
* **Risk**: Parsers are defined inline within client component files. They cannot be shared with Server Component pages for prefetching, violating the central architectural rule of `nuqs`.
* **Fix**: Extract schemas to dedicated `*search-params.ts` files with `createSearchParamsCache`.

---

### `FINDING-P2-03`: Redundant Root-Level `<NuqsAdapter>` Nesting
* **Affected Files**:
  * `apps/web/app/[locale]/dashboard/operator/(dashboard)/promotions/page.tsx`
* **Risk**: Duplicate adapter causes unnecessary context provider hierarchy.
* **Fix**: Remove `<NuqsAdapter>` from the promotions page component tree.

---

## 🟡 P3: Minor & Polish Issues

### `FINDING-P3-01`: Deprecated Parser Configuration API
* **Affected Files**: `features/admin/views/admin-users-view.tsx`
* **Fix**: Replace `{ defaultValue: "" }` with `.withDefault("")`.

### `FINDING-P3-02`: Missing `clearOnDefault: true` on Common Filters
* **Affected Files**: `features/operator/lib/bookings/booking-search-params.ts`, `features/search/lib/params.ts`
* **Fix**: Add `.withOptions({ clearOnDefault: true })` to clean query strings when default values are selected (e.g. `?status=ALL` removed from URL).

### `FINDING-P3-03`: Zero-Indexed vs One-Indexed Page Ambiguity
* **Affected Files**: `features/admin/views/admin-activity-logs-view.tsx` (uses 0-indexed page in URL while others use 1-indexed).
* **Fix**: Standardize all pagination to 1-indexed via `parseAsInteger.withDefault(1)`.

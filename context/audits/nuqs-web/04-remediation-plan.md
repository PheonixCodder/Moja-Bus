# 🛠️ 04 - Remediation Plan: Phased Implementation

This execution plan guides the step-by-step resolution of all findings identified in the audit.

---

## 🎯 Phase Overview

```
[Phase 1: Quick Fixes & Hygiene]
  ├── Remove redundant <NuqsAdapter> in promotions page
  ├── Fix type import in settlements page
  └── Fix Link-driven tabs in sent-offers view
       │
[Phase 2: Server Prefetch & Hydration Alignment]
  ├── Implement searchParams cache parsing in schedules page
  └── Implement searchParams cache parsing in staff page
       │
[Phase 3: Search Input Debouncing & History Polish]
  ├── Debounce bookings search input
  ├── Debounce admin-users search input
  └── Debounce terminals search input
       │
[Phase 4: Missing URL State Migration]
  ├── Extract shared params for Routes & wire to nuqs
  ├── Extract shared params for Drivers & wire to nuqs
  └── Extract shared params for Fleet & wire to nuqs
```

---

## 📝 Phase 1: Quick Fixes & Hygiene (✅ COMPLETED)
1. **Promotions Page**: Removed redundant `<NuqsAdapter>` wrapping in `apps/web/app/[locale]/dashboard/operator/(dashboard)/promotions/page.tsx`.
2. **Settlements Page**: Changed import to `import type { SearchParams } from "nuqs/server"` in `apps/web/app/[locale]/dashboard/admin/financials/settlements/page.tsx`.
3. **Ledger Page**: Changed import to `import type { SearchParams } from "nuqs/server"` in `apps/web/app/[locale]/dashboard/admin/financials/ledger/page.tsx`.
4. **Sent Offers View**: Updated status tabs in `features/operator/views/operator-sent-offers-view.tsx` to use `setParams({ status: tab.value })`.

---

## 📝 Phase 2: Server Prefetch & Hydration Alignment (✅ COMPLETED)
1. **Schedules Page** (`operator/(dashboard)/schedules/page.tsx`):
   * Added `searchParams: Promise<SearchParams>` to props.
   * Parsed with `scheduleSearchParamsCache.parse(await searchParams)`.
   * Passed query filters to `trpc.schedules.list.queryOptions({ ... })`.
2. **Staff Page** (`operator/(dashboard)/staff/page.tsx`):
   * Added `searchParams: Promise<SearchParams>` to props.
   * Parsed with `staffSearchParamsCache.parse(await searchParams)`.
   * Passed filters to `trpc.staff.listStaff.queryOptions({ ... })`.
3. **Routes Page** (`operator/(dashboard)/routes/page.tsx`):
   * Parsed with `routeSearchParamsCache.parse(await searchParams)`.
   * Prefetched `trpc.routes.list.queryOptions({ showArchived })`.
4. **Drivers Page** (`operator/(dashboard)/drivers/page.tsx`):
   * Parsed with `driverSearchParamsCache.parse(await searchParams)`.
   * Prefetched `trpc.drivers.listDrivers.queryOptions({ ... })`.
5. **Fleet Page** (`operator/(dashboard)/fleet/page.tsx`):
   * Parsed with `fleetSearchParamsCache.parse(await searchParams)`.
   * Prefetched `getBuses`, `getBusTypes`, and layouts on server.

---

## 📝 Phase 3: Search Input Debouncing & History Polish (✅ COMPLETED)
1. **Operator Bookings** (`operator-bookings-view.tsx`):
   * Buffered search query locally with 300ms debounce before `setParams({ q })`.
2. **Admin Users** (`admin-users-view.tsx`):
   * Migrated deprecated `{ defaultValue }` to `parseAsString.withDefault("")`.
   * Debounced search input 300ms to eliminate URL rewriting on every keystroke.
3. **Operator Terminals** (`operator-terminals-view.tsx`):
   * Debounced search input 300ms before synchronizing with nuqs state.
4. **Admin Activity Logs** (`admin-activity-logs-view.tsx`, `activity-logs-table.tsx`, `activity-logs-pagination.tsx`):
   * Unified 4 disparate `useQueryState` calls into `useQueryStates(adminActivityLogsParamsSchema)`.
   * Debounced search input 300ms before updating URL.

---

## 📝 Phase 4: Missing URL State Migration (✅ COMPLETED)
1. **Operator Routes** (`operator-routes-view.tsx`):
   * Created `features/operator/lib/routes/route-search-params.ts`.
   * Replaced local `useState` with `useQueryStates(routeSearchParams)`.
   * Synced filters across search and status tabs.
2. **Operator Drivers** (`operator-drivers-view.tsx`):
   * Created `features/operator/lib/drivers/driver-search-params.ts`.
   * Replaced 5 local filter `useState` hooks with `useQueryStates(driverSearchParams)`.
   * Preserved accumulated infinite-roster pagination.
3. **Operator Fleet** (`operator-fleet-view.tsx`):
   * Created `features/operator/lib/fleet/fleet-search-params.ts`.
   * Replaced `useSearchParams`, `window.location.pathname`, and local `useState` with `useQueryStates(fleetSearchParams)`.
   * Synced tab (`buses` | `layouts`), query search, status filter, and modal actions.

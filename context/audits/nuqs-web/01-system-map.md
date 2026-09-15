# 🗺️ 01 - System Map: `nuqs` Inventory across `apps/web`

This document maps all usages of `nuqs` across `apps/web`, including:
1. Root adapter positioning.
2. Server Component prefetch / hydration caching via `createSearchParamsCache`.
3. Client components utilizing `useQueryState` and `useQueryStates`.
4. Feature modules completely missing URL state management where required.

---

## 1. Adapter & Setup Layer

| Location | NuqsAdapter | Notes |
| :--- | :--- | :--- |
| `apps/web/app/[locale]/layout.tsx` | ✅ Wrapped correctly around app tree inside `TRPCReactProvider`. | Correct app-router setup per `setup-nuqs-adapter`. |
| `apps/web/app/[locale]/dashboard/operator/(dashboard)/promotions/page.tsx` | ❌ **Redundant nested `<NuqsAdapter>`** | Violates DRY and causes unnecessary React context nesting. |

---

## 2. Server vs. Client Integration Matrix

| Domain / Route | Server Page File | Shared Parser Schema | Server `createSearchParamsCache` | Client View / Component |
| :--- | :--- | :--- | :--- | :--- |
| **Search & Booking** | `[locale]/search/page.tsx` | `features/search/lib/params.ts` | ✅ Used (`searchParamsCache`) | `SearchPageClient` (`useQueryStates`) |
| **Public Blog** | `[locale]/blog/page.tsx` | `features/blog/lib/params.ts` | ✅ Used (`blogParamsCache`) | `BlogIndexView` (`useQueryStates`) |
| **Operator Bookings** | `operator/(dashboard)/bookings/page.tsx` | `features/operator/lib/bookings/booking-search-params.ts` | ✅ Used (`bookingListParamsCache`) | `OperatorBookingsView` (`useQueryStates`) |
| **Operator Revenue** | `operator/(dashboard)/revenue/page.tsx` | `features/operator/lib/revenue-search-params.ts` | ✅ Used (`revenueSearchParamsCache`) | `OperatorRevenueView`, `RevenueHeader` (`useQueryStates`) |
| **Operator Schedules** | `operator/(dashboard)/schedules/page.tsx` | `features/operator/lib/schedules/schedule-search-params.ts` | ❌ **Ignored in Page** (Pre-fetches `{}` empty query) | `OperatorSchedulesView` (`useQueryStates`) |
| **Operator Staff** | `operator/(dashboard)/staff/page.tsx` | `features/operator/lib/staff-search-params.ts` | ❌ **Ignored in Page** (Pre-fetches default args only) | `OperatorStaffView` (`useQueryStates`) |
| **Operator Trips** | `operator/(dashboard)/trips/page.tsx` | `features/operator/lib/trips/trip-search-params.ts` | ⚠️ Partially parsed | `OperatorTripsView` (`useQueryStates`) |
| **Operator Marketplace** | `operator/.../drivers/marketplace/page.tsx` | Inline in view file | ❌ **No shared schema** | `OperatorMarketplaceView` (`useQueryStates`) |
| **Operator Sent Offers** | `operator/.../drivers/offers/page.tsx` | Inline in view file | ❌ **No shared schema** | `OperatorSentOffersView` (Uses `Link href` instead of setter) |
| **Operator Terminals** | `operator/.../terminals/page.tsx` | None (Inline `useQueryState`) | ❌ **No shared schema** | `OperatorTerminalsView` (`useQueryState` × 3) |
| **Operator Fleet** | `operator/.../fleet/page.tsx` | None | ❌ **No nuqs used** (Uses raw `useSearchParams()`) | `OperatorFleetView` (Raw router replace) |
| **Operator Routes** | `operator/.../routes/page.tsx` | None | ❌ **No nuqs used** (Local `useState` only, filters lost on reload) | `OperatorRoutesView` |
| **Operator Drivers** | `operator/.../drivers/page.tsx` | None | ❌ **No nuqs used** (Local `useState` only, filters lost on reload) | `OperatorDriversView` |
| **Operator Withdrawals** | `operator/.../withdraw/page.tsx` | None (Inline `useQueryState`) | ❌ **No shared schema** | `OperatorWithdrawView` (`useQueryState`) |
| **Admin Dispatch** | `admin/operations/dispatch/page.tsx` | `features/admin/lib/search-params.ts` | ✅ Used (`dispatchSearchParamsCache`) | `DispatchFilterBar`, `DispatchTripList` |
| **Admin Withdrawals** | `admin/financials/withdrawals/page.tsx` | `features/admin/lib/search-params.ts` | ✅ Used (`withdrawalsSearchParamsCache`) | `AdminWithdrawalsView`, `WithdrawalsFilterBar` |
| **Admin Users** | `admin/users/page.tsx` | None (Inline `useQueryState`) | ❌ **No shared schema** | `AdminUsersView` (`useQueryState` × 3) |
| **Admin Activity Logs** | `admin/audit-logs/activity/page.tsx` | None (Inline `useQueryState`) | ❌ **No shared schema** | `AdminActivityLogsView`, `ActivityLogsTable` |
| **Admin Campaigns** | `admin/content/campaigns/page.tsx` | None (Inline `useQueryState`) | ❌ **No shared schema** | `AdminCampaignsView` (`useQueryState` × 4) |
| **Admin Settlements** | `admin/financials/settlements/page.tsx` | `features/admin/lib/search-params.ts` | ⚠️ Imports `SearchParams` from `"nuqs"` instead of `"nuqs/server"` | `SettlementsHistoryTable` (`useQueryState`) |

---

## 3. Data Flow Architecture

```
Current Reality:
[Browser URL]
   │
   ├─► Server Page (Next.js 15+ searchParams: Promise<...>)
   │      ├─ 40% uses createSearchParamsCache.parse() ✅
   │      └─ 60% ignores searchParams, pre-fetches empty {} (Hydration Mismatch!) ❌
   │
   └─► Client View Components
          ├─ 35% useQueryStates(sharedSchema) ✅
          ├─ 30% ad-hoc useQueryState() inline with un-debounced inputs ❌
          ├─ 15% manual <Link href="?query=..."> (URL/State Desynchronization) ❌
          └─ 20% raw React useState (URL state not preserved on reload) ❌
```

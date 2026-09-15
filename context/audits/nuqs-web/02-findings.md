# 🔎 02 - Findings: Detailed Rule Evaluation

This document details every violation and anti-pattern discovered in `apps/web`, benchmarked against the official standard in `context/services/nuqs` and the 8 rule categories in `.agents/skills/nuqs`.

---

## Category 1: Adapter & Setup (`setup-*`)

### 1.1 Redundant Nested `<NuqsAdapter>`
* **Rule**: `setup-nuqs-adapter` (Wrap app once at the root layout).
* **Violation in**: `apps/web/app/[locale]/dashboard/operator/(dashboard)/promotions/page.tsx:24`
```tsx
// VIOLATION: Root layout already renders <NuqsAdapter>
export default async function OperatorPromotionsPage() {
  return (
    <HydrateClient>
      <NuqsAdapter>  {/* REDUNDANT */}
        <OperatorPromotionsView />
      </NuqsAdapter>
    </HydrateClient>
  );
}
```
* **Impact**: Unnecessary React context re-creation, memory overhead, and risk of state isolation bugs.

### 1.2 Incorrect Server Type Import
* **Rule**: `setup-import-server` (Import server utilities exclusively from `nuqs/server`).
* **Violation in**: `apps/web/app/[locale]/dashboard/admin/financials/settlements/page.tsx:5`
```tsx
// VIOLATION:
import { SearchParams } from "nuqs"; // ❌ Imported from client bundle
// SHOULD BE:
import type { SearchParams } from "nuqs/server"; // ✅
```
* **Impact**: Leaks client module bundle exports into Server Component build pipeline.

---

## Category 2: Parser Configuration (`parser-*`)

### 2.1 Missing Shared Parser Schemas (Ad-Hoc Inline Parsers)
* **Rule**: `setup-shared-parsers` / `server-share-parsers` (Define shared parsers in a dedicated `params.ts` file; never re-define inline in client components).
* **Violations in**:
  * `features/admin/views/admin-users-view.tsx`
  * `features/admin/views/admin-campaigns-view.tsx`
  * `features/admin/views/admin-activity-logs-view.tsx`
  * `features/operator/views/operator-terminals-view.tsx`
  * `features/operator/views/operator-marketplace-view.tsx`
  * `features/operator/views/operator-sent-offers-view.tsx`
* **Impact**: Server Components cannot pre-fetch using the same type constraints as the Client View, resulting in waterfall requests on first render.

### 2.2 Deprecated Options Pattern in `useQueryState`
* **Rule**: `parser-with-default` / `state-options-inheritance` (Chain `.withDefault()` and `.withOptions()` directly on the parser, not in the hook second argument).
* **Violation in**: `features/admin/views/admin-users-view.tsx:59-64`:
```tsx
// VIOLATION:
const [searchQuery, setSearchQuery] = useQueryState("q", { defaultValue: "" }); // ❌ Deprecated syntax
// SHOULD BE:
const [searchQuery, setSearchQuery] = useQueryState("q", parseAsString.withDefault("")); // ✅
```

---

## Category 3: State Management & Control (`state-*`)

### 3.1 Controlled Search Inputs Without Debouncing (Immediate URL Spam)
* **Rule**: `perf-debounce-search` / `perf-throttle-updates` / `state-controlled-inputs` (Never trigger an immediate URL update on every keystroke in search inputs).
* **Violations in**:
  * `features/operator/views/operator-bookings-view.tsx:207`:
    ```tsx
    // VIOLATION: Calls setParams on every keystroke
    <Input
      value={q}
      onChange={(e) => void setParams({ q: e.target.value, page: 1 })}
    />
    ```
    *Note*: `debouncedQ` is calculated via `useDebounce(q, 300)` for the tRPC query, but the **URL query state itself** is hammered on every character typed!
  * `features/admin/views/admin-users-view.tsx:175-178`:
    ```tsx
    onChange={(e) => {
      setSearchQuery(e.target.value); // Immediate URL write on keypress
      setCurrentPageParam(1);
    }}
    ```
  * `features/operator/views/operator-terminals-view.tsx:341`:
    ```tsx
    onChange={(e) => setSearch(e.target.value)} // Immediate URL write on keypress
    ```
* **Impact**: Severe browser history bloat, laggy typing on mobile devices, and unnecessary Next.js router re-evaluation on every character.

### 3.2 Mixing `<Link href="...">` with `useQueryStates`
* **Rule**: `history-back-sync` / `state-use-query-states` (Do not mix direct anchor links with nuqs state setters for tab switching).
* **Violation in**: `features/operator/views/operator-sent-offers-view.tsx:334-351`:
```tsx
// VIOLATION: Renders a <Link> that performs full Next.js navigation instead of setParams({ status: tab.value })
<Link href={tab.value === "ACTIVE" ? "..." : `?status=${tab.value}`}>
  <Button variant={params.status === tab.value ? "default" : "outline"}>
```
* **Impact**: Causes full Next.js page re-navigation, losing in-memory client states and breaking smooth tab transitions.

---

## Category 4: Server Component Integration (`server-*`)

### 4.1 Server Prefetch Ignoring `searchParams` (Cache Miss / Hydration Desync)
* **Rule**: `server-search-params-cache` / `server-parse-before-get` (Server page must parse `searchParams` with cache and pass them to prefetch queries).
* **Violations in**:
  * `apps/web/app/[locale]/dashboard/operator/(dashboard)/schedules/page.tsx:18-20`:
    ```tsx
    // VIOLATION: Completely ignores incoming searchParams (filter, sort, route, page)
    export default async function SchedulesPage() {
      await prefetch(trpc.schedules.list.queryOptions({})); // ❌ Prefetches empty defaults!
      return (
        <HydrateClient>
          <OperatorSchedulesView /> {/* ❌ Client mounts with URL params and refetches immediately! */}
        </HydrateClient>
      );
    }
    ```
  * `apps/web/app/[locale]/dashboard/operator/(dashboard)/staff/page.tsx:18-35`:
    ```tsx
    // VIOLATION: Hardcodes prefetch arguments to undefined/defaults instead of parsing URL
    export default async function OperatorStaffPage() {
      await Promise.all([
        prefetch(trpc.staff.listStaff.queryOptions({ page: 1, limit: 50 })), // ❌ Ignores URL ?page=3&role=ADMIN
      ]);
    }
    ```
* **Impact**: Every time an operator shares a link with filters, visits page 2, or reloads a filtered table, the server pre-fetches useless default data, and the browser displays a flash of incorrect content before firing a client-side network request.

### 4.2 Missing `shallow: false` on Server-Driven Tables
* **Rule**: `server-shallow-false` (When a page relies on server-rendered data rather than client React Query suspense hooks, updates must not be shallow).
* **Impact**: Filters change in the URL but server components don't re-render.

---

## Category 5: Missing URL State (Anti-Pattern: Local `useState` Only)

### 5.1 Critical Operator Pages Using Ephemeral `useState` Instead of `nuqs`
* **Rule**: Core business tables that support filtering, sorting, or pagination MUST store their state in the URL.
* **Violations**:
  * `features/operator/views/operator-routes-view.tsx`: Uses `useState("ALL")` for status and `useState("")` for search. Reloading the page or sharing the link clears all filters.
  * `features/operator/views/operator-drivers-view.tsx`: Uses local `useState` for search, status, category, verification, and employment filters.
  * `features/operator/views/operator-fleet-view.tsx`: Uses local `useState` for tabs and search, and raw `useSearchParams()` for one modal action.
* **Impact**: Operators lose their active view state whenever they refresh, navigate back, or bookmark a filtered list.

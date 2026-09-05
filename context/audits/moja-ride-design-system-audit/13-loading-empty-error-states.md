# Moja Ride Design & Design-Engineering Audit
## 13. Loading, Empty, Error & Success States

### 1. The Operational Edge-State Framework

Software quality is defined not by how an interface looks when all data is present and operations succeed, but by how it behaves during:
1. **Network Latency / Fetching** (Loading State)
2. **Zero-Data Conditions** (Empty State)
3. **Network or Server Failures** (Error State)
4. **Action Completion** (Success Feedback)
5. **Partial Data Degradation** (Fallback State)

---

### 2. Loading State Audit

#### 2.1 The Full-Page Spinner Trap in Operator Dashboard
In `apps/web/app/[locale]/dashboard/operator/(dashboard)/loading.tsx`:
```tsx
"use client";
import { Spinner } from "@moja/ui/components/ui/spinner";

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-full">
      <Spinner className="size-6" />
    </div>
  );
}
```
- **The Problem**: Whenever an operator clicks a navigation link in the sidebar (e.g. from Overview to Fleet, or from Bookings to Routes), Next.js displays this layout-level `loading.tsx`.
- **The Consequence**: The entire screen content vanishes, replaced by a tiny spinning circle in the center. Once data resolves, the screen abruptly flashes in. This creates extreme perceived latency and visual flicker.
- **The Fix**: Replace `loading.tsx` with a structural skeleton showing card wireframes and table placeholders.

#### 2.2 Skeletons in Admin Dashboard
In `apps/web/features/admin/views/admin-dashboard-view.tsx` lines 17–32:
```tsx
function StatsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <Skeleton className="h-80 w-full" />
      ...
    </div>
  );
}
```
- **The Positive**: Good implementation of layout-matched skeletons wrapped in React `<Suspense fallback={<StatsSkeleton />}>`.
- **The Gap**: This pattern is not formalized as a reusable component or layout convention.

---

### 3. Empty State Audit: Bypassing `@moja/ui/empty`

`@moja/ui/src/components/ui/empty.tsx` provides an exceptional, fully-typed Base UI component suite:
- `Empty`: Container with dashed border and center alignment
- `EmptyHeader`: Title & icon group
- `EmptyMedia`: Circular icon badge
- `EmptyTitle`: Heading
- `EmptyDescription`: Subtext with link support
- `EmptyContent`: Action button container

#### The Abandonment Reality
`@moja/ui/empty.tsx` is only used in **7 files** in the entire monorepo!
Every other view creates its own one-off empty state markup:

| File | Current Implementation | Issues |
| :--- | :--- | :--- |
| `passenger-dashboard-view.tsx` L235 | `<div className="flex flex-col items-center justify-center py-12 ..."> <div className="w-12 h-12 bg-muted ..."> <Ticket className="size-6" /> ...` | Completely reinvents `EmptyMedia` and `EmptyTitle`. |
| `operator-bookings-view.tsx` L53 | `<div className="text-center py-16 text-text-secondary text-sm"> <CalendarDays className="size-10 mx-auto mb-3 text-text-muted" />` | Bare icon, uses ghost tokens (`text-text-muted`), no action button. |
| `operator-dashboard-view.tsx` L275 | `<div className="flex flex-col items-center justify-center py-16 text-center ..."> <div className="w-12 h-12 bg-slate-100 text-slate-400 ...">` | Hardcoded `slate-100` and `slate-400`. |
| `search-empty-state.tsx` | Custom illustration and manual filter reset triggers. | Independent styling unlinked to `@moja/ui`. |

---

### 4. Error State Audit: Missing Boundaries

| Dashboard | `error.tsx` Present? | Failure Behavior |
| :--- | :---: | :--- |
| **Passenger Web** | **NO** | If a query fails, the entire dashboard unmounts and crashes to Next.js generic 500 page. Navigation is destroyed. |
| **Admin Web** | **NO** | If any query fails, crashes to generic error page. Administrator is locked out of the navigation shell. |
| **Operator Web** | **YES** | Implements `operator/(dashboard)/error.tsx`. Correctly catches tRPC errors, isolates the crash to the content pane, preserves the sidebar and header, and provides a "Retry" button. |

---

### 5. Success State Feedback & Toasts

- **Technology**: `sonner` is utilized across web dashboards (`<Toaster />` in layouts).
- **Execution**:
  - `toast.success` and `toast.error` are used effectively during check-in and mutation flows.
  - **Flaw**: Novu notification inbox overlays z-index 9999 (`z-index: 9999 !important` in `packages/ui/src/styles/globals.css`), occasionally rendering over Sonner toast notifications in the top-right corner.

---

### 6. Remediation Strategy

1. **Mandate `@moja/ui/empty`**: Codemod all ad-hoc empty divs to use `<Empty>` across all views.
2. **Add Missing `error.tsx` Boundaries**: Create `apps/web/app/[locale]/dashboard/(passenger)/error.tsx` and `apps/web/app/[locale]/dashboard/admin/error.tsx`.
3. **Replace `operator/loading.tsx`**: Implement structural card skeletons matching the dashboard layout.

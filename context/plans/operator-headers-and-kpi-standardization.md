# Implementation Plan — Operator Headers & KPI Cards Standardization

**Target Module:** `apps/web/features/operator`  
**Date:** September 15, 2026  
**Status:** Pending Approval  

---

## 1. What We Are Building

We are unifying the fragmented page headers and KPI/stats cards across all 14 operator dashboard pages in `apps/web/features/operator`. Rather than reinventing headers and metric cards with ad-hoc flex layouts, divergent styles, and duplicate local implementations, we will build a composable compound header architecture supporting **4 distinct header archetypes** (`PageHeaderAction`, `PageHeaderTabbed`, `PageHeaderControl`, and `PageHeaderLive`) and a unified, strongly-typed **KPI Card & Grid system** (`KpiCard` and `KpiGrid`). All existing functionality—including tRPC queries, permission checks (`can(...)`), CSV import/export triggers, drawer states, search params, and action buttons—will be strictly preserved with zero regressions.

---

## 2. Language We Agreed On

- **3 to 4 Header Archetypes:** A standardized set of 4 header patterns (`Action`, `Tabbed`, `Control`, `Live`) tailored to the functional nature of each page, rather than 14 bespoke layouts.
- **KPI / Stats Card System:** A unified design-system component (`KpiCard`) with built-in loading states, semantic color variants, and actionable slots, replacing copy-pasted `div`s and disconnected card widgets.
- **Page Header vs. Filter Toolbar:** The **Page Header** establishes top-level identity and primary page actions (title, subtitle, badge/icon, primary CTAs), while the **Filter Toolbar** is a distinct secondary control bar (search inputs, status select dropdowns, date filters) that lives below the header or adjacent to the content.
- **KPI Card Variants:** Distinct functional modes on `KpiCard`: `default` (icon + badge), `status` (semantic text colors like success/warning), `actionable` (embedded action button), and `trend` (percentage deltas).

---

## 3. Decisions Made

1. **Four Specialized Header Archetypes:**
   - **`PageHeaderAction` (Standard Action):** Title + subtitle (optional icon) on the left; page-level actions on the right (e.g. Export CSV, Import CSV, "+ Add Location"). Used by: **Terminals**, **Routes**, **Promotions**, **Withdrawals**, **Settings**.
   - **`PageHeaderTabbed` (Tabbed Action):** Title + subtitle + secondary view tabs (`Buses | Layouts`, `Members | Invitations`) on the left; actions on the right. Used by: **Fleet Management**, **Staff**.
   - **`PageHeaderControl` (Control & Filter):** Title + subtitle on the left; inline contextual controls (date-range dropdown, period selectors, export) on the right. Used by: **Revenue / Financial Workspace**, **Driver Marketplace**.
   - **`PageHeaderLive` (Live Operational Bar):** Operational status pills, live indicators, date range/pagination badge, quick refresh trigger. Used by: **Dispatch Board**, **Live Fleet Map**.

2. **Compound / Composable Component Architecture:**
   - We avoid brittle monolithic components with dozens of booleans. Instead, we use a compound primitive pattern (`PageHeader`, `PageHeaderHeading`, `PageHeaderTitle`, `PageHeaderDescription`, `PageHeaderActions`, `PageHeaderTabs`, `PageHeaderControls`).
   - Archetype presets are exposed as convenient wrappers that forward slots, guaranteeing that permissions (`can(...)`), modals, dialogs, and event handlers are passed cleanly without any code deletion.

3. **Unified KPI Card System (`KpiCard` & `KpiGrid`):**
   - Single source of truth in `features/operator/components/kpi-card.tsx` with responsive layout wrapper `KpiGrid` (supporting columns 2 through 5).
   - Replaces duplicate local `StatCard` in `operator-fleet-view.tsx`, raw `div`s in `operator-drivers-view.tsx`, and standardizes `stat-card.tsx`.
   - Supports `isLoading` skeleton rendering to eliminate layout shift during tRPC suspense/query loading.

4. **Incremental Safe Rollout Strategy:**
   - Migrate in 5 safe phases with zero breaking changes, verifying each page before moving to the next.

---

## 4. Assumptions

- Existing route URLs, search parameters (handled via `nuqs`), and permissions (`useStaffPermissions`) remain unchanged.
- The top-level global app bar (search, user avatar, global quick actions) is handled in the root operator layout and remains untouched; this plan focuses on the view/page headers and KPI cards inside each page content container.
- Existing translation namespaces in `operatorDashboard.*` will continue to provide titles, subtitles, and labels.

---

## 5. How to Build It (Step-by-Step Implementation)

### Phase 1: Foundation Primitives
1. **Create Composable Header Primitives (`apps/web/features/operator/components/header/`):**
   - `page-header.tsx`: Root container, `PageHeaderHeading`, `PageHeaderTitle`, `PageHeaderDescription`, `PageHeaderActions`, `PageHeaderTabs`, `PageHeaderControls`.
   - Export 4 archetypes:
     - `PageHeaderAction` (Title, description, actions slot, optional icon).
     - `PageHeaderTabbed` (Title, description, tabs slot, actions slot).
     - `PageHeaderControl` (Title, description, controls slot, actions slot).
     - `PageHeaderLive` (Live status pills, date/pagination slot, refresh slot, controls slot).
2. **Create Unified KPI System (`apps/web/features/operator/components/kpi/`):**
   - `kpi-card.tsx`:
     - Props: `label`, `value`, `subtext?`, `icon?`, `iconClassName?`, `variant?` (`'default' | 'status' | 'actionable' | 'trend'`), `statusColor?` (`'success' | 'warning' | 'destructive' | 'primary'`), `action?` (ReactNode), `trend?` (`{ value: number, direction: 'up' | 'down' }`), `isLoading?` (boolean).
   - `kpi-grid.tsx`:
     - Responsive grid with configurable columns (`cols={2 | 3 | 4 | 5}`). Includes automatic skeleton grid when `isLoading={true}`.

### Phase 2: Core Resource Pages Migration
3. **Migrate Terminals (`operator-terminals-view.tsx`):**
   - Replace inline header with `PageHeaderAction` (retaining CSV export/import & `can("terminals:create")` buttons).
   - Replace old `StatCard` with `KpiGrid` and `KpiCard`s.
4. **Migrate Fleet Management (`operator-fleet-view.tsx`):**
   - Delete duplicate local `StatCardProps` and `StatCard` function.
   - Replace header with `PageHeaderTabbed` (retaining "Buses" / "Layouts" segmented switch & action buttons).
   - Replace metric cards with `KpiGrid` and `KpiCard`s.
5. **Migrate Drivers List (`operator-drivers-view.tsx`):**
   - Replace inline header with `PageHeaderAction` (retaining "Live Fleet Map" and "Onboard Driver").
   - Replace raw unstyled `div`s with `KpiGrid` and `KpiCard` using `variant="status"` for active, verified, and pending counts.

### Phase 3: Financial Pages Migration
6. **Migrate Revenue / Financial Workspace (`operator-revenue-view.tsx`):**
   - Replace header with `PageHeaderControl` (retaining date-range selector and CSV export).
   - Standardize escrow and net earnings cards with `KpiCard` using `variant="actionable"` for "Request Withdrawal".
7. **Migrate Withdrawals (`operator-withdraw-view.tsx`):**
   - Replace header with `PageHeaderAction`.
   - Standardize balance and pending escrow cards with `KpiCard`.

### Phase 4: Promotions, Staff & Schedules
8. **Migrate Promotions (`operator-promotions-view.tsx`):**
   - Replace legacy `OperatorPageHeader` with `PageHeaderAction`.
   - Update `OperatorPromotionsKpiCards` to use `KpiGrid` and `KpiCard` with loading state.
9. **Migrate Staff (`operator-staff-view.tsx`):**
   - Replace `StaffPageHeader` with `PageHeaderTabbed` or `PageHeaderAction` (preserving permissions and invite sheet trigger).
10. **Migrate Schedules (`operator-schedules-view.tsx`):**
    - Replace header with `PageHeaderAction` (preserving CSV buttons and "+ Create Schedule").

### Phase 5: Operational & Overview Pages
11. **Migrate Dispatch Board (`operator-trips-view.tsx` / dispatch view):**
    - Apply `PageHeaderLive` for real-time status counts, pagination summary, and refresh trigger.
12. **Migrate Driver Marketplace (`operator-marketplace-view.tsx`):**
    - Apply `PageHeaderControl` with filter toolbar integration.
13. **Migrate Overview Dashboard (`operator-dashboard-view.tsx`):**
    - Standardize top summary metric cards using `KpiGrid` and `KpiCard` with trend badges.

### Phase 6: Code Cleanup & Verification
14. **Deprecate or Remove Legacy Duplicates:**
    - Safely remove unused local card definitions and redundant legacy header files.
15. **Typecheck and Linting:**
    - Run `pnpm run typecheck` or `tsc --noEmit` across `apps/web`.
    - Verify all pages load cleanly without console errors or visual regressions.

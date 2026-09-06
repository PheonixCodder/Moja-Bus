# Moja Ride Design & Design-Engineering Audit
## 09. Navigation Architecture

### 1. Navigation Topology Across the Product Ecosystem

The Moja Ride monorepo supports five primary navigation paradigms:

```
Navigation Architecture Across Ecosystem
┌───────────────────────┬────────────────────────────────────────────────────────┐
│ Platform Surface      │ Primary Navigation Paradigm                            │
├───────────────────────┼────────────────────────────────────────────────────────┤
│ Passenger Web         │ Collapsible Sidebar + Sticky Header + Command Palette  │
│ Operator Web          │ Collapsible Sidebar + Sticky Header + Quick Actions    │
│ Admin Web             │ Collapsible Sidebar + Per-Page Header + Floating Bell  │
│ Traveler Mobile       │ Floating Curved SVG Tab Bar (5 items) + Stack Sheets   │
│ Driver Mobile         │ In-Cab Bottom Tab Bar (Role-Filtered) + ScreenShell    │
└───────────────────────┴────────────────────────────────────────────────────────┘
```

---

### 2. Desktop Web Navigation Audit

#### 2.1 The Three Dashboard Sidebars
All three web dashboards implement the modern `@moja/ui/components/ui/sidebar` system with cookie-persisted collapse states (`defaultOpen = cookieStore.get("sidebar_state")?.value === "true"`):
1. **`DashboardSidebar` (Passenger)**:
   - Primary links: Overview, Bookings, Tickets, Wallet, Saved Passengers, Referrals, Settings.
   - Clean, lightweight, consumer-focused.
2. **`OperatorSidebar` (Operator)**:
   - Dynamic permission gating (`useStaffPermissions` / `canAny`).
   - Grouped sections: Operations (Dispatch, Fleet, Routes, Schedules, Bookings), Financials (Revenue, Withdrawals), Management (Staff, Drivers, Reviews, Settings).
3. **`AdminSidebar` (Admin)**:
   - High-authority grouping: Overview, Operations, Marketplace, Financials (Ledger, Settlements, Withdrawals), Verification queue, Content/Marketing, Security & Audit Logs.

#### 2.2 The Header Architecture Breakdown
While sidebars are unified, **header architecture is completely fragmented between the dashboards**:

| Header Property | Passenger Dashboard | Operator Dashboard | Admin Dashboard |
| :--- | :--- | :--- | :--- |
| **Header Declaration** | Inside `layout.tsx` | Inside `layout.tsx` | **Inside each individual `page.tsx`!** |
| **Notification Inbox** | Integrated in header | Integrated in header | **Unanchored floating absolute `div` in layout!** |
| **Search Trigger** | `<SearchDialog />` | `<OperatorSearchDialog />` | None |
| **Breadcrumbs** | None (Page Title) | None (Page Title) | In each page header (`nav / span / text-text-muted`) |
| **Quick Actions** | None | `<OperatorQuickActions />` | None |

#### The Admin Header Disaster
In `apps/web/app/[locale]/dashboard/admin/layout.tsx` lines 56–59:
```tsx
<SidebarInset className="min-h-0 min-w-0 bg-bg-base relative">
  <div className="absolute right-4 top-1.5 z-40">
    <NotificationInbox />
  </div>
  <main className="flex min-h-0 flex-1 flex-col">{children}</main>
  <Toaster />
</SidebarInset>
```
And in every individual admin page (e.g. `admin/page.tsx` line 49):
```tsx
<header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-bg-base px-4">
  <SidebarTrigger className="text-text-muted hover:text-text-primary" />
  <Separator orientation="vertical" className="h-4 bg-border" />
  <nav className="flex items-center gap-1 text-xs text-text-muted">
    <span>{t("breadcrumb.admin")}</span>
    <span className="mx-1 text-text-muted/40">/</span>
    <span className="text-text-primary font-medium">{t("breadcrumb.overview")}</span>
  </nav>
</header>
```
- **The Issue**: Because the layout does not provide a standard `<header>`, every single page in `dashboard/admin/` must manually re-declare a 48px header with a sidebar trigger, separator, and breadcrumb.
- **The Visual Collision**: Meanwhile, `layout.tsx` forcibly renders `<NotificationInbox />` at `top-1.5 right-4 z-40`. If an individual page places an action button or filter on the right side of its header, the floating notification bell **physically overlays and blocks clicks to that button**.

---

### 3. Mobile Navigation Architecture Audit

#### 3.1 Traveler App: The Curved SVG Floating Tab Bar
In `apps/traveler-app/app/(tabs)/_layout.tsx`:
- Features an animated, custom SVG tab bar (`getCurvedPath`) with a curved notch peak (`PEAK = 22`), Reanimated translation for active icons, and dynamic label fades.
- Tabs: Home, Bookings, Search (floating center action), Tickets, Settings.
- **Evaluation**: Visually distinctive and modern (benchmarked against luxury consumer apps). However:
  - The curved SVG requires hardcoded window dimension calculations (`SCREEN_WIDTH`).
  - On non-standard aspect ratios or split-screen Android, the curved notch can drift off-center.
  - Interactive touch area for the center button requires high precision to avoid hitting the tab bar background instead of the button.

#### 3.2 Driver App: The High-Utility Tactical Tab Bar
In `apps/driver-app/components/TabBar.tsx`:
- Features a flat, high-contrast tab bar (`#09090b` background, `#27272a` top border).
- Animated pill indicator (`useSharedValue`, `withTiming`, 220ms duration).
- Dynamic role filtering: Conductors only see Trips, Scanner, and Profile (filtering out Offers and Live navigation).
- Haptic feedback integrated directly into tab switches (`DriverFeedback.tap()`).
- **Evaluation**: Highly effective for professional drivers. Fast, clear, and unencumbered by delicate geometry.

---

### 4. Navigation System Recommendations

1. **Standardize Admin Dashboard Header Architecture**:
   - Refactor `apps/web/app/[locale]/dashboard/admin/layout.tsx` to include an `<AdminDashboardHeader />` identical in contract to `OperatorDashboardHeader`.
   - Remove the absolute floating `<NotificationInbox />` from `layout.tsx`.
   - Delete the redundant `<header>` declarations duplicated across all 15+ admin pages.
2. **Implement Dynamic Breadcrumbs in Layout Headers**:
   - Instead of hardcoding breadcrumbs inside page files, create a shared `<DashboardBreadcrumb />` component that reads the current route segments.
3. **Harmonize Command Palettes**:
   - Merge `SearchDialog` and `OperatorSearchDialog` into a single, domain-aware `@moja/ui` command menu component.

# Moja Ride Design & Design-Engineering Audit
## 10. Responsive Design System

### 1. Breakpoint Strategy Across Monorepo

The web surfaces utilize Tailwind CSS v4's default breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

The mobile surfaces (React Native / Expo) rely on dynamic window dimensions (`useWindowDimensions`) and `react-native-safe-area-context`.

---

### 2. Dashboard Responsive Behavior

#### 2.1 Sidebar & Header Adaptation
- **Desktop (>= 1024px)**: Sidebar stays pinned or collapsible. Headers render breadcrumbs, search triggers, and action buttons.
- **Tablet / Mobile (< 1024px)**: Sidebar smoothly collapses into an off-canvas Sheet drawer (`@moja/ui/components/ui/sidebar.tsx`).
- **Pass**: The responsive sidebar transition behaves reliably across all three web dashboards.
- **Fail**: In Admin dashboard pages, because the notification bell is absolutely positioned at `top-1.5 right-4`, on mobile screens (<640px), the breadcrumb navigation in the header collides directly with the notification bell.

#### 2.2 Dashboard Grid Breakdowns & KPI Stacking
Across the dashboards, metric cards adapt using responsive grids:
- `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (Passenger overview & Operator overview).
- **Responsive Failure in Operator Dispatch**:
  In `apps/web/features/operator/views/operator-dashboard-view.tsx` line 253:
  `grid grid-cols-1 lg:grid-cols-3 gap-8 items-start`
  - On screens between 768px and 1023px (tablets / iPads often used by bus terminal station managers), the layout falls back to a single column (`grid-cols-1`).
  - The left 2/3 pane (departures list) stretches to full width, followed by hundreds of pixels of vertical scrolling before reaching the right-hand panel (activities and quick actions).
  - This creates an unergonomic tablet experience where essential operational actions are buried below lists.

---

### 3. Data Tables & Data Density Responsiveness

#### The Critical Distinction: Scrolling vs Card Transformation
When rendering tabular data on smaller viewports, enterprise systems use one of two intentional patterns:
1. **Horizontal Scroll with Pinned Columns**: Best for high-density operational data (e.g. settlements, ledgers, dispatch manifests).
2. **Responsive Card Transformation**: Best for simple consumer lists (e.g. recent transactions, saved passengers).

#### Current Implementation Flaws
1. **Admin Withdrawals Table (`withdrawals-table.tsx`)**:
   Uses `<Table className="min-w-[800px]">` wrapped in `overflow-x-auto`. This correctly allows horizontal scrolling on mobile viewports. However, column headers lack column pinning, meaning the operator loses sight of the withdrawal reference and operator name when scrolling horizontally to the action buttons.
2. **Saved Passengers View (`saved-passengers-view.tsx`)**:
   Renders a desktop HTML table on mobile without wrapping in `overflow-x-auto`, causing horizontal page blowout on mobile viewports below 480px.

---

### 4. Modal vs Sheet Responsive Patterns

In modern web design systems, complex dialogs adapt based on screen size:
- On desktop: Centered modal dialog (`Dialog`).
- On mobile: Bottom sheet drawer (`Drawer` / `Sheet`) sliding up from the bottom.

#### Audit Findings:
- **`BookingDetailDrawer` (Operator)**: Employs `@moja/ui/components/ui/sheet.tsx`, opening from the right on desktop (`w-[480px] sm:w-[540px]`). On mobile, it expands to 100% viewport width. Excellent responsive behavior.
- **`TicketScanner` (Operator)**: Renders a centered dialog on all viewport sizes. On small mobile screens, the camera viewfinder overflows the modal container height.
- **`ActionDrawer` (`@moja/ui/components/ui/action-drawer.tsx`)**: Implemented but rarely utilized across dashboard feature directories.

---

### 5. Responsive Design Recommendations

1. **Fix Tablet Viewport (768px–1024px) in Operator Dashboard**:
   Change `grid-cols-1 lg:grid-cols-3` to `grid-cols-1 md:grid-cols-12`, with departures taking 7 columns and operational actions taking 5 columns on tablet screens.
2. **Add Column Pinning to Financial Tables**:
   Pin the first column (Reference / Entity Name) and last column (Actions) during horizontal table scrolling.
3. **Wrap All Web Tables in Responsive Scrollers**:
   Audit all 18 table views to ensure `overflow-x-auto` is universally applied with smooth scrolling indicators.

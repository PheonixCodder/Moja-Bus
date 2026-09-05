# Moja Ride Design & Design-Engineering Audit
## 26. Half-Baked & Partially Implemented Design Systems

### 1. The Anatomy of "Half-Baked" Design

In large-scale codebases, features often stall halfway through implementation:
- A developer creates tokens for light mode, but neglects dark mode.
- A library component is created, but only 2 of 20 pages adopt it.
- CSS classes are written, but the runtime provider is never mounted.

These half-baked implementations create more architectural debt than having no system at all, because future developers assume the system works and build upon broken foundations.

---

### 2. Comprehensive Inventory of Half-Baked Systems in Moja Ride

```
Half-Baked Implementations
┌────────────────────────────────────────────────────────────────────────┐
│ 1. WEB DARK MODE                                                       │
│    - CSS: Complete .dark block in packages/theme/global.css            │
│    - Components: Hundreds of dark:... utility classes                  │
│    - Runtime: apps/web/app/layout.tsx NEVER adds .dark to <html>!      │
│    - Reality: 100% INOPERATIVE on web.                                 │
├────────────────────────────────────────────────────────────────────────┤
│ 2. TRAVELER APP DARK MODE                                              │
│    - CSS: Complete .dark:root block in apps/traveler-app/global.css    │
│    - Components: dark:bg-input/30 across components/ui                 │
│    - Runtime: app/_layout.tsx locks <ThemeProvider value={LightTheme}> │
│    - Reality: 100% FROZEN in light mode.                               │
├────────────────────────────────────────────────────────────────────────┤
│ 3. THE SHARED EMPTY STATE SYSTEM                                       │
│    - Component: packages/ui/empty.tsx with 6 composable subcomponents │
│    - Adoption: Used in only 7 files; 25+ files invent ad-hoc empty divs│
│    - Reality: 80% ABANDONED.                                           │
├────────────────────────────────────────────────────────────────────────┤
│ 4. THE DOMAIN STATUS BADGE SYSTEM                                      │
│    - Schema: Type-safe enums (TripStatus, BookingStatus, CompanyStatus)│
│    - UI: No shared status component in @moja/ui                        │
│    - Adoption: Re-declared independently in 15 separate files          │
│    - Reality: COMPLETE RE-INVENTION PER FILE.                          │
├────────────────────────────────────────────────────────────────────────┤
│ 5. DRIVER MOBILE TOKEN EXTRACTION                                      │
│    - State: Highly disciplined tokens in driver-app/constants/theme.ts │
│    - Leaked: Copied into web views as ghost classes (text-text-*)      │
│    - Architecture: Never formalized in @moja/theme                     │
│    - Reality: GHOST LEAKAGE WITHOUT REPO INTEGRATION.                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 3. Detailed Case Studies

#### 3.1 Web Dark Mode: The Phantom Theme
- In `packages/theme/global.css` lines 55–87:
  ```css
  .dark {
    --background: oklch(0.145 0 0);
    --foreground: oklch(0.985 0 0);
    --card: oklch(0.205 0 0);
    --border: oklch(1 0 0 / 10%);
    ...
  }
  ```
- In `apps/web/app/layout.tsx` lines 20–26:
  ```tsx
  <html lang="en" className={`${montserrat.variable} h-full antialiased`}>
    <body className="min-h-full flex flex-col font-sans">{children}</body>
  </html>
  ```
- Notice that `.dark` is **never added** to `<html>` or `<body>`. There is no theme switcher, no `next-themes`, and no cookie-based theme resolver.
- **The Consequence**: Every line of code written as `dark:bg-card` or `dark:text-white` across the entire web monorepo is currently dead code in production. Even worse, views that hardcoded `text-slate-900` did so because they believed the app was light-mode-only, guaranteeing that if someone ever flips `.dark` on, the entire admin surface will break.

#### 3.2 The Status System: 15 Independent Re-Inventions
Because `@moja/ui` never published a `<StatusBadge type="trip" status={status} />` component, every engineer who built a new page wrote their own:
- Operator Trips: `TRIP_STATUS_CONFIG` in `operator/lib/trips/status-config.ts`
- Admin Trips: `STATUS_CONFIG` in `admin/components/dispatch-trip-list.tsx`
- Operator Staff: `STATUS_CONFIG` in `operator/lib/staff.ts`
- Admin Staff: `ADMIN_STATUS_CONFIG` in `admin/lib/admin-staff.ts`
- Operator Fleet: `STATUS_CONFIG` in `operator/views/operator-fleet-view.tsx`
- Operator Drivers: `STATUS_CONFIG` in `operator/components/drivers/driver-status-badge.tsx`
- Admin Blog: `STATUS_CONFIG` in `admin/views/blog-edit-view.tsx`
- Traveler Bookings: `STATUS_CONFIG` in `traveler-app/features/booking/components/booking-card.tsx`

Each re-invention chose different colors, different icons, and different opacity levels for the exact same underlying enum states.

---

### 4. Remediation Plan for Half-Baked Systems

1. **Commit to Dark Mode or Strip It**:
   - Install and configure `next-themes` with a proper theme toggle in passenger and admin dashboards, OR strip out all `dark:` classes until a full dark-mode audit is executed.
2. **Publish Domain Components to `@moja/ui`**:
   - Create `@moja/ui/src/components/domain/status-badge.tsx` mapping all database enums to centralized colors and icons.
3. **Migrate to `@moja/ui/empty`**:
   - Perform a global search-and-replace to adopt `<Empty>` across all 25 empty-state views.

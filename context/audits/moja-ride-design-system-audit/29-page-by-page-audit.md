# Moja Ride Design & Design-Engineering Audit
## 29. Granular Page-by-Page Audit

### 1. Web — Passenger Dashboard (`apps/web/app/[locale]/dashboard/(passenger)`)

#### 1.1 Overview Page (`page.tsx` & `passenger-dashboard-view.tsx`)
- **Purpose**: Passenger hub displaying greeting, search trigger, active departures, recent bookings, wallet balance, and travel insights.
- **Visual Hierarchy Score**: `7.5 / 10`. Clear welcome banner, prominent live boarding pass when departure is near, logical 4-card metric grid.
- **Design System Violations**:
  - Unconstrained container width: Stretches infinitely across ultrawide monitors.
  - Radioactive neon green search CTA in header (`bg-neon`, `rgba(57,255,20,1)`).
  - Ad-hoc empty state with custom divs instead of `@moja/ui/empty.tsx`.
- **Verdict**: Strong UX structure; needs layout width constraint and brand color cleanup.

#### 1.2 Bookings View (`bookings/page.tsx` & `passenger-tickets-view.tsx`)
- **Purpose**: Display upcoming, completed, and pending passenger bookings with ticket access.
- **Visual Hierarchy Score**: `6.5 / 10`. Timeline presentation works well on mobile, but cards are verbose on desktop.
- **Design System Violations**:
  - Deep ghost token pollution: `bg-bg-base`, `text-text-primary`, `text-text-muted` appear over 15 times in this file alone.
  - Custom border dots and notch cutouts with unmapped backgrounds (`bg-bg-base`).
- **Verdict**: High technical debt; urgently requires token codemod.

#### 1.3 Saved Passengers View (`passengers/page.tsx` & `saved-passengers-view.tsx`)
- **Purpose**: Manage frequent travel companions (family members, colleagues).
- **Visual Hierarchy Score**: `5.5 / 10`. Uses a desktop HTML table that blows out horizontally on mobile viewports.
- **Design System Violations**:
  - Action triggers use tiny `text-[10px]` buttons with <20px touch height.
  - Table headers use unmapped `bg-bg-base`.
- **Verdict**: Redesign table with responsive cards on mobile viewports.

#### 1.4 Wallet View (`wallet/page.tsx` & `transaction-history.tsx`)
- **Purpose**: Display available balance, top-up trigger, and transaction ledger.
- **Visual Hierarchy Score**: `7.0 / 10`. Clean card layout with quick deposit buttons.
- **Design System Violations**:
  - Currency displayed as `XOF`, while top-up error schema says `500 FCFA`.
  - Transaction table headers use unmapped `bg-bg-base`.
- **Verdict**: Unify currency formatting and replace table header styles.

---

### 2. Web — Operator Dashboard (`apps/web/app/[locale]/dashboard/operator/(dashboard)`)

#### 2.1 Overview Dashboard (`page.tsx` & `operator-dashboard-view.tsx`)
- **Purpose**: Real-time operational overview for station managers and dispatchers.
- **Visual Hierarchy Score**: `5.5 / 10`. Jarring pitch-black slate banner dominates the screen; departures table pushed below fold.
- **Design System Violations**:
  - `bg-slate-900` banner in light-mode UI.
  - KPI cards use unmapped `bg-bg-surface` and `text-text-primary`.
  - Monospace font (`font-mono`) used for currency numbers instead of standard font with `tabular-nums`.
- **Verdict**: Invert hero card to light-mode card; elevate live departures higher on the page.

#### 2.2 Bookings View (`bookings/page.tsx` & `operator-bookings-view.tsx`)
- **Purpose**: High-velocity passenger manifest check-in and search.
- **Visual Hierarchy Score**: `4.2 / 10`. "Card Soup" anti-pattern. 50 stacked cards force 7,000px of scrolling.
- **Design System Violations**:
  - No tabular data structure.
  - Ghost tokens in every card row (`text-text-muted`, `bg-bg-surface`).
  - Lacks column sorting (by seat, departure time, or status).
- **Verdict**: **CRITICAL REDESIGN CANDIDATE**. Replace card stack with a compact `@tanstack/react-table`.

#### 2.3 Fleet Management (`fleet/page.tsx` & `operator-fleet-view.tsx`)
- **Purpose**: Bus vehicle registry, maintenance status, seat configuration.
- **Visual Hierarchy Score**: `6.8 / 10`. Vehicle cards with status badges and seat capacity.
- **Design System Violations**:
  - Re-declares local `STATUS_CONFIG` for bus statuses (`ACTIVE`, `MAINTENANCE`, `INACTIVE`).
- **Verdict**: Good layout; migrate status badges to shared component.

#### 2.4 Schedules & Trips Views (`schedules/`, `trips/`)
- **Purpose**: Departure window planning, pricing grids, driver assignments.
- **Visual Hierarchy Score**: `6.5 / 10`. Comprehensive calendar and timeline selectors.
- **Design System Violations**:
  - Inconsistent date formatting locales.
  - Multi-segment pricing inputs lack inline masking.
- **Verdict**: High operational utility; needs table density standardization.

---

### 3. Web — Admin Dashboard (`apps/web/app/[locale]/dashboard/admin`)

#### 3.1 Admin Overview (`page.tsx` & `admin-dashboard-view.tsx`)
- **Purpose**: Executive visibility into platform volume, treasury solvency, and activity.
- **Visual Hierarchy Score**: `7.0 / 10`. Outstanding separation of Commercial volume (GMV) from Treasury liabilities (Escrow/Float).
- **Design System Violations**:
  - Hardcoded `text-slate-900` headings and `text-slate-500` descriptions guarantee dark mode failure.
  - Layout bell icon overlays page-level action headers.
- **Verdict**: Strong UX architecture; resolve header layout and hardcoded slate colors.

#### 3.2 Withdrawals & Payouts View (`withdrawals/page.tsx` & `withdrawals-table.tsx`)
- **Purpose**: Approving, rejecting, and reconciling carrier bank payouts.
- **Visual Hierarchy Score**: `7.5 / 10`. Uses `@tanstack/react-table` with status badges, amount formatting, and action drawers.
- **Design System Violations**:
  - Filter bar hardcodes French locale `{ locale: fr }`.
  - Filter bar uses unmapped `bg-bg-base` and `bg-bg-muted`.
  - Table lacks column pinning during horizontal mobile scrolling.
- **Verdict**: Mature table implementation; clean up filter tokens and add column pinning.

#### 3.3 Verification Queue (`verifications/page.tsx` & `admin-verifications-view.tsx`)
- **Purpose**: Carrier KYC and legal compliance review.
- **Visual Hierarchy Score**: `6.8 / 10`. Document preview side drawers.
- **Design System Violations**:
  - Interactive filter cards implemented as raw `div` tags with `cursor-pointer` (keyboard accessibility violation).
- **Verdict**: Wrap interactive cards in accessible button primitives.

---

### 4. Traveler Mobile App (`apps/traveler-app`)

#### 4.1 Home & Search Screen (`app/(tabs)/index.tsx`, `search.tsx`)
- **Purpose**: Destination discovery, date selection, origin-destination route search.
- **Visual Hierarchy Score**: `8.0 / 10`. Clean mobile cards, rapid origin/destination swap buttons.
- **Design System Violations**:
  - Touch targets on auxiliary buttons fall below 44px.
  - Section headings use web markdown `h2` with underline borders.
- **Verdict**: Polish typography scale and enlarge touch targets.

#### 4.2 Ticket & Booking Details (`features/booking/components/ticket-sheet.tsx`)
- **Purpose**: Boarding pass QR code display and native sharing.
- **Visual Hierarchy Score**: `8.5 / 10`. High visual fidelity, clear QR display, offline capability, native sharing with haptics.
- **Verdict**: **Best-in-class component** in the mobile app. Maintain as-is.

#### 4.3 Mobile Seat Selection (`features/booking/components/passenger-seat-map.tsx`)
- **Purpose**: Real-time seat selection in bus layout.
- **Visual Hierarchy Score**: `8.8 / 10`. Realistic seat silhouettes, solid brand magenta selection, high-contrast states.
- **Verdict**: Outstanding. Web seat map should be updated to copy this mobile design.

---

### 5. Driver & Conductor Mobile App (`apps/driver-app`)

#### 5.1 In-Cab Trips & Live Navigation (`app/(tabs)/trips.tsx`, `live.tsx`)
- **Purpose**: Active trip monitoring, passenger manifest, route turns.
- **Visual Hierarchy Score**: `9.0 / 10`. High-contrast dark OLED interface, large touch targets (52px-60px), tablet `maxWidth: 480` constraint.
- **Verdict**: Exemplary tactical vehicle UI. Keep design language intact; extract tokens into shared theme package.

#### 5.2 QR Ticket Scanner (`app/(tabs)/scanner.tsx`)
- **Purpose**: High-speed boarding ticket validation via camera.
- **Visual Hierarchy Score**: `8.8 / 10`. Camera viewfinder with instant haptic confirmation (`DriverFeedback.success()`), large validation status card.
- **Verdict**: Superb in-cab tool. Maintain as-is.

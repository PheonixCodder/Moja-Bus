# Moja Ride Design & Design-Engineering Audit
## 30. Priority Remediation Plan & Transformation Roadmap

### 1. Phased Transformation Overview

The remediation plan is organized into 7 sequential, non-disruptive phases:

```
Remediation Phases
┌────────────────────────────────────────────────────────┐
│ Phase 0: Critical UX, Ghost Tokens & Accessibility (P0)│
├───────────────────────────┬────────────────────────────┘
│ Phase 1: Foundation       │ Tokens, Colors, Typography (P1)
├───────────────────────────┼────────────────────────────┐
│ Phase 2: Shared UI        │ Button, Badge, Empty, States (P1)
├───────────────────────────┼────────────────────────────┤
│ Phase 3: Product Patterns │ Data Tables, Layout Headers (P1)
├───────────────────────────┼────────────────────────────┤
│ Phase 4: Platform Harmony │ Mobile & Web Parity (P2)
├───────────────────────────┼────────────────────────────┤
│ Phase 5: Premium Polish   │ Motion, Haptics, Skeletons (P3)
├───────────────────────────┼────────────────────────────┤
│ Phase 6: Governance       │ Linters, CI Guardrails, Docs (P4)
└───────────────────────────┴────────────────────────────┘
```

---

### Phase 0: Critical UX, Ghost Tokens & Accessibility (P0 — Immediate)

*Goal: Stop active UI regressions, fix broken layout collisions, and protect user trust.*

1. **Codemod All Ghost Tokens in `apps/web`**:
   - Scope: 32+ files across Passenger, Operator, and Admin dashboards.
   - Action:
     - `bg-bg-base` → `bg-background` or `bg-card`
     - `bg-bg-surface` → `bg-card`
     - `bg-bg-elevated` → `bg-muted`
     - `bg-bg-muted` → `bg-muted`
     - `text-text-primary` → `text-foreground`
     - `text-text-secondary` → `text-muted-foreground`
     - `text-text-muted` → `text-muted-foreground`
     - `hover:border-border-strong` → `hover:border-border`
   - Impact: Restores background fills, card depth, and text contrast across all web views.

2. **Fix Admin Dashboard Header Architecture**:
   - Scope: `apps/web/app/[locale]/dashboard/admin/layout.tsx` and 15+ admin pages.
   - Action:
     - Move common `<header>` with sidebar trigger into `layout.tsx`.
     - Anchor `<NotificationInbox />` inside the header flow, removing `absolute top-1.5 right-4 z-40`.
     - Remove redundant `<header>` blocks duplicated across all child admin pages.
   - Impact: Eliminates button-blocking collisions and deletes ~180 lines of duplicated boilerplate.

3. **Remove Rogue Radioactive Green CTA**:
   - Scope: `apps/web/features/dashboard/components/dashboard-header.tsx`.
   - Action: Replace `bg-neon` and `rgba(57,255,20,1)` box shadow with `bg-primary text-primary-foreground`.
   - Impact: Restores brand integrity on the consumer passenger dashboard.

4. **Implement Missing Route Error Boundaries**:
   - Scope: `apps/web/app/[locale]/dashboard/(passenger)` and `apps/web/app/[locale]/dashboard/admin`.
   - Action: Create `error.tsx` catching tRPC and network failures without crashing the sidebar navigation shell.
   - Impact: Prevents full-screen crashes on query failures.

---

### Phase 1: Design System Foundation (P1 — Week 1–2)

*Goal: Create a single source of truth for design tokens across Web, Traveler Mobile, and Driver Mobile.*

1. **Re-architect `packages/theme`**:
   - Fix `Colors.light.surface` bug (change `#0f1b2d` to `#ffffff`).
   - Add missing spacing tokens (`space-3` = 12px, `space-2.5` = 10px).
   - Define semantic status tokens: `success`, `warning`, `info`, `destructive` in OKLCH, Hex, and RGB.
2. **Standardize Tailwind CSS v4 Theme**:
   - Update `packages/theme/global.css` with explicit `@theme inline` mappings for all semantic tokens.
3. **Harmonize Currency Presentation**:
   - Standardize on **"FCFA"** or **"XOF"** across all user-facing interfaces.
   - Build `<CurrencyAmount value={amount} format="compact" | "full" />` component with non-breaking spaces and locale-aware number formatting.

---

### Phase 2: Shared Component Harmonization (P1 — Week 3–4)

*Goal: Upgrade `@moja/ui` to eliminate ad-hoc component re-invention.*

1. **Upgrade `Button` (`@moja/ui/src/components/ui/button.tsx`)**:
   - Increase default height to `h-9` (36px) or `h-10` (40px) to meet touch accessibility requirements.
   - Add native `loading?: boolean` prop rendering a standardized spinner while locking button dimensions.
   - Add `icon` and `iconPosition` slots.
2. **Expand `Badge` (`@moja/ui/src/components/ui/badge.tsx`)**:
   - Add `success`, `warning`, and `info` variants with subtle backgrounds (`bg-success/10 text-success border-success/20`).
3. **Build Centralized Domain `<StatusBadge>`**:
   - Create `@moja/ui/src/components/domain/status-badge.tsx`.
   - Maps `TripStatus`, `BookingStatus`, `CompanyStatus`, and `StaffStatus` to uniform colors, localized labels, and icons.
   - Decommission the 15 conflicting local `STATUS_CONFIG` maps across the monorepo.
4. **Enforce `<Empty>` Monorepo-Wide**:
   - Refactor the 25 ad-hoc empty state implementations to consume `@moja/ui/empty.tsx`.

---

### Phase 3: Product Pattern Standardization (P2 — Week 5–6)

*Goal: Resolve data density failures in operational software.*

1. **Re-engineer Operator Bookings View**:
   - Replace the 50-card `BookingRow` stack in `operator-bookings-view.tsx` with a high-density `@tanstack/react-table`.
   - Implement compact 44px rows, sortable columns, and instant check-in keyboard shortcuts.
2. **Invert Light-Mode Operator Hero Card**:
   - Refactor the `bg-slate-900` banner in `operator-dashboard-view.tsx` to match light-mode card styling.
3. **Replace Full-Page Spinner in Operator `loading.tsx`**:
   - Implement a multi-card structural skeleton matching the dashboard layout.
4. **Align Passenger Seat Map with Mobile Quality**:
   - Replace web's washed-out pastel pink selection with mobile's high-contrast brand magenta (`bg-[#ee237c] text-white`).
   - Add bus seat top/bottom corner radii to match mobile silhouette.

---

### Phase 4: Platform Harmonization (P2 — Week 7–8)

*Goal: Align Traveler Mobile and Driver Mobile with monorepo tokens.*

1. **Fix Traveler Mobile Typography**:
   - Replace web markdown prose typography in `apps/traveler-app/components/ui/text.tsx` with mobile-tuned scale matching `driver-app/constants/theme.ts`.
   - Eliminate `border-b pb-2` underline rules on mobile headings.
2. **Enlarge Mobile Touch Targets**:
   - Enforce 44px minimum touch height on all buttons in `apps/traveler-app`.
3. **Integrate Driver Mobile with Shared Theme**:
   - Connect `apps/driver-app` to `@moja/theme` tokens, removing hardcoded hex style objects.

---

### Phase 5: Premium Polish & Perceived Performance (P3 — Week 9–10)

*Goal: Achieve world-class interaction quality benchmarked against Linear and Stripe.*

1. **Implement React View Transitions**:
   - Enable fluid view transitions on web between overview pages and detail drawers.
2. **Gesture-Driven Mobile Sheets**:
   - Upgrade traveler ticket sheets to gesture-driven bottom sheets with spring physics.
3. **Optimistic Mutations**:
   - Provide instant optimistic UI feedback when operators check in passengers or toggle trip statuses.

---

### Phase 6: Design System Governance & CI Guardrails (P4 — Ongoing)

*Goal: Prevent design drift from returning.*

1. **Biome / ESLint AST Lint Rules**:
   - Fail CI if an undefined utility class (e.g. `bg-bg-*`, `text-text-*`) is introduced.
   - Flag raw `slate-*` color classes where semantic tokens (`text-foreground`, `bg-card`) must be used.
2. **Design System Living Catalog**:
   - Maintain an interactive Storybook catalog documenting all `@moja/ui` components and tokens.

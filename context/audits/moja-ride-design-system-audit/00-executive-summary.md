# Moja Ride Design & Design-Engineering Audit
## 00. Executive Summary

### Overview & Audit Metadata
- **Product**: Moja Ride Monorepo (Web Passenger Dashboard, Web Operator Dashboard, Web Admin Dashboard, Traveler Mobile App, Driver/Conductor Mobile App, `@moja/ui`, `@moja/theme`)
- **Date**: September 2026
- **Auditor**: Senior Product Design Engineer & Design Systems Architect
- **Repository Scope**: 100% monorepo surface inspected (`.tsx`, `.ts`, `.css`, configuration, tokens, layouts, views, components)
- **Methodology**: Context-Driven Development (CDD) Design Systems Audit, comparing implementation against production benchmarks (Uber, Stripe, Linear, Airbnb, Vercel).

---

### Overall Design Score: `5.4 / 10`

| Dimension | Score | Assessment |
| :--- | :---: | :--- |
| **Visual Polish & Modernity** | `6.2 / 10` | High-quality individual components and modern layout skeletons (Base UI / Lucide), but marred by rogue color choices and visual collisions. |
| **Design System Architecture** | `3.8 / 10` | Severe fragmentation: 3 disconnected styling regimes, ghost token pollution across 32+ web files, and zero automated token governance. |
| **Cross-Product Consistency** | `4.2 / 10` | The same domain concepts (e.g. `TripStatus.DEPARTED`, ticket pricing, button sizes, headers) have completely divergent visual executions across apps. |
| **Information Hierarchy & Density** | `5.8 / 10` | Passenger web has good breathing room; Operator web suffers from "card soup" (50 separate cards per page instead of an operational table); Admin is functional but inconsistent. |
| **Accessibility (a11y)** | `5.0 / 10` | Sub-standard touch targets on web (h-7/h-8 buttons) and traveler mobile (h-9/h-8); interactive `div` elements without keyboard handlers; dark-mode contrast failures from hardcoded `text-slate-900`. |
| **State Completeness** | `4.5 / 10` | Shared `Empty` component bypassed on 80% of screens; full-page layout spinners in Operator `loading.tsx`; missing `error.tsx` in Passenger and Admin; buttons lack native `loading` state. |
| **Financial Trust UX** | `6.5 / 10` | Good hold countdown timers and QR code tickets, but currency terminology is fractured between `XOF`, `FCFA`, `CFA`, and `XOF / FCFA` with conflicting thousand separators. |
| **Mobile Adaptability** | `6.0 / 10` | Driver app has an opinionated in-cab UI (`ScreenShell`, 52-60px buttons), but Traveler app uncritically copies web prose typography (30px `h2` with border lines). |

---

### Design-System Maturity: `Level 2.2 / 5 (Reusable with Nascent Systematics)`

The Moja Ride ecosystem sits between **Level 2 (Reusable)** and **Level 3 (Systematic)**:
- A strong set of 60 primitive UI components exists in `packages/ui` based on `@base-ui/react` and Radix.
- However, the system is **not governed or enforced**: developers routinely bypass primitives, invent phantom CSS classes, duplicate status definitions, and hardcode colors.
- The monorepo has **three competing token systems**: Web uses Tailwind v4 with OKLCH CSS variables; Driver Mobile uses a custom NativeWind/Lingua token palette with hardcoded hex values; Traveler Mobile imports OKLCH tokens but immediately overrides them with Tailwind v3 HSL values.

---

### The Biggest Strengths

1. **Modern Foundation Stack**: Next.js 16 (App Router), Tailwind CSS v4, Base UI primitives (`@base-ui/react`), Expo Router v57, and NativeWind. This provides high composability without legacy CSS-in-JS overhead.
2. **Specialized In-Cab Driver Experience**: `apps/driver-app` does not attempt to clone the desktop web UI. It implements a dedicated dark-mode-only interface (`#09090b`), generous touch targets (`h-13` / `h-15` buttons, `h-14` inputs), and tactile haptic feedback (`DriverFeedback.tap()`) tailored for in-vehicle operation.
3. **Strong Domain Skeletons**: Real domain features—such as the interactive passenger seat map, live boarding pass, QR ticket presentation, hold expiration countdowns, and withdrawal approval drawers—have thoughtful functional architectures.
4. **Fluid Web Layout Structure**: The sidebar system (`@moja/ui/components/ui/sidebar`) across Passenger and Operator dashboards provides smooth collapse/expand states with cookie persistence and backdrop-blur headers.
5. **URL-Synchronized Filter State**: Widespread adoption of `nuqs` across dashboard views guarantees shareable, bookmarkable operational views.

---

### The Biggest Problems

1. **Ghost / Phantom Token Pollution**: Over 32 files across `apps/web` use undefined CSS classes: `text-text-primary`, `text-text-secondary`, `text-text-muted`, `bg-bg-base`, `bg-bg-surface`, `bg-bg-elevated`, `hover:border-border-strong`. These classes do not exist in web CSS—they were copied from the driver app's NativeWind tokens. In the browser, elements with these classes render with no styling or browser-default fallback.
2. **Fractured Color Regimes & Anti-Patterns**:
   - `apps/web/features/dashboard/components/dashboard-header.tsx`: Features an unstyled `bg-neon` button with a radioactive green box shadow (`rgba(57,255,20,1)`), on a platform whose primary brand color is `#ee237c` (Moja Pink).
   - `apps/web/features/operator/views/operator-dashboard-view.tsx`: Features a pitch-black `bg-slate-900` hero banner in the middle of a light-mode operational dashboard.
   - Four competing neutral palettes coexist simultaneously: OKLCH semantic tokens, Tailwind `slate-*`, Tailwind `zinc-*`, and undefined `text-text-*`.
3. **Half-Baked Dark Mode**:
   - Web CSS defines complete `.dark` variables, and hundreds of components include `dark:...` classes. However, `apps/web/app/layout.tsx` never applies `.dark` to `<html>`, nor is there any theme provider (`next-themes`). Web dark mode is completely non-functional.
   - Meanwhile, in light mode, dozens of admin views hardcode `text-slate-900` or `text-slate-800`, which will instantly break when dark mode is enabled.
   - Traveler mobile is permanently locked to `LightTheme`, while Driver mobile is permanently locked to dark mode.
4. **Status System Chaos**: Domain statuses (`TripStatus`, `BookingStatus`, `CompanyStatus`, `StaffStatus`) are independently defined across at least 15 separate files with conflicting color palettes, badge styling, and icons. For example, a "Departed" trip is rendered as `slate-600` with an `ArrowRight` icon in the Operator dashboard, but as `purple-100` / `purple-700` with a `BusIcon` in the Admin dashboard.
5. **Operational Data Density Failure in Operator Dashboard**: In `apps/web/features/operator/views/operator-bookings-view.tsx`, the primary bookings list renders up to 50 individual, verbose `<Card>` items stacked vertically rather than an operational data table. An operator looking for a passenger must scroll through yards of cards instead of scanning a compact table.
6. **Bypassed Primitives & Component Abandonment**:
   - `@moja/ui` provides an `Empty` component suite (`Empty`, `EmptyHeader`, `EmptyTitle`, `EmptyDescription`, `EmptyContent`, `EmptyMedia`). It is utilized in only 7 files. Every other page constructs ad-hoc empty states using arbitrary divs, random padding, and mismatched icons.
   - `Button` in `@moja/ui` has no `loading` state, forcing developers to manually inject `<Spinner>` or `<Loader2>` across dozens of forms.
   - `Badge` in `@moja/ui` lacks `success`, `warning`, and `info` variants, forcing developers to invent raw utility classes like `bg-emerald-500/10 text-emerald-600` or `bg-amber-100 text-amber-700`.

---

### Top 15 Highest Priority Fixes (Remediation Masterlist)

| Priority | Area | File / Target | Finding & Remediation Action |
| :---: | :--- | :--- | :--- |
| **P0** | Design System | `packages/theme/global.css`, `apps/web` | **Resolve Ghost Tokens**: Eliminate `text-text-primary`, `bg-bg-base`, etc. across all 32 web files. Replace with standard semantic tokens: `text-foreground`, `text-muted-foreground`, `bg-background`, `bg-card`, `border-border`. |
| **P0** | Brand Polish | `apps/web/features/dashboard/components/dashboard-header.tsx` | **Remove Radioactive Green**: Replace `bg-neon` and `rgba(57,255,20,1)` box-shadow with brand `bg-primary text-primary-foreground`. |
| **P0** | Architecture | `apps/web/app/layout.tsx`, `apps/web` | **Formalize Dark Mode Strategy**: Either cleanly activate `next-themes` with a proper theme provider and audit all hardcoded `text-slate-900` classes, or explicitly disable `dark:` utility branches until dark mode is officially supported. |
| **P1** | Shared UI | `packages/ui/src/components/ui/badge.tsx` | **Add Semantic Badge Variants**: Add `success`, `warning`, and `info` variants to `Badge` so developers stop writing ad-hoc green/amber/blue utility strings. |
| **P1** | Shared UI | `packages/ui/src/components/ui/button.tsx` | **Standardize Control Heights & Add Loading**: Upgrade default button height from `h-8` (32px) to `h-9`/`h-10` (36px/40px). Add built-in `loading` prop with integrated spinner. |
| **P1** | Domain UI | Monorepo-wide status badges | **Centralize Status Badge System**: Create `@moja/ui/components/domain/trip-status-badge.tsx` and `booking-status-badge.tsx`. Unify the conflicting color and icon definitions between Admin and Operator. |
| **P1** | Operator UX | `apps/web/features/operator/views/operator-bookings-view.tsx` | **Replace Card Soup with Data Table**: Convert the 50-card booking list into a compact, high-density `@tanstack/react-table` with sorting, filtering, and quick check-in actions. |
| **P1** | Admin Layout | `apps/web/app/[locale]/dashboard/admin/layout.tsx` | **Fix Floating Notification Header Collision**: Admin layout currently places `<NotificationInbox />` as an unanchored absolute overlay at `top-1.5 right-4`, while individual pages define their own `<header>`. Move the header into `layout.tsx` as done in Operator and Passenger layouts. |
| **P1** | Mobile UX | `apps/traveler-app/components/ui/text.tsx` | **Fix Desktop Typography in Mobile App**: Remove the web markdown `text-4xl` and `border-b pb-2` headings from `text.tsx`. Adopt an intentional mobile typography scale matching iOS/Android conventions. |
| **P2** | Financial UX | Monorepo-wide currency presentation | **Unify Currency Formatter**: Create a single `<CurrencyAmount value={amount} />` component. Resolve the collision between `XOF`, `FCFA`, and `CFA`, and enforce consistent locale-aware number formatting. |
| **P2** | Seat Map | `passenger-seat-map.tsx` (Web vs Mobile) | **Harmonize Seat Selection Design**: Align web's pastel pink selection (`bg-pink-100 ring-pink-300`) with mobile's high-contrast brand primary (`bg-[#ee237c] text-white`). |
| **P2** | Error Handling | `apps/web/app/[locale]/dashboard/(passenger)`, `admin` | **Implement Missing Error Boundaries**: Create `error.tsx` for Passenger and Admin dashboards to prevent unhandled Suspense/tRPC failures from collapsing the whole layout. |
| **P2** | Loading States | `apps/web/app/[locale]/dashboard/operator/(dashboard)/loading.tsx` | **Replace Full-Page Spinner with Content Skeleton**: Replace the bare centered spinner with a multi-card KPI skeleton to eliminate visual flashing on route navigation. |
| **P3** | Empty States | Monorepo-wide | **Adopt `@moja/ui/empty` Everywhere**: Refactor the ~25 ad-hoc empty state implementations across web views to consume the formal `Empty` component. |
| **P3** | Token Architecture | `packages/theme/tokens.ts` | **Fix Theme Token Inconsistencies**: Fix `Colors.light.surface` which is currently set to dark navy (`#0f1b2d`) in light mode. Add missing spacing tokens (12px, etc.). |

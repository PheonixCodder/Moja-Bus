# Moja Ride Design & Design-Engineering Audit
## 27. Design Debt & Duplication Analysis

### 1. The Design Debt Matrix

Design debt accumulated across the Moja Ride monorepo is categorized by severity:
- **Critical (P0)**: Actively damages user trust, accessibility, or core task completion.
- **High (P1)**: Major inconsistency or architectural flaw that increases ongoing development cost.
- **Medium (P2)**: Meaningful polish and maintainability debt.
- **Low (P3)**: Minor aesthetic inconsistency.

| Debt Item | Severity | Affected Apps | Technical Description | Remediation Direction |
| :--- | :---: | :--- | :--- | :--- |
| **Ghost Tokens** | **Critical** | `apps/web` (32+ files) | `text-text-primary`, `bg-bg-base`, etc. are unmapped in CSS, failing silently. | Replace with semantic tokens (`text-foreground`, `bg-card`). |
| **Admin Layout Header Break** | **Critical** | `apps/web` (Admin) | Unanchored floating notification bell blocks page buttons; duplicate headers in 15 pages. | Move header to `layout.tsx`; anchor bell properly. |
| **Missing Route Error Boundaries** | **Critical** | `apps/web` (Passenger & Admin) | Uncaught queries crash the whole layout to Next.js 500 error page. | Create `error.tsx` in Passenger and Admin. |
| **Operator Card Soup** | **High** | `apps/web` (Operator) | 50 stacked cards for bookings force 7,000px of scrolling. | Replace with compact `@tanstack/react-table`. |
| **Status Badge Duplication** | **High** | All apps (15 files) | Local `STATUS_CONFIG` maps conflict in color and icons. | Create `@moja/ui/components/domain/status-badge.tsx`. |
| **Currency Notation Drift** | **High** | All apps | Mixing XOF, FCFA, and CFA with conflicting thousand separators. | Standardize on FCFA or XOF; build `<CurrencyAmount>`. |
| **Traveler Desktop Typography** | **High** | `apps/traveler-app` | Web article markdown typography (`h1` 36px, `h2` with border-b) on mobile. | Replace `text.tsx` with mobile-tuned scale. |
| **Undersized Web Buttons** | **High** | `packages/ui`, `apps/web` | Default `h-8` (32px) button fails mobile touch ergonomics. | Upgrade default button to `h-9`/`h-10` (36px/40px). |
| **Missing Button Loading State** | **Medium** | `packages/ui`, `traveler-app`| Manual insertion of `<Spinner>` / `<Loader2>` across 40+ forms. | Add native `loading?: boolean` prop to `Button`. |
| **Empty State Abandonment** | **Medium** | `apps/web` (25+ views) | `@moja/ui/empty.tsx` bypassed in favor of ad-hoc divs. | Enforce `@moja/ui/empty` monorepo-wide. |
| **Operator Full-Screen Spinner**| **Medium** | `apps/web` (Operator) | `loading.tsx` blanks out the entire screen on tab changes. | Replace with layout-matched multi-card skeleton. |
| **Radioactive Neon Button** | **Medium** | `apps/web` (Passenger) | Rogue `bg-neon` CTA in dashboard header. | Convert to brand magenta `bg-primary`. |
| **Surface Token Bug in Theme** | **Medium** | `packages/theme` | `Colors.light.surface` set to `#0f1b2d` (midnight blue) in light mode. | Fix `surface` to `#ffffff` in `tokens.ts`. |
| **Date Picker Hardcoded Locale**| **Low** | `apps/web` (Admin) | French `{ locale: fr }` hardcoded in English dashboard views. | Pass active `next-intl` locale dynamically. |

---

### 2. Code Duplication Inventory

#### 2.1 Duplicated Page Headers in Admin Dashboard
Every single admin page file implements its own redundant header:
- `apps/web/app/[locale]/dashboard/admin/page.tsx`
- `apps/web/app/[locale]/dashboard/admin/users/travelers/page.tsx`
- `apps/web/app/[locale]/dashboard/admin/users/operators/page.tsx`
- `apps/web/app/[locale]/dashboard/admin/staff/page.tsx`
- `apps/web/app/[locale]/dashboard/admin/settings/page.tsx`
- `apps/web/app/[locale]/dashboard/admin/operations/page.tsx`
- `apps/web/app/[locale]/dashboard/admin/content/posts/page.tsx`
- ...and 8 more files.
Each file copy-pastes:
```tsx
<header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-bg-base px-4">
  <SidebarTrigger className="text-text-muted hover:text-text-primary" />
  <Separator orientation="vertical" className="h-4 bg-border" />
  <nav className="flex items-center gap-1 text-xs text-text-muted">...</nav>
</header>
```
**Total Duplicated Lines**: ~180 lines of identical header boilerplate.

#### 2.2 Duplicated Ticket Scanner Views
- In `apps/web/features/operator/components/ticket-scanner.tsx`
- In `apps/driver-app/app/(tabs)/scanner.tsx`
While using different camera libraries (web HTML5-QRCode vs Expo Camera), the ticket result card layout, passenger validation badges, and check-in confirmation flows are independently coded and visually disparate.

---

### 3. Estimated Engineering Cost of Design Debt

- **Visual QA Friction**: Every new feature requires checking whether classes like `bg-bg-base` will break on production builds.
- **Double-Work on Bugfixes**: Changing the color or label of a trip status requires editing 15 different files.
- **Conversion Degradation**: Inconsistent currency notations (XOF vs FCFA) and surprise checkout fees decrease mobile booking conversion by an estimated 8–15% in e-commerce benchmarks.
- **Maintenance Overhead**: Carrying unused dark mode CSS in Traveler Mobile and non-functional `.dark` rules in Web adds cognitive drag to every design engineering task.

# Moja Ride Design & Design-Engineering Audit
## 02. Design System Architecture

### 1. Monorepo Package Topology & Dependencies

The Moja Ride design surface spans three applications and two packages:

```
                      ┌────────────────────────┐
                      │    @moja/theme         │
                      │  (global.css, tokens)  │
                      └──────────┬─────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
      ┌────────────────────┐          ┌───────────────────────┐
      │     @moja/ui       │          │   apps/traveler-app   │
      │ (Base UI, globals) │          │  (NativeWind + Expo)  │
      └──────────┬─────────┘          └───────────────────────┘
                 │
                 ▼
      ┌────────────────────┐          ┌───────────────────────┐
      │     apps/web       │          │   apps/driver-app     │
      │   (Next.js 16)     │          │  (NativeWind + Expo)  │
      └────────────────────┘          └───────────────────────┘
```

#### Monorepo Architecture Analysis
1. **`packages/theme`**: Intended to be the single source of truth for design tokens. Contains `global.css` (OKLCH variables for light/dark) and `tokens.ts` (React Native JS tokens).
2. **`packages/ui`**: Component library containing 60 Shadcn/Base-UI primitives styled with `@import "@moja/theme/global.css"` and Tailwind CSS v4.
3. **`apps/web`**: Imports `@moja/ui/globals.css` in `apps/web/app/globals.css`. Serves all three web dashboards (Passenger, Operator, Admin).
4. **`apps/traveler-app`**: Imports `@moja/theme/global.css`, but immediately overrides the root CSS variables with Tailwind v3 HSL values inside `apps/traveler-app/global.css`.
5. **`apps/driver-app`**: **Does not import `@moja/theme` at all**. It defines its own standalone Tailwind theme in `apps/driver-app/global.css` and its own TypeScript design tokens in `apps/driver-app/constants/theme.ts`.

---

### 2. The Three Competing Design Systems

Instead of one unified design system, Moja Ride operates three completely divergent design systems in parallel:

| System Attribute | System A: Web (`apps/web` + `@moja/ui`) | System B: Traveler (`apps/traveler-app`) | System C: Driver (`apps/driver-app`) |
| :--- | :--- | :--- | :--- |
| **Color Color Space** | OKLCH (`oklch(1 0 0)`, `oklch(0.145 0 0)`) | HSL raw channels (`0 0% 100%`, `334 86% 54%`) | Hex (`#ee237c`, `#09090b`, `#18181b`) |
| **Component Primitives** | Base UI (`@base-ui/react`) + CVA | RN Primitives (`@rn-primitives`) + CVA | Custom React Native (`TouchableOpacity`, `Text`) |
| **Iconography Family** | `lucide-react` | `@hugeicons/react-native` + `@hugeicons/core-free-icons` | `@hugeicons/react-native` + `@hugeicons/core-free-icons` |
| **Default Button Height**| `h-8` (32px) | `h-10` / `sm:h-9` (40px / 36px) | `sm:h-10`, `md:h-13`, `lg:h-15` (40px, 52px, 60px) |
| **Token Naming Scheme** | Shadcn standard (`--background`, `--card`, `--muted`) | Shadcn standard (`--background`, `--card`, `--muted`) | Lingua / Custom (`--color-bg-app`, `--color-bg-card`, `--color-text-primary`) |
| **Dark Mode Strategy** | CSS variables defined; runtime inactive | CSS variables defined; runtime locked to LightTheme | Locked to dark mode permanently (`#09090b`) |

---

### 3. Ghost Token Pollution in `apps/web`

The most critical architectural bug in the repository is the proliferation of **ghost tokens** across `apps/web`.

#### What Happened
During development, UI code or styling conventions from `apps/driver-app` (which uses custom NativeWind tokens like `--color-bg-app`, `--color-text-primary`, `--color-text-muted`) were copied into `apps/web`. However, those classes were **never added to web's Tailwind v4 configuration or CSS theme**.

#### Evidence in Code
Classes actively used across 32+ web files:
- `text-text-primary`
- `text-text-secondary`
- `text-text-muted`
- `text-text-muted/40`
- `bg-bg-base`
- `bg-bg-surface`
- `bg-bg-elevated`
- `bg-bg-muted`
- `hover:border-border-strong`

#### File-by-File Evidence

1. `apps/web/features/booking/views/passenger-tickets-view.tsx`
   - Line 149: `<div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-base">`
   - Line 214: `<div className="p-6 border-t border-border bg-bg-base shrink-0">`
   - Line 482: `<span className="text-[10px] font-bold text-text-muted font-mono tracking-tight bg-bg-base px-2 py-1 rounded-md border border-border">`
   - Line 489: `<span className="text-xl font-extrabold text-text-primary tracking-tight truncate">`
   - Line 497: `<span className="text-xs text-text-secondary truncate mt-0.5">`

2. `apps/web/app/[locale]/dashboard/operator/(dashboard)/layout.tsx`
   - Line 52: `<SidebarInset className="min-h-0 min-w-0 bg-bg-base relative">`

3. `apps/web/app/[locale]/dashboard/admin/layout.tsx`
   - Line 56: `<SidebarInset className="min-h-0 min-w-0 bg-bg-base relative">`

4. `apps/web/app/[locale]/dashboard/admin/page.tsx`
   - Line 49: `<header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-bg-base px-4">`
   - Line 50: `<SidebarTrigger className="text-text-muted hover:text-text-primary" />`
   - Line 52: `<nav className="flex items-center gap-1 text-xs text-text-muted">`
   - Line 55: `<span className="text-text-primary font-medium">`

5. `apps/web/features/operator/views/operator-dashboard-view.tsx`
   - Line 161: `<Card className="border-border bg-bg-surface hover:shadow-md transition-shadow">`
   - Line 163: `<CardTitle className="text-[10px] font-bold uppercase tracking-wider text-text-muted">`
   - Line 171: `<div className="text-2xl font-bold font-mono tracking-tight text-text-primary">`
   - Line 289: `className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-2 border-border text-text-primary hover:bg-bg-elevated")}`

6. `apps/web/features/admin/components/withdrawals-filter-bar.tsx`
   - Line 52: `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-border rounded-xl bg-bg-base shadow-sm">`
   - Line 54: `<div className="flex items-center gap-2 px-3 py-1.5 border border-border/60 rounded-md bg-bg-muted text-sm font-medium">`
   - Line 55: `<ListFilter className="size-4 text-text-muted" />`

#### The Technical Consequence
In Tailwind CSS v4, arbitrary utility classes that do not match an explicit `@theme` property resolve to **empty CSS rules**.
- `bg-bg-base` generates no `background-color`. The container is completely transparent (`background-color: rgba(0, 0, 0, 0)`), inheriting whatever is behind it.
- `text-text-primary` and `text-text-muted` generate no `color`. Text color defaults to browser default or inherits unpredictably.
- On elements that assumed `bg-bg-base` was white or dark slate, borders and dividers sit on transparent backgrounds.

---

### 4. Bypass Patterns and Anti-Patterns

#### 4.1 Direct Utility Overrides of Theme Tokens
Throughout `apps/web`, instead of using semantic tokens (`bg-card`, `text-foreground`, `text-muted-foreground`), views bypass the system with raw Tailwind slate values:
- `text-slate-900` appears in 45+ files.
- `text-slate-500` appears in 60+ files.
- `bg-slate-900` appears in 12+ files.
- `bg-slate-50` appears in 38+ files.

#### 4.2 Inconsistent Container Constraints
Across the three web dashboards, page containers lack a standardized width or layout grid:
- Passenger Overview (`passenger-dashboard-view.tsx`): `flex flex-1 flex-col gap-6 p-4 lg:p-6` (no max-width constraint; stretches infinitely on ultrawide monitors).
- Operator Overview (`operator-dashboard-view.tsx`): `max-w-[1400px] mx-auto pb-10` with `space-y-8`.
- Admin Overview (`apps/web/app/[locale]/dashboard/admin/page.tsx`): `mx-auto max-w-7xl space-y-6` with `p-6 md:p-8`.

---

### 5. Architectural Verdict

The repository does not have an operating Design System architecture. It has:
1. An unmaintained token package (`packages/theme`) containing flawed values.
2. An isolated mobile token file (`apps/driver-app/constants/theme.ts`) that is cleaner than the shared package.
3. A shared UI library (`packages/ui`) that is frequently bypassed or overridden.
4. An unchecked copy-paste workflow that leaked invalid classes across dozens of core production pages.

**Remediation Required**: Unify the token architecture into `@moja/theme`, define semantic CSS variables for Tailwind v4, eliminate all ghost classes, and enforce token consumption via Biome linting rules.

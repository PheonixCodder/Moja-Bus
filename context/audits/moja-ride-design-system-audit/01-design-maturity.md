# Moja Ride Design & Design-Engineering Audit
## 01. Design Maturity Assessment

### 1. The 5-Level Design System Maturity Model

To evaluate the Moja Ride frontend monorepo accurately, we assess each application and package against the industry-standard five-level design system maturity model:

| Level | Classification | Definition |
| :---: | :--- | :--- |
| **1** | **Ad-hoc** | Styling is page-specific, arbitrary, and copy-pasted. No centralized tokens or reusable component contracts. Visual decisions are left to individual developers. |
| **2** | **Reusable** | Shared component libraries exist and are consumed. Some basic tokens (colors, fonts) are defined. However, components lack comprehensive states, pages frequently bypass primitives, and visual drift is common. |
| **3** | **Systematic** | Design tokens (semantic and primitive), typography scales, spacing units, and component variants are formalized. Most product surfaces strictly consume the design system. Governance and linting prevent drift. |
| **4** | **Scalable** | The design system supports multi-brand, multi-platform, and multi-team environments with centralized token pipelines (e.g. Style Dictionary / Tokens Studio). Automated visual regression testing, accessibility audits, and unified release lifecycles are in place. |
| **5** | **Mature** | World-class consistency, automated cross-platform parity, strict runtime/compile-time token governance, comprehensive motion/interaction standards, telemetry-backed UX metrics, and high-fidelity documentation (benchmarked against Stripe, Linear, Vercel, Apple). |

---

### 2. Monorepo Surface Maturity Breakdown

```
Maturity Level
  5 │                                                         
  4 │                                                         
  3 │                                ┌───┐                    
    │             ┌───┐              │   │         ┌───┐      
  2 │  ┌───┐      │   │   ┌───┐      │   │         │   │  ┌───┐
    │  │   │      │   │   │   │      │   │  ┌───┐  │   │  │   │
  1 │  └───┘      └───┘   └───┘      └───┘  └───┘  └───┘  └───┘
    └───────────────────────────────────────────────────────────
       Pass.      Oper.   Admin     Driver  Trav.  @moja  @moja
        Web        Web     Web        App    App    /ui   /theme
       (1.8)      (2.3)   (2.1)      (3.0)  (2.0)  (2.6)  (1.9)
```

| Surface | Assigned Level | Current State & Justification |
| :--- | :---: | :--- |
| **Web — Passenger Dashboard** | **Level 1.8** | **Ad-hoc / Early Reusable**. Layout components and cards are borrowed from `@moja/ui`, but styles are deeply polluted with ghost tokens (`text-text-primary`, `bg-bg-base`), rogue styling (`bg-neon`), hardcoded pastel colors for seat selection, and arbitrary spacing overrides. |
| **Web — Operator Dashboard** | **Level 2.3** | **Reusable with High Debt**. Employs strong operational navigation and tRPC query patterns, but suffers from severe operational anti-patterns: 50-card booking lists instead of data tables, pitch-black slate hero cards in light mode, and local re-declarations of status badges. |
| **Web — Admin Dashboard** | **Level 2.1** | **Fragmented Reusable**. While utilizing `@tanstack/react-table` on select financial views, the layout architecture is broken: an unanchored notification bell floats at `top-1.5 right-4`, hardcoded `slate-900` text is rampant, and error boundaries are non-existent. |
| **Driver / Conductor Mobile App** | **Level 3.0** | **Systematic (Siloed)**. The most internally coherent surface in the monorepo. It has a clearly defined dark-mode token system (`constants/theme.ts`), high-density touch targets (52px-60px), dedicated `ScreenShell`, haptics, and custom typography utilities (`h1`, `h2`, `body-md`). However, it is an isolated island that does not share its token architecture with the rest of the monorepo. |
| **Traveler Mobile App** | **Level 2.0** | **Reusable (Incoherent)**. Contains an attractive custom SVG tab bar and digital ticket sheets, but blindly ports desktop-web prose typography (30px `h2` with underline borders), locks the app runtime to light mode while maintaining unused dark CSS, and lacks an overarching screen layout wrapper. |
| **Shared UI (`packages/ui`)** | **Level 2.6** | **Component-Rich / Token-Poor**. Has 60 high-quality Base UI / Radix primitives, but lacks domain-specific variants (no `success`/`warning` badges), sets undersized button defaults (`h-8` = 32px), lacks `loading` state props on buttons, and provides no linting or governance to prevent consumers from overriding core visual properties. |
| **Theme System (`packages/theme`)** | **Level 1.9** | **Primitive / Fractured**. `tokens.ts` only specifies 8 color tokens, erroneously defines `surface: "#0f1b2d"` (dark navy) in light mode, omits key spacing values (e.g. 12px), and is completely bypassed by both the driver app and traveler app. |

---

### 3. Detailed Architectural Evidence

#### 3.1 Why Web Passenger is Level 1.8
In `apps/web/features/dashboard/components/dashboard-header.tsx`:
```tsx
<Link
  href="/"
  className="inline-flex items-center gap-1.5 rounded-md bg-neon px-3 py-1.5 text-sm font-semibold text-black shadow-[0_0_12px_rgba(57,255,20,0.15),0_0_2px_rgba(57,255,20,1)] transition-shadow duration-150 hover:bg-neon/90"
>
  <Search className="size-4" />
  {t("findBus")}
</Link>
```
This is Level 1 ad-hoc development:
- `bg-neon` is undefined in Tailwind theme.
- `shadow-[0_0_12px_rgba(57,255,20,0.15),0_0_2px_rgba(57,255,20,1)]` is a raw inline CSS value creating a neon radioactive button on a brand interface centered around `#ee237c` magenta.
- Across `passenger-tickets-view.tsx`, `saved-passengers-view.tsx`, and `transaction-history.tsx`, classes like `bg-bg-base`, `text-text-primary`, and `text-text-muted` are applied without any underlying CSS variable definition.

#### 3.2 Why Web Operator is Level 2.3
In `apps/web/features/operator/views/operator-dashboard-view.tsx` lines 110–136:
```tsx
<div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-6 text-white shadow-lg">
  ...
  <h1 className="text-2xl md:text-3xl font-extrabold font-display tracking-tight text-white">
    {company?.name || t("portalFallback")}
  </h1>
  <p className="text-slate-400 text-xs md:text-sm max-w-2xl leading-relaxed">
    {statusDesc}
  </p>
</div>
```
The entire view is set in light mode (`bg-background` = `#ffffff`), but the hero banner is hardcoded to `bg-slate-900`, `border-slate-800`, and `text-slate-400`. When the operator scrolls down, the KPI cards switch back to `border-border bg-bg-surface text-text-primary`. This creates jarring visual discordance typical of uncoordinated Level 2 component assembly.

#### 3.3 Why Driver Mobile is Level 3.0
`apps/driver-app/constants/theme.ts` establishes a disciplined, cohesive token structure:
```ts
export const colors = {
  primary: { rose: "#ee237c", deepRose: "#be123c", emerald: "#10b981", blue: "#3b82f6" },
  semantic: { success: "#10b981", warning: "#f59e0b", streak: "#f97316", error: "#ef4444", info: "#3b82f6" },
  neutral: {
    background: "#09090b", surface: "#18181b", elevated: "#27272a",
    border: "#27272a", borderStrong: "#3f3f46",
    textPrimary: "#fafafa", textSecondary: "#a1a1aa", textMuted: "#71717a",
  },
} as const;
```
Every screen in `apps/driver-app` consumes these exact tokens. The component library (`Button.tsx`, `Input.tsx`, `Card.tsx`, `ScreenShell.tsx`) strictly maps to this palette. The only reason Driver Mobile cannot be classified as Level 4 is that its tokens exist in complete isolation: they are hardcoded TS objects rather than shared tokens published across the monorepo.

---

### 4. What Prevents Moja Ride from Achieving Level 4 (Scalable)

1. **Lack of Token Governance**: No tool (Style Dictionary, Tokens Studio, or custom AST linter) guarantees that a token changed in `packages/theme` propagates safely to `apps/web`, `apps/traveler-app`, and `apps/driver-app`.
2. **Component Bypassing**: Developers routinely write `<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full ...">` instead of consuming `<Badge>`.
3. **Ghost Token Permissiveness**: Biome and Tailwind v4 silently permit undefined utility classes like `text-text-primary` and `bg-bg-base`, allowing unstyled UI regressions to pass CI unnoticed.
4. **Platform Disconnect**: Web uses OKLCH, Traveler Mobile uses HSL/Radix, and Driver Mobile uses Hex/Lingua. There is no single source of truth for color, spacing, or typography.

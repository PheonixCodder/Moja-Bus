# Moja Ride Design & Design-Engineering Audit
## 03. Design Tokens Architecture

### 1. Token Maturity & Hierarchy Analysis

A mature design system architecture organizes tokens into three distinct tiers:
1. **Tier 1: Global Primitives**: Raw values (e.g. `pink-500: #ee237c`, `slate-900: #0f172a`, `space-16: 16px`).
2. **Tier 2: Semantic Tokens**: Contextual decisions (e.g. `action-primary: var(--pink-500)`, `surface-canvas: var(--slate-900)`).
3. **Tier 3: Component Tokens**: Component-scoped contracts (e.g. `button-height-default: 40px`, `badge-radius: 9999px`).

#### Moja Ride Current Architecture
Moja Ride has an incomplete, fragmented Tier 1 and Tier 2 implementation, with Tier 3 almost entirely missing.

```
Moja Ride Token Architecture (Current)
┌────────────────────────────────────────────────────────┐
│ Tier 1: Primitives                                     │
│  - packages/theme/global.css: raw OKLCH definitions    │
│  - packages/theme/tokens.ts: 8 hex colors              │
│  - apps/driver-app/constants/theme.ts: 14 hex colors   │
└───────────────────────────┬────────────────────────────┘
                            │ (Incomplete mapping)
┌───────────────────────────▼────────────────────────────┐
│ Tier 2: Semantic Tokens                                │
│  - Web: --primary, --background, --card, --border      │
│    (Missing: success, warning, info, subtle surface)   │
│  - Driver: colors.semantic.success, warning, etc.      │
│  - Traveler: Re-maps OKLCH to Tailwind v3 HSL          │
└───────────────────────────┬────────────────────────────┘
                            │ (No component contracts)
┌───────────────────────────▼────────────────────────────┐
│ Tier 3: Component Tokens (MISSING)                     │
│  - Developers hardcode px/rem per component            │
└────────────────────────────────────────────────────────┘
```

---

### 2. Deep-Dive Audit of `@moja/theme/tokens.ts`

`packages/theme/tokens.ts` is intended as the cross-platform token definition for React Native and shared consumers:

```ts
// packages/theme/tokens.ts
export const Colors = {
  light: {
    text: "#171717",
    background: "#ffffff",
    backgroundElement: "#f5f5f5",
    backgroundSelected: "#e5e5e5",
    surface: "#0f1b2d", // CRITICAL BUG: Midnight Blue in Light Mode!
    textSecondary: "#737373",
    primary: "#ee237c",
    primaryForeground: "#ffffff",
  },
  dark: {
    text: "#fafafa",
    background: "#171717",
    backgroundElement: "#262626",
    backgroundSelected: "#404040",
    surface: "#0f1b2d",
    textSecondary: "#a3a3a3",
    primary: "#ee237c",
    primaryForeground: "#ffffff",
  },
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16, // GAP: 12px (space-3 in standard scales) is omitted!
  four: 24,
  five: 32,
  six: 64,
} as const;
```

#### Critical Flaws in `tokens.ts`:
1. **Light Mode Surface Bug**: `Colors.light.surface` is set to `#0f1b2d` (midnight navy). If a light-mode component consumes `Colors.light.surface`, it renders dark blue instead of an elevated light surface (`#ffffff` or `#f8fafc`).
2. **Missing Spacing Units**: The 12px step (`0.75rem` / `gap-3`), which is the most common padding in modern compact web/mobile interfaces (cards, list items, pill badges), is completely absent from the scale (`two: 8`, `three: 16`).
3. **No Semantic States**: Zero tokens exist for `success`, `warning`, `error`, `info`, `border`, `input`, or `focus ring`.
4. **No Shadow or Elevation Tokens**: No definitions exist for box shadows or elevation levels.

---

### 3. Token Collisions & Format Incompatibilities

Across the monorepo, the same conceptual token is represented in four incompatible formats:

#### Example: Primary Brand Color (`#ee237c`)
- In `packages/theme/global.css`: `#ee237c` (Hex) assigned to `--primary` and `--color-primary`.
- In `packages/theme/tokens.ts`: `primary: "#ee237c"` and `primaryRGB = "238, 35, 124"`.
- In `apps/traveler-app/global.css`: `--primary: 334 86% 54%` (raw HSL channels for Tailwind v3 opacity mixing).
- In `apps/driver-app/global.css`: `--color-primary: #ee237c` and `--color-primary-dark: #be123c`.
- In `apps/driver-app/constants/theme.ts`: `rose: "#ee237c"`.
- In `passenger-seat-map.tsx`: `"bg-pink-100 text-pink-800 ring-pink-300"`.
- In `passenger-dashboard-view.tsx`: `"bg-linear-to-r from-primary/10 via-primary/5 to-card"`.

#### Example: Neutral Surface / Card Background
- In `packages/theme/global.css`: `--card: oklch(1 0 0)` (Light) / `oklch(0.205 0 0)` (Dark).
- In `packages/theme/tokens.ts`: `backgroundElement: "#f5f5f5"` / `surface: "#0f1b2d"`.
- In `apps/driver-app/constants/theme.ts`: `surface: "#18181b"` / `elevated: "#27272a"`.
- In `apps/web` (unsupported): `bg-bg-surface` / `bg-bg-base` / `bg-bg-elevated`.
- In `apps/web` (raw utility): `bg-slate-50`, `bg-slate-100`, `bg-slate-900`.

---

### 4. Control Heights & Sizing Tokens

In modern design systems (Stripe, Linear, Radix UI), interactive control heights are strictly locked into a size token ladder:

| Standard Size | Standard Height | Moja `@moja/ui` Button | Moja Traveler Button | Moja Driver Button |
| :--- | :---: | :---: | :---: | :---: |
| **Extra Small (xs)** | 28px | 24px (`h-6`) | N/A | N/A |
| **Small (sm)** | 32px or 36px | 28px (`h-7`) | 36px (`h-9`) | 40px (`h-10`) |
| **Default / Medium (md)**| 40px | **32px (`h-8`)** | 40px (`h-10`) | **52px (`h-13`)** |
| **Large (lg)** | 44px or 48px | 36px (`h-9`) | 44px (`h-11`) | **60px (`h-15`)** |

#### Critical Findings:
1. **Web Buttons are Undersized**: `@moja/ui` defines `default` button height as `h-8` (32px). This is an auxiliary/dense size in most design systems, not a primary button height.
2. **Driver Buttons are In-Cab Scaled**: Driver button sizes (`52px` and `60px`) are intentionally large for touch targets while driving. This is an **intentional domain divergence**, not accidental drift.
3. **Traveler Button Inconsistency**: Traveler mobile buttons alternate between `h-9` and `h-10` with arbitrary `rounded-md` corners, falling short of the recommended 44px minimum touch target on iOS.

---

### 5. Border Radius & Shadow Tokens

#### Radius Scale
In `packages/theme/global.css`:
```css
--radius: 0.625rem; /* 10px */
--radius-sm: calc(var(--radius) - 4px); /* 6px */
--radius-md: calc(var(--radius) - 2px); /* 8px */
--radius-lg: var(--radius); /* 10px */
--radius-xl: calc(var(--radius) + 4px); /* 14px */
```
However, in component usage:
- `apps/web/features/operator/views/operator-dashboard-view.tsx` line 110: `rounded-2xl` (16px).
- `apps/web/features/home/components/home-destinations.tsx`: `rounded-[2rem]` (32px).
- `apps/driver-app/components/ui/Button.tsx`: `rounded-2xl` (16px).
- `apps/traveler-app/components/ui/button.tsx`: `rounded-md` (6px).
- `apps/web/features/booking/views/passenger-tickets-view.tsx`: `rounded-xl` (12px).

There is zero adherence to the defined `--radius` variables. Individual components freely pick whatever Tailwind corner radius looks good in isolation.

#### Shadow Scale
In `packages/theme/global.css`, **no elevation tokens exist**.
In `apps/web/globals.css`, **no elevation tokens exist**.
As a result:
- Passenger cards use: `shadow-xs`, `shadow-sm`, and arbitrary `shadow-[0_0_12px_rgba(57,255,20,0.15)]`.
- Operator views use: `hover:shadow-md`, `shadow-lg`.
- Traveler mobile cards use: `shadow-sm shadow-black/5`.
- Driver mobile cards use: `elevation: 2` or zero shadow with strong borders.

---

### 6. Summary of Token Remediation Requirements

1. **Re-architect `@moja/theme/tokens.ts`**:
   - Provide complete Tier 1 primitives in OKLCH, Hex, and RGB.
   - Define semantic Tier 2 tokens: `surface`, `surfaceElevated`, `surfaceSubtle`, `textPrimary`, `textMuted`, `borderDefault`, `borderStrong`, `statusSuccess`, `statusWarning`, `statusError`, `statusInfo`.
   - Fix `Colors.light.surface` from `#0f1b2d` to `#ffffff`.
   - Add missing spacing tokens (`space-3` = 12px, `space-2.5` = 10px).
2. **Export to Web & NativeWind**:
   - Export CSS variables for web (`@theme inline` in Tailwind v4).
   - Export JS/TS object contracts for Expo/React Native.
3. **Eliminate Ghost Tokens**:
   - Codemod all instances of `text-text-primary` → `text-foreground`, `bg-bg-base` → `bg-background`, `bg-bg-surface` → `bg-card`.

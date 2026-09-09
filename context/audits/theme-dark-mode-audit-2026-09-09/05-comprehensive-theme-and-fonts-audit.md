# Moja Ride Monorepo — Full System Theme & Fonts Audit (Light & Dark Themes)

**Date:** 2026-09-09  
**Audit Scope:** `packages/theme`, `apps/web`, `packages/ui`, `apps/driver-app`, `apps/traveler-app`, `apps/booth-app`  
**Standard:** Moja Ride Context-Driven Development (CDD) Protocol & Design System Invariants  
**Audit Location:** `context/audits/theme-and-fonts-audit-2026-09-09.md`

---

## 1. Executive Summary & Topology Map

Moja Ride operates a cross-platform fleet and intercity passenger booking platform with heterogeneous design requirements:
1. **Web Hub (`apps/web` + `packages/ui`)**: Responsive desktop/mobile web. Uses shadcn Base UI + Tailwind CSS v4 with the **Maia preset** (`b20te54eby`), Outfit (sans body) and Raleway (heading). Currently **locked strictly to Light Mode** (Moja Brand Pink `#ee237c`, taupe neutrals). Dark mode tokens are formally specified in CSS, but UI is explicitly configured for light theme only.
2. **Driver App (`apps/driver-app`)**: In-vehicle mobile HUD and shift console (Expo / React Native / NativeWind v4). Designed to be **locked permanently to Dark Mode** (OLED `#09090b` canvas) for night driving safety and cockpit glare reduction. Uses **Montserrat** (400, 500, 600, 700, 900).
3. **Traveler App (`apps/traveler-app`)**: Consumer ticket booking and tracking app (Expo / React Native / NativeWind v4). Designed to be **locked permanently to Light Mode** (Clean white canvas, Moja Pink `#ee237c`). Uses **Montserrat** (400, 500, 600, 700).
4. **Booth App (`apps/booth-app`)**: Terminal ticket sales and cash reconciliation console for agents (Expo / React Native / NativeWind v4). Designed to be **locked permanently to Light Mode** for daylight outdoor kiosk visibility. Uses **Montserrat** (400, 500, 600, 700, 900).
5. **Core Token Engine (`packages/theme`)**: Monorepo single source of truth (`tokens.ts` and `global.css`). Exports Palette primitives, semantic `Colors.light` & `Colors.dark`, `Radii`, `Spacing`, typography scales, and CSS variable bindings for both `:root` and `.dark`.

### High-Level Status Matrix

| Surface | Platform | Target Mode | Actual Mode Runtime | Typography Engine | Type Scale Conformance | Dark Theme Health | Light Theme Health |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`packages/theme`** | Core / CSS | Universal | Both (Tokens + CSS) | Montserrat (Mobile) / Outfit & Raleway (Web) | ⚠️ Partial (Fonts export incomplete) | ⚠️ Mixed (oklch alpha issue) | 🟢 Canonical |
| **`packages/ui`** | Web React | Light Only | Light | Outfit / Raleway | 🟢 Pinned (`style-maia.css`) | ⚪ Dormant (CSS exists, UI inactive) | 🟢 100% Compliant |
| **`apps/web`** | Next.js 16 | Light Only | Light | Outfit / Raleway | 🟢 Pinned via `style-maia` | ⚪ Inactive by Architectural Decision | 🟢 100% Compliant |
| **`apps/driver-app`** | Expo (RN) | Permanently Dark | 🟢 Dark (Forced via `className="flex-1 dark"`) | Montserrat (400-900) | 🟢 Centralized (`@utility`) | 🟢 Fully Wired & OLED Optimized | N/A (Intentionally Dark) |
| **`apps/traveler-app`** | Expo (RN) | Permanently Light | 🟢 Light (Forced via `className="flex-1 light"`) | Montserrat (400-700) | 🟢 Centralized (`@utility`) | N/A (Intentionally Light) | 🟢 Fully Wired & Tokenised |
| **`apps/booth-app`** | Expo (RN) | Permanently Light | 🟢 Light (Forced via `className="flex-1 light"`) | Montserrat (400-900) | 🟢 Centralized (`@utility`) | N/A (Intentionally Light) | 🟢 Fully Wired & Tokenised |

---

## 2. Deep Dive by Surface

### 2.1 Core Package: `packages/theme`

#### Color Token Architecture
- **Palette (Tier 1)**: Defines primitives `rose` (brand pink `#ee237c` as 500), `emerald` (success `#10b981`), `amber` (warning `#f59e0b`), `orange` (streak `#f97316`), `red` (error `#ef4444`), `blue` (info `#3b82f6`), and `zinc` (scale 50 to 950).
- **Semantic Colors (Tier 2)**:
  - `Colors.light`:
    - `background`: `#ffffff`, `surface`: `#ffffff`, `card`: `#ffffff`, `cardElevated`: `#f4f4f5`
    - `textPrimary`: `#18181b`, `textSecondary`: `#71717a`, `textMuted`: `#a1a1aa`
    - `border`: `#e4e4e7`, `borderStrong`: `#d4d4d8`
    - `primary`: `#ee237c`, `streak`: `#f97316`
  - `Colors.dark`:
    - `background`: `#09090b` (true OLED black), `surface`: `#18181b`, `card`: `#18181b`, `cardElevated`: `#27272a`
    - `textPrimary`: `#fafafa`, `textSecondary`: `#a1a1aa`, `textMuted`: `#71717a`
    - `border`: `#27272a`, `borderStrong`: `#3f3f46`
    - `primary`: `#ee237c`, `streak`: `#f97316`
- **Global CSS (`global.css`)**:
  - `:root` declares light mode variables using taupe/OKLCH color coordinates matching preset `b20te54eby`.
  - `.dark` declares dark mode variables.
  - `@theme inline` binds CSS variables to Tailwind CSS v4 utilities (`--color-background: var(--background)`, etc.).
  - Contains universal mobile typography `@utility` definitions (`h1` through `micro`) referencing `var(--foreground)` and `var(--muted-foreground)`, guaranteeing automatic contrast switching between light and dark without app-specific overrides.

#### Gaps & Findings in `packages/theme`
1. **P2 — OKLCH Alpha Notation in Native CSS Parsers**:
   - In `global.css` line 146 & 148, `--border` and `--input` under `.dark` were patched to `rgba(255, 255, 255, 0.10)` for Android React Native compatibility. However, `--sidebar-border: oklch(1 0 0 / 10%)` still retains slash-alpha notation. While sidebar is primarily web-facing, any mobile consumer referencing `--sidebar-border` would crash or render transparent.
2. **P2 — Divergence Between TS `Fonts` Export and Web Fonts**:
   - `tokens.ts` exports:
     ```ts
     export const Fonts = { sans: "Montserrat", serif: "Georgia, serif", rounded: "SF Pro Rounded, normal", mono: "ui-monospace, monospace" };
     ```
   - Whereas `global.css` and `apps/web` use **Outfit** for sans and **Raleway** for headings. If a web developer imports `Fonts.sans` from `@moja/theme/tokens`, they receive `"Montserrat"`.

---

### 2.2 Web Ecosystem: `apps/web` & `packages/ui`

#### Architecture & Dark Mode Stance
- **Preset**: Adopted `b20te54eby` (Style: Maia, Base: Taupe, Primary: Moja Pink `#ee237c`, Radius: Medium `0.625rem`).
- **Mode Invariant**: **Web is Light-Only by Architectural Decision**.
  - `apps/web/app/layout.tsx`:
    ```tsx
    <html lang="en" className={`${outfit.variable} ${raleway.variable} style-maia h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
    ```
  - `packages/ui/src/components/ui/sonner.tsx` explicitly documents:
    ```tsx
    /** Moja is light-only — no ThemeProvider / next-themes. Theme is fixed to "light" */
    ```
  - `packages/ui/src/styles/globals.css` declares `@custom-variant dark (&:is(.dark *));`.
- **Fonts Implementation**:
  - `next/font/google` loads `Outfit` (`--font-outfit`) and `Raleway` (`--font-raleway`) in `apps/web/app/layout.tsx`.
  - Linked to CSS variables `--font-display-base` and `--font-heading-base`.
  - Applied globally via `@layer base { body { @apply bg-background text-foreground font-sans; } }`.

#### Gaps & Findings in Web / UI
1. **P3 — Inactive Dark Theme Rules in `packages/ui/src/styles/style-maia.css`**:
   - `style-maia.css` contains standard shadcn dark selectors (e.g., `.dark &`, `dark:bg-*`). Because the `<html>` tag never receives the `.dark` class, these rules are dead code. They do not cause runtime errors or visual regressions, but represent ~8KB of dormant CSS.
2. **P3 — Hardcoded Toast Inline Colors**:
   - In `packages/ui/src/components/ui/sonner.tsx`, fallback colors are mapped to CSS variables (`var(--popover)`, `var(--border)`), but the Toaster prop is statically pinned to `theme="light"`. This is 100% compliant with the current light-mode mandate.

---

### 2.3 Mobile App: `apps/driver-app`

#### Dark Mode Implementation
- **Configuration**:
  - `app.json`: `"userInterfaceStyle": "automatic"`.
  - `app/_layout.tsx`: Root level is **forced dark**:
    ```tsx
    <ThemeProvider value={NAV_THEME}>
      <StatusBar style="light" />
      <View className="flex-1 dark" style={{ backgroundColor: colors.neutral.background }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { flex: 1, backgroundColor: colors.neutral.background } }}>
          ...
        </Stack>
      </View>
    </ThemeProvider>
    ```
  - `NAV_THEME`: Spreads `DarkTheme` with `dark: true`, background `#09090b`, card `#18181b`, text `#fafafa`, border `#27272a`, primary `#ee237c`.
- **CSS Local Overrides (`apps/driver-app/global.css`)**:
  - Sets `:root { --radius: 1rem; }` to support larger 44px+ mobile touch targets (matches `rounded-xl = 20px`).
  - Aliases `--color-border-strong: var(--border-strong)` and `--color-text-muted: var(--muted-foreground)`.
  - Inherits the centralized typography utilities (`h1` through `micro`) from `@moja/theme/global.css`.
- **Fonts**:
  - Loaded via `useFonts` in `hooks/use-load-fonts.ts`:
    `Montserrat_400Regular`, `Montserrat_500Medium`, `Montserrat_600SemiBold`, `Montserrat_700Bold`, `Montserrat_900Black`.
  - Family aliases in `global.css`: `--font-montserrat`, `--font-montserrat-medium`, `--font-montserrat-semibold`, `--font-montserrat-bold`.

#### Gaps & Findings in Driver App
1. **P3 — `app.json` declares `"userInterfaceStyle": "automatic"`**:
   - While `_layout.tsx` wraps the app in `<View className="flex-1 dark">`, `app.json` still states `"userInterfaceStyle": "automatic"`. Setting this to `"dark"` prevents the native iOS/Android splash screen or status bar from flashing white during cold boot before JavaScript evaluates.

---

### 2.4 Mobile App: `apps/traveler-app`

#### Light Mode Implementation
- **Configuration**:
  - `app.json`: `"userInterfaceStyle": "automatic"`.
  - `app/_layout.tsx`: Root level is **forced light**:
    ```tsx
    <ThemeProvider value={NAV_THEME}>
      <StatusBar style="dark" />
      <View className="flex-1 light" style={{ backgroundColor: Colors.light.background }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { flex: 1, backgroundColor: Colors.light.background } }}>
          ...
        </Stack>
      </View>
    </ThemeProvider>
    ```
  - `NAV_THEME`: Spreads `DefaultTheme` with `dark: false`, background `#ffffff`, card `#ffffff`, text `#18181b`, border `#e4e4e7`, primary `#ee237c`.
- **CSS Local Overrides (`apps/traveler-app/global.css`)**:
  - Sets `:root { --radius: 1rem; }` ensuring `rounded-xl` evaluates to 20px, fixing the historical "boxed card" radius regression.
  - Inherits centralized typography utilities from `@moja/theme/global.css`.
- **Non-CSS Colors (`constants/ui-colors.ts`)**:
  - Fully populated with `IconColors` (default, secondary, muted, brand, onBrand, onCard, success, warning, error, info), `SwitchColors`, and `PlaceholderColor`.
- **Fonts**:
  - Loaded via `useFonts` in `hooks/use-load-fonts.ts`:
    `Montserrat_400Regular`, `Montserrat_500Medium`, `Montserrat_600SemiBold`, `Montserrat_700Bold`.
  - *Note: Does not load `Montserrat_900Black` (only up to 700Bold), which matches its UI requirements.*

#### Gaps & Findings in Traveler App
1. **P3 — `app.json` declares `"userInterfaceStyle": "automatic"`**:
   - Similar to driver-app, `app.json` should declare `"userInterfaceStyle": "light"` to ensure the native OS splash window is pinned to light mode during cold launch.
2. **P3 — Dead `dark:` variants in shadcn primitives**:
   - Components inside `apps/traveler-app/components/ui/` contain `dark:` Tailwind classes inherited from upstream shadcn. Since the app is locked with `className="light"`, these are inactive.

---

### 2.5 Mobile App: `apps/booth-app`

#### Light Mode Implementation
- **Configuration**:
  - `app.json`: `"userInterfaceStyle": "light"`.
  - `app/_layout.tsx`: Explicitly locks runtime light mode:
    ```tsx
    <StatusBar style="dark" />
    <View className="flex-1 light" style={{ backgroundColor: colors.neutral.background }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { flex: 1, backgroundColor: colors.neutral.background } }}>
        ...
      </Stack>
    </View>
    ```
- **CSS Local Overrides (`apps/booth-app/global.css`)**:
  - Pinned `:root { --radius: 1rem; }` for touch tablet terminals.
  - Redundant local `@utility h1` … `@utility caption` blocks exist in `apps/booth-app/global.css` that mirror `@moja/theme/global.css`.
- **Fonts**:
  - Loaded via `useFonts` in `hooks/use-load-fonts.ts`:
    `Montserrat_400Regular`, `Montserrat_500Medium`, `Montserrat_600SemiBold`, `Montserrat_700Bold`, `Montserrat_900Black`.

#### Gaps & Findings in Booth App
1. **P2 — Absence of `constants/ui-colors.ts` & Inline Hex Icons**:
   - Unlike `traveler-app` and `driver-app`, `apps/booth-app` lacks a `constants/ui-colors.ts` module.
   - Screen files (e.g. `app/(tabs)/profile.tsx`, `app/sell/payment.tsx`, `app/sell/confirmation.tsx`) pass raw inline hex strings to icon `color` props (e.g. `#111`, `#666`, `#22c55e`, `#ef4444`).
2. **P2 — Inline `ActivityIndicator` Hex Colors**:
   - `app/(tabs)/index.tsx`, `app/sell/[tripId].tsx`, `app/terminal-select.tsx`, and `app/reconcile.tsx` use hardcoded `color="#ee237c"` instead of referencing `Palette.rose[500]` or `colors.primary.rose`.
3. **P3 — Duplicated Typography Utilities**:
   - `apps/booth-app/global.css` re-declares `h1` through `caption` utilities instead of relying purely on `@moja/theme/global.css`.

---

## 3. Comprehensive Design Token Matrices

### 3.1 Color Systems Matrix

| Semantic Token | Light Mode (Web / Traveler / Booth) | Dark Mode (Driver App) | Source of Truth |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#ffffff` / `oklch(1 0 0)` | `#09090b` / `oklch(0.147 0.004 49.3)` | `var(--background)` / `Colors.*.background` |
| **Surface / Card** | `#ffffff` / `oklch(1 0 0)` | `#18181b` / `oklch(0.214 0.009 43.1)` | `var(--card)` / `Colors.*.card` |
| **Card Elevated** | `#f4f4f5` / `oklch(0.96 0.002 17.2)` | `#27272a` / `oklch(0.268 0.011 36.5)` | `var(--card-elevated)` / `Colors.*.cardElevated` |
| **Primary Brand** | `#ee237c` (Moja Pink) | `#ee237c` (Moja Pink) | `var(--primary)` / `Palette.rose[500]` |
| **Primary Foreground** | `#ffffff` | `#ffffff` | `var(--primary-foreground)` |
| **Text Primary** | `#18181b` / `oklch(0.147 0.004 49.3)` | `#fafafa` / `oklch(0.986 0.002 67.8)` | `var(--foreground)` / `Colors.*.textPrimary` |
| **Text Secondary** | `#71717a` | `#a1a1aa` | `Colors.*.textSecondary` |
| **Text Muted** | `#a1a1aa` / `oklch(0.547 0.021 43.1)` | `#71717a` / `oklch(0.714 0.014 41.2)` | `var(--muted-foreground)` / `Colors.*.textMuted` |
| **Border Subtle** | `#e4e4e7` / `oklch(0.922 0.005 34.3)` | `#27272a` / `rgba(255, 255, 255, 0.10)` | `var(--border)` / `Colors.*.border` |
| **Border Strong** | `#d4d4d8` (zinc-300) | `#3f3f46` (zinc-700) | `var(--border-strong)` / `Colors.*.borderStrong` |
| **Success** | `#10b981` (emerald-500) | `#10b981` (emerald-500) | `var(--success)` / `Palette.emerald[500]` |
| **Warning** | `#f59e0b` (amber-500) | `#f59e0b` (amber-500) | `var(--warning)` / `Palette.amber[500]` |
| **Destructive / Error** | `#ef4444` / `oklch(0.577 0.245 27.325)` | `#ef4444` / `oklch(0.704 0.191 22.216)` | `var(--destructive)` / `Palette.red[500]` |
| **Info** | `#3b82f6` (blue-500) | `#3b82f6` (blue-500) | `var(--info)` / `Palette.blue[500]` |
| **Gamification Streak**| `#f97316` (orange-500) | `#f97316` (orange-500) | `var(--streak)` / `Palette.orange[500]` |

---

### 3.2 Typography & Font Matrix

| Token Scale | Font Family (Web) | Font Family (Mobile) | Size | Line Height | Weight | NativeWind Class |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display / Hero** | Raleway / Outfit | Montserrat-Bold | 32px | 40px | 700 | `text-3xl font-bold` |
| **Heading 1 (h1)** | Raleway | Montserrat-Bold | 28px | 34px | 700 | `h1` |
| **Heading 2 (h2)** | Raleway | Montserrat-Bold | 22px | 28px | 700 | `h2` |
| **Heading 3 (h3)** | Raleway | Montserrat-SemiBold | 18px | 24px | 600 | `h3` |
| **Heading 4 (h4)** | Raleway | Montserrat-Medium | 15px | 20px | 500 | `h4` |
| **Body Large** | Outfit | Montserrat | 16px | 24px | 400 | `body-lg` |
| **Body Medium** | Outfit | Montserrat | 14px | 20px | 400 | `body-md` |
| **Body Small** | Outfit | Montserrat | 12px | 18px | 400 | `body-sm` |
| **Caption** | Outfit | Montserrat | 11px | 15px | 400 | `caption` |
| **Micro / Legal** | Outfit | Montserrat-SemiBold | 10px | 14px | 600 | `micro` |

---

### 3.3 Border Radius Scale Matrix

| Semantic Class | Formula (Web) | Web Value (`--radius: 0.625rem`) | Formula (Mobile) | Mobile Value (`--radius: 1rem`) |
| :--- | :--- | :--- | :--- | :--- |
| `rounded-sm` | `calc(var(--radius) - 4px)` | 6px | `calc(var(--radius) - 4px)` | 12px |
| `rounded-md` | `calc(var(--radius) - 2px)` | 8px | `calc(var(--radius) - 2px)` | 14px |
| `rounded-lg` | `var(--radius)` | 10px | `var(--radius)` | 16px |
| `rounded-xl` | `calc(var(--radius) + 4px)` | 14px | `calc(var(--radius) + 4px)` | **20px** (Fixes "boxed" look) |
| `rounded-2xl` | `calc(var(--radius) + 8px)` | 18px | `calc(var(--radius) + 8px)` | 24px |
| `rounded-3xl` | `calc(var(--radius) + 12px)` | 22px | `calc(var(--radius) + 14px)` | 30px |
| `rounded-4xl` | `calc(var(--radius) + 16px)` | 26px | `calc(var(--radius) + 16px)` | 32px |

---

## 4. Ranked Findings & Recommendations

### P1 — High Priority (Visual Bleed & Theme Hygiene)
1. **`booth-app` Missing `constants/ui-colors.ts` & Inline Hex Icons**:
   - **Finding**: Kiosk screens use `#111`, `#666`, `#16a34a`, `#2563eb` inline.
   - **Recommendation**: Scaffold `apps/booth-app/constants/ui-colors.ts` mirroring `traveler-app` with typed `IconColors`, and migrate all Hugeicons / Lucide icons to use token references.
2. **`booth-app` ActivityIndicator Hardcoded Hex**:
   - **Finding**: Spinners in 4 files pass `#ee237c` directly.
   - **Recommendation**: Replace with `Palette.rose[500]` or `colors.primary.rose`.

### P2 — Medium Priority (OS & Engine Alignment)
1. **Cold-Boot Splash Inconsistency in `app.json` (`driver-app` & `traveler-app`)**:
   - **Finding**: Both apps define `"userInterfaceStyle": "automatic"` in `app.json`, while JavaScript code locks them to `"dark"` and `"light"` respectively.
   - **Recommendation**: Set `"userInterfaceStyle": "dark"` in `apps/driver-app/app.json` and `"userInterfaceStyle": "light"` in `apps/traveler-app/app.json`.
2. **`packages/theme` Fonts Export Incompleteness**:
   - **Finding**: `tokens.ts` only declares `"Montserrat"` under `Fonts.sans`, omitting `Outfit` and `Raleway` which are the canonical fonts for `apps/web`.
   - **Recommendation**: Expand `Fonts` in `tokens.ts` to include `web: { sans: "Outfit", heading: "Raleway" }` or document platform-specific boundaries.
3. **`apps/booth-app/global.css` Redundant Typography Utilities**:
   - **Finding**: `global.css` redefines `h1` through `caption` using hardcoded hex rather than relying on `@moja/theme/global.css`.
   - **Recommendation**: Delete the local `@utility` blocks in `apps/booth-app/global.css` so it inherits the centralized, variable-driven definitions.

### P3 — Low Priority / Polish (Code Deadwood)
1. **Dormant `dark:` CSS in `packages/ui` and `apps/traveler-app`**:
   - Clean up or document dormant classes as forward-compatible scaffolding.
2. **Slash-Alpha in `global.css` `--sidebar-border`**:
   - Convert `oklch(1 0 0 / 10%)` to `rgba(255, 255, 255, 0.10)` in `global.css` for absolute cross-engine parsing safety.

---

## 5. Architectural Invariants Sign-off

- [x] **Web App Safety Guarantee**: Zero changes in this audit or remediation modify `packages/theme/global.css`'s base `--radius: 0.625rem`, protecting all Web/Maia UI components.
- [x] **Mobile Radius Ergonomics**: `driver-app`, `traveler-app`, and `booth-app` all override `:root { --radius: 1rem; }` locally, ensuring consistent 20px card rounding and finger-friendly targets.
- [x] **Strict Mode Isolation**: `driver-app` is isolated dark; `traveler-app`, `booth-app`, and `web` are isolated light. No system dark/light leaks can cross application boundaries.
- [x] **Typecheck Verification**: All 13 workspace packages and apps compile with **Exit 0** and zero type errors.

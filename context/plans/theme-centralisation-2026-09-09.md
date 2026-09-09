# Plan: Moja Ride Centralised Theme — Dark Mode, Light Mode & Design System Overhaul

**Status:** Draft — Approved for Implementation
**Created:** 2026-09-09
**Scope:** `packages/theme`, `packages/ui`, `apps/driver-app`, `apps/traveler-app`
**Out of Scope:** `apps/web` (zero changes touch it — see Section 0)

---

## Table of Contents

1. [Architecture Principles](#architecture-principles)
2. [Section 0 — Web App Safety Guarantee](#section-0--web-app-safety-guarantee)
3. [Phase 1 — packages/theme Foundation](#phase-1--packagestheme-foundation)
4. [Phase 2 — Driver App Dark Mode](#phase-2--driver-app-dark-mode)
5. [Phase 3 — Traveler App Light Mode & Border Radius](#phase-3--traveler-app-light-mode--border-radius)
6. [Phase 4 — Icon & JS Colour Centralisation](#phase-4--icon--js-colour-centralisation)
7. [Phase 5 — Typography Utility System](#phase-5--typography-utility-system)
8. [Phase 6 — Styling Rule Documentation](#phase-6--styling-rule-documentation)
9. [Execution Order](#execution-order)
10. [File Change Index](#file-change-index)

---

## Architecture Principles

These rules govern every change in this plan. No exception.

| Principle | Rule |
|-----------|------|
| **Single Source of Truth** | Every colour, radius, spacing, and font token originates in `packages/theme/tokens.ts` or `packages/theme/global.css`. Apps derive — they never invent. |
| **CSS Variables over Hardcode** | NativeWind utility classes always use `var(--token)` — never raw hex or px inside a shared component. |
| **JS Tokens for JS Props** | When a prop cannot accept a class name (icon `color`, `placeholderTextColor`, `trackColor`, `Switch.thumbColor`) it must read from a centralised constants file, not inline. |
| **App-Level Overrides, Shared Base Intact** | `packages/theme/global.css` is the untouched shared base. Per-app customisations go in the app's own `global.css` via `@theme` block overrides. |
| **No Mixed Styling in Primitives** | Primitive UI components (`Button`, `Card`, `Input`, `Badge`, `PageHeader`) use NativeWind only. StyleSheet.create is reserved for layout shells (`ScreenShell`, `TabBar`) where dynamic values are required. Document the split. |
| **Forced Mode Per App** | Driver-app forces dark. Traveler-app forces light. No system preference leakage. |
| **web is protected** | `packages/theme/global.css` `--radius` is never changed. Mobile apps override `--radius` locally. |

---

## Section 0 — Web App Safety Guarantee

**The web app will not be affected by any change in this plan.**

### Why `--radius` Can't Change in `packages/theme`

Import chain:
```
packages/theme/global.css  (--radius: 0.625rem)
  └── imported by packages/ui/src/styles/globals.css
        └── imported by apps/web/app/globals.css
```

`packages/ui/src/styles/style-maia.css` uses `rounded-2xl`, `rounded-4xl` etc.
throughout. Changing `--radius` in `packages/theme` would cascade into all web
component radii. Therefore:

**Rule: `packages/theme/global.css` `--radius` stays at `0.625rem`. Mobile apps
override it locally.**

### Mobile App Radius Override Approach

Each mobile app's `global.css` will add a `:root` override **after** the
`@import "@moja/theme/global.css"` line:

```css
/* apps/driver-app/global.css  AND  apps/traveler-app/global.css */
@import "@moja/theme/global.css";

/* Mobile-specific radius scale — larger touch targets than web */
:root {
  --radius: 1rem;   /* 16px base → rounded-xl = 20px, matching existing rounded-[20px] screens */
}
```

Because `@import` is processed first, this `:root` block overrides the shared
`--radius: 0.625rem` in mobile only. Web is not involved.

---

## Phase 1 — `packages/theme` Foundation

**Goal:** Fix all token gaps, add missing tokens, fix radius/3xl delta.
**Web impact:** Zero (additions only — no existing values changed).

### Task 1.1 — `tokens.ts`: Add Missing Tokens

**File:** `packages/theme/tokens.ts`

#### 1.1.1 Add `orange` to Palette (for `streak`)
```ts
// Add to Palette object:
orange: {
  500: "#f97316",
  600: "#ea6c0a",
} as const,
```

#### 1.1.2 Update `Radii` to match the mobile `--radius: 1rem` scale
```ts
export const Radii = {
  none: 0,
  xs:   4,
  sm:   12,   // --radius-sm  = 1rem - 4px
  md:   14,   // --radius-md  = 1rem - 2px
  lg:   16,   // --radius-lg  = 1rem (base)
  xl:   20,   // --radius-xl  = 1rem + 4px  ← matches rounded-[20px] screens
  "2xl": 24,  // --radius-2xl = 1rem + 8px
  "3xl": 28,  // --radius-3xl = 1rem + 12px
  "4xl": 32,  // --radius-4xl = 1rem + 16px
  full: 9999,
} as const;
```
> Note: This reflects the MOBILE token values. The web `@moja/ui` keeps its own
> radius interpretation via its `style-maia.css` classes — these TS constants are
> used only in StyleSheet.create() calls in the mobile apps.

#### 1.1.3 Add `borderStrong` to semantic `Colors`
```ts
// In Colors.light:
borderStrong: Palette.zinc[300],   // #d4d4d8

// In Colors.dark:
borderStrong: Palette.zinc[700],   // #3f3f46
```

#### 1.1.4 Add semantic `streak` to `Colors`
```ts
// In Colors.light:
streak: Palette.orange[500],      // #f97316

// In Colors.dark:
streak: Palette.orange[500],      // same — streak is always orange
```

### Task 1.2 — `global.css`: Add Missing CSS Variables

**File:** `packages/theme/global.css`

#### 1.2.1 Add `--border-strong` and `--streak` to `:root` and `.dark`
```css
/* :root additions */
--border-strong: #d4d4d8;   /* zinc-300 */
--streak:        #f97316;   /* orange-500 */

/* .dark additions */
--border-strong: #3f3f46;   /* zinc-700 */
--streak:        #f97316;   /* orange-500 — always orange */
```

#### 1.2.2 Fix dark mode border/input from `oklch` alpha to `rgba`
```css
/* BEFORE (.dark) */
--border: oklch(1 0 0 / 10%);
--input:  oklch(1 0 0 / 15%);

/* AFTER (.dark) */
--border: rgba(255, 255, 255, 0.10);
--input:  rgba(255, 255, 255, 0.15);
```
> Reason: `oklch()` with slash-alpha is not reliably parsed by react-native-css
> on all Android versions. rgba() is universally safe.

#### 1.2.3 Add `--border-strong` and `--streak` to `@theme inline` mappings
```css
@theme inline {
  /* ...existing mappings... */
  --color-border-strong: var(--border-strong);
  --color-streak:        var(--streak);
}
```

#### 1.2.4 Add Mobile Typography `@utility` helpers

Add after the `@theme inline` block. These are Montserrat-based and use CSS
variables so they adapt to whatever mode each app is in:

```css
/* ============================================================
   TYPOGRAPHY UTILITIES — Mobile (Montserrat)
   Used by: apps/driver-app, apps/traveler-app
   Not used by: apps/web (web uses Outfit/Raleway from @moja/ui)
   ============================================================ */
@utility h1 {
  font-family: "Montserrat-Bold";
  font-size: 28px;
  font-weight: 700;
  line-height: 34px;
  color: var(--foreground);
}
@utility h2 {
  font-family: "Montserrat-Bold";
  font-size: 22px;
  font-weight: 700;
  line-height: 28px;
  color: var(--foreground);
}
@utility h3 {
  font-family: "Montserrat-SemiBold";
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
  color: var(--foreground);
}
@utility h4 {
  font-family: "Montserrat-Medium";
  font-size: 15px;
  font-weight: 500;
  line-height: 20px;
  color: var(--foreground);
}
@utility body-lg {
  font-family: "Montserrat";
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: var(--foreground);
}
@utility body-md {
  font-family: "Montserrat";
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: var(--foreground);
}
@utility body-sm {
  font-family: "Montserrat";
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color: var(--muted-foreground);
}
@utility caption {
  font-family: "Montserrat";
  font-size: 11px;
  font-weight: 400;
  line-height: 15px;
  color: var(--muted-foreground);
}
@utility micro {
  font-family: "Montserrat-SemiBold";
  font-size: 10px;
  font-weight: 600;
  line-height: 14px;
  color: var(--muted-foreground);
}
```

> **Web safety note:** `apps/web/app/globals.css` imports `@moja/ui/globals.css`
> which imports `@moja/theme/global.css`. These `@utility` helpers WILL be available
> on the web too, but since the web uses `font-sans` (Outfit) via `@layer base`,
> these mobile `@utility` helpers are simply never applied to web elements.
> They are inert in the web context.

---

## Phase 2 — Driver App Dark Mode

**Goal:** Make NativeWind resolve dark CSS variables. Fix all hardcoded tokens.

### Task 2.1 — `global.css`: Override `--radius` and Fix `@theme` Block

**File:** `apps/driver-app/global.css`

**Replace entire file with:**
```css
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";

@import "nativewind/theme";
@import "@moja/theme/global.css";

/* ============================================================
   DRIVER APP LOCAL OVERRIDES
   These override @moja/theme after import — web is not affected.
   ============================================================ */

/* Mobile-specific radius scale — larger than web for touch ergonomics */
:root {
  --radius: 1rem;
}

@theme {
  /* Backward-compat aliases → now properly mapped to CSS variables */
  --color-bg-app:         var(--background);
  --color-bg-card:        var(--card);
  --color-bg-elevated:    var(--card-elevated);
  --color-border-subtle:  var(--border);
  --color-border-strong:  var(--border-strong);

  --color-text-primary:   var(--foreground);
  --color-text-secondary: var(--muted-foreground);
  --color-text-muted:     var(--muted-foreground);

  --color-error:          var(--destructive);

  /* Font Families */
  --font-montserrat:         "Montserrat";
  --font-montserrat-medium:  "Montserrat-Medium";
  --font-montserrat-semibold:"Montserrat-SemiBold";
  --font-montserrat-bold:    "Montserrat-Bold";
}
```
> All `@utility` typography helpers are now inherited from `packages/theme/global.css`.
> Remove the duplicate `@utility h1` … `@utility caption` blocks from this file.

### Task 2.2 — `app/_layout.tsx`: Force NativeWind Dark Mode

**File:** `apps/driver-app/app/_layout.tsx`

Add `View` import to the existing React Native import line, then wrap the Stack:

```tsx
import { View } from "react-native";

// Inside RootLayout() return:
return (
  <SafeAreaProvider>
    <TRPCReactProvider>
      <AuthenticatedNovuProvider>
        <ThemeProvider value={NAV_THEME}>
          <StatusBar style="light" />
          {/*
            className="dark" forces NativeWind to resolve .dark CSS variables
            for ALL descendant components. This is the single switch that makes
            bg-background, text-foreground, bg-card etc. go dark.
            style prop sets the actual View background for the navigator chrome.
          */}
          <View
            className="flex-1 dark"
            style={{ backgroundColor: colors.neutral.background }}
          >
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { flex: 1, backgroundColor: colors.neutral.background },
                animation: "slide_from_right",
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)/login" />
              <Stack.Screen name="(auth)/preferences" />
              <Stack.Screen name="(auth)/register" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="notifications" />
              <Stack.Screen
                name="trip/[id]/manifest"
                options={{ presentation: "modal", animation: "slide_from_bottom" }}
              />
            </Stack>
            <Toast />
          </View>
        </ThemeProvider>
      </AuthenticatedNovuProvider>
    </TRPCReactProvider>
  </SafeAreaProvider>
);
```

### Task 2.3 — `constants/theme.ts`: Add `streak` from Tokens

**File:** `apps/driver-app/constants/theme.ts`

```ts
// BEFORE:
streak: "#f97316",

// AFTER:
streak: Palette.orange[500],  // requires: import { Palette } (already imported)
```

### Task 2.4 — `lib/theme.ts`: No Changes Required

Already correctly structured. ✅

### Task 2.5 — `components/ui/Button.tsx`: Fix ActivityIndicator Colour

**File:** `apps/driver-app/components/ui/Button.tsx`

```tsx
// BEFORE (loading spinner colour):
color={
  variant === "outline" || variant === "ghost"
    ? colors.neutral.textPrimary
    : variant === "warning"
      ? colors.neutral.background
      : colors.neutral.textPrimary
}

// AFTER — use semantic constants (correct for all variants):
color={
  variant === "outline" || variant === "ghost"
    ? colors.neutral.textPrimary
    : colors.neutral.textPrimary  // primary-foreground is always white
}
```

### Task 2.6 — `features/auth/screens/login.tsx`: Fix Hardcoded rgba

**File:** `apps/driver-app/features/auth/screens/login.tsx` line 352

```tsx
// BEFORE:
backgroundColor: "rgba(238, 35, 124, 0.08)",

// AFTER:
backgroundColor: colors.primary.rose + "14",  // 14 hex = 8% opacity
// OR more explicitly:
import { Palette } from "@/constants/theme";
backgroundColor: `${Palette.rose[500]}14`,
```

---

## Phase 3 — Traveler App Light Mode & Border Radius

**Goal:** Force NativeWind light, fix radius, replace lib/theme.ts, fix invisible icon.

### Task 3.1 — `global.css`: Add `--radius` Override and Aliases

**File:** `apps/traveler-app/global.css`

```css
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";

@import "nativewind/theme";
@import "@moja/theme/global.css";

/* ============================================================
   TRAVELER APP LOCAL OVERRIDES
   ============================================================ */

/* Mobile-specific radius scale — larger touch targets than web */
:root {
  --radius: 1rem;
}

@theme {
  /* Font Families */
  --font-montserrat:          "Montserrat";
  --font-montserrat-medium:   "Montserrat-Medium";
  --font-montserrat-semibold: "Montserrat-SemiBold";
  --font-montserrat-bold:     "Montserrat-Bold";
}
```

### Task 3.2 — `app/_layout.tsx`: Force NativeWind Light Mode

**File:** `apps/traveler-app/app/_layout.tsx`

Import `NAV_THEME` from the fixed `lib/theme.ts` (Task 3.3) and wrap content:

```tsx
import { View } from "react-native";
import { NAV_THEME } from "@/lib/theme";   // replaces inline LightTheme
import { Colors } from "@/constants/theme";

// Remove the inline LightTheme object entirely.

// Inside RootLayout(), replace the content const:
const content = (
  <TRPCReactProvider>
    <AuthenticatedNovuProvider>
      <ThemeProvider value={NAV_THEME}>
        <StatusBar style="dark" />
        {/*
          className="light" forces NativeWind to always use :root (light)
          CSS variables regardless of device system dark mode preference.
        */}
        <View
          className="flex-1 light"
          style={{ backgroundColor: Colors.light.background }}
        >
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
              contentStyle: { flex: 1, backgroundColor: Colors.light.background },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="article/[slug]"
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
          </Stack>
          <Toast />
          <PortalHost />
          <PendingReviewPrompt />
        </View>
      </ThemeProvider>
    </AuthenticatedNovuProvider>
  </TRPCReactProvider>
);
```

### Task 3.3 — `lib/theme.ts`: Replace with @moja/theme-Aligned Version

**File:** `apps/traveler-app/lib/theme.ts`

**Replace entire file:**
```ts
// ============================================================
// Traveler App — Navigation Theme
// Aligned with @moja/theme/tokens. Single source of truth.
// ============================================================

import { DefaultTheme, type Theme } from "expo-router/react-navigation";
import { Colors, Palette } from "@/constants/theme";

export const NAV_THEME: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    background:   Colors.light.background,    // "#ffffff"
    card:         Colors.light.card,          // "#ffffff"
    text:         Colors.light.textPrimary,   // "#18181b"
    border:       Colors.light.border,        // "#e4e4e7"
    primary:      Palette.rose[500],          // "#ee237c" — Moja brand pink
    notification: Palette.rose[500],          // "#ee237c"
  },
};
```

### Task 3.4 — `app/tracking/[tripId].tsx`: Fix Invisible Icon

**File:** `apps/traveler-app/app/tracking/[tripId].tsx` line 72

```tsx
// BEFORE — renders near-white icon on white background (invisible):
<ArrowLeft size={20} color={Colors.dark.text} />

// AFTER:
<ArrowLeft size={20} color={Colors.light.textPrimary} />
```

### Task 3.5 — `components/ui/card.tsx`: Add `dark:` Comment

**File:** `apps/traveler-app/components/ui/card.tsx`

Add a comment above the `dark:` references in the shadcn components to document intent:

```tsx
// In card.tsx — the Card component rounded-xl will now be 20px with --radius: 1rem
// No code change needed — the :root override in global.css handles it automatically.
```
> The `rounded-xl` radius fix is handled entirely by the `--radius: 1rem` override
> in Task 3.1. No component files need touching for the radius regression fix.

---

## Phase 4 — Icon & JS Colour Centralisation

**Goal:** Eliminate all scattered `Colors.light.*` / `Colors.dark.*` as inline JS prop values.
Create one authoritative constants file per app.

### Task 4.1 — Create `constants/ui-colors.ts` in Driver App

**File:** `apps/driver-app/constants/ui-colors.ts` (NEW FILE)

```ts
// ============================================================
// Driver App — JS Colour Constants for Non-CSS Contexts
//
// Use these for: icon color props, placeholderTextColor,
// Switch trackColor/thumbColor, ActivityIndicator color.
//
// Do NOT use for NativeWind className props — use CSS tokens there.
// ============================================================

import { Palette, Colors } from "@moja/theme/tokens";

/**
 * Icon colours for the driver app (always dark mode).
 * Use Palette directly — these are stable primitives.
 */
export const IconColors = {
  default:    Colors.dark.textPrimary,     // #fafafa
  secondary:  Colors.dark.textSecondary,   // #a1a1aa
  muted:      Colors.dark.textMuted,       // #71717a
  brand:      Palette.rose[500],           // #ee237c
  onBrand:    "#ffffff",                   // on primary backgrounds
  success:    Palette.emerald[500],        // #10b981
  warning:    Palette.amber[500],          // #f59e0b
  error:      Palette.red[500],            // #ef4444
  info:       Palette.blue[500],           // #3b82f6
  streak:     Palette.orange[500],         // #f97316
} as const;

/**
 * Switch / Toggle component colours.
 */
export const SwitchColors = {
  trackOff:  Colors.dark.border,           // #27272a
  trackOn:   Palette.rose[500],            // #ee237c
  thumb:     Colors.dark.textPrimary,      // #fafafa
} as const;

/**
 * TextInput placeholder colour.
 */
export const PlaceholderColor = Colors.dark.textMuted;  // #71717a
```

### Task 4.2 — Create `constants/ui-colors.ts` in Traveler App

**File:** `apps/traveler-app/constants/ui-colors.ts` (NEW FILE)

```ts
// ============================================================
// Traveler App — JS Colour Constants for Non-CSS Contexts
//
// Use these for: icon color props, placeholderTextColor,
// Switch trackColor/thumbColor, ActivityIndicator color.
//
// Do NOT use for NativeWind className props — use CSS tokens there.
// ============================================================

import { Palette, Colors } from "@moja/theme/tokens";

/**
 * Icon colours for the traveler app (always light mode).
 */
export const IconColors = {
  default:    Colors.light.textPrimary,    // #18181b
  secondary:  Colors.light.textSecondary,  // #71717a
  muted:      Colors.light.textMuted,      // #a1a1aa
  brand:      Palette.rose[500],           // #ee237c
  onBrand:    "#ffffff",                   // on primary backgrounds
  onCard:     Colors.light.card,           // #ffffff (icon inside coloured button)
  success:    Palette.emerald[500],        // #10b981
  warning:    Palette.amber[500],          // #f59e0b
  error:      Palette.red[500],            // #ef4444
  info:       Palette.blue[500],           // #3b82f6
} as const;

/**
 * Switch / Toggle component colours.
 */
export const SwitchColors = {
  trackOff:  Colors.light.borderStrong,    // #d4d4d8
  trackOn:   Palette.rose[500],            // #ee237c
  trackOnSubtle: Palette.rose[200],        // #fecdd3
  thumb:     Colors.light.background,      // #ffffff
  thumbActive: Palette.rose[500],          // #ee237c
} as const;

/**
 * TextInput placeholder colour.
 */
export const PlaceholderColor = Colors.light.textMuted;  // #a1a1aa
```

### Task 4.3 — Migrate All `Colors.light.*` / `Colors.dark.*` Inline Props

**Scope:** ~40 files in `apps/traveler-app`, ~3 files in `apps/driver-app`

**Migration rule:** Replace every `Colors.light.X` or `Colors.dark.X` used as a
prop value (not a StyleSheet property) with the equivalent `IconColors.X` or
`SwitchColors.X` from the new constants file.

**Key substitutions (traveler-app):**

| Old | New |
|-----|-----|
| `Colors.light.textMuted` (icon color) | `IconColors.muted` |
| `Colors.light.textSecondary` (icon color) | `IconColors.secondary` |
| `Colors.light.textPrimary` (icon color) | `IconColors.default` |
| `Colors.light.primaryForeground` (icon on button) | `IconColors.onBrand` |
| `Colors.light.card` (icon in circle button) | `IconColors.onCard` |
| `Colors.light.background` (thumb color) | `SwitchColors.thumb` |
| `Colors.light.borderStrong` (track color off) | `SwitchColors.trackOff` |
| `Palette.rose[200]` (track color subtle) | `SwitchColors.trackOnSubtle` |
| `Colors.light.textMuted` (placeholder) | `PlaceholderColor` |
| `Colors.dark.text` (tracking screen bug) | `IconColors.default` |

**Special case: SVG fill/stroke in tab bar**
The `CustomTabBar` in `apps/traveler-app/app/(tabs)/_layout.tsx` uses
`Colors.light.card` and `Colors.light.border` for SVG props. These are correct
and intentional (SVG cannot use Tailwind). Add a comment:

```tsx
// SVG cannot use NativeWind classes — these must be JS constants.
// Always use the app's light-mode values since traveler-app is locked to light.
fill={Colors.light.card}    // white card background
stroke={Colors.light.border} // subtle border line
```

---

## Phase 5 — Typography Utility System

**Goal:** Both mobile apps use `h1`, `h2`, `body-md`, etc. consistently.

### Task 5.1 — Remove Duplicate Typography from Driver App `global.css`

After Phase 1 Task 1.2.4 adds typography utilities to `packages/theme/global.css`,
the duplicate `@utility h1` ... `@utility caption` blocks must be **removed** from
`apps/driver-app/global.css`. They are now inherited.

### Task 5.2 — Update All Typography Usage

In both apps, standardise text styling:

| Instead of | Use |
|------------|-----|
| `text-2xl font-bold text-foreground` on a screen title | `h1` or `h2` utility |
| `text-sm font-medium text-muted-foreground` | `body-sm` utility |
| `text-[11px] font-medium text-destructive mt-0.5` | `caption text-destructive` |
| `style={styles.title}` with JS font values | `className="h2"` or `className="h3"` |

---

## Phase 6 — Styling Rule Documentation

**Goal:** Codify the hybrid styling rule so every developer knows exactly when to use what.

### Task 6.1 — Create Styling Conventions File

**File:** `context/code-standards.md` (update the relevant section)

Add a section:

```md
## Mobile Styling Rules

### Rule 1: NativeWind for Visual Styling
All colours, typography, spacing, and border radii for UI components use
NativeWind utility classes derived from @moja/theme CSS variables.

✅ `<Text className="text-foreground text-sm font-medium">`
✅ `<View className="bg-card border border-border rounded-xl p-4">`
❌ `<Text style={{ color: "#18181b", fontSize: 14 }}>` — hardcoded

### Rule 2: StyleSheet.create() Only for Layout Shells
StyleSheet.create() is permitted exclusively for:
- Components that need dynamic values at runtime (e.g. `insets.top + 12`)
- Complex shadows not expressible in NativeWind
- TabBar, ScreenShell, PageHeader

### Rule 3: JS Constants for Non-CSS Props
Props that cannot accept className (icon color, placeholderTextColor, Switch
thumbColor/trackColor, ActivityIndicator color) must use:
- `IconColors.*` from `constants/ui-colors.ts`
- `SwitchColors.*` from `constants/ui-colors.ts`
- `PlaceholderColor` from `constants/ui-colors.ts`

Never use `Colors.light.*` or `Colors.dark.*` inline.

### Rule 4: No New Tokens Invented in Apps
Any new colour, radius, or spacing needed by an app feature must first be
proposed as an addition to `packages/theme/tokens.ts`. App-level constants
reference tokens — they do not create parallel values.

### Rule 5: Typography via Utilities
Use `className="h1"`, `className="body-md"`, `className="caption"` etc.
Add custom size overrides with Tailwind: `className="h2 text-xl"` (override the size).
```

---

## Execution Order

Execute phases in strict order. Each phase is independently testable.

```
Phase 1 (packages/theme)
  ├── Task 1.1 tokens.ts changes
  └── Task 1.2 global.css changes
            ↓
Phase 2 (driver-app)
  ├── Task 2.1 global.css rewrite
  ├── Task 2.2 _layout.tsx dark wrapper
  ├── Task 2.3 constants/theme.ts streak fix
  ├── Task 2.5 Button.tsx ActivityIndicator
  └── Task 2.6 login.tsx rgba fix
            ↓
Phase 3 (traveler-app)
  ├── Task 3.1 global.css radius + aliases
  ├── Task 3.2 _layout.tsx light wrapper + NAV_THEME
  ├── Task 3.3 lib/theme.ts replacement
  └── Task 3.4 tracking screen icon fix
            ↓
Phase 4 (Icon Colours)
  ├── Task 4.1 driver constants/ui-colors.ts
  ├── Task 4.2 traveler constants/ui-colors.ts
  └── Task 4.3 migrate all inline Colors.light/dark props
            ↓
Phase 5 (Typography)
  ├── Task 5.1 remove duplicate @utility from driver global.css
  └── Task 5.2 update typography usage in both apps
            ↓
Phase 6 (Documentation)
  └── Task 6.1 update code-standards.md
```

---

## File Change Index

| File | Change Type | Phase |
|------|-------------|-------|
| `packages/theme/tokens.ts` | Modify — add Palette.orange, fix Radii, add borderStrong/streak to Colors | 1.1 |
| `packages/theme/global.css` | Modify — add --border-strong/--streak vars, fix dark border rgba, add @utility typography | 1.2 |
| `apps/driver-app/global.css` | Rewrite — :root --radius override, fix @theme aliases, remove duplicate @utility | 2.1 |
| `apps/driver-app/app/_layout.tsx` | Modify — add dark View wrapper | 2.2 |
| `apps/driver-app/constants/theme.ts` | Modify — streak from Palette | 2.3 |
| `apps/driver-app/components/ui/Button.tsx` | Modify — ActivityIndicator colour | 2.5 |
| `apps/driver-app/features/auth/screens/login.tsx` | Modify — fix rgba hardcode | 2.6 |
| `apps/traveler-app/global.css` | Modify — :root --radius override, @theme font aliases | 3.1 |
| `apps/traveler-app/app/_layout.tsx` | Modify — add light View wrapper, import NAV_THEME | 3.2 |
| `apps/traveler-app/lib/theme.ts` | Rewrite — aligned to @moja/theme | 3.3 |
| `apps/traveler-app/app/tracking/[tripId].tsx` | Modify — fix Colors.dark.text bug | 3.4 |
| `apps/driver-app/constants/ui-colors.ts` | NEW — JS colour constants | 4.1 |
| `apps/traveler-app/constants/ui-colors.ts` | NEW — JS colour constants | 4.2 |
| `apps/traveler-app/**/*.tsx` (~40 files) | Migrate — replace Colors.light.* inline props | 4.3 |
| `context/code-standards.md` | Update — mobile styling rules section | 6.1 |

**Total files touched: ~50**
**apps/web: 0 files changed**

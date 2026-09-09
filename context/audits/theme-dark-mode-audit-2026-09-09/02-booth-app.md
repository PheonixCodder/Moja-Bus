# Audit: `apps/booth-app` — Theme & Styling Audit

**Date:** 2026-09-09
**Auditor:** Antigravity
**Scope:** All files in `apps/booth-app/` — theme mode, source of truth, hardcoded values, CSS variable usage, NativeWind hygiene
**Related:** `context/audits/theme-dark-mode-audit-2026-09-09/01-packages-theme.md`, `context/plans/theme-centralisation-2026-09-09.md`

---

## Executive Summary

| Property | Status |
|---|---|
| **Declared mode** | ✅ Light (`userInterfaceStyle: "light"` in `app.json`) |
| **NativeWind mode forced?** | ❌ **No** — no `className="light"` wrapper in `_layout.tsx`. The app follows system dark mode preference. |
| **ThemeProvider present?** | ❌ **No** — no `<ThemeProvider>` wrapping the Stack at all |
| **Source of truth for colours** | ⚠️ **Fragmented** — partially `@moja/theme/tokens` (via `constants/theme.ts`), partially hardcoded hex, partially raw Tailwind named colours |
| **Typography utilities** | ❌ Duplicated & hardcoded hex in `global.css` — not using `var(--foreground)` |
| **Severity** | **HIGH** — system dark mode leaks into the app despite light intent |

---

## 1. Theme Mode Declared vs. Actual

### 1.1 What is declared

- `apps/booth-app/app.json` → `"userInterfaceStyle": "light"` ✅
- `constants/theme.ts` header comment: *"Booth App uses LIGHT MODE exclusively"* ✅
- `global.css` comment: *"TYPOGRAPHY UTILITIES — Booth Edition (Light Mode)"* ✅

**Intended mode: LIGHT** — the booth is a tablet app used at bus terminals in daylight.

### 1.2 What actually happens at runtime

**`apps/booth-app/app/_layout.tsx`** — the root layout does NOT force NativeWind light mode:

```tsx
// _layout.tsx (current) — MISSING mode wrapper
return (
  <SafeAreaProvider>
    <TRPCReactProvider>
      <StatusBar style="dark" />        {/* ← correct for light UI */}
      <ReconnectHandler />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { flex: 1, backgroundColor: "#ffffff" },  // ← hardcoded
          animation: "slide_from_right",
        }}
      >
        ...
      </Stack>
      <Toast />
    </TRPCReactProvider>
  </SafeAreaProvider>
);
```

**Problems:**
1. No `<View className="flex-1 light">` wrapper → NativeWind will follow the device system dark/light preference. If a user has their device in dark mode, all `bg-background`, `text-foreground`, `bg-card` etc. CSS variable classes will resolve to the DARK palette from `@moja/theme/global.css`, not the light palette. The booth will render with a dark background on dark-mode devices.
2. No `<ThemeProvider>` → expo-router navigation chrome has no explicit theme.

---

## 2. Source of Truth — Colour System

The booth-app has **three competing sources** for colour values:

| Source | Usage in codebase |
|--------|------------------|
| `@moja/theme/tokens` via `constants/theme.ts` | ✅ Used correctly in `Input.tsx`, `Button.tsx` for `placeholderTextColor` and `ActivityIndicator` colour |
| CSS variables via NativeWind (`bg-background`, `text-foreground`, etc.) | ✅ Used in most screens for layout containers and text |
| Raw hardcoded hex strings | ❌ Used in 7+ files for icon `color` props and `ActivityIndicator` |
| Raw Tailwind named colours (`bg-green-50`, `text-blue-700`) | ❌ Used extensively in payment, booking, and reconciliation screens |

There is **no `constants/ui-colors.ts`** file (as prescribed by the centralisation plan for driver-app and traveler-app). Icon colours are scattered as inline hex.

---

## 3. Findings Catalogue

### F-01 — CRITICAL: No NativeWind Mode Lock

**File:** `app/_layout.tsx`
**Severity:** 🔴 CRITICAL

No `<View className="flex-1 light">` wrapper around the Stack. The app follows the device system preference. On a device set to dark mode, all CSS variable-based colours resolve to dark palette values despite the app being declared as light-mode.

Also in `_layout.tsx` line 89:
```tsx
contentStyle: { flex: 1, backgroundColor: "#ffffff" },  // ← hardcoded white
```
The Stack navigator background is hardcoded `#ffffff` instead of `Colors.light.background`.

**Fix:**
```tsx
import { View } from "react-native";
import { Colors } from "@/constants/theme";

return (
  <SafeAreaProvider>
    <TRPCReactProvider>
      <StatusBar style="dark" />
      <ReconnectHandler />
      {/*
        className="light" forces NativeWind to always resolve :root (light)
        CSS variables regardless of device system dark mode preference.
        This is the single switch that keeps the booth in light mode.
      */}
      <View
        className="flex-1 light"
        style={{ backgroundColor: Colors.light.background }}
      >
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { flex: 1, backgroundColor: Colors.light.background },
            animation: "slide_from_right",
          }}
        >
          ...
        </Stack>
        <Toast />
      </View>
    </TRPCReactProvider>
  </SafeAreaProvider>
);
```

---

### F-02 — HIGH: Typography Utilities Hardcode Hex Instead of CSS Variables

**File:** `global.css`
**Severity:** 🟠 HIGH

All `@utility h1` through `@utility caption` blocks use hardcoded hex:

```css
@utility h1      { color: #18181b; }   /* ← should be var(--foreground) */
@utility h2      { color: #18181b; }
@utility h3      { color: #18181b; }
@utility h4      { color: #18181b; }
@utility body-lg { color: #18181b; }
@utility body-md { color: #18181b; }
@utility body-sm { color: #71717a; }   /* ← should be var(--muted-foreground) */
@utility caption { color: #71717a; }
```

The `micro` utility (present in `packages/theme/global.css` specification) is **missing entirely** from booth-app.

The `global.css` also **does not override `--radius`** for mobile. The base package uses `--radius: 0.625rem` (10px). Mobile apps should override to `--radius: 1rem` (16px) for touch-appropriate rounding, as planned for driver-app and traveler-app.

---

### F-03 — HIGH: Hardcoded Hex for All Icon Colours (No `constants/ui-colors.ts`)

**Files:** Multiple
**Severity:** 🟠 HIGH

There is no `constants/ui-colors.ts` in booth-app. Every icon `color` prop uses a raw hex string:

| File | Hardcoded Value | Correct Replacement |
|------|-----------------|---------------------|
| `app/(tabs)/_layout.tsx` L11 — `tabBarActiveTintColor` | `"#ee237c"` | `Palette.rose[500]` |
| `app/(tabs)/profile.tsx` L94 — MapPin icon | `"#ee237c"` | `IconColors.brand` |
| `app/(tabs)/profile.tsx` L116 — BarChart icon | `"#2563eb"` | `IconColors.info` |
| `app/(tabs)/profile.tsx` L125 — Globe icon | `"#6b7280"` | `IconColors.muted` |
| `app/(tabs)/profile.tsx` L162 — Logout icon | `"#ef4444"` | `IconColors.error` |
| `app/(tabs)/checkin.tsx` L99 — Barcode icon | `"#9ca3af"` | `IconColors.secondary` |
| `app/(tabs)/checkin.tsx` L153 — CheckmarkCircle icon | `"#22c55e"` | `IconColors.success` |
| `app/(tabs)/checkin.tsx` L171 — CancelCircle icon | `"#ef4444"` | `IconColors.error` |
| `app/sell/payment.tsx` L206 — ArrowLeft icon | `"#111"` | `IconColors.default` |
| `app/sell/payment.tsx` L230 — BanknoteIcon | `"#16a34a"` | `IconColors.success` |
| `app/sell/payment.tsx` L249 — SmartPhone01Icon | `"#2563eb"` | `IconColors.info` |
| `app/sell/passenger.tsx` L138 — ArrowLeft icon | `"#111"` | `IconColors.default` |
| `app/sell/confirmation.tsx` L36 — CheckCircle | `"#22c55e"` | `IconColors.success` |
| `app/sell/confirmation.tsx` L61 — Share icon | `"#666"` | `IconColors.muted` |
| `app/sell/[tripId].tsx` L122 — ArrowLeft icon | `"#111"` | `IconColors.default` |
| `components/paystack-qr.tsx` L127 — X icon | `"#666"` | `IconColors.muted` |
| `app/(tabs)/bookings.tsx` L167 — BanknoteIcon | `"#16a34a"` | `IconColors.success` |
| `app/(tabs)/bookings.tsx` L173 — SmartPhone01Icon | `"#2563eb"` | `IconColors.info` |
| `app/(tabs)/bookings.tsx` L189 — WifiOff01Icon | `"#f59e0b"` | `IconColors.warning` |

---

### F-04 — HIGH: Hardcoded `ActivityIndicator` and `placeholderTextColor` Values

**Files:** Multiple
**Severity:** 🟠 HIGH

| File | Prop | Raw Value | Fix |
|------|------|-----------|-----|
| `app/(tabs)/index.tsx` L87 | `ActivityIndicator color` | `"#ee237c"` | `Palette.rose[500]` |
| `app/(tabs)/index.tsx` L79 | `placeholderTextColor` | `"#9ca3af"` | `PlaceholderColor` from `constants/ui-colors.ts` |
| `app/sell/[tripId].tsx` L108 | `ActivityIndicator color` | `"#ee237c"` | `Palette.rose[500]` |
| `app/terminal-select.tsx` L51 | `ActivityIndicator color` | `"#ee237c"` | `Palette.rose[500]` |
| `app/reconcile.tsx` L78 | `ActivityIndicator color` | `"#ee237c"` | `Palette.rose[500]` |

Note: `Input.tsx` handles `placeholderTextColor` correctly via `colors.neutral.textMuted`. The inline usage in `index.tsx` is inconsistent with it.

---

### F-05 — MEDIUM: Extensive Raw Tailwind Named Colours Bypass the Token System

**Files:** Multiple screens
**Severity:** 🟡 MEDIUM

Payment-method domain colours (cash=green, mobile=blue, offline=amber) are expressed as raw Tailwind named colour classes throughout. These will not adapt if the palette changes and are not tracked in the design system.

| File | Raw Classes Used |
|------|-----------------|
| `app/sell/payment.tsx` | `bg-green-50 border-green-200 text-green-800 text-green-700`, `bg-blue-50 border-blue-200 text-blue-800 text-blue-700` |
| `app/sell/passenger.tsx` | `bg-green-50 border-green-200 text-green-800 text-green-700 text-green-600`, `bg-amber-50 border-amber-200 text-amber-800` |
| `app/(tabs)/bookings.tsx` | `bg-green-50 border-green-200 text-green-700 text-green-800`, `bg-blue-50 border-blue-200 text-blue-800`, `bg-green-100 bg-blue-100 text-green-700 text-blue-700` |
| `app/reconcile.tsx` | `bg-green-50 border-green-200 text-green-700 text-green-800 text-green-900`, `bg-blue-50 border-blue-200 text-blue-700 text-blue-800 text-blue-900` |
| `app/sell/[tripId].tsx` | `text-amber-700`, `bg-amber-100 border-amber-300 text-amber-800` |
| `components/offline-banner.tsx` | `bg-amber-500` (hardcoded banner background) |
| `app/(tabs)/index.tsx` | `text-red-500 text-green-600 bg-blue-100 text-blue-700 bg-orange-100 text-orange-700` |

> **Recommended approach:** These are intentional semantic payment-method colours. The correct fix is to either (a) add `success`, `info`, `warning` semantic tokens to `@moja/theme` and map them, or (b) document them as booth-specific payment-method constants in `constants/theme.ts` so they are at least tracked in one place rather than scattered as raw Tailwind classes.

---

### F-06 — MEDIUM: `global.css` Aliases Have Two Hardcoded Values

**File:** `global.css` lines 14 and 18
**Severity:** 🟡 MEDIUM

```css
@theme {
  --color-border-strong: #d4d4d8;   /* ← hardcoded zinc-300 — should be var(--border-strong) once Phase 1 adds it */
  --color-text-muted: #a1a1aa;      /* ← hardcoded zinc-400 — should be var(--muted-foreground) right now */
}
```

`--muted-foreground` already exists in `@moja/theme/global.css`. The `--color-text-muted` alias should reference it today. `--border-strong` will be added in Phase 1 of the plan; at that point `--color-border-strong` should also be switched to `var(--border-strong)`.

---

### F-07 — MEDIUM: `login.tsx` Uses Raw `TextInput`/`TouchableOpacity` Instead of Shared Components

**File:** `app/(auth)/login.tsx`
**Severity:** 🟡 MEDIUM

The login screen bypasses the shared component library:

1. Uses raw `<TextInput>` with no `placeholderTextColor` prop — placeholder colour is platform-default, not themed.
2. Uses raw `<TouchableOpacity>` + `<Text className="text-white ...">` for the submit button instead of `<Button variant="primary">`.

Both `Input` and `Button` components in `components/ui/` already handle these correctly. The login screen should consume them for consistency.

---

### F-08 — LOW: Invented Semantic Colours in `constants/theme.ts`

**File:** `constants/theme.ts` lines 43-45
**Severity:** 🟢 LOW

```ts
semantic: {
  ticket:   "#10b981",   // ← should be Palette.emerald[500]
  cash:     "#10b981",   // ← should be Palette.emerald[500]
  paystack: "#0065ff",   // ← invented value not in Palette
},
```

`Palette.emerald[500]` = `"#10b981"` — the values match but the reference is lost. `paystack` (`#0065ff`) is a third-party brand colour that should be named explicitly.

---

### F-09 — LOW: Tab Bar Missing `tabBarInactiveTintColor` and `tabBarStyle`

**File:** `app/(tabs)/_layout.tsx`
**Severity:** 🟢 LOW

Only `tabBarActiveTintColor` is set (as raw hex). `tabBarInactiveTintColor` defaults to a platform value (may not match theme). `tabBarStyle` has no `backgroundColor`, which could show a default white/dark tab bar depending on the OS.

```tsx
// Should be:
import { colors, Palette } from "@/constants/theme";

screenOptions={{
  headerShown: false,
  tabBarActiveTintColor: Palette.rose[500],
  tabBarInactiveTintColor: colors.neutral.textMuted,
  tabBarStyle: { backgroundColor: colors.neutral.background },
}}
```

---

## 4. What Is Working Correctly

| ✅ | Detail |
|----|--------|
| `constants/theme.ts` | Imports and re-exports from `@moja/theme/tokens`. The `colors` object correctly binds to `Colors.light.*` exclusively — no dark values mixed in. |
| `components/ui/Input.tsx` | Correctly uses `colors.neutral.textMuted` for `placeholderTextColor`. |
| `components/ui/Button.tsx` | `ActivityIndicator` colour correctly uses `colors.neutral.*`. Variant logic is sound. |
| `global.css` base imports | Correctly imports `@moja/theme/global.css`. Most `@theme` aliases use `var(--token)`. |
| `app.json` | Declares `userInterfaceStyle: "light"` — OS-level system preference lock is in place. |
| `StatusBar` | `style="dark"` — correct for a light-mode UI. |
| Screen background containers | Consistently use `bg-background`, `bg-card` CSS variable classes — not hardcoded backgrounds for main layout containers. |

---

## 5. Priority Fix Order

```
P0 — CRITICAL (incorrect rendering on dark-mode devices)
  F-01  Add <View className="flex-1 light"> wrapper in _layout.tsx
        Replace contentStyle backgroundColor="#ffffff" with Colors.light.background

P1 — HIGH (token hygiene — multiple source-of-truth violations)
  F-02  global.css: replace hardcoded hex in @utility blocks with var(--foreground) / var(--muted-foreground)
        global.css: add :root { --radius: 1rem; } override
        global.css: add missing `micro` utility
  F-03  Create constants/ui-colors.ts with IconColors, PlaceholderColor for light mode
        Replace all inline color="..." hex on HugeiconsIcon with IconColors.*
  F-04  Replace all inline ActivityIndicator color="..." with Palette.rose[500]
        Replace inline placeholderTextColor="#9ca3af" in index.tsx with PlaceholderColor

P2 — MEDIUM (design system consistency)
  F-05  Add success/info/warning semantic tokens to @moja/theme (Phase 1 extension)
        OR add booth-specific payment colour constants to constants/theme.ts
  F-06  Fix --color-text-muted → var(--muted-foreground) in global.css
        Fix --color-border-strong → var(--border-strong) after Phase 1
  F-07  Replace raw <TextInput> in login.tsx with shared <Input>
        Replace raw submit TouchableOpacity with <Button variant="primary">

P3 — LOW (polish)
  F-08  Replace ticket/cash "#10b981" with Palette.emerald[500] in constants/theme.ts
        Document paystack "#0065ff" as a named brand constant
  F-09  Add tabBarInactiveTintColor and tabBarStyle to (tabs)/_layout.tsx using tokens
```

---

## 6. Comparison with Driver-App & Traveler-App Findings

| Issue | driver-app | traveler-app | booth-app |
|-------|-----------|-------------|-----------|
| NativeWind mode not forced | ✅ Fixed in plan (Phase 2) | ✅ Fixed in plan (Phase 3) | ❌ Same gap — not yet addressed |
| Missing `<ThemeProvider>` | Had it already | Had it already | ❌ Missing entirely |
| Typography `@utility` hardcodes hex | ✅ Found in audit, fixed in plan | N/A | ❌ Same issue — `#18181b`, `#71717a` |
| No `constants/ui-colors.ts` | ✅ Plan creates it (Task 4.1) | ✅ Plan creates it (Task 4.2) | ❌ Not created, not in plan |
| `ActivityIndicator` hardcoded colour | ✅ Fixed in plan (Task 2.5) | N/A | ❌ 4 instances unaddressed |
| Missing `--radius: 1rem` mobile override | ✅ Fixed in plan | ✅ Fixed in plan | ❌ Missing |
| Raw named Tailwind colours | Minimal | Minimal | ❌ Extensive — 7 files |
| Inline `placeholderTextColor` hex | ✅ Fixed in plan | N/A | ❌ 1 instance (index.tsx) |
| Login uses raw inputs not shared components | N/A | N/A | ❌ login.tsx |

---

## 7. Recommended Addition to the Theme Centralisation Plan

The existing plan (`theme-centralisation-2026-09-09.md`) scopes only driver-app and traveler-app. The following tasks should be added as **Phase 7 — Booth App**:

```
Phase 7 (booth-app)
  ├── Task 7.1   _layout.tsx — add <View className="flex-1 light"> + update contentStyle
  ├── Task 7.2a  global.css — fix @utility colour values to use var(--foreground) / var(--muted-foreground)
  ├── Task 7.2b  global.css — add :root { --radius: 1rem; } override for mobile touch scale
  ├── Task 7.2c  global.css — add missing `micro` utility
  ├── Task 7.2d  global.css — fix --color-text-muted to var(--muted-foreground)
  ├── Task 7.3   Create constants/ui-colors.ts (IconColors, PlaceholderColor — light mode)
  ├── Task 7.4   Migrate all inline color="..." on HugeiconsIcon to IconColors.*
  ├── Task 7.5   Migrate all ActivityIndicator color="..." to Palette.rose[500]
  ├── Task 7.6   (tabs)/_layout.tsx — use token values for tabBar tint/background
  ├── Task 7.7   login.tsx — replace raw <TextInput> / <TouchableOpacity> with <Input> / <Button>
  └── Task 7.8   constants/theme.ts — replace ticket/cash hex with Palette.emerald[500], name paystack brand colour
```

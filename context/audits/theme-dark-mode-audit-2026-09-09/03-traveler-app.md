# Audit: `apps/traveler-app` — Light Mode & Theming

## Quick Verdict

Light mode rendering is **mostly correct** but: (1) `lib/theme.ts` is a completely
independent colour system disconnected from `@moja/theme`; (2) border-radius is inconsistent
across 50+ components; (3) 40+ components hardcode `Colors.light.*` as JS props making them
impossible to theme-switch; (4) the traveler-app has no typography utility system at all.

---

## 1. Root Layout (`app/_layout.tsx`)

```tsx
const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.light.background,  // "#ffffff"
  },
};

<ThemeProvider value={LightTheme}>
  <StatusBar style="dark" />
  <Stack screenOptions={{ contentStyle: { flex: 1, backgroundColor: Colors.light.background } }}>
```

### Status: Functionally Correct for Light Mode ✅

The layout correctly uses `DefaultTheme` and locks the background to white.
`StatusBar style="dark"` is correct for a light background.

### Issue T1.1 — NativeWind is also missing colorScheme forcing

No `className="light"` or `setColorScheme("light")` call exists. Since the system
preference could be dark on the user's device, NativeWind might auto-switch to dark mode
on a device with dark system theme enabled. This would break the traveler-app visual design.

The traveler-app must **force light mode** just like the driver-app must force dark.

---

## 2. `lib/theme.ts` — Completely Disconnected System

### Issue T2.1 — Independent HSL strings, zero connection to `@moja/theme`

```ts
// apps/traveler-app/lib/theme.ts
export const THEME = {
  light: {
    background: "hsl(0 0% 100%)",
    primary: "hsl(0 0% 9%)",          // BLACK — not Moja rose!
    border:  "hsl(0 0% 89.8%)",
    ...
  },
  dark: {
    primary: "hsl(0 0% 98%)",         // WHITE — not Moja rose!
    ...
  },
};
```

**Critical problems:**
1. `primary` is defined as black (`hsl(0 0% 9%)`) — this is a shadcn/ui default.
   The Moja brand primary is `#ee237c` (rose-500). This THEME object is used for
   `NAV_THEME` which controls navigator header tint, tab bar active color etc.
   Any React Navigation component reading `theme.colors.primary` will render black, not pink.

2. These values are completely decoupled from `@moja/theme/tokens`. If the brand colour
   changes in tokens.ts, this file will not update.

3. The dark colour definitions in this file are never used (traveler-app is forced light)
   but their existence creates confusion.

### Issue T2.2 — `NAV_THEME` structure differs from driver-app

Driver-app exports a single `NAV_THEME: Theme` (dark only).
Traveler-app exports `NAV_THEME: Record<"light" | "dark", Theme>` — but then in
`_layout.tsx` uses its own inline `LightTheme` object, **not** `NAV_THEME` at all!
So `lib/theme.ts` in traveler-app is imported by nothing in `_layout.tsx`. Dead code.

---

## 3. `constants/theme.ts` — Thin but Correct

```ts
export {
  Colors, Fonts, Palette, primaryRGB, Spacing, type ThemeColor,
} from "@moja/theme/tokens";

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
```

This is correct — it re-exports from `@moja/theme/tokens` without adding a competing
colour system. The problem is that many components then call `Colors.light.*` directly
as hardcoded JS prop values instead of using NativeWind semantic classes.

---

## 4. `global.css` — Near Empty

```css
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";
@import "nativewind/theme";
@import "@moja/theme/global.css";
```

**No app-level `@theme` overrides, no `@utility` helpers, no backward-compat aliases.**

### Issue T4.1 — No typography utility classes

Driver-app has `@utility h1 { ... }` etc. in its `global.css`. Traveler-app has none.
Every screen defines font size, weight, and colour individually with Tailwind classes.
This leads to: `text-2xl font-bold`, `text-xl font-bold`, `text-lg font-semibold` used
inconsistently across different headers — no canonical type scale enforced.

### Issue T4.2 — No backward-compat aliases

Driver-app has `--color-bg-app`, `--color-bg-card`, `--color-border-subtle` etc. for legacy
code. Traveler-app has none, but uses both the `@moja/theme` tokens AND raw `Colors.light.*`
JS values. Without aliases, migrating to fully-semantic classes is harder.

---

## 5. Border Radius — Full Regression Analysis

### Root Cause

`packages/theme/global.css` → `--radius: 0.625rem` (10 px)

NativeWind v4 `@theme inline` maps:
- `rounded-sm` → 6 px
- `rounded-md` → 8 px  
- `rounded-lg` → 10 px
- `rounded-xl` → 14 px
- `rounded-2xl` → 18 px
- `rounded-3xl` → 22 px

### What the App Actually Uses (Inventory)

| Component | Class Used | Actual px | Expected "old" px | Delta |
|-----------|-----------|-----------|-------------------|-------|
| `ui/card.tsx` (shadcn Card) | `rounded-xl` | 14 | ~20 | −6 |
| `ui/button.tsx` default | `rounded-xl` | 14 | ~18 | −4 |
| `ui/input.tsx` | `rounded-xl` | 14 | ~18 | −4 |
| `features/search/search-form.tsx` container | `rounded-[20px]` | 20 | 20 | 0 |
| `features/auth/auth-field.tsx` | `rounded-[18px]` | 18 | 18 | 0 |
| `features/auth/auth-button.tsx` | `rounded-[18px]` | 18 | 18 | 0 |
| `features/settings/*.tsx` cards | `rounded-[20px]` | 20 | 20 | 0 |
| `features/settings/help-support.tsx` buttons | `rounded-[18px]` | 18 | 18 | 0 |

### The Visual Inconsistency

The shadcn primitive components (`Card`, `Button`, `Input`) use semantic `rounded-xl` (14 px).
All custom feature components use `rounded-[20px]` / `rounded-[18px]` arbitrary values.
The result is that inside the same screen:
- shadcn Card wrapper = 14 px radius → looks "boxed"/squared
- custom search form = 20 px radius → looks properly rounded
- auth fields = 18 px radius → intermediate

This is the "boxed" look the user reported. The shadcn primitive components shrank when
`--radius` was reduced from what was presumably `~1rem` (16 px) to `0.625rem` (10 px),
while the arbitrary pixel values stayed the same.

### Fix Options

**Option A (Recommended):** Increase `--radius` in `packages/theme/global.css` to `1rem`
(16 px). Then `--radius-xl` = 20 px, `--radius-2xl` = 24 px. The shadcn components
will match the arbitrary pixel values already in use.

**Option B:** Update all arbitrary `rounded-[20px]` and `rounded-[18px]` usages to
`rounded-xl` and `rounded-2xl` respectively, with the current 10 px base.
This requires touching ~50 files.

**Option C:** Keep `--radius: 0.625rem` and update only the shadcn primitive files
(`card.tsx`, `button.tsx`, `input.tsx`) to use `rounded-[20px]` / `rounded-[18px]`.
Less ideal — bypasses the token system.

---

## 6. `Colors.light.*` Hardcoded in JS Props — Full List

**40+ instances** of `Colors.light.*` used as JS prop values (icon `color=`,
`placeholderTextColor=`, `backgroundColor=`, `trackColor=`, `thumbColor=`).

These bypass NativeWind and are hardwired to light-mode values. If the traveler-app
ever needs system dark mode, all these will break. More immediately, they create a
maintenance burden because they don't update when CSS tokens change.

### Most Critical Files:

| File | Count | Props Affected |
|------|-------|---------------|
| `app/(tabs)/_layout.tsx` | 4 | icon `color`, SVG `fill`/`stroke` |
| `features/auth/screens/login.tsx` | 1 | `color` prop |
| `features/home/components/*.tsx` | 6 | icon `color`, `placeholderTextColor` |
| `features/search/components/*.tsx` | 8 | icon `color`, `placeholderTextColor`, `trackColor`, `thumbColor` |
| `features/settings/components/*.tsx` | 12 | `placeholderTextColor`, `thumbColor`, `ActivityIndicator color` |
| `features/booking/components/*.tsx` | 3 | icon `color` |
| `features/operators/components/*.tsx` | 5 | icon `color` |
| `components/subpage-header.tsx` | 1 | icon `color` |
| `components/notification-bell.tsx` | 1 | icon `color` |

### Special Case: `tracking/[tripId].tsx`

```tsx
<ArrowLeft size={20} color={Colors.dark.text} />
```

One component in the **traveler-app** uses `Colors.dark.text` — this is almost certainly
a copy-paste error from the driver-app and will render a near-white icon on a white
background, making it invisible.

---

## 7. Tab Bar (`app/(tabs)/_layout.tsx`)

### Status: Functionally Correct for Light Mode

The custom curved tab bar uses `Colors.light.card` for SVG fill and `Colors.light.border`
for stroke — correctly hardwired to light values.

### Issue T7.1 — Not using NativeWind / CSS tokens for SVG colours

SVG components cannot use NativeWind class names. The approach of using `Colors.light.*`
is the only option here. **This is acceptable** but should be documented.

### Issue T7.2 — Tab bar not forced light

If the device switches to system dark mode and NativeWind follows, the rest of the UI
would go dark but the SVG tab bar would stay light (since it reads JS constants).
This creates a split rendering. Forcing NativeWind to light mode (Issue T1.1 fix) prevents this.

---

## 8. Component Library (shadcn via `@rn-primitives`)

The traveler-app has a full shadcn/rn-primitives UI library (32 components in `components/ui/`).

### Issue T8.1 — Components use `dark:` variants but app has no dark mode

Many shadcn primitives include `dark:` Tailwind variants:
```tsx
// button.tsx
"dark:bg-input/30 dark:border-input dark:active:bg-input/50"
// input.tsx
"aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40"
```

Since the traveler-app is locked to light mode, these `dark:` classes are dead code.
They add bundle size but cause no visual problem. They should be removed or kept
deliberately as future-proofing — currently undocumented.

### Issue T8.2 — `card.tsx` `rounded-xl` is 14 px (the core regression)

```tsx
// components/ui/card.tsx
"bg-card border-border flex flex-col gap-6 rounded-xl border py-6 shadow-sm shadow-black/5"
```

`rounded-xl` = 14 px with current `--radius: 0.625rem`. This is the component that
looks "boxed" compared to the `rounded-[20px]` custom cards. **This is the primary fix target.**

### Issue T8.3 — `card.tsx` default padding is `py-6` (24 px vertical, no horizontal)

`CardContent` adds `px-6` and `CardHeader` adds `px-6`, but `Card` itself only has `py-6`.
If a screen renders `<Card>` without `CardHeader`/`CardContent`, content has no horizontal
padding. Several screens use `<Card className="p-4 ...">` which overrides this correctly,
but it means the default Card structure is not self-sufficient.

---

## 9. Summary of Issues

| # | Severity | Issue | Location |
|---|----------|-------|----------|
| T1 | 🔴 CRITICAL | NativeWind not forced to light — system dark mode would break traveler-app | `app/_layout.tsx` |
| T2 | 🔴 CRITICAL | `lib/theme.ts` disconnected from `@moja/theme` — `primary` = black, not rose | `lib/theme.ts` |
| T3 | 🔴 CRITICAL | `Colors.dark.text` used in traveler tracking screen — invisible icon | `app/tracking/[tripId].tsx` |
| T4 | 🟠 HIGH | Border-radius regression: `rounded-xl` = 14 px vs `rounded-[20px]` custom cards | Multiple |
| T5 | 🟠 HIGH | 40+ `Colors.light.*` hardcoded as JS props — fragile, bypasses token system | Multiple |
| T6 | 🟠 HIGH | No typography utility system — type scale inconsistent across screens | `global.css` |
| T7 | 🟡 MEDIUM | `lib/theme.ts` imported nowhere in `_layout.tsx` — dead code | `lib/theme.ts` |
| T8 | 🟡 MEDIUM | `dark:` variants in shadcn components are dead code | `components/ui/*.tsx` |
| T9 | 🟢 LOW | `card.tsx` default structure requires `CardHeader`/`CardContent` for padding | `components/ui/card.tsx` |

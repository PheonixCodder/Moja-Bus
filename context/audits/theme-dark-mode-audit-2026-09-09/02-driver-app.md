# Audit: `apps/driver-app` — Dark Mode & Theming

## Quick Verdict

The **JS layer** (NAV_THEME, constants/theme.ts) is correctly wired to dark values.
The **CSS/NativeWind layer** is NOT receiving the dark signal — no `colorScheme` prop is passed
to NativeWind, so every `bg-background`, `text-foreground`, etc. resolves the `:root` (light)
values instead of `.dark`. This is the #1 root cause of the dark mode being broken.

---

## 1. Root Layout (`app/_layout.tsx`)

```tsx
// CORRECT — NAV_THEME is dark
<ThemeProvider value={NAV_THEME}>
  <StatusBar style="light" />
  <Stack screenOptions={{ contentStyle: { backgroundColor: colors.neutral.background } }}>
```

### Issue 1.1 — NativeWind `colorScheme` prop is MISSING

`expo-router`'s `<ThemeProvider>` controls React Navigation colours only.
NativeWind has its own separate dark-mode mechanism. It listens for the `colorScheme`
context that must be explicitly set. Without it, NativeWind defaults to `"light"` and
never adds the `.dark` class to the virtual DOM tree.

**Missing code:**
```tsx
import { useColorScheme } from "nativewind";
// or
import { vars } from "nativewind";
```

The correct pattern for a **forced dark** app is to add `className="dark"` (or the
NativeWind v4 equivalent) to the root `<View>` that wraps the Stack. Since the driver-app
must always be dark regardless of system preference, this should be:

```tsx
// In _layout.tsx — wrap Stack in a forced-dark root View
<View className="flex-1 dark">
  <Stack ...>
```

Or use NativeWind's `useColorScheme` with `setColorScheme("dark")` on mount.

### Issue 1.2 — `contentStyle` uses JS value, not CSS var

```tsx
contentStyle: { flex: 1, backgroundColor: colors.neutral.background }
```

`colors.neutral.background` = `Colors.dark.background` = `"#09090b"` — this is correct
for the navigator chrome. But any screen that doesn't set its own background will show
the navigator background, not the NativeWind `bg-background` class. These two stay in sync
only as long as `Colors.dark.background` === the CSS `--background` dark value, which is
currently true but fragile.

---

## 2. NativeWind Configuration

### Issue 2.1 — No `colorScheme` override anywhere in the app

**Searched** all `.tsx` and `.ts` files for: `colorScheme`, `useColorScheme`,
`setColorScheme`, `className="dark"`. **Zero results.**

This confirms NativeWind always renders in light mode. Every utility class that relies on
`:root` CSS variables (`bg-background`, `text-foreground`, `bg-card`, `border-border`, etc.)
resolves the light palette.

### Issue 2.2 — `global.css` typography utilities use hardcoded hex

```css
/* apps/driver-app/global.css */
@utility h1  { color: #fafafa; }   /* zinc-50 — dark text */
@utility h2  { color: #fafafa; }
@utility h3  { color: #fafafa; }
@utility h4  { color: #fafafa; }
@utility body-lg { color: #fafafa; }
@utility body-md { color: #fafafa; }
@utility body-sm { color: #a1a1aa; }  /* zinc-400 */
@utility caption { color: #71717a; }  /* zinc-500 */
```

These are correct for dark mode visually, but they bypass `var(--foreground)`. If the
theme is ever updated, these won't follow. They also cannot adapt. They should use:
```css
@utility h1 { color: var(--foreground); }
```

### Issue 2.3 — `--color-border-strong` hardcoded in `@theme` block

```css
@theme {
  --color-border-strong: #3f3f46;  /* hardcoded zinc-700 */
}
```

Should be `var(--border-strong)` via a CSS variable, not a raw hex in `@theme`.
If the theme dark mode border is changed in `packages/theme`, this won't update.

### Issue 2.4 — `--color-text-muted` hardcoded

```css
@theme {
  --color-text-muted: #71717a;  /* hardcoded zinc-500 */
}
```

Same problem — bypasses the token system.

---

## 3. `constants/theme.ts`

### Status: CORRECT ✅

The file correctly re-exports from `@moja/theme/tokens` and builds a `colors` object
pinned to `Colors.dark.*`. This is the right approach.

```ts
export const colors = {
  neutral: {
    background: Colors.dark.background,   // #09090b
    surface:    Colors.dark.surface,      // #18181b
    elevated:   Colors.dark.cardElevated, // #27272a
    border:     Colors.dark.border,       // #27272a
    ...
  }
};
```

### Minor Issue — `streak` colour is hardcoded

```ts
semantic: {
  streak: "#f97316",  // orange-500 — not in @moja/theme/tokens
}
```

Should be added to `packages/theme/tokens.ts` as `Palette.orange[500]` for centralisation.

---

## 4. `lib/theme.ts`

### Status: CORRECT ✅

```ts
export const NAV_THEME: Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    background: colors.neutral.background,  // from @moja/theme dark
    card:        colors.neutral.surface,
    text:        colors.neutral.textPrimary,
    border:      colors.neutral.border,
    primary:     colors.primary.rose,
    notification: colors.primary.rose,
  },
};
```

This is correct. The navigator renders dark correctly because it reads `NAV_THEME`.
The problem is NativeWind does not.

---

## 5. UI Components

### 5.1 `components/ui/ScreenShell.tsx`
- Uses `StyleSheet.create` with `colors.neutral.background` — **correct** (pulls dark values from JS tokens).
- `footerWrap.borderTopColor` = `colors.neutral.border` — **correct**.
- ❌ No NativeWind classes — fine for layout, but means it will not respond to theme changes via CSS.

### 5.2 `components/ui/PageHeader.tsx`
- Uses `StyleSheet.create` with `colors.neutral.*` throughout — **correct**.
- `backButton.backgroundColor` = `colors.neutral.surface` — **correct**.
- ❌ Mixed pattern: some text uses `StyleSheet` colours, icons pass `colors.neutral.textPrimary` directly.

### 5.3 `components/ui/Button.tsx`
- Uses **NativeWind classes only** (`bg-primary`, `bg-card`, `text-foreground`, etc.) — **correct** pattern.
- ❌ But since NativeWind is in light mode (Issue 2.1), `bg-card` = white, `bg-secondary` = light grey.
- `ActivityIndicator` colour prop: uses `colors.neutral.textPrimary` (dark value) — hardcoded JS.
  This is fine for forced dark but breaks the pattern.

### 5.4 `components/ui/Card.tsx`
- Uses NativeWind: `bg-card border-border rounded-2xl` — **correct** pattern.
- ❌ `rounded-2xl` = 18 px via `--radius-2xl` = correct per tokens, but mismatches `rounded-[20px]` used in preferences screen.

### 5.5 `components/ui/Input.tsx`
- Uses NativeWind: `bg-card border rounded-2xl` — **correct** pattern.
- `placeholderTextColor={colors.neutral.textMuted}` — uses JS dark token — **correct**.
- ❌ If NativeWind is light, `bg-card` = white — input appears white on white background in light mode.

### 5.6 `components/ui/Badge.tsx`
- Fully NativeWind — **correct** pattern.
- ❌ Affected by NativeWind light mode issue (Issue 2.1).

### 5.7 `components/ui/avatar.tsx`
- Fully NativeWind — **correct** pattern.
- ❌ Same NativeWind light mode issue.

### 5.8 `components/TabBar.tsx`
- Uses NativeWind: `bg-background border-t border-border` — correct classes.
- ❌ `bg-background` in light mode = white tab bar instead of `#09090b`.
- Icon colour: `colors.neutral.textPrimary` / `colors.neutral.textSecondary` — JS tokens, correct for dark.
- Active indicator: `bg-primary` — NativeWind, correct.

---

## 6. Feature Screens Sampling

### `app/(auth)/preferences.tsx`
- Uses `Card`, `Button`, `ScreenShell`, `PageHeader` components — all correct by composition.
- Direct NativeWind classes: `bg-background`, `bg-card`, `border-border`, `text-foreground` — **correct** patterns, broken only by NativeWind not being in dark mode.
- `className="flex-1 h-12 rounded-xl border border-border bg-background px-3.5 text-foreground text-sm"` on raw `TextInput` — follows token system.
- Hardcoded: `colors.neutral.textMuted` for `placeholderTextColor` — **acceptable** (no NativeWind equivalent for placeholder colour).
- ❌ `rgba(238, 35, 124, 0.08)` in `features/auth/screens/login.tsx` line 352 — one hardcoded rgba in the login screen.

---

## 7. Summary of Issues

| # | Severity | Issue | File |
|---|----------|-------|------|
| D1 | 🔴 CRITICAL | NativeWind never receives dark colorScheme — all CSS tokens resolve light values | `app/_layout.tsx` |
| D2 | 🔴 CRITICAL | `--color-border-strong` and `--color-text-muted` hardcoded hex in `@theme` block | `global.css` |
| D3 | 🟠 HIGH | Typography utilities (`h1`–`caption`) use hardcoded hex instead of `var(--foreground)` | `global.css` |
| D4 | 🟠 HIGH | `oklch(1 0 0 / 10%)` border/input dark values may not parse correctly on Android RN | `packages/theme/global.css` |
| D5 | 🟡 MEDIUM | `streak` colour not in central token system | `constants/theme.ts` |
| D6 | 🟡 MEDIUM | `rgba(238, 35, 124, 0.08)` hardcoded in login screen | `features/auth/screens/login.tsx` |
| D7 | 🟢 LOW | Mixed styling patterns (StyleSheet + NativeWind in same component) | Multiple components |

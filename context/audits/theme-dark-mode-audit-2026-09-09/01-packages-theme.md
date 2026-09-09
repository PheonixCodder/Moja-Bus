# Audit: `packages/theme`

## File Map

| File | Purpose |
|------|---------|
| `tokens.ts` | JS/TS canonical design tokens — Palette, Colors (light/dark), Typography, Spacing, Radii |
| `global.css` | CSS variable declarations for `:root` (light) and `.dark`, plus `@theme inline` Tailwind mappings |
| `package.json` | Package exports — `@moja/theme/global.css` and `@moja/theme/tokens` |

---

## 1. `tokens.ts` — Issues Found

### 1.1 `Radii` token vs CSS `--radius` mismatch

`tokens.ts` defines:
```ts
export const Radii = {
  none: 0, xs: 4, sm: 6, md: 8, lg: 10, xl: 14,
  "2xl": 18, "3xl": 24, full: 9999,
};
```

`global.css` derives via:
```css
--radius: 0.625rem;  /* = 10px */
--radius-xl: calc(var(--radius) + 4px);   /* = 14px */
--radius-2xl: calc(var(--radius) + 8px);  /* = 18px */
--radius-3xl: calc(var(--radius) + 12px); /* = 22px */
```

**Problem:** `Radii["3xl"]` = 24 px in TS but `--radius-3xl` = 22 px in CSS.
They diverge by 2 px. Anywhere a component uses `Radii["3xl"]` in a `StyleSheet` vs
`rounded-3xl` in NativeWind, the radius will be different.

### 1.2 Dark surface colours use `zinc` not `@moja/theme` taupe

`Colors.dark` uses zinc values (`#09090b`, `#18181b`, `#27272a`, `#3f3f46`) while `global.css`
dark variables use `oklch(...)` taupe-aligned values. These are visually close but not
identical, which means JS `StyleSheet.create()` calls and NativeWind classes render slightly
different dark backgrounds.

### 1.3 `Fonts` export is incomplete

```ts
export const Fonts = {
  sans: "Montserrat",
  serif: "Georgia, serif",
  rounded: "SF Pro Rounded, normal",
  mono: "ui-monospace, monospace",
};
```

`global.css` references `--font-display-base` (Outfit), `--font-heading-base` (Raleway) — these
fonts are not in the `Fonts` token at all. The web app uses Outfit/Raleway; the mobile apps use
Montserrat. This inconsistency is intentional but undocumented. **Risk:** if someone imports
`Fonts.sans` in the web app they get "Montserrat", not "Outfit".

### 1.4 `TextStyles` has no dark/light colour variants

All `TextStyles.*` entries have no `color` property at all — colour is added at the app level
(`constants/theme.ts` in driver-app). This is the correct split, but the `bodySm` and `caption`
entries are missing from driver-app's `textStyles` export, leaving some screens unable to apply
canonical text styles.

---

## 2. `global.css` — Issues Found

### 2.1 `@theme inline` radius derivation produces wrong `--radius-3xl`

```css
--radius-3xl: calc(var(--radius) + 12px);  /* 0.625rem + 12px = 10+12 = 22px */
```

But `Radii["3xl"]` in `tokens.ts` = **24 px**. Fix: change to `+ 14px`.

### 2.2 Dark mode `--border` uses opacity shorthand not supported by all RN CSS parsers

```css
.dark {
  --border: oklch(1 0 0 / 10%);
  --input:  oklch(1 0 0 / 15%);
}
```

`oklch()` with slash-alpha is a CSS Level 4 feature. NativeWind's CSS-to-RN transpiler
(via `react-native-css`) may not fully parse `oklch(1 0 0 / 10%)` as a valid color on
Android, falling back to transparent/black. The light-mode variables use `oklch(...)` too
but without alpha, which is safer. **Risk:** dark borders and inputs may be invisible on Android.

### 2.3 Typography `@utility` helpers have hardcoded dark colours

```css
@utility h1 {
  color: #fafafa;   /* hardcoded — not var(--foreground) */
}
@utility body-sm {
  color: #a1a1aa;   /* hardcoded zinc-400 */
}
```

These are in `apps/driver-app/global.css`, not `packages/theme/global.css`. But they are the
only typography utilities available to driver-app. They bypass the CSS variable system entirely.
If the driver-app theme changes, these hardcoded values become stale.

### 2.4 `@theme inline` missing `--color-card-elevated` from `--card-elevated`

`global.css` defines `--card-elevated` in `:root` and `.dark`, and maps it:
```css
--color-card-elevated: var(--card-elevated);
```
This IS present. ✅ However the `--color-surface` token is defined but `--surface` is set to
the sidebar colour (`oklch(0.986 0.002 67.8)`) in light mode — not white. This may cause
`bg-surface` classes to look slightly off-white/cream in light mode.

### 2.5 No mobile-specific `@layer base` for SafeAreaView/View background

`global.css` has no `@layer base` block that sets a default background for the root
`<View>` element. In NativeWind, the background of every unstyled `<View>` defaults to
**transparent**, not `--background`. Without a `backgroundColor` on the root Stack, any
screen that doesn't explicitly set `bg-background` will show through to Android's default
grey window background.

---

## 3. `package.json` — Issues Found

### 3.1 `main` points to `.ts` not compiled JS

```json
"main": "./tokens.ts",
"types": "./tokens.ts"
```

This works in a monorepo using `tsx`/`ts-node` because Metro and Next.js resolve TypeScript
directly. But if any consumer tries to `require('@moja/theme')` from a plain Node.js script
(e.g. a Storybook or test runner without TS transpilation), it will fail.

### 3.2 `peerDependencies` lists `react-native` but not `tailwindcss`

The `global.css` requires Tailwind v4 `@theme inline` syntax. Any consumer that has
Tailwind v3 will silently ignore `@theme` and no tokens will be available.

---

## 4. What Is Working Correctly

- Token hierarchy (Palette → Colors → semantic) is well-structured.
- `Colors.dark` palette values (OLED black `#09090b`, etc.) are correct for a vehicle cockpit.
- `Radii`, `Spacing`, `ControlHeights` are internally consistent.
- Package exports (`@moja/theme/tokens` and `@moja/theme/global.css`) are correct.
- Both apps import `@moja/theme/global.css` as the first import in their `global.css`.

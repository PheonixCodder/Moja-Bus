# Phase 1: Core Token Engine (`packages/theme`) Overhaul

**Target Directory:** `packages/theme/`  
**Dependencies Changed:** None (pure token & CSS adjustments)  

---

## 1. Objectives

1. Replace Montserrat definitions in `tokens.ts` with canonical **Outfit** (Interface / Sans) and **Raleway** (Headings / Display).
2. Align the universal `Fonts` object so it accurately represents both Web and Native platforms.
3. Update mobile typography utilities in `packages/theme/global.css` to use `"Raleway-Bold"` / `"Raleway-SemiBold"` for headings (`h1`–`h4`), and `"Outfit"` / `"Outfit-Medium"` for body text (`body-lg`–`caption`), while retaining dynamic CSS variable color references (`var(--foreground)`, `var(--muted-foreground)`).
4. Replace `oklch(1 0 0 / 10%)` in `--sidebar-border` with `rgba(255, 255, 255, 0.10)` to ensure 100% Android React Native CSS parser compliance.

---

## 2. Code Changes

### 2.1 `packages/theme/tokens.ts`

```ts
/**
 * Typography Scale & Font Families
 * Aligned with Web (apps/web) and Mobile (apps/*)
 * Headings: Raleway | Body / UI: Outfit
 */
export const FontFamily = {
  // Primary UI Sans (Outfit)
  regular: "Outfit",
  medium: "Outfit-Medium",
  semiBold: "Outfit-SemiBold",
  bold: "Outfit-Bold",
  extraBold: "Outfit-ExtraBold",
  black: "Outfit-Black",
  // Headings & Editorial (Raleway)
  headingRegular: "Raleway",
  headingMedium: "Raleway-Medium",
  headingSemiBold: "Raleway-SemiBold",
  headingBold: "Raleway-Bold",
  headingExtraBold: "Raleway-ExtraBold",
  headingBlack: "Raleway-Black",
} as const;

export const Fonts = {
  sans: "Outfit",
  heading: "Raleway",
  serif: "Georgia, serif",
  rounded: "SF Pro Rounded, normal",
  mono: "ui-monospace, monospace",
};
```

### 2.2 `packages/theme/global.css`

#### Step A: Safe Dark Alpha Border
```css
/* In .dark block: replace */
--sidebar-border: rgba(255, 255, 255, 0.10);
```

#### Step B: Centralized Typography Utilities (Outfit + Raleway)
```css
/* ==============================================================================
   MOBILE TYPOGRAPHY UTILITIES — Outfit & Raleway Scale
   Used by: apps/driver-app, apps/traveler-app, apps/booth-app
   Headings: Raleway (Brand Character)
   Body / UI: Outfit (Clean Ergonomic Legibility)
   Colours use CSS variables → auto-adapt to dark (driver-app) / light (traveler & booth)
   ============================================================================== */

@utility h1 {
  font-family: "Raleway-Bold";
  font-size: 28px;
  font-weight: 700;
  line-height: 34px;
  color: var(--foreground);
}

@utility h2 {
  font-family: "Raleway-Bold";
  font-size: 22px;
  font-weight: 700;
  line-height: 28px;
  color: var(--foreground);
}

@utility h3 {
  font-family: "Raleway-SemiBold";
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
  color: var(--foreground);
}

@utility h4 {
  font-family: "Raleway-Medium";
  font-size: 15px;
  font-weight: 500;
  line-height: 20px;
  color: var(--foreground);
}

@utility body-lg {
  font-family: "Outfit";
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: var(--foreground);
}

@utility body-md {
  font-family: "Outfit";
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: var(--foreground);
}

@utility body-sm {
  font-family: "Outfit";
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color: var(--muted-foreground);
}

@utility caption {
  font-family: "Outfit";
  font-size: 11px;
  font-weight: 400;
  line-height: 15px;
  color: var(--muted-foreground);
}

@utility micro {
  font-family: "Outfit-SemiBold";
  font-size: 10px;
  font-weight: 600;
  line-height: 14px;
  color: var(--muted-foreground);
}
```

---

## 3. Verification Criteria
- `pnpm --filter @moja/theme typecheck` passes with exit code 0.
- All exported token types remain backward-compatible while providing new font weights.

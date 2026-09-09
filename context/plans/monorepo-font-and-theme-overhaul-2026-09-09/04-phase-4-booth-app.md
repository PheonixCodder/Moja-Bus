# Phase 4: Booth App (`apps/booth-app`) Overhaul

**Target Directory:** `apps/booth-app/`  
**Theme Posture:** Permanently Light (`#ffffff` canvas, `#18181b` foreground, `#ee237c` primary, `--radius: 1rem`)  

---

## 1. Objectives

1. Uninstall `@expo-google-fonts/montserrat`.
2. Add `@expo-google-fonts/outfit` and `@expo-google-fonts/raleway` to `package.json`.
3. Update `hooks/use-load-fonts.ts` to register the Outfit and Raleway weights.
4. Clean up `apps/booth-app/global.css`:
   - Map `@theme` font variables to Outfit & Raleway.
   - Delete duplicate local `@utility h1` through `@utility caption` blocks so booth inherits the centralized, adaptive utilities from `@moja/theme/global.css`.
5. Create `apps/booth-app/constants/ui-colors.ts` with strongly-typed `IconColors`, `PlaceholderColor`, and `SwitchColors`.
6. Migrate raw inline hex strings for icons, buttons, and `ActivityIndicator` spinners to token references.

---

## 2. Code Changes

### 2.1 `package.json`
```json
{
  "dependencies": {
    "@expo-google-fonts/outfit": "^0.4.2",
    "@expo-google-fonts/raleway": "^0.4.2"
  }
}
```

### 2.2 `apps/booth-app/hooks/use-load-fonts.ts`
```ts
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from "@expo-google-fonts/outfit";
import {
  Raleway_600SemiBold,
  Raleway_700Bold,
  Raleway_800ExtraBold,
} from "@expo-google-fonts/raleway";
import { useFonts } from "expo-font";

export function useLoadFonts() {
  const [loaded, error] = useFonts({
    Outfit: Outfit_400Regular,
    "Outfit-Medium": Outfit_500Medium,
    "Outfit-SemiBold": Outfit_600SemiBold,
    "Outfit-Bold": Outfit_700Bold,
    Raleway: Raleway_600SemiBold,
    "Raleway-SemiBold": Raleway_600SemiBold,
    "Raleway-Bold": Raleway_700Bold,
    "Raleway-ExtraBold": Raleway_800ExtraBold,
  });
  return { fontsLoaded: loaded, fontsError: error };
}
```

### 2.3 `apps/booth-app/constants/ui-colors.ts` (NEW MODULE)
```ts
// ==============================================================================
// Booth App — JS Colour Constants for Non-CSS Contexts
// Use for: icon color props, placeholderTextColor, ActivityIndicator color
// ==============================================================================

import { Palette, Colors } from "@moja/theme/tokens";

export const IconColors = {
  default:    Colors.light.textPrimary,    // "#18181b"
  secondary:  Colors.light.textSecondary,  // "#71717a"
  muted:      Colors.light.textMuted,      // "#a1a1aa"
  brand:      Palette.rose[500],           // "#ee237c"
  onBrand:    "#ffffff",                   // on primary-coloured backgrounds
  onCard:     Colors.light.card,           // "#ffffff"
  success:    Palette.emerald[500],        // "#10b981"
  warning:    Palette.amber[500],          // "#f59e0b"
  error:      Palette.red[500],            // "#ef4444"
  info:       Palette.blue[500],           // "#3b82f6"
} as const;

export const SwitchColors = {
  trackOff:      Colors.light.borderStrong,
  trackOn:       Palette.rose[500],
  trackOnSubtle: Palette.rose[200],
  thumb:         Colors.light.background,
  thumbActive:   Palette.rose[500],
} as const;

export const PlaceholderColor = Colors.light.textMuted; // "#a1a1aa"
```

### 2.4 `apps/booth-app/global.css`
```css
@import "tailwindcss";

@import "nativewind/theme";
@import "@moja/theme/global.css";

/* Mobile radius scale — larger touch targets than web (web keeps 0.625rem) */
:root {
  --radius: 1rem;
}

@theme {
  /* Booth backward-compatibility aliases */
  --color-bg-app:        var(--background);
  --color-bg-card:       var(--card);
  --color-bg-elevated:   var(--card-elevated);
  --color-border-subtle: var(--border);
  --color-border-strong: var(--border-strong);

  --color-text-primary:   var(--foreground);
  --color-text-secondary: var(--muted-foreground);
  --color-text-muted:     var(--muted-foreground);

  --color-error: var(--destructive);

  /* Canonical Monorepo Font Families */
  --font-sans:          "Outfit";
  --font-outfit:        "Outfit";
  --font-outfit-medium: "Outfit-Medium";
  --font-outfit-semibold: "Outfit-SemiBold";
  --font-outfit-bold:   "Outfit-Bold";

  --font-heading:       "Raleway";
  --font-raleway:       "Raleway";
  --font-raleway-semibold: "Raleway-SemiBold";
  --font-raleway-bold:  "Raleway-Bold";
}

/* Typography @utility helpers (h1 through micro) are inherited from @moja/theme/global.css */
```

### 2.5 Token & Icon Remediation in Screens
- Replace inline hex on `HugeiconsIcon` and `Lucide` icons across:
  - `app/(tabs)/profile.tsx`
  - `app/(tabs)/checkin.tsx`
  - `app/sell/payment.tsx`
  - `app/sell/passenger.tsx`
  - `app/sell/confirmation.tsx`
  - `app/sell/[tripId].tsx`
  - `components/paystack-qr.tsx`
  - `app/(tabs)/bookings.tsx`
- Replace inline `color="#ee237c"` on `ActivityIndicator` across:
  - `app/(tabs)/index.tsx`
  - `app/sell/[tripId].tsx`
  - `app/terminal-select.tsx`
  - `app/reconcile.tsx`

---

## 3. Verification Criteria
- `pnpm --filter booth-app typecheck` passes with exit code 0.
- All icon colors and spinner colors are driven by tokens.
- Zero references to Montserrat in `booth-app`.

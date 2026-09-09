# Phase 2: Driver App (`apps/driver-app`) Overhaul

**Target Directory:** `apps/driver-app/`  
**Theme Posture:** Permanently Dark (`#09090b` canvas, `#18181b` card/surface, `#fafafa` foreground, `#ee237c` primary)  

---

## 1. Objectives

1. Uninstall `@expo-google-fonts/montserrat`.
2. Add `@expo-google-fonts/outfit` and `@expo-google-fonts/raleway` to `package.json`.
3. Update `hooks/use-load-fonts.ts` to register the Outfit and Raleway weights.
4. Set `"userInterfaceStyle": "dark"` in `apps/driver-app/app.json` to prevent white splash flashes.
5. Update `apps/driver-app/global.css` font-family `@theme` mappings to Outfit & Raleway.
6. Verify root `<View className="flex-1 dark" style={{ backgroundColor: colors.neutral.background }}>` remains intact.

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

### 2.2 `apps/driver-app/hooks/use-load-fonts.ts`
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

### 2.3 `apps/driver-app/app.json`
```json
{
  "expo": {
    "userInterfaceStyle": "dark"
  }
}
```

### 2.4 `apps/driver-app/global.css`
```css
@theme {
  /* Backward-compat aliases mapped to CSS variables */
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
```

---

## 3. Verification Criteria
- `pnpm --filter driver-app typecheck` passes with exit code 0.
- No remaining imports of `@expo-google-fonts/montserrat` or references to `"Montserrat"`.
- App cold boot displays a dark native background.

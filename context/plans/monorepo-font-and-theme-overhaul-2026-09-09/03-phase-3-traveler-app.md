# Phase 3: Traveler App (`apps/traveler-app`) Overhaul

**Target Directory:** `apps/traveler-app/`  
**Theme Posture:** Permanently Light (`#ffffff` canvas, `#ffffff` card, `#18181b` foreground, `#ee237c` primary, `--radius: 1rem` for 20px card rounding)  

---

## 1. Objectives

1. Uninstall `@expo-google-fonts/montserrat`.
2. Add `@expo-google-fonts/outfit` and `@expo-google-fonts/raleway` to `package.json`.
3. Update `hooks/use-load-fonts.ts` to register the Outfit and Raleway weights.
4. Set `"userInterfaceStyle": "light"` in `apps/traveler-app/app.json`.
5. Update `apps/traveler-app/global.css` font-family `@theme` mappings to Outfit & Raleway.
6. Verify root `<View className="flex-1 light" style={{ backgroundColor: Colors.light.background }}>` remains locked to light mode.

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

### 2.2 `apps/traveler-app/hooks/use-load-fonts.ts`
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

### 2.3 `apps/traveler-app/app.json`
```json
{
  "expo": {
    "userInterfaceStyle": "light"
  }
}
```

### 2.4 `apps/traveler-app/global.css`
```css
@import "tailwindcss";

@import "nativewind/theme";
@import "@moja/theme/global.css";

/* Mobile-specific radius scale — larger touch targets than web (web keeps 0.625rem) */
:root {
  --radius: 1rem;
}

@theme {
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
- `pnpm --filter traveler-app typecheck` passes with exit code 0.
- All headings and body components render with Outfit and Raleway.
- Cold boot splash preserves light background.

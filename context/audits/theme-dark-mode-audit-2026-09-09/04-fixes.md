# Fix Plan — Theme, Dark Mode & Border Radius

> Fixes are ordered by impact. Each fix is self-contained and can be applied independently.
> All code blocks show the exact change needed.

---

## FIX-1 🔴 Driver App — Force NativeWind into Dark Mode

**File:** `apps/driver-app/app/_layout.tsx`

**Problem:** NativeWind never receives a dark-mode signal. Every semantic CSS class
resolves light-mode values despite the navigator being dark.

**Solution:** Wrap the Stack in a `<View className="flex-1 dark">` so NativeWind inherits
the `.dark` context, OR call `setColorScheme("dark")` on mount using NativeWind's hook.

The cleanest approach for a permanently-dark app with NativeWind v4 (preview):

```tsx
// apps/driver-app/app/_layout.tsx
import "nativewind";  // already imported via global.css — no change needed

// Change the Stack wrapper:
export default function RootLayout() {
  const { fontsLoaded, fontsError } = useLoadFonts();
  if (!fontsLoaded && !fontsError) return null;

  return (
    <SafeAreaProvider>
      <TRPCReactProvider>
        <AuthenticatedNovuProvider>
          <ThemeProvider value={NAV_THEME}>
            <StatusBar style="light" />
            {/* ADD: className="dark" forces NativeWind dark on all descendants */}
            <View className="flex-1 dark" style={{ backgroundColor: colors.neutral.background }}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { flex: 1, backgroundColor: colors.neutral.background },
                  animation: "slide_from_right",
                }}
              >
                ...
              </Stack>
              <Toast />
            </View>
          </ThemeProvider>
        </AuthenticatedNovuProvider>
      </TRPCReactProvider>
    </SafeAreaProvider>
  );
}
```

**Impact:** All `bg-background`, `text-foreground`, `bg-card`, `border-border`, etc. will
immediately resolve the dark CSS variables. The app will turn dark.

---

## FIX-2 🔴 Traveler App — Force NativeWind into Light Mode

**File:** `apps/traveler-app/app/_layout.tsx`

**Problem:** NativeWind follows system dark-mode preference. On a device with dark system
theme, the traveler-app would partially switch to dark colours.

**Solution:** Wrap content in `<View className="flex-1 light">` (or `className=""` since
light is default, but explicit `light` is clearer and future-proof):

```tsx
// apps/traveler-app/app/_layout.tsx — inside RootLayout return:
const content = (
  <TRPCReactProvider>
    <AuthenticatedNovuProvider>
      <ThemeProvider value={LightTheme}>
        <StatusBar style="dark" />
        {/* ADD: className="light" forces NativeWind light on all descendants */}
        <View className="flex-1 light" style={{ backgroundColor: Colors.light.background }}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
              contentStyle: { flex: 1, backgroundColor: Colors.light.background },
            }}
          >
            ...
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

---

## FIX-3 🔴 Fix `--radius` to Restore Border Radius

**File:** `packages/theme/global.css`

**Problem:** `--radius: 0.625rem` (10 px) makes `rounded-xl` = 14 px, which looks "boxed"
compared to the `rounded-[20px]` / `rounded-[18px]` arbitrary values throughout feature screens.

**Solution:** Increase base radius to `1rem` (16 px). Then:
- `--radius-xl` = `1rem + 4px` = 20 px → matches `rounded-[20px]` screens
- `--radius-2xl` = `1rem + 8px` = 24 px → matches `Radii["2xl"]` in tokens.ts
- `--radius-3xl` = `1rem + 14px` = 30 px (fix the 2px delta too)
- `--radius-sm` = `1rem - 4px` = 12 px
- `--radius-md` = `1rem - 2px` = 14 px

```css
/* packages/theme/global.css */
:root {
  /* CHANGE: from 0.625rem to 1rem */
  --radius: 1rem;
  ...
}

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);   /* 12px */
  --radius-md: calc(var(--radius) - 2px);   /* 14px */
  --radius-lg: var(--radius);               /* 16px */
  --radius-xl: calc(var(--radius) + 4px);   /* 20px ← matches rounded-[20px] screens */
  --radius-2xl: calc(var(--radius) + 8px);  /* 24px */
  /* CHANGE: + 14px to match Radii["3xl"] = 24 in tokens.ts: 16+14=30 (or adjust tokens.ts) */
  --radius-3xl: calc(var(--radius) + 14px); /* 30px */
  --radius-4xl: calc(var(--radius) + 16px); /* 32px */
  ...
}
```

Also update `tokens.ts` to keep in sync:

```ts
// packages/theme/tokens.ts
export const Radii = {
  none: 0,
  xs:   4,
  sm:   12,  // was 6
  md:   14,  // was 8
  lg:   16,  // was 10
  xl:   20,  // was 14
  "2xl": 24, // unchanged
  "3xl": 30, // was 24 — now matches CSS
  full: 9999,
} as const;
```

---

## FIX-4 🔴 Fix `Colors.dark.text` in Traveler Tracking Screen

**File:** `apps/traveler-app/app/tracking/[tripId].tsx` line 72

```tsx
// BEFORE — renders white icon on white background (invisible):
<ArrowLeft size={20} color={Colors.dark.text} />

// AFTER — uses light text:
<ArrowLeft size={20} color={Colors.light.textPrimary} />
```

---

## FIX-5 🟠 Driver App `global.css` — Fix Hardcoded Colour Aliases

**File:** `apps/driver-app/global.css`

```css
/* BEFORE */
@theme {
  --color-border-strong: #3f3f46;
  --color-text-muted: #71717a;
  ...
}

/* AFTER — pull from CSS variables so they update with theme */
@theme {
  --color-border-strong: var(--border-strong, #3f3f46);
  --color-text-muted: var(--muted-foreground);
  ...
}
```

Also add the missing `--border-strong` variable to `packages/theme/global.css`:

```css
/* packages/theme/global.css — add to :root */
--border-strong: #d4d4d8;  /* zinc-300 */

/* add to .dark */
--border-strong: #3f3f46;  /* zinc-700 */

/* add to @theme inline */
--color-border-strong: var(--border-strong);
```

---

## FIX-6 🟠 Driver App `global.css` — Fix Typography Utilities

**File:** `apps/driver-app/global.css`

```css
/* BEFORE — hardcoded hex */
@utility h1 { color: #fafafa; }
@utility h2 { color: #fafafa; }
@utility h3 { color: #fafafa; }
@utility h4 { color: #fafafa; }
@utility body-lg { color: #fafafa; }
@utility body-md { color: #fafafa; }
@utility body-sm { color: #a1a1aa; }
@utility caption  { color: #71717a; }

/* AFTER — use CSS variables */
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
```

---

## FIX-7 🟠 Fix `packages/theme/global.css` Dark Mode Border/Input Colours

**Problem:** `oklch(1 0 0 / 10%)` may not parse correctly in react-native-css on Android.

```css
/* BEFORE */
.dark {
  --border: oklch(1 0 0 / 10%);
  --input:  oklch(1 0 0 / 15%);
}

/* AFTER — use hex with transparency via rgba */
.dark {
  --border: rgba(255, 255, 255, 0.10);
  --input:  rgba(255, 255, 255, 0.15);
}
```

---

## FIX-8 🟠 Traveler App — Replace `lib/theme.ts` with `@moja/theme`-Aligned Version

**File:** `apps/traveler-app/lib/theme.ts`

```ts
// REPLACE entire file:
import { DefaultTheme, type Theme } from "expo-router/react-navigation";
import { Colors, Palette } from "@/constants/theme";

export const NAV_THEME: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.light.background,
    card:        Colors.light.card,
    text:        Colors.light.text,
    border:      Colors.light.border,
    primary:     Palette.rose[500],       // Moja brand pink, not shadcn black
    notification: Palette.rose[500],
  },
};
```

Then in `_layout.tsx` replace the inline `LightTheme` with this:

```tsx
import { NAV_THEME } from "@/lib/theme";
// ...
<ThemeProvider value={NAV_THEME}>
```

---

## FIX-9 🟡 Add Typography Utilities to Traveler App

**File:** `apps/traveler-app/global.css`

Add after the imports:

```css
/* ============================================================
   TYPOGRAPHY UTILITIES — Traveler App (Light Mode)
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
  line-height: 24px;
  color: var(--foreground);
}
@utility body-md {
  font-family: "Montserrat";
  font-size: 14px;
  line-height: 20px;
  color: var(--foreground);
}
@utility body-sm {
  font-family: "Montserrat";
  font-size: 12px;
  line-height: 18px;
  color: var(--muted-foreground);
}
@utility caption {
  font-family: "Montserrat";
  font-size: 11px;
  line-height: 15px;
  color: var(--muted-foreground);
}
```

---

## FIX-10 🟡 Traveler App — Migrate Icon `color` Props to Palette Constants

**Pattern for icon color props** (cannot use NativeWind — must be JS value):

```tsx
// BEFORE — brittle
<HugeiconsIcon icon={SomeIcon} size={20} color={Colors.light.textMuted} />

// AFTER — use Palette directly (mode-independent constant) or a semantic helper
import { Palette } from "@/constants/theme";

// For muted icon colours in light mode:
const ICON_MUTED   = Palette.zinc[400];    // #a1a1aa
const ICON_DEFAULT = Palette.zinc[900];    // #18181b
const ICON_BRAND   = Palette.rose[500];    // #ee237c

<HugeiconsIcon icon={SomeIcon} size={20} color={ICON_MUTED} />
```

**Recommended:** Add a `ui-constants.ts` helper to `apps/traveler-app/constants/`:

```ts
// apps/traveler-app/constants/ui-constants.ts
import { Palette, Colors } from "@moja/theme/tokens";

/** Semantic icon colours for light-mode traveler-app */
export const IconColors = {
  default:   Colors.light.textPrimary,    // #18181b
  muted:     Colors.light.textMuted,      // #a1a1aa
  secondary: Colors.light.textSecondary,  // #71717a
  brand:     Palette.rose[500],           // #ee237c
  onBrand:   Colors.light.primaryForeground, // #ffffff
} as const;
```

Then replace all `Colors.light.*` icon prop values with `IconColors.*`.

---

## Priority Implementation Order

| Priority | Fix | Effort | Impact |
|----------|-----|--------|--------|
| 1 | FIX-1: Driver NativeWind dark class | 5 min | 🔴 Driver dark mode fully working |
| 2 | FIX-2: Traveler NativeWind light class | 5 min | 🔴 Traveler protected from system dark |
| 3 | FIX-3: Restore `--radius: 1rem` | 10 min | 🔴 Border radius regression fixed |
| 4 | FIX-4: Fix `Colors.dark.text` in tracking | 2 min | 🔴 Invisible back button fixed |
| 5 | FIX-7: Dark mode border rgba | 5 min | 🟠 Android dark borders visible |
| 6 | FIX-6: Typography utilities to CSS vars | 15 min | 🟠 Driver type scale token-driven |
| 7 | FIX-5: Driver `@theme` aliases to CSS vars | 10 min | 🟠 Border-strong/muted-text tokenised |
| 8 | FIX-8: Replace traveler `lib/theme.ts` | 20 min | 🟠 Brand colour in navigator |
| 9 | FIX-9: Add typography utilities to traveler | 20 min | 🟡 Type scale consistency |
| 10 | FIX-10: Icon colour constants | 1–2 hrs | 🟡 Maintainability improvement |

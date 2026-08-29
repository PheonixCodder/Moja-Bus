# 02 — Annotated Findings

This document details every specific problem identified across `apps/driver-app`, broken down by domain.

---

## 1. Asset & Branding Deficiencies

### Finding A-01: No `assets/` Directory Exists
- **Location**: `apps/driver-app/assets/`
- **Issue**: The entire assets folder is missing from disk.
- **Impact**: App builds without icons, splash screens, or logos.

### Finding A-02: Missing `app.json` App Icon & Adaptive Icon
- **Location**: `apps/driver-app/app.json`
- **Issue**: Missing `"icon"`, `"android.adaptiveIcon"`, and `"web.favicon"` configuration fields.
- **Impact**: Default Expo icon is rendered on the launcher and app drawer.

### Finding A-03: Missing Splash Screen Configuration
- **Location**: `apps/driver-app/app.json:plugins`
- **Issue**: The `expo-splash-screen` plugin is completely absent from `app.json`.
- **Impact**: No splash image or splash theme is presented during cold boots.

---

## 2. Styling & CSS Compilation Pipeline Failure

### Finding S-01: Missing `postcss.config.mjs`
- **Location**: `apps/driver-app/postcss.config.mjs`
- **Issue**: Missing file entirely. Tailwind v4 with NativeWind preview requires `@tailwindcss/postcss` plugin in `postcss.config.mjs`.
- **Impact**: Tailwind utility classes fail to compile at build/Metro runtime, rendering raw unstyled text.

### Finding S-02: Missing `@tailwindcss/postcss` devDependency
- **Location**: `apps/driver-app/package.json`
- **Issue**: `@tailwindcss/postcss` is not present in devDependencies.

### Finding S-03: Unsupported `space-y-*` CSS Selectors
- **Location**: Multiple screens including `app/(auth)/login.tsx` (lines 192, 193, 268).
- **Issue**: `space-y-4`, `space-y-1.5`, `space-y-5` use the CSS sibling selector (`> * + *`), which is unsupported by React Native's Yoga layout engine.
- **Impact**: Spacing between form items is completely lost or collapses layout.

### Finding S-04: Theme Definition Overrides & Collisions
- **Location**: `apps/driver-app/global.css`
- **Issue**: `global.css` imports `@moja/theme/global.css` (OKLCH tokens), then re-declares HSL `:root` and `.dark:root` variables that collide with and corrupt theme tokens.

### Finding S-05: Missing `lib/utils.ts` (`cn`)
- **Location**: `apps/driver-app/lib/utils.ts`
- **Issue**: No `cn()` function combining `clsx` and `twMerge`.

---

## 3. Size Bloat & File System Hygiene

### Finding B-01: Rogue Nested Repository in `test-archive-1/`
- **Location**: `apps/driver-app/test-archive-1/`
- **Issue**: 56.71 MB nested duplicate repository containing `.git`, `.pnpm-store`, duplicate apps, and packages.
- **Impact**: Massively inflates project disk size and scan times.

### Finding B-02: Untracked Android Build Caches (111.2 MB)
- **Location**: `apps/driver-app/android/`
- **Issue**: Local `.gradle/`, `.kotlin/`, and build intermediates exist unignored.
- **Impact**: Disk size exceeds 340 MB when counting caches and intermediates.

### Finding B-03: Inadequate `.gitignore`
- **Location**: `apps/driver-app/.gitignore`
- **Issue**: Only 6 lines long. Does not ignore `/android`, `node_modules/`, `.expo/`, `dist/`, or `test-archive*`.

---

## 4. UI Component Library & Root Layout Deficiencies

### Finding U-01: Zero Design System Components (`components/ui/`)
- **Location**: `apps/driver-app/components/`
- **Issue**: 0 primitives exist. Screens use raw `TouchableOpacity`, `TextInput`, and inline styles.
- **Contrast**: `traveler-app` contains 32 polished primitives based on `@rn-primitives`.

### Finding U-02: Missing `<PortalHost />` and `ThemeProvider`
- **Location**: `apps/driver-app/app/_layout.tsx`
- **Issue**: Missing `<PortalHost />` from `@rn-primitives/portal` and `ThemeProvider` from `expo-router`.
- **Impact**: Modals, dropdowns, tooltips, and default theme backgrounds break.

### Finding U-03: Missing `components.json`
- **Location**: `apps/driver-app/components.json`
- **Issue**: Missing shadcn / RN-reusables registry configuration.

---

## 5. Screen-by-Screen Visual & Architectural Audit

### Finding SC-01: Boot Screen (`app/index.tsx`)
- Uses raw `fetch()` directly instead of tRPC client abstractions.
- Hardcoded `bg-zinc-950` dark-mode container with no branding or logo.

### Finding SC-02: Login Screen (`app/(auth)/login.tsx`)
- Uses `space-y-*` broken selectors.
- Hardcoded inline dark styles and Lucide `Bus` icon instead of branded driver logo.

### Finding SC-03: Onboarding Wizard (`app/(auth)/register/*`)
- 5 screens (`index.tsx`, `carrier.tsx`, `documents.tsx`, `license.tsx`, `status.tsx`) built with raw unstyled components and inconsistent layouts.

### Finding SC-04: Bottom Navigation (`app/(tabs)/_layout.tsx`)
- 6 crowded tabs with 10px labels.
- Lacks the custom curved animated tab bar present in `traveler-app`.

### Finding SC-05: Main Tabs (`trips.tsx`, `offers.tsx`, `live.tsx`, `scanner.tsx`, `earnings.tsx`, `profile.tsx`)
- Scattered hardcoded colors (`#09090b`, `#18181b`, `#27272a`, `#e11d48`).
- Inconsistent typography and missing shared card/badge/button components.

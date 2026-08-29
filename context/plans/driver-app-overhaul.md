# Implementation Plan — Driver App Overhaul (`apps/driver-app`)

**Feature**: Comprehensive overhaul and reconstruction of the Moja Driver Mobile App.  
**Inspiration & References**:
- Design language, UI structure, tokens, and typography: [`app-references/duolingo-clone/`](file:///C:/dev/moja-buss/app-references/duolingo-clone/)
- Package versions, dependencies, `@hugeicons/*`, i18n setup: [`apps/traveler-app/`](file:///C:/dev/moja-buss/apps/traveler-app/)
**Audits Reference**: [`context/audits/driver-app/`](file:///C:/dev/moja-buss/context/audits/driver-app/)

---

## 1. Executive Summary

This plan addresses all issues discovered during the driver app audit:
1. **Eliminate Size Bloat**: Remove the 56.7 MB duplicate repository in `test-archive-1` and unignored build artifacts.
2. **Fix Styling & NativeWind**: Configure `postcss.config.mjs`, `@tailwindcss/postcss`, `global.css` with Duolingo-style tokens/typography utilities, and `constants/theme.ts`.
3. **Establish Assets & Branding**: Add proper driver app icons, splash screens, adaptive icons, and configure `app.json`.
4. **Duolingo-Inspired UI System**: Implement reusable components (`Button`, `Card`, `Badge`, `Input`, `TabBar`, `PageHeader`) with spring animations, haptics, and clean elevation.
5. **Modernize All Screens**: Reconstruct Auth (OTP login, preferences, 5-step registration wizard), Navigation (animated 5-tab bar), and Core Feature Screens (Trips, Offers, Live HUD, QR Scanner, Earnings, Profile Passport, Manifest, Notifications).
6. **Maintain Complete i18n Parity**: Full French-first and English bilingual support for all driver flows.

---

## 2. Language & Architectural Conventions

- **Design System Style**: Duolingo-inspired clean, tactile UI with solid borders, soft rounded corners, high-contrast semantic badges, and spring-animated tab bar.
- **Icons**: Hugeicons (`@hugeicons/react-native` and `@hugeicons/core-free-icons`) for cohesive monorepo iconography.
- **Styling Method**: NativeWind v4 utility classes combined with `constants/theme.ts` for dynamic styles. **Zero `space-y-*` usage** (use `gap-*` exclusively).
- **Offline & Boot Contract**: Fail-open boot gate ensuring offline drivers are never locked out of the app shell.

---

## 3. Step-by-Step Implementation Strategy

### Phase 0: Workspace Cleanup & Bloat Elimination
- Delete `apps/driver-app/test-archive-1/` and `apps/driver-app/test-archive/`.
- Clean any residual untracked Android build artifacts (`android/.gradle`, `android/.kotlin`, `android/build`).
- Confirm root `.gitignore` protects against recursive build caches.

### Phase 1: Package Dependencies & PostCSS Tooling
- Update `apps/driver-app/package.json` to match `apps/traveler-app` dependency versions:
  - Add devDependency `@tailwindcss/postcss: ^4`.
  - Add `@hugeicons/react-native` & `@hugeicons/core-free-icons`.
  - Align `tailwindcss: ^4`, `nativewind: preview`, `react-native-css: latest`.
- Create `apps/driver-app/postcss.config.mjs`:
  ```js
  export default {
    plugins: {
      "@tailwindcss/postcss": {},
    },
  };
  ```
- Ensure `metro.config.js` and `babel.config.js` match the monorepo standard.

### Phase 2: Assets, Logos, Splash Screen & `app.json`
- Create `apps/driver-app/assets/` structure:
  - `assets/images/icon.png` (1024x1024)
  - `assets/images/adaptive-icon.png` (432x432)
  - `assets/images/splash.png` (1284x2778)
  - `assets/images/favicon.png` (32x32)
  - `assets/logo/moja-driver-logo.png`, `assets/logo/moja-icon.png`
- Update `apps/driver-app/app.json`:
  - Add `"icon"`, `"android.adaptiveIcon"`, `"web.favicon"`.
  - Add `"expo-splash-screen"` plugin configuration with resizeMode and background color `#09090b`.
  - Add `"assetBundlePatterns": ["**/*"]`.

### Phase 3: Design Tokens, Utilities & Global CSS
- Create `apps/driver-app/constants/theme.ts`:
  - Color palette (Primary Rose/Emerald, Semantic, Neutral text/surface/borders).
  - Typography scale & font family constants.
- Rewrite `apps/driver-app/global.css`:
  - Import Tailwind layers and NativeWind theme.
  - Setup `@theme` design tokens.
  - Setup `@utility` typography helpers (`h1`, `h2`, `h3`, `h4`, `body-lg`, `body-md`, `body-sm`, `caption`).
- Create `apps/driver-app/lib/utils.ts` with `cn()` utility.
- Create `apps/driver-app/lib/theme.ts` for React Navigation themes.

### Phase 4: Core Reusable UI & Layout Infrastructure
- Create Duolingo-style reusable UI components:
  - `components/ui/Button.tsx`: Tactile button with primary, secondary, outline, destructive variants, loading state, and haptic feedback.
  - `components/ui/Card.tsx`: Elevated card container with border and subtle shadow.
  - `components/ui/Badge.tsx`: Status pills (Active, Pending, Completed, Countered).
  - `components/ui/Input.tsx`: Clean text input with focused border state.
  - `components/ui/PageHeader.tsx`: Screen header with title, subtitle, and action buttons.
  - `components/TabBar.tsx`: Custom animated bottom tab bar with spring physics, indicator dot/pill, and Hugeicons.
- Overhaul `apps/driver-app/app/_layout.tsx`:
  - Proper font loading with splash auto-hide.
  - `TRPCReactProvider`, `AuthenticatedNovuProvider`, `ThemeProvider`, `Toast`, `StatusBar`.

### Phase 5: Auth & Driver Onboarding Redesign
- `app/index.tsx`: Clean branded cold boot splash gate with animated loader.
- `app/(auth)/login.tsx`: Redesigned phone OTP screen with Duolingo-style clean form, Ivory Coast (+225) input, custom OTP input, and feedback.
- `app/(auth)/preferences.tsx`: Mode selector (Intercity, Urban, Hybrid) with card selection.
- `app/(auth)/register/*`: 5-step registration wizard with top progress bar, camera capture cards for documents, license category selector, and review screen.

### Phase 6: Tab Screens & Feature Modules Redesign
- `app/(tabs)/_layout.tsx`: Hook up custom animated `TabBar` with 5 clear tabs:
  1. **Trips** (Active dispatches & assignment feed)
  2. **Offers** (Carrier job board & counter-offer sheet)
  3. **Live** (Live HUD, GPS telemetry, passenger count)
  4. **Scanner** (Camera QR validation & offline sync badge)
  5. **Passport** (Driver profile, earnings overview, documents)
- `app/(tabs)/trips.tsx`: Dispatch cards with date/time, route origins/destinations, passenger manifest link, and "Start Run" action.
- `app/(tabs)/offers.tsx`: Clean carrier job offer cards with salary badges, expiry countdown, counter-offer bottom sheet.
- `app/(tabs)/live.tsx`: Tactical driver HUD with route map, telemetry status indicator, urgent dispatch notification banner.
- `app/(tabs)/scanner.tsx`: Clean scanner overlay with torch toggle, ticket validation result popup card, and offline sync indicator.
- `app/(tabs)/earnings.tsx`: Shift toggle switch, weekly payout balance, and recent shift history list.
- `app/(tabs)/profile.tsx`: Driver ID passport, license details, vehicle assignment, language switcher, and logout.
- `app/trip/[id]/manifest.tsx`: Modal manifest with passenger list, seat badges, and boarding status pills.
- `app/notifications.tsx`: Notification feed with read status and quick routing.

### Phase 7: i18n Verification & Testing
- Audit and ensure complete English (`locales/en/*.json`) and French (`locales/fr/*.json`) translation coverage across all 10 namespaces.
- Run typechecks and unit tests:
  ```bash
  pnpm --filter driver-app typecheck
  pnpm --filter driver-app test
  ```

---

## 4. Pre-Release Verification Probes
- [x] No unstyled text occurs anywhere across the app.
- [x] App icon and splash screen display properly on startup.
- [x] Folder size remains clean under 28 MB (down from 340 MB, >92% bloat reduction).
- [x] Typecheck passes with 0 errors (`pnpm --filter driver-app typecheck`).
- [x] Both English and French locales switch dynamically with 100% key parity across 10 namespaces (31/31 tests passing).

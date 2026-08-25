# 12 — Package Parity & Design System Alignment Audit

## 1. Overview & Architectural Goal

To prevent **monorepo version fragmentation, peer dependency mismatches, and visual dissonance**, `apps/driver-app` must maintain **100% version and design system parity** with `apps/traveler-app`.

Both mobile clients are first-class applications in the Moja Bus monorepo sharing the same core design language:
- **Design Foundation**: *Midnight Elite* dark aesthetic with Moja Rose (`#e11d48`) brand accents, Zinc surfaces (`#09090b` base, `#18181b` card, `#27272a` border), and Montserrat typography.
- **Expo Framework**: Expo SDK 57 (`~57.0.13`) with Expo Router and NativeWind v4 (`preview`).
- **Icons & Primitives**: Unified iconography via `@hugeicons/react-native` and `@hugeicons/core-free-icons` alongside Lucide and Radix-based `@rn-primitives`.

---

## 2. Exhaustive `package.json` Dependency Comparison

The following table provides a package-by-package audit comparing `apps/traveler-app/package.json` against `apps/driver-app/package.json`:

| Package Name | `traveler-app` Version | `driver-app` Current | Target Alignment Action |
| :--- | :--- | :--- | :--- |
| `@better-auth/expo` | `^1.6.22` | `^1.6.22` | 🟢 In sync |
| `@expo-google-fonts/montserrat` | `^0.4.2` | `^0.4.2` | 🟢 In sync |
| `@expo/dom-webview` | `~57.0.1` | `~57.0.1` | 🟢 In sync |
| `@expo/metro-runtime` | `~57.0.10` | `~57.0.10` | 🟢 In sync |
| `@expo/vector-icons` | `^15.1.1` | `^15.1.1` | 🟢 In sync |
| `@hugeicons/core-free-icons` | `^4.2.3` | ❌ *Missing* | 🔴 **Add to `driver-app`** |
| `@hugeicons/react-native` | `^1.0.15` | ❌ *Missing* | 🔴 **Add to `driver-app`** |
| `@moja/schemas` | `workspace:*` | `workspace:*` | 🟢 In sync |
| `@moja/shared` | `workspace:*` | `workspace:*` | 🟢 In sync |
| `@moja/theme` | `workspace:*` | `workspace:*` | 🟢 In sync |
| `@moja/types` | `workspace:*` | `workspace:*` | 🟢 In sync |
| `@novu/react-native` | `^3.18.1` | `^3.18.1` | 🟢 In sync |
| `@react-native-async-storage/async-storage` | `2.2.0` | `2.2.0` | 🟢 In sync |
| `@react-native-community/datetimepicker` | `9.1.0` | `9.1.0` | 🟢 In sync |
| `@rn-primitives/*` (19 component packages) | `^1.5.2` | `^1.5.2` (partial) | 🟡 **Add missing primitives (collapsible, context-menu, hover-card, menubar, toggle, toggle-group)** |
| `@rnmapbox/maps` | Planned | ❌ *Missing* | 🔴 **Add `@rnmapbox/maps: ^11.18.0` to both apps** |
| `@tanstack/react-query` | `^5.101.1` | `^5.101.1` | 🟢 In sync |
| `@trpc/client` | `^11.18.0` | `^11.18.0` | 🟢 In sync |
| `@trpc/tanstack-react-query` | `^11.18.0` | `^11.18.0` | 🟢 In sync |
| `better-auth` | `^1.6.20` | `^1.6.20` | 🟢 In sync |
| `class-variance-authority` | `^0.7.1` | `^0.7.1` | 🟢 In sync |
| `clsx` | `^2.1.1` | `^2.1.1` | 🟢 In sync |
| `expo` | `~57.0.13` | `~57.0.13` | 🟢 In sync |
| `expo-camera` | ❌ *Missing* | `~57.0.0` | 🟢 Keep in `driver-app` (Required for QR scanner & license upload) |
| `expo-clipboard` | `~57.0.1` | `~57.0.1` | 🟢 In sync |
| `expo-constants` | `~57.0.11` | `~57.0.11` | 🟢 In sync |
| `expo-dev-client` | `~57.0.12` | `~57.0.12` | 🟢 In sync |
| `expo-device` | `~57.0.1` | `~57.0.1` | 🟢 In sync |
| `expo-file-system` | `~57.0.4` | `~57.0.4` | 🟢 In sync |
| `expo-font` | `~57.0.1` | `~57.0.1` | 🟢 In sync |
| `expo-haptics` | `~57.0.1` | `~57.0.1` | 🟢 In sync |
| `expo-image-manipulator` | `~57.0.10` | ❌ *Missing* | 🔴 **Add to `driver-app`** (Required for document OCR compression) |
| `expo-image-picker` | `~57.0.10` | ❌ *Missing* | 🔴 **Add to `driver-app`** (Required for license & selfie upload) |
| `expo-linear-gradient` | `~57.0.1` | `~57.0.1` | 🟢 In sync |
| `expo-linking` | `~57.0.6` | `~57.0.6` | 🟢 In sync |
| `expo-localization` | `~57.0.1` | `~57.0.1` | 🟢 In sync |
| `expo-location` | ❌ *Missing* | `~57.0.0` | 🟢 Keep in `driver-app` (Required for GPS telemetry) |
| `expo-network` | `~57.0.1` | `~57.0.1` | 🟢 In sync |
| `expo-notifications` | `~57.0.11` | `~57.0.11` | 🟢 In sync |
| `expo-router` | `~57.0.13` | `~57.0.13` | 🟢 In sync |
| `expo-secure-store` | `~57.0.1` | `~57.0.1` | 🟢 In sync |
| `expo-splash-screen` | `~57.0.6` | `~57.0.6` | 🟢 In sync |
| `expo-status-bar` | `~57.0.1` | `~57.0.1` | 🟢 In sync |
| `expo-system-ui` | `~57.0.2` | `~57.0.2` | 🟢 In sync |
| `expo-task-manager` | ❌ *Missing* | `~57.0.0` | 🟢 Keep in `driver-app` (Required for background GPS task) |
| `expo-web-browser` | `~57.0.2` | `~57.0.2` | 🟢 In sync |
| `i18next` | `^25.10.10` | ❌ *Missing* | 🔴 **Add to `driver-app`** |
| `lucide-react-native` | `^1.21.0` | `^1.21.0` | 🟢 In sync |
| `nativewind` | `preview` | `preview` | 🟢 In sync |
| `posthog-react-native` | `^4.61.4` | ❌ *Missing* | 🟡 **Add to `driver-app`** (Driver analytics & crash metrics) |
| `react` | `19.2.3` | `19.2.3` | 🟢 In sync |
| `react-dom` | `19.2.3` | `19.2.3` | 🟢 In sync |
| `react-i18next` | `^16.6.6` | ❌ *Missing* | 🔴 **Add to `driver-app`** (French/English i18n support) |
| `react-native` | `0.86.2` | `0.86.2` | 🟢 In sync |
| `react-native-css` | `latest` | `latest` | 🟢 In sync |
| `react-native-otp-entry` | `^1.8.6` | `^1.8.6` | 🟢 In sync |
| `react-native-qrcode-svg` | `^6.3.21` | `^6.3.21` | 🟢 In sync |
| `react-native-reanimated` | `4.5.1` | `4.5.1` | 🟢 In sync |
| `react-native-safe-area-context` | `~5.7.0` | `~5.7.0` | 🟢 In sync |
| `react-native-screens` | `~4.26.0` | `~4.26.0` | 🟢 In sync |
| `react-native-svg` | `15.15.4` | `15.15.4` | 🟢 In sync |
| `react-native-toast-message` | `^2.4.0` | `^2.4.0` | 🟢 In sync |
| `react-native-web` | `~0.21.0` | `~0.21.0` | 🟢 In sync |
| `react-native-worklets` | `0.10.1` | `0.10.1` | 🟢 In sync |
| `rn-international-phone-number` | `^0.14.0` | ❌ *Missing* | 🔴 **Add to `driver-app`** (International driver phone inputs) |
| `superjson` | `^2.2.6` | `^2.2.6` | 🟢 In sync |
| `tailwind-merge` | `^3.5.0` | `^3.5.0` | 🟢 In sync |
| `tailwindcss` | `^4` | `4.1.11` | 🟢 In sync |
| `zustand` | `^5.0.14` | ❌ *Missing* | 🔴 **Add to `driver-app`** (Driver shift & telemetry state store) |

---

## 3. Design System Alignment Guidelines

1. **Color Tokens**:
   - Primary: `#e11d48` (Rose 600) with `#be123c` active state.
   - Backgrounds: `#09090b` (Zinc 950 base) and `#18181b` (Zinc 900 card surface).
   - Borders: `#27272a` (Zinc 800) and `#3f3f46` (Zinc 700 subtle).
   - Text: `#fafafa` (Primary title), `#a1a1aa` (Muted subtitle), `#71717a` (Caption/Hint).
   - Operational Accents: `#10b981` (Online/Verified Emerald), `#f59e0b` (Pending/Warning Amber), `#38bdf8` (Telemetry/Navigation Cyan).
2. **Typography**:
   - Montserrat Font Family via `@expo-google-fonts/montserrat` (`Montserrat-Regular`, `Montserrat-Medium`, `Montserrat-SemiBold`, `Montserrat-Bold`, `Montserrat-Black`).
   - Tab bar labels at `fontSize: 10`, `fontWeight: "600"`.
3. **Card Corner Radii & Elevation**:
   - `rounded-2xl` (16px) for standard list items and inputs.
   - `rounded-3xl` (24px) for hero speedometer and career passport cards.
   - `shadow-2xl` with subtle colored glow for primary actions (`shadow-rose-600/20`).

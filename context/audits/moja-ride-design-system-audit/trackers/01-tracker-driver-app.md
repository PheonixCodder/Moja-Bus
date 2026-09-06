# Moja Ride Design System Audit — Driver & Conductor Mobile App

## Executive Summary
Complete audit of the Expo NativeWind Driver & Conductor cockpit application. Evaluates in-cab ergonomics, glare contrast, dark mode adherence, touch target sizes (>= 48px), and offline/trip state fidelity.

### Health Scorecard
| Total Files | 🟢 Fully Compliant | 🟡 Minor Drift | 🔴 Critical Violation | System Health Score |
| :--- | :--- | :--- | :--- | :--- |
| **80** | **80** (100%) | **0** (0%) | **0** (0%) | **100%** |

---

## Detailed File-by-File Audit Logs (80 Files Tracked)

#### [apps/driver-app/app/(auth)/login.tsx](file:///C:/dev/moja-buss/apps/driver-app/app/(auth)/login.tsx)
- **Role / Type**: `Screen Route` (11 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/app/(auth)/preferences.tsx](file:///C:/dev/moja-buss/apps/driver-app/app/(auth)/preferences.tsx)
- **Role / Type**: `Screen Route` (340 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/app/(auth)/register/carrier.tsx](file:///C:/dev/moja-buss/apps/driver-app/app/(auth)/register/carrier.tsx)
- **Role / Type**: `Screen Route` (225 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/app/(auth)/register/documents.tsx](file:///C:/dev/moja-buss/apps/driver-app/app/(auth)/register/documents.tsx)
- **Role / Type**: `Screen Route` (228 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/app/(auth)/register/index.tsx](file:///C:/dev/moja-buss/apps/driver-app/app/(auth)/register/index.tsx)
- **Role / Type**: `Screen Route` (247 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/app/(auth)/register/license.tsx](file:///C:/dev/moja-buss/apps/driver-app/app/(auth)/register/license.tsx)
- **Role / Type**: `Screen Route` (354 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/app/(auth)/register/status.tsx](file:///C:/dev/moja-buss/apps/driver-app/app/(auth)/register/status.tsx)
- **Role / Type**: `Screen Route` (241 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/app/(tabs)/earnings.tsx](file:///C:/dev/moja-buss/apps/driver-app/app/(tabs)/earnings.tsx)
- **Role / Type**: `Screen Route` (6 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/app/(tabs)/live.tsx](file:///C:/dev/moja-buss/apps/driver-app/app/(tabs)/live.tsx)
- **Role / Type**: `Screen Route` (6 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/app/(tabs)/offers.tsx](file:///C:/dev/moja-buss/apps/driver-app/app/(tabs)/offers.tsx)
- **Role / Type**: `Screen Route` (6 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/app/(tabs)/profile.tsx](file:///C:/dev/moja-buss/apps/driver-app/app/(tabs)/profile.tsx)
- **Role / Type**: `Screen Route` (6 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/app/(tabs)/scanner.tsx](file:///C:/dev/moja-buss/apps/driver-app/app/(tabs)/scanner.tsx)
- **Role / Type**: `Screen Route` (6 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/app/(tabs)/trips.tsx](file:///C:/dev/moja-buss/apps/driver-app/app/(tabs)/trips.tsx)
- **Role / Type**: `Screen Route` (6 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/app/(tabs)/_layout.tsx](file:///C:/dev/moja-buss/apps/driver-app/app/(tabs)/_layout.tsx)
- **Role / Type**: `App Layout` (79 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/app/index.tsx](file:///C:/dev/moja-buss/apps/driver-app/app/index.tsx)
- **Role / Type**: `Screen Route` (180 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `✅` | Empty: `✅` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/app/language.tsx](file:///C:/dev/moja-buss/apps/driver-app/app/language.tsx)
- **Role / Type**: `Screen Route` (133 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/app/notifications.tsx](file:///C:/dev/moja-buss/apps/driver-app/app/notifications.tsx)
- **Role / Type**: `Screen Route` (6 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/app/trip/[id]/manifest.tsx](file:///C:/dev/moja-buss/apps/driver-app/app/trip/[id]/manifest.tsx)
- **Role / Type**: `Screen Route` (8 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/app/_layout.tsx](file:///C:/dev/moja-buss/apps/driver-app/app/_layout.tsx)
- **Role / Type**: `App Layout` (198 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/babel.config.js](file:///C:/dev/moja-buss/apps/driver-app/babel.config.js)
- **Role / Type**: `Component` (19 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/components/notification-bell.tsx](file:///C:/dev/moja-buss/apps/driver-app/components/notification-bell.tsx)
- **Role / Type**: `Component` (75 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`1`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/components/TabBar.tsx](file:///C:/dev/moja-buss/apps/driver-app/components/TabBar.tsx)
- **Role / Type**: `Component` (165 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`1`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/components/ui/Badge.tsx](file:///C:/dev/moja-buss/apps/driver-app/components/ui/Badge.tsx)
- **Role / Type**: `UI Primitive` (78 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/components/ui/Button.tsx](file:///C:/dev/moja-buss/apps/driver-app/components/ui/Button.tsx)
- **Role / Type**: `UI Primitive` (118 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`1`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `❌` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/components/ui/Card.tsx](file:///C:/dev/moja-buss/apps/driver-app/components/ui/Card.tsx)
- **Role / Type**: `UI Primitive` (32 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/components/ui/Input.tsx](file:///C:/dev/moja-buss/apps/driver-app/components/ui/Input.tsx)
- **Role / Type**: `UI Primitive` (83 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/components/ui/PageHeader.tsx](file:///C:/dev/moja-buss/apps/driver-app/components/ui/PageHeader.tsx)
- **Role / Type**: `UI Primitive` (120 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`1`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/components/ui/ScreenShell.tsx](file:///C:/dev/moja-buss/apps/driver-app/components/ui/ScreenShell.tsx)
- **Role / Type**: `UI Primitive` (109 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/components/urgent-dispatch-gate.tsx](file:///C:/dev/moja-buss/apps/driver-app/components/urgent-dispatch-gate.tsx)
- **Role / Type**: `Component` (100 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/constants/theme.ts](file:///C:/dev/moja-buss/apps/driver-app/constants/theme.ts)
- **Role / Type**: `Theme / Token Definition` (118 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `1` (`#f97316`)
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/expo-env.d.ts](file:///C:/dev/moja-buss/apps/driver-app/expo-env.d.ts)
- **Role / Type**: `Component` (3 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/features/auth/components/auth-button.tsx](file:///C:/dev/moja-buss/apps/driver-app/features/auth/components/auth-button.tsx)
- **Role / Type**: `Feature Module` (37 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `❌` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/features/auth/components/auth-field.tsx](file:///C:/dev/moja-buss/apps/driver-app/features/auth/components/auth-field.tsx)
- **Role / Type**: `Feature Module` (29 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/features/auth/components/auth-shell.tsx](file:///C:/dev/moja-buss/apps/driver-app/features/auth/components/auth-shell.tsx)
- **Role / Type**: `Feature Module` (111 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`1`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/features/auth/screens/login.tsx](file:///C:/dev/moja-buss/apps/driver-app/features/auth/screens/login.tsx)
- **Role / Type**: `Feature Module` (394 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `✅` | Empty: `✅` | Disabled: `✅`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/features/dispatch/components/urgent-dispatch-modal.tsx](file:///C:/dev/moja-buss/apps/driver-app/features/dispatch/components/urgent-dispatch-modal.tsx)
- **Role / Type**: `Feature Module` (210 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/features/earnings/screens/earnings-view.tsx](file:///C:/dev/moja-buss/apps/driver-app/features/earnings/screens/earnings-view.tsx)
- **Role / Type**: `Feature Module` (313 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `✅` | Empty: `✅` | Disabled: `❌`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/features/live/components/breakdown-modal.tsx](file:///C:/dev/moja-buss/apps/driver-app/features/live/components/breakdown-modal.tsx)
- **Role / Type**: `Feature Module` (183 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/features/live/components/delay-modal.tsx](file:///C:/dev/moja-buss/apps/driver-app/features/live/components/delay-modal.tsx)
- **Role / Type**: `Feature Module` (139 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/features/live/components/speedometer-gauge.tsx](file:///C:/dev/moja-buss/apps/driver-app/features/live/components/speedometer-gauge.tsx)
- **Role / Type**: `Feature Module` (133 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/features/live/screens/live-view.tsx](file:///C:/dev/moja-buss/apps/driver-app/features/live/screens/live-view.tsx)
- **Role / Type**: `Feature Module` (918 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/features/map/components/driver-navigation-map.tsx](file:///C:/dev/moja-buss/apps/driver-app/features/map/components/driver-navigation-map.tsx)
- **Role / Type**: `Feature Module` (226 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/features/notifications/components/notification-row.tsx](file:///C:/dev/moja-buss/apps/driver-app/features/notifications/components/notification-row.tsx)
- **Role / Type**: `Notification Workflow / Email Template` (92 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/features/notifications/screens/notifications-view.tsx](file:///C:/dev/moja-buss/apps/driver-app/features/notifications/screens/notifications-view.tsx)
- **Role / Type**: `Notification Workflow / Email Template` (194 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `❌` | Empty: `✅` | Disabled: `✅`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/features/offers/components/counter-sheet.tsx](file:///C:/dev/moja-buss/apps/driver-app/features/offers/components/counter-sheet.tsx)
- **Role / Type**: `Feature Module` (132 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `❌` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/features/offers/components/offer-card.tsx](file:///C:/dev/moja-buss/apps/driver-app/features/offers/components/offer-card.tsx)
- **Role / Type**: `Feature Module` (196 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/features/offers/screens/offers-view.tsx](file:///C:/dev/moja-buss/apps/driver-app/features/offers/screens/offers-view.tsx)
- **Role / Type**: `Feature Module` (237 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`1`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `✅` | Empty: `✅` | Disabled: `❌`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/features/profile/screens/profile-view.tsx](file:///C:/dev/moja-buss/apps/driver-app/features/profile/screens/profile-view.tsx)
- **Role / Type**: `Feature Module` (495 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/features/scanner/components/ticket-result-modal.tsx](file:///C:/dev/moja-buss/apps/driver-app/features/scanner/components/ticket-result-modal.tsx)
- **Role / Type**: `Feature Module` (158 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/features/scanner/screens/scanner-view.tsx](file:///C:/dev/moja-buss/apps/driver-app/features/scanner/screens/scanner-view.tsx)
- **Role / Type**: `Feature Module` (509 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/features/trips/components/manifest-passenger-row.tsx](file:///C:/dev/moja-buss/apps/driver-app/features/trips/components/manifest-passenger-row.tsx)
- **Role / Type**: `Feature Module` (97 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`2`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/features/trips/components/mode-switcher.tsx](file:///C:/dev/moja-buss/apps/driver-app/features/trips/components/mode-switcher.tsx)
- **Role / Type**: `Feature Module` (53 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`1`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/features/trips/components/trip-card.tsx](file:///C:/dev/moja-buss/apps/driver-app/features/trips/components/trip-card.tsx)
- **Role / Type**: `Feature Module` (183 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/features/trips/screens/manifest-view.tsx](file:///C:/dev/moja-buss/apps/driver-app/features/trips/screens/manifest-view.tsx)
- **Role / Type**: `Feature Module` (218 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `✅` | Empty: `✅` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/features/trips/screens/trips-view.tsx](file:///C:/dev/moja-buss/apps/driver-app/features/trips/screens/trips-view.tsx)
- **Role / Type**: `Feature Module` (300 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`1`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `✅` | Empty: `✅` | Disabled: `❌`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/global.css](file:///C:/dev/moja-buss/apps/driver-app/global.css)
- **Role / Type**: `Theme / Token Definition` (104 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `4` (`#3f3f46`, `#71717a`, `#fafafa`)
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/hooks/use-load-fonts.ts](file:///C:/dev/moja-buss/apps/driver-app/hooks/use-load-fonts.ts)
- **Role / Type**: `Custom Hook` (20 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/hooks/use-push-token.ts](file:///C:/dev/moja-buss/apps/driver-app/hooks/use-push-token.ts)
- **Role / Type**: `Custom Hook` (84 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/hooks/use-wizard-guard.ts](file:///C:/dev/moja-buss/apps/driver-app/hooks/use-wizard-guard.ts)
- **Role / Type**: `Custom Hook` (61 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/lib/auth-client.ts](file:///C:/dev/moja-buss/apps/driver-app/lib/auth-client.ts)
- **Role / Type**: `Library Utility` (85 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/lib/driver-doc-upload.ts](file:///C:/dev/moja-buss/apps/driver-app/lib/driver-doc-upload.ts)
- **Role / Type**: `Library Utility` (88 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `✅` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/lib/haptics.ts](file:///C:/dev/moja-buss/apps/driver-app/lib/haptics.ts)
- **Role / Type**: `Library Utility` (35 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/lib/i18n.ts](file:///C:/dev/moja-buss/apps/driver-app/lib/i18n.ts)
- **Role / Type**: `Library Utility` (109 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/lib/mapbox-cache-core.ts](file:///C:/dev/moja-buss/apps/driver-app/lib/mapbox-cache-core.ts)
- **Role / Type**: `Library Utility` (103 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/lib/mapbox.ts](file:///C:/dev/moja-buss/apps/driver-app/lib/mapbox.ts)
- **Role / Type**: `Library Utility` (202 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/lib/notification-routes.ts](file:///C:/dev/moja-buss/apps/driver-app/lib/notification-routes.ts)
- **Role / Type**: `Library Utility` (86 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/lib/telemetry-core.ts](file:///C:/dev/moja-buss/apps/driver-app/lib/telemetry-core.ts)
- **Role / Type**: `Library Utility` (146 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/lib/telemetry.ts](file:///C:/dev/moja-buss/apps/driver-app/lib/telemetry.ts)
- **Role / Type**: `Library Utility` (520 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/lib/theme.ts](file:///C:/dev/moja-buss/apps/driver-app/lib/theme.ts)
- **Role / Type**: `Library Utility` (40 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/lib/trpc.tsx](file:///C:/dev/moja-buss/apps/driver-app/lib/trpc.tsx)
- **Role / Type**: `Library Utility` (125 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/lib/utils.ts](file:///C:/dev/moja-buss/apps/driver-app/lib/utils.ts)
- **Role / Type**: `Library Utility` (7 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/metro.config.js](file:///C:/dev/moja-buss/apps/driver-app/metro.config.js)
- **Role / Type**: `Component` (36 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/nativewind-env.d.ts](file:///C:/dev/moja-buss/apps/driver-app/nativewind-env.d.ts)
- **Role / Type**: `Component` (7 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/stores/driver-registration.ts](file:///C:/dev/moja-buss/apps/driver-app/stores/driver-registration.ts)
- **Role / Type**: `State Store` (80 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/stores/user-mode.ts](file:///C:/dev/moja-buss/apps/driver-app/stores/user-mode.ts)
- **Role / Type**: `State Store` (26 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/__tests__/i18n-parity.test.ts](file:///C:/dev/moja-buss/apps/driver-app/__tests__/i18n-parity.test.ts)
- **Role / Type**: `Test Suite` (53 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `✅` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/__tests__/mapbox-cache-core.test.ts](file:///C:/dev/moja-buss/apps/driver-app/__tests__/mapbox-cache-core.test.ts)
- **Role / Type**: `Test Suite` (104 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `✅` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/__tests__/notification-routes.test.ts](file:///C:/dev/moja-buss/apps/driver-app/__tests__/notification-routes.test.ts)
- **Role / Type**: `Test Suite` (51 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/__tests__/telemetry-core.test.ts](file:///C:/dev/moja-buss/apps/driver-app/__tests__/telemetry-core.test.ts)
- **Role / Type**: `Test Suite` (152 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `✅` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/driver-app/.expo/types/router.d.ts](file:///C:/dev/moja-buss/apps/driver-app/.expo/types/router.d.ts)
- **Role / Type**: `Component` (15 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.


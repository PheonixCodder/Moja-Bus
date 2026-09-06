# Moja Ride Design System Audit — Legacy Repositories & Deprecated Packages

## Executive Summary
Exhaustive audit and archival record of legacy packages in legacy-apps-setup/ (agent-app, aggregator-web, api, driver-app, operator-web, traveler-app) to confirm isolation and prevent style regression bleeding.

### Health Scorecard
| Total Files | 🟢 Fully Compliant | 🟡 Minor Drift | 🔴 Critical Violation | System Health Score |
| :--- | :--- | :--- | :--- | :--- |
| **85** | **62** (73%) | **13** (15%) | **10** (12%) | **73%** |

---

## Detailed File-by-File Audit Logs (85 Files Tracked)

#### [legacy-apps-setup/packages/agent-app/src/offline/db.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/agent-app/src/offline/db.ts)
- **Role / Type**: `Component` (193 LOC)
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

#### [legacy-apps-setup/packages/agent-app/src/offline/sync.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/agent-app/src/offline/sync.ts)
- **Role / Type**: `Component` (68 LOC)
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

#### [legacy-apps-setup/packages/agent-app/src/screens/AgentSaleScreen.tsx](file:///C:/dev/moja-buss/legacy-apps-setup/packages/agent-app/src/screens/AgentSaleScreen.tsx)
- **Role / Type**: `Component` (211 LOC)
- **Status**: 🔴 Critical Violation
- **Metrics**:
  - Hardcoded Hexes: `12` (`#fff`, `#F5F5F5`, `#E8F5E9`)
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`4`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `✅` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Urgent Remediation Required**:
  - Replace arbitrary hex values (#fff, #F5F5F5, #E8F5E9, #FFEBEE) with canonical tokens from `@repo/theme` or semantic Tailwind tokens.
  
  
  
  
  - Ensure touch targets adhere to >= 44px (mobile) or standard density hierarchy (web).

---

#### [legacy-apps-setup/packages/agent-app/src/services/api.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/agent-app/src/services/api.ts)
- **Role / Type**: `Component` (37 LOC)
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

#### [legacy-apps-setup/packages/agent-app/src/store/auth.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/agent-app/src/store/auth.ts)
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

#### [legacy-apps-setup/packages/aggregator-web/next-env.d.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/aggregator-web/next-env.d.ts)
- **Role / Type**: `Component` (6 LOC)
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

#### [legacy-apps-setup/packages/aggregator-web/postcss.config.js](file:///C:/dev/moja-buss/legacy-apps-setup/packages/aggregator-web/postcss.config.js)
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

#### [legacy-apps-setup/packages/aggregator-web/src/app/globals.css](file:///C:/dev/moja-buss/legacy-apps-setup/packages/aggregator-web/src/app/globals.css)
- **Role / Type**: `Theme / Token Definition` (11 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `2` (`#E8461E`, `#1A3A2A`)
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [legacy-apps-setup/packages/aggregator-web/src/app/layout.tsx](file:///C:/dev/moja-buss/legacy-apps-setup/packages/aggregator-web/src/app/layout.tsx)
- **Role / Type**: `App Layout` (23 LOC)
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

#### [legacy-apps-setup/packages/aggregator-web/src/app/page.tsx](file:///C:/dev/moja-buss/legacy-apps-setup/packages/aggregator-web/src/app/page.tsx)
- **Role / Type**: `Screen Route` (60 LOC)
- **Status**: 🔴 Critical Violation
- **Metrics**:
  - Hardcoded Hexes: `4` (`#1A3A2A`, `#2D5C40`, `#E8461E`)
  - Arbitrary Tailwind Classes: `1`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Urgent Remediation Required**:
  - Replace arbitrary hex values (#1A3A2A, #2D5C40, #E8461E, #C03615) with canonical tokens from `@repo/theme` or semantic Tailwind tokens.
  
  
  - Add loading state / skeleton for async data fetching.

  - Add error boundary or fallback toast/alert for failed states.

  - Ensure touch targets adhere to >= 44px (mobile) or standard density hierarchy (web).

---

#### [legacy-apps-setup/packages/aggregator-web/src/app/search/page.tsx](file:///C:/dev/moja-buss/legacy-apps-setup/packages/aggregator-web/src/app/search/page.tsx)
- **Role / Type**: `Screen Route` (114 LOC)
- **Status**: 🟡 Minor Drift
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`2`)
  - State Coverage: Loading: `✅` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Recommended Polish**:
  - Standardize palette classes (text-gray-500, bg-gray-100, text-gray-400) to theme tokens.
  
  - Verify empty state UX when zero records are returned.

  - Add explicit accessibility attributes (`aria-label` or `accessibilityLabel`).

---

#### [legacy-apps-setup/packages/aggregator-web/src/components/layout/Providers.tsx](file:///C:/dev/moja-buss/legacy-apps-setup/packages/aggregator-web/src/components/layout/Providers.tsx)
- **Role / Type**: `Component` (12 LOC)
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

#### [legacy-apps-setup/packages/aggregator-web/src/components/layout/TopNav.tsx](file:///C:/dev/moja-buss/legacy-apps-setup/packages/aggregator-web/src/components/layout/TopNav.tsx)
- **Role / Type**: `Component` (29 LOC)
- **Status**: 🔴 Critical Violation
- **Metrics**:
  - Hardcoded Hexes: `2` (`#E8461E`, `#C03615`)
  - Arbitrary Tailwind Classes: `3`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Urgent Remediation Required**:
  - Replace arbitrary hex values (#E8461E, #C03615) with canonical tokens from `@repo/theme` or semantic Tailwind tokens.
  
  
  - Add loading state / skeleton for async data fetching.

  - Add error boundary or fallback toast/alert for failed states.

  - Ensure touch targets adhere to >= 44px (mobile) or standard density hierarchy (web).

---

#### [legacy-apps-setup/packages/aggregator-web/src/components/operator/OperatorCarousel.tsx](file:///C:/dev/moja-buss/legacy-apps-setup/packages/aggregator-web/src/components/operator/OperatorCarousel.tsx)
- **Role / Type**: `Component` (46 LOC)
- **Status**: 🟡 Minor Drift
- **Metrics**:
  - Hardcoded Hexes: `1` (`#E8461E`)
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Recommended Polish**:
  - Standardize palette classes (border-gray-100, text-gray-500, text-gray-400) to theme tokens.
  - Replace arbitrary spacing [w-[200px]] with 4px/8px standard Tailwind spacing.

  
  - Add explicit accessibility attributes (`aria-label` or `accessibilityLabel`).

---

#### [legacy-apps-setup/packages/aggregator-web/src/components/search/PopularRoutes.tsx](file:///C:/dev/moja-buss/legacy-apps-setup/packages/aggregator-web/src/components/search/PopularRoutes.tsx)
- **Role / Type**: `Component` (38 LOC)
- **Status**: 🟡 Minor Drift
- **Metrics**:
  - Hardcoded Hexes: `1` (`#E8461E`)
  - Arbitrary Tailwind Classes: `2`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Recommended Polish**:
  - Standardize palette classes (border-gray-100, text-gray-400) to theme tokens.
  
  
  - Add explicit accessibility attributes (`aria-label` or `accessibilityLabel`).

---

#### [legacy-apps-setup/packages/aggregator-web/src/components/search/SearchForm.tsx](file:///C:/dev/moja-buss/legacy-apps-setup/packages/aggregator-web/src/components/search/SearchForm.tsx)
- **Role / Type**: `Component` (90 LOC)
- **Status**: 🔴 Critical Violation
- **Metrics**:
  - Hardcoded Hexes: `2` (`#E8461E`, `#C03615`)
  - Arbitrary Tailwind Classes: `3`
  - Raw UI Elements: Buttons (`1`), Inputs (`3`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Urgent Remediation Required**:
  - Replace arbitrary hex values (#E8461E, #C03615) with canonical tokens from `@repo/theme` or semantic Tailwind tokens.
  - Refactor 1 raw `<button>` or `<TouchableOpacity>` instances to use `Button` primitive with appropriate variant.

  - Refactor 3 raw `<input>` instances to use `Input` primitive with label and error validation.

  - Add loading state / skeleton for async data fetching.

  - Add error boundary or fallback toast/alert for failed states.

  - Ensure touch targets adhere to >= 44px (mobile) or standard density hierarchy (web).

---

#### [legacy-apps-setup/packages/aggregator-web/src/components/trip/TripCard.tsx](file:///C:/dev/moja-buss/legacy-apps-setup/packages/aggregator-web/src/components/trip/TripCard.tsx)
- **Role / Type**: `Component` (132 LOC)
- **Status**: 🟡 Minor Drift
- **Metrics**:
  - Hardcoded Hexes: `2` (`#E8461E`, `#C03615`)
  - Arbitrary Tailwind Classes: `2`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Recommended Polish**:
  - Standardize palette classes (text-gray-300, text-gray-400, text-gray-500) to theme tokens.
  
  
  - Add explicit accessibility attributes (`aria-label` or `accessibilityLabel`).

---

#### [legacy-apps-setup/packages/aggregator-web/src/lib/api.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/aggregator-web/src/lib/api.ts)
- **Role / Type**: `Library Utility` (15 LOC)
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

#### [legacy-apps-setup/packages/aggregator-web/tailwind.config.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/aggregator-web/tailwind.config.ts)
- **Role / Type**: `Component` (18 LOC)
- **Status**: 🟡 Minor Drift
- **Metrics**:
  - Hardcoded Hexes: `3` (`#E8461E`, `#C03615`, `#1A3A2A`)
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Recommended Polish**:
  - Standardize minor styling drift.
  
  
  - Add explicit accessibility attributes (`aria-label` or `accessibilityLabel`).

---

#### [legacy-apps-setup/packages/api/prisma/seed.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/prisma/seed.ts)
- **Role / Type**: `Backend API Route` (210 LOC)
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

#### [legacy-apps-setup/packages/api/src/jobs/scheduler.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/jobs/scheduler.ts)
- **Role / Type**: `Backend API Route` (164 LOC)
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

#### [legacy-apps-setup/packages/api/src/middleware/auth.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/middleware/auth.ts)
- **Role / Type**: `Backend API Route` (46 LOC)
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

#### [legacy-apps-setup/packages/api/src/middleware/errorHandler.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/middleware/errorHandler.ts)
- **Role / Type**: `Backend API Route` (31 LOC)
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

#### [legacy-apps-setup/packages/api/src/routes/ads.routes.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/routes/ads.routes.ts)
- **Role / Type**: `Backend API Route` (169 LOC)
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

#### [legacy-apps-setup/packages/api/src/routes/agents.routes.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/routes/agents.routes.ts)
- **Role / Type**: `Backend API Route` (65 LOC)
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

#### [legacy-apps-setup/packages/api/src/routes/aggregator.routes.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/routes/aggregator.routes.ts)
- **Role / Type**: `Backend API Route` (226 LOC)
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

#### [legacy-apps-setup/packages/api/src/routes/analytics.routes.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/routes/analytics.routes.ts)
- **Role / Type**: `Backend API Route` (201 LOC)
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

#### [legacy-apps-setup/packages/api/src/routes/auth.routes.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/routes/auth.routes.ts)
- **Role / Type**: `Backend API Route` (174 LOC)
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

#### [legacy-apps-setup/packages/api/src/routes/booking-management.routes.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/routes/booking-management.routes.ts)
- **Role / Type**: `Backend API Route` (186 LOC)
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

#### [legacy-apps-setup/packages/api/src/routes/bookings.routes.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/routes/bookings.routes.ts)
- **Role / Type**: `Backend API Route` (245 LOC)
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

#### [legacy-apps-setup/packages/api/src/routes/crew.routes.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/routes/crew.routes.ts)
- **Role / Type**: `Backend API Route` (339 LOC)
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

#### [legacy-apps-setup/packages/api/src/routes/fleet.routes.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/routes/fleet.routes.ts)
- **Role / Type**: `Backend API Route` (190 LOC)
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

#### [legacy-apps-setup/packages/api/src/routes/immobilizer.routes.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/routes/immobilizer.routes.ts)
- **Role / Type**: `Backend API Route` (131 LOC)
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

#### [legacy-apps-setup/packages/api/src/routes/loyalty.routes.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/routes/loyalty.routes.ts)
- **Role / Type**: `Backend API Route` (40 LOC)
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

#### [legacy-apps-setup/packages/api/src/routes/operators.routes.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/routes/operators.routes.ts)
- **Role / Type**: `Backend API Route` (153 LOC)
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

#### [legacy-apps-setup/packages/api/src/routes/payments.routes.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/routes/payments.routes.ts)
- **Role / Type**: `Backend API Route` (97 LOC)
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

#### [legacy-apps-setup/packages/api/src/routes/pricing.routes.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/routes/pricing.routes.ts)
- **Role / Type**: `Backend API Route` (105 LOC)
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

#### [legacy-apps-setup/packages/api/src/routes/promotions.routes.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/routes/promotions.routes.ts)
- **Role / Type**: `Backend API Route` (138 LOC)
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

#### [legacy-apps-setup/packages/api/src/routes/ratings.routes.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/routes/ratings.routes.ts)
- **Role / Type**: `Backend API Route` (156 LOC)
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

#### [legacy-apps-setup/packages/api/src/routes/rides.routes.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/routes/rides.routes.ts)
- **Role / Type**: `Backend API Route` (163 LOC)
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

#### [legacy-apps-setup/packages/api/src/routes/sync.routes.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/routes/sync.routes.ts)
- **Role / Type**: `Backend API Route` (237 LOC)
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

#### [legacy-apps-setup/packages/api/src/routes/tracking.routes.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/routes/tracking.routes.ts)
- **Role / Type**: `Backend API Route` (97 LOC)
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

#### [legacy-apps-setup/packages/api/src/routes/trips.routes.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/routes/trips.routes.ts)
- **Role / Type**: `Backend API Route` (229 LOC)
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

#### [legacy-apps-setup/packages/api/src/routes/white-label.routes.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/routes/white-label.routes.ts)
- **Role / Type**: `Backend API Route` (115 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `2` (`#E8461E`, `#1A3A2A`)
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `✅` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [legacy-apps-setup/packages/api/src/server.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/server.ts)
- **Role / Type**: `Backend API Route` (109 LOC)
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

#### [legacy-apps-setup/packages/api/src/services/cancellation.service.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/services/cancellation.service.ts)
- **Role / Type**: `Backend API Route` (294 LOC)
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

#### [legacy-apps-setup/packages/api/src/services/immobilizer.service.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/services/immobilizer.service.ts)
- **Role / Type**: `Backend API Route` (147 LOC)
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

#### [legacy-apps-setup/packages/api/src/services/loyalty.service.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/services/loyalty.service.ts)
- **Role / Type**: `Backend API Route` (132 LOC)
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

#### [legacy-apps-setup/packages/api/src/services/payment.service.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/services/payment.service.ts)
- **Role / Type**: `Backend API Route` (277 LOC)
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

#### [legacy-apps-setup/packages/api/src/services/pricing.service.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/services/pricing.service.ts)
- **Role / Type**: `Backend API Route` (135 LOC)
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

#### [legacy-apps-setup/packages/api/src/services/ride-hailing.service.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/services/ride-hailing.service.ts)
- **Role / Type**: `Backend API Route` (246 LOC)
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

#### [legacy-apps-setup/packages/api/src/services/tracking.socket.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/services/tracking.socket.ts)
- **Role / Type**: `Backend API Route` (145 LOC)
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

#### [legacy-apps-setup/packages/api/src/utils/logger.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/utils/logger.ts)
- **Role / Type**: `Backend API Route` (13 LOC)
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

#### [legacy-apps-setup/packages/api/src/utils/prisma.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/utils/prisma.ts)
- **Role / Type**: `Backend API Route` (12 LOC)
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

#### [legacy-apps-setup/packages/api/src/utils/redis.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/api/src/utils/redis.ts)
- **Role / Type**: `Backend API Route` (27 LOC)
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

#### [legacy-apps-setup/packages/driver-app/src/screens/CheckInScreen.tsx](file:///C:/dev/moja-buss/legacy-apps-setup/packages/driver-app/src/screens/CheckInScreen.tsx)
- **Role / Type**: `Component` (108 LOC)
- **Status**: 🟡 Minor Drift
- **Metrics**:
  - Hardcoded Hexes: `4` (`#000`, `#E8461E`, `#fff`)
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`2`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Recommended Polish**:
  - Standardize minor styling drift.
  
  
  - Add explicit accessibility attributes (`aria-label` or `accessibilityLabel`).

---

#### [legacy-apps-setup/packages/driver-app/src/screens/TripDashboardScreen.tsx](file:///C:/dev/moja-buss/legacy-apps-setup/packages/driver-app/src/screens/TripDashboardScreen.tsx)
- **Role / Type**: `Component` (292 LOC)
- **Status**: 🔴 Critical Violation
- **Metrics**:
  - Hardcoded Hexes: `15` (`#F5F5F5`, `#E8F5E9`, `#FFEBEE`)
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`3`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Urgent Remediation Required**:
  - Replace arbitrary hex values (#F5F5F5, #E8F5E9, #FFEBEE, #fff) with canonical tokens from `@repo/theme` or semantic Tailwind tokens.
  
  
  - Add loading state / skeleton for async data fetching.

  
  - Ensure touch targets adhere to >= 44px (mobile) or standard density hierarchy (web).

---

#### [legacy-apps-setup/packages/driver-app/src/services/api.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/driver-app/src/services/api.ts)
- **Role / Type**: `Component` (14 LOC)
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

#### [legacy-apps-setup/packages/driver-app/src/store/driver.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/driver-app/src/store/driver.ts)
- **Role / Type**: `Component` (32 LOC)
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

#### [legacy-apps-setup/packages/operator-web/next-env.d.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/operator-web/next-env.d.ts)
- **Role / Type**: `Component` (6 LOC)
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

#### [legacy-apps-setup/packages/operator-web/next.config.js](file:///C:/dev/moja-buss/legacy-apps-setup/packages/operator-web/next.config.js)
- **Role / Type**: `Component` (9 LOC)
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

#### [legacy-apps-setup/packages/operator-web/postcss.config.js](file:///C:/dev/moja-buss/legacy-apps-setup/packages/operator-web/postcss.config.js)
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

#### [legacy-apps-setup/packages/operator-web/src/app/dashboard/page.tsx](file:///C:/dev/moja-buss/legacy-apps-setup/packages/operator-web/src/app/dashboard/page.tsx)
- **Role / Type**: `Screen Route` (82 LOC)
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

#### [legacy-apps-setup/packages/operator-web/src/app/globals.css](file:///C:/dev/moja-buss/legacy-apps-setup/packages/operator-web/src/app/globals.css)
- **Role / Type**: `Theme / Token Definition` (17 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `3` (`#E8461E`, `#C03615`, `#1A3A2A`)
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [legacy-apps-setup/packages/operator-web/src/app/layout.tsx](file:///C:/dev/moja-buss/legacy-apps-setup/packages/operator-web/src/app/layout.tsx)
- **Role / Type**: `App Layout` (19 LOC)
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

#### [legacy-apps-setup/packages/operator-web/src/app/providers.tsx](file:///C:/dev/moja-buss/legacy-apps-setup/packages/operator-web/src/app/providers.tsx)
- **Role / Type**: `Screen Route` (16 LOC)
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

#### [legacy-apps-setup/packages/operator-web/src/app/tracking/page.tsx](file:///C:/dev/moja-buss/legacy-apps-setup/packages/operator-web/src/app/tracking/page.tsx)
- **Role / Type**: `Screen Route` (110 LOC)
- **Status**: 🟡 Minor Drift
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Recommended Polish**:
  - Standardize palette classes (bg-gray-50, text-gray-700, text-gray-500) to theme tokens.
  
  - Verify empty state UX when zero records are returned.

  - Add explicit accessibility attributes (`aria-label` or `accessibilityLabel`).

---

#### [legacy-apps-setup/packages/operator-web/src/components/charts/RevenueChart.tsx](file:///C:/dev/moja-buss/legacy-apps-setup/packages/operator-web/src/components/charts/RevenueChart.tsx)
- **Role / Type**: `Component` (51 LOC)
- **Status**: 🟡 Minor Drift
- **Metrics**:
  - Hardcoded Hexes: `1` (`#E8461E`)
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Recommended Polish**:
  - Standardize minor styling drift.
  
  
  - Add explicit accessibility attributes (`aria-label` or `accessibilityLabel`).

---

#### [legacy-apps-setup/packages/operator-web/src/components/charts/RoutePerformanceTable.tsx](file:///C:/dev/moja-buss/legacy-apps-setup/packages/operator-web/src/components/charts/RoutePerformanceTable.tsx)
- **Role / Type**: `Component` (60 LOC)
- **Status**: 🟡 Minor Drift
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Recommended Polish**:
  - Standardize palette classes (text-gray-500, bg-gray-50, text-gray-600) to theme tokens.
  
  
  - Add explicit accessibility attributes (`aria-label` or `accessibilityLabel`).

---

#### [legacy-apps-setup/packages/operator-web/src/components/fleet/FleetStatusList.tsx](file:///C:/dev/moja-buss/legacy-apps-setup/packages/operator-web/src/components/fleet/FleetStatusList.tsx)
- **Role / Type**: `Component` (33 LOC)
- **Status**: 🟡 Minor Drift
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Recommended Polish**:
  - Standardize palette classes (text-gray-500, text-red-500, text-gray-400) to theme tokens.
  
  
  - Add explicit accessibility attributes (`aria-label` or `accessibilityLabel`).

---

#### [legacy-apps-setup/packages/operator-web/src/components/layout/Sidebar.tsx](file:///C:/dev/moja-buss/legacy-apps-setup/packages/operator-web/src/components/layout/Sidebar.tsx)
- **Role / Type**: `Component` (48 LOC)
- **Status**: 🟡 Minor Drift
- **Metrics**:
  - Hardcoded Hexes: `2` (`#1A3A2A`, `#E8461E`)
  - Arbitrary Tailwind Classes: `2`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Recommended Polish**:
  - Standardize minor styling drift.
  
  
  - Add explicit accessibility attributes (`aria-label` or `accessibilityLabel`).

---

#### [legacy-apps-setup/packages/operator-web/src/components/ui/StatCard.tsx](file:///C:/dev/moja-buss/legacy-apps-setup/packages/operator-web/src/components/ui/StatCard.tsx)
- **Role / Type**: `UI Primitive` (21 LOC)
- **Status**: 🟡 Minor Drift
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Recommended Polish**:
  - Standardize palette classes (text-gray-500, text-gray-900, text-red-500) to theme tokens.
  
  
  - Add explicit accessibility attributes (`aria-label` or `accessibilityLabel`).

---

#### [legacy-apps-setup/packages/operator-web/src/lib/api.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/operator-web/src/lib/api.ts)
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

#### [legacy-apps-setup/packages/operator-web/tailwind.config.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/operator-web/tailwind.config.ts)
- **Role / Type**: `Component` (18 LOC)
- **Status**: 🟡 Minor Drift
- **Metrics**:
  - Hardcoded Hexes: `3` (`#E8461E`, `#C03615`, `#1A3A2A`)
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Recommended Polish**:
  - Standardize minor styling drift.
  
  
  - Add explicit accessibility attributes (`aria-label` or `accessibilityLabel`).

---

#### [legacy-apps-setup/packages/traveler-app/src/screens/BookingManagementScreen.tsx](file:///C:/dev/moja-buss/legacy-apps-setup/packages/traveler-app/src/screens/BookingManagementScreen.tsx)
- **Role / Type**: `Component` (361 LOC)
- **Status**: 🔴 Critical Violation
- **Metrics**:
  - Hardcoded Hexes: `17` (`#999`, `#E8461E`, `#fff`)
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`6`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `✅` | Empty: `✅` | Disabled: `✅`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Urgent Remediation Required**:
  - Replace arbitrary hex values (#999, #E8461E, #fff, #666) with canonical tokens from `@repo/theme` or semantic Tailwind tokens.
  
  
  
  
  - Ensure touch targets adhere to >= 44px (mobile) or standard density hierarchy (web).

---

#### [legacy-apps-setup/packages/traveler-app/src/screens/BookingScreen.tsx](file:///C:/dev/moja-buss/legacy-apps-setup/packages/traveler-app/src/screens/BookingScreen.tsx)
- **Role / Type**: `Component` (139 LOC)
- **Status**: 🔴 Critical Violation
- **Metrics**:
  - Hardcoded Hexes: `12` (`#00AABB`, `#FF6600`, `#006DB7`)
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`2`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `✅` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Urgent Remediation Required**:
  - Replace arbitrary hex values (#00AABB, #FF6600, #006DB7, #FFC107) with canonical tokens from `@repo/theme` or semantic Tailwind tokens.
  
  
  
  
  - Ensure touch targets adhere to >= 44px (mobile) or standard density hierarchy (web).

---

#### [legacy-apps-setup/packages/traveler-app/src/screens/PostBookingScreen.tsx](file:///C:/dev/moja-buss/legacy-apps-setup/packages/traveler-app/src/screens/PostBookingScreen.tsx)
- **Role / Type**: `Component` (222 LOC)
- **Status**: 🔴 Critical Violation
- **Metrics**:
  - Hardcoded Hexes: `12` (`#F5F5F5`, `#1A3A2A`, `#4CAF50`)
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`4`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Urgent Remediation Required**:
  - Replace arbitrary hex values (#F5F5F5, #1A3A2A, #4CAF50, #fff) with canonical tokens from `@repo/theme` or semantic Tailwind tokens.
  
  
  
  - Add error boundary or fallback toast/alert for failed states.

  - Ensure touch targets adhere to >= 44px (mobile) or standard density hierarchy (web).

---

#### [legacy-apps-setup/packages/traveler-app/src/screens/RideEstimatesScreen.tsx](file:///C:/dev/moja-buss/legacy-apps-setup/packages/traveler-app/src/screens/RideEstimatesScreen.tsx)
- **Role / Type**: `Component` (228 LOC)
- **Status**: 🔴 Critical Violation
- **Metrics**:
  - Hardcoded Hexes: `13` (`#FFCC00`, `#00C853`, `#E8461E`)
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`4`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `✅` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Urgent Remediation Required**:
  - Replace arbitrary hex values (#FFCC00, #00C853, #E8461E, #fff) with canonical tokens from `@repo/theme` or semantic Tailwind tokens.
  
  
  
  
  - Ensure touch targets adhere to >= 44px (mobile) or standard density hierarchy (web).

---

#### [legacy-apps-setup/packages/traveler-app/src/screens/SearchScreen.tsx](file:///C:/dev/moja-buss/legacy-apps-setup/packages/traveler-app/src/screens/SearchScreen.tsx)
- **Role / Type**: `Component` (143 LOC)
- **Status**: 🔴 Critical Violation
- **Metrics**:
  - Hardcoded Hexes: `12` (`#fff`, `#F5F5F5`, `#1A3A2A`)
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`2`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `❌` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Urgent Remediation Required**:
  - Replace arbitrary hex values (#fff, #F5F5F5, #1A3A2A, #E8461E) with canonical tokens from `@repo/theme` or semantic Tailwind tokens.
  
  
  
  - Add error boundary or fallback toast/alert for failed states.

  - Ensure touch targets adhere to >= 44px (mobile) or standard density hierarchy (web).

---

#### [legacy-apps-setup/packages/traveler-app/src/services/api.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/traveler-app/src/services/api.ts)
- **Role / Type**: `Component` (37 LOC)
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

#### [legacy-apps-setup/packages/aggregator-web/.next/types/app/layout.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/aggregator-web/.next/types/app/layout.ts)
- **Role / Type**: `Component` (80 LOC)
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

#### [legacy-apps-setup/packages/aggregator-web/.next/types/app/page.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/aggregator-web/.next/types/app/page.ts)
- **Role / Type**: `Component` (80 LOC)
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

#### [legacy-apps-setup/packages/operator-web/.next/types/app/dashboard/page.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/operator-web/.next/types/app/dashboard/page.ts)
- **Role / Type**: `Component` (80 LOC)
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

#### [legacy-apps-setup/packages/operator-web/.next/types/app/layout.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/operator-web/.next/types/app/layout.ts)
- **Role / Type**: `Component` (80 LOC)
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

#### [legacy-apps-setup/packages/operator-web/.next/types/app/tracking/page.ts](file:///C:/dev/moja-buss/legacy-apps-setup/packages/operator-web/.next/types/app/tracking/page.ts)
- **Role / Type**: `Component` (80 LOC)
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


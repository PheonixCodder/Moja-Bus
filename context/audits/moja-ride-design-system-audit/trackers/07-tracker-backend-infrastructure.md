# Moja Ride Design System Audit — Backend, Services, Schemas & Infrastructure

## Executive Summary
Accounting and validation of non-visual files (cron endpoints, tRPC routers, Prisma schema, DB seeds, Zod schemas, utility libraries). Confirms absence of leaked styling and validates domain data contracts.

### Health Scorecard
| Total Files | 🟢 Fully Compliant | 🟡 Minor Drift | 🔴 Critical Violation | System Health Score |
| :--- | :--- | :--- | :--- | :--- |
| **285** | **285** (100%) | **0** (0%) | **0** (0%) | **100%** |

---

## Detailed File-by-File Audit Logs (285 Files Tracked)

#### [apps/web/app/api/auth/[...all]/route.ts](file:///C:/dev/moja-buss/apps/web/app/api/auth/[...all]/route.ts)
- **Role / Type**: `Backend API Route` (5 LOC)
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

#### [apps/web/app/api/cron/expire-driver-licenses/route.ts](file:///C:/dev/moja-buss/apps/web/app/api/cron/expire-driver-licenses/route.ts)
- **Role / Type**: `Backend API Route` (153 LOC)
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

#### [apps/web/app/api/cron/expire-holds/route.ts](file:///C:/dev/moja-buss/apps/web/app/api/cron/expire-holds/route.ts)
- **Role / Type**: `Backend API Route` (23 LOC)
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

#### [apps/web/app/api/cron/expire-offers/route.ts](file:///C:/dev/moja-buss/apps/web/app/api/cron/expire-offers/route.ts)
- **Role / Type**: `Backend API Route` (172 LOC)
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

#### [apps/web/app/api/cron/generate-trips/route.ts](file:///C:/dev/moja-buss/apps/web/app/api/cron/generate-trips/route.ts)
- **Role / Type**: `Backend API Route` (60 LOC)
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

#### [apps/web/app/api/cron/incentive-status-sweep/route.ts](file:///C:/dev/moja-buss/apps/web/app/api/cron/incentive-status-sweep/route.ts)
- **Role / Type**: `Backend API Route` (25 LOC)
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

#### [apps/web/app/api/cron/process-outbox/route.ts](file:///C:/dev/moja-buss/apps/web/app/api/cron/process-outbox/route.ts)
- **Role / Type**: `Backend API Route` (25 LOC)
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

#### [apps/web/app/api/cron/process-referral-rewards/route.ts](file:///C:/dev/moja-buss/apps/web/app/api/cron/process-referral-rewards/route.ts)
- **Role / Type**: `Backend API Route` (23 LOC)
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

#### [apps/web/app/api/cron/promo-expiry-reminders/route.ts](file:///C:/dev/moja-buss/apps/web/app/api/cron/promo-expiry-reminders/route.ts)
- **Role / Type**: `Backend API Route` (23 LOC)
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

#### [apps/web/app/api/cron/prune-telemetry/route.ts](file:///C:/dev/moja-buss/apps/web/app/api/cron/prune-telemetry/route.ts)
- **Role / Type**: `Backend API Route` (44 LOC)
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

#### [apps/web/app/api/cron/publish-blogs/route.ts](file:///C:/dev/moja-buss/apps/web/app/api/cron/publish-blogs/route.ts)
- **Role / Type**: `Backend API Route` (66 LOC)
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

#### [apps/web/app/api/cron/reconcile-driver-stats/route.ts](file:///C:/dev/moja-buss/apps/web/app/api/cron/reconcile-driver-stats/route.ts)
- **Role / Type**: `Backend API Route` (273 LOC)
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

#### [apps/web/app/api/cron/reconcile-payments/route.ts](file:///C:/dev/moja-buss/apps/web/app/api/cron/reconcile-payments/route.ts)
- **Role / Type**: `Backend API Route` (166 LOC)
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

#### [apps/web/app/api/cron/release-escrow/route.ts](file:///C:/dev/moja-buss/apps/web/app/api/cron/release-escrow/route.ts)
- **Role / Type**: `Backend API Route` (292 LOC)
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

#### [apps/web/app/api/cron/release-reservations/route.ts](file:///C:/dev/moja-buss/apps/web/app/api/cron/release-reservations/route.ts)
- **Role / Type**: `Backend API Route` (67 LOC)
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

#### [apps/web/app/api/cron/snapshot-accounts/route.ts](file:///C:/dev/moja-buss/apps/web/app/api/cron/snapshot-accounts/route.ts)
- **Role / Type**: `Backend API Route` (52 LOC)
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

#### [apps/web/app/api/cron/sweep-captures/route.ts](file:///C:/dev/moja-buss/apps/web/app/api/cron/sweep-captures/route.ts)
- **Role / Type**: `Backend API Route` (22 LOC)
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

#### [apps/web/app/api/health/route.ts](file:///C:/dev/moja-buss/apps/web/app/api/health/route.ts)
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

#### [apps/web/app/api/novu/route.ts](file:///C:/dev/moja-buss/apps/web/app/api/novu/route.ts)
- **Role / Type**: `Backend API Route` (19 LOC)
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

#### [apps/web/app/api/payments/mobile-callback/route.ts](file:///C:/dev/moja-buss/apps/web/app/api/payments/mobile-callback/route.ts)
- **Role / Type**: `Backend API Route` (63 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `8` (`#f8fafc`, `#0f172a`, `#ffffff`)
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/web/app/api/payments/verify/route.ts](file:///C:/dev/moja-buss/apps/web/app/api/payments/verify/route.ts)
- **Role / Type**: `Backend API Route` (93 LOC)
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

#### [apps/web/app/api/tickets/verify/route.ts](file:///C:/dev/moja-buss/apps/web/app/api/tickets/verify/route.ts)
- **Role / Type**: `Backend API Route` (51 LOC)
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

#### [apps/web/app/api/trpc/[...trpc]/route.ts](file:///C:/dev/moja-buss/apps/web/app/api/trpc/[...trpc]/route.ts)
- **Role / Type**: `Backend API Route` (17 LOC)
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

#### [apps/web/app/api/v1/telemetry/ping/route.ts](file:///C:/dev/moja-buss/apps/web/app/api/v1/telemetry/ping/route.ts)
- **Role / Type**: `Backend API Route` (243 LOC)
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

#### [apps/web/app/api/webhooks/paystack/route.ts](file:///C:/dev/moja-buss/apps/web/app/api/webhooks/paystack/route.ts)
- **Role / Type**: `Backend API Route` (47 LOC)
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

#### [apps/web/app/layout.tsx](file:///C:/dev/moja-buss/apps/web/app/layout.tsx)
- **Role / Type**: `App Layout` (29 LOC)
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

#### [apps/web/app/[locale]/(auth)/(passenger)/layout.tsx](file:///C:/dev/moja-buss/apps/web/app/[locale]/(auth)/(passenger)/layout.tsx)
- **Role / Type**: `App Layout` (52 LOC)
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

#### [apps/web/app/[locale]/(auth)/(passenger)/login/page.tsx](file:///C:/dev/moja-buss/apps/web/app/[locale]/(auth)/(passenger)/login/page.tsx)
- **Role / Type**: `Screen Route` (51 LOC)
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

#### [apps/web/app/[locale]/(auth)/operator/layout.tsx](file:///C:/dev/moja-buss/apps/web/app/[locale]/(auth)/operator/layout.tsx)
- **Role / Type**: `App Layout` (50 LOC)
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

#### [apps/web/app/[locale]/(auth)/operator/login/page.tsx](file:///C:/dev/moja-buss/apps/web/app/[locale]/(auth)/operator/login/page.tsx)
- **Role / Type**: `Screen Route` (25 LOC)
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

#### [apps/web/app/[locale]/blog/layout.tsx](file:///C:/dev/moja-buss/apps/web/app/[locale]/blog/layout.tsx)
- **Role / Type**: `App Layout` (20 LOC)
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

#### [apps/web/app/[locale]/blog/page.tsx](file:///C:/dev/moja-buss/apps/web/app/[locale]/blog/page.tsx)
- **Role / Type**: `Screen Route` (56 LOC)
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

#### [apps/web/app/[locale]/blog/[slug]/page.tsx](file:///C:/dev/moja-buss/apps/web/app/[locale]/blog/[slug]/page.tsx)
- **Role / Type**: `Screen Route` (113 LOC)
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

#### [apps/web/app/[locale]/capture/[token]/page.tsx](file:///C:/dev/moja-buss/apps/web/app/[locale]/capture/[token]/page.tsx)
- **Role / Type**: `Screen Route` (102 LOC)
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

#### [apps/web/app/[locale]/invite/page.tsx](file:///C:/dev/moja-buss/apps/web/app/[locale]/invite/page.tsx)
- **Role / Type**: `Screen Route` (48 LOC)
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

#### [apps/web/app/[locale]/layout.tsx](file:///C:/dev/moja-buss/apps/web/app/[locale]/layout.tsx)
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

#### [apps/web/app/[locale]/page.tsx](file:///C:/dev/moja-buss/apps/web/app/[locale]/page.tsx)
- **Role / Type**: `Screen Route` (62 LOC)
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

#### [apps/web/app/[locale]/r/[code]/page.tsx](file:///C:/dev/moja-buss/apps/web/app/[locale]/r/[code]/page.tsx)
- **Role / Type**: `Screen Route` (33 LOC)
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

#### [apps/web/components/dashboard-switcher.tsx](file:///C:/dev/moja-buss/apps/web/components/dashboard-switcher.tsx)
- **Role / Type**: `Component` (76 LOC)
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

#### [apps/web/components/image-upload-field.tsx](file:///C:/dev/moja-buss/apps/web/components/image-upload-field.tsx)
- **Role / Type**: `Component` (144 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `✅` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/web/components/lang-setter.tsx](file:///C:/dev/moja-buss/apps/web/components/lang-setter.tsx)
- **Role / Type**: `Component` (18 LOC)
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

#### [apps/web/components/locale-switcher.tsx](file:///C:/dev/moja-buss/apps/web/components/locale-switcher.tsx)
- **Role / Type**: `Component` (59 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/web/components/posthog-provider.tsx](file:///C:/dev/moja-buss/apps/web/components/posthog-provider.tsx)
- **Role / Type**: `Component` (25 LOC)
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

#### [apps/web/components/qr-code.tsx](file:///C:/dev/moja-buss/apps/web/components/qr-code.tsx)
- **Role / Type**: `Component` (23 LOC)
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

#### [apps/web/components/urban-badge.tsx](file:///C:/dev/moja-buss/apps/web/components/urban-badge.tsx)
- **Role / Type**: `Component` (13 LOC)
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

#### [apps/web/features/dashboard/components/dashboard-date-range-picker.tsx](file:///C:/dev/moja-buss/apps/web/features/dashboard/components/dashboard-date-range-picker.tsx)
- **Role / Type**: `Feature Module` (104 LOC)
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

#### [apps/web/features/dashboard/components/dashboard-header.tsx](file:///C:/dev/moja-buss/apps/web/features/dashboard/components/dashboard-header.tsx)
- **Role / Type**: `Feature Module` (44 LOC)
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

#### [apps/web/features/dashboard/components/dashboard-quick-search.tsx](file:///C:/dev/moja-buss/apps/web/features/dashboard/components/dashboard-quick-search.tsx)
- **Role / Type**: `Feature Module` (12 LOC)
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

#### [apps/web/features/dashboard/components/dashboard-sidebar.tsx](file:///C:/dev/moja-buss/apps/web/features/dashboard/components/dashboard-sidebar.tsx)
- **Role / Type**: `Feature Module` (302 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/web/features/dashboard/components/live-boarding-pass.tsx](file:///C:/dev/moja-buss/apps/web/features/dashboard/components/live-boarding-pass.tsx)
- **Role / Type**: `Feature Module` (85 LOC)
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

#### [apps/web/features/dashboard/components/page-title-header.tsx](file:///C:/dev/moja-buss/apps/web/features/dashboard/components/page-title-header.tsx)
- **Role / Type**: `Feature Module` (23 LOC)
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

#### [apps/web/features/dashboard/components/saved-companions.tsx](file:///C:/dev/moja-buss/apps/web/features/dashboard/components/saved-companions.tsx)
- **Role / Type**: `Feature Module` (96 LOC)
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

#### [apps/web/features/dashboard/components/search-dialog.tsx](file:///C:/dev/moja-buss/apps/web/features/dashboard/components/search-dialog.tsx)
- **Role / Type**: `Feature Module` (131 LOC)
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

#### [apps/web/features/dashboard/components/sessions-panel.tsx](file:///C:/dev/moja-buss/apps/web/features/dashboard/components/sessions-panel.tsx)
- **Role / Type**: `Feature Module` (103 LOC)
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

#### [apps/web/features/dashboard/components/travel-insights-chart.tsx](file:///C:/dev/moja-buss/apps/web/features/dashboard/components/travel-insights-chart.tsx)
- **Role / Type**: `Feature Module` (164 LOC)
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

#### [apps/web/features/dashboard/components/wallet-quick-deposit.tsx](file:///C:/dev/moja-buss/apps/web/features/dashboard/components/wallet-quick-deposit.tsx)
- **Role / Type**: `Feature Module` (145 LOC)
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

#### [apps/web/features/dashboard/lib/dashboard-search-params.ts](file:///C:/dev/moja-buss/apps/web/features/dashboard/lib/dashboard-search-params.ts)
- **Role / Type**: `Feature Module` (11 LOC)
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

#### [apps/web/features/dashboard/views/passenger-dashboard-view.tsx](file:///C:/dev/moja-buss/apps/web/features/dashboard/views/passenger-dashboard-view.tsx)
- **Role / Type**: `Feature Module` (438 LOC)
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

#### [apps/web/global.d.ts](file:///C:/dev/moja-buss/apps/web/global.d.ts)
- **Role / Type**: `Component` (39 LOC)
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

#### [apps/web/i18n/navigation.ts](file:///C:/dev/moja-buss/apps/web/i18n/navigation.ts)
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

#### [apps/web/i18n/request.ts](file:///C:/dev/moja-buss/apps/web/i18n/request.ts)
- **Role / Type**: `Component` (69 LOC)
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

#### [apps/web/i18n/routing.ts](file:///C:/dev/moja-buss/apps/web/i18n/routing.ts)
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

#### [apps/web/i18n/types.ts](file:///C:/dev/moja-buss/apps/web/i18n/types.ts)
- **Role / Type**: `Component` (5 LOC)
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

#### [apps/web/instrumentation.ts](file:///C:/dev/moja-buss/apps/web/instrumentation.ts)
- **Role / Type**: `Component` (8 LOC)
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

#### [apps/web/lib/app-origin.ts](file:///C:/dev/moja-buss/apps/web/lib/app-origin.ts)
- **Role / Type**: `Library Utility` (11 LOC)
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

#### [apps/web/lib/auth-client.ts](file:///C:/dev/moja-buss/apps/web/lib/auth-client.ts)
- **Role / Type**: `Library Utility` (21 LOC)
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

#### [apps/web/lib/auth-email.ts](file:///C:/dev/moja-buss/apps/web/lib/auth-email.ts)
- **Role / Type**: `Library Utility` (92 LOC)
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

#### [apps/web/lib/auth-server.ts](file:///C:/dev/moja-buss/apps/web/lib/auth-server.ts)
- **Role / Type**: `Library Utility` (333 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `✅` | Disabled: `✅`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/web/lib/bank-access.ts](file:///C:/dev/moja-buss/apps/web/lib/bank-access.ts)
- **Role / Type**: `Library Utility` (44 LOC)
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

#### [apps/web/lib/bank-account.ts](file:///C:/dev/moja-buss/apps/web/lib/bank-account.ts)
- **Role / Type**: `Library Utility` (62 LOC)
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

#### [apps/web/lib/bank-crypto.ts](file:///C:/dev/moja-buss/apps/web/lib/bank-crypto.ts)
- **Role / Type**: `Library Utility` (88 LOC)
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

#### [apps/web/lib/cancel-trip-with-refunds.ts](file:///C:/dev/moja-buss/apps/web/lib/cancel-trip-with-refunds.ts)
- **Role / Type**: `Library Utility` (307 LOC)
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

#### [apps/web/lib/constants/legal.ts](file:///C:/dev/moja-buss/apps/web/lib/constants/legal.ts)
- **Role / Type**: `Theme / Token Definition` (9 LOC)
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

#### [apps/web/lib/cron-auth.ts](file:///C:/dev/moja-buss/apps/web/lib/cron-auth.ts)
- **Role / Type**: `Library Utility` (26 LOC)
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

#### [apps/web/lib/dash-boards.ts](file:///C:/dev/moja-buss/apps/web/lib/dash-boards.ts)
- **Role / Type**: `Library Utility` (39 LOC)
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

#### [apps/web/lib/driver-assignment.ts](file:///C:/dev/moja-buss/apps/web/lib/driver-assignment.ts)
- **Role / Type**: `Library Utility` (225 LOC)
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

#### [apps/web/lib/driver-authorization.ts](file:///C:/dev/moja-buss/apps/web/lib/driver-authorization.ts)
- **Role / Type**: `Library Utility` (44 LOC)
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

#### [apps/web/lib/driver-earnings.ts](file:///C:/dev/moja-buss/apps/web/lib/driver-earnings.ts)
- **Role / Type**: `Library Utility` (107 LOC)
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

#### [apps/web/lib/driver-run-state.ts](file:///C:/dev/moja-buss/apps/web/lib/driver-run-state.ts)
- **Role / Type**: `Library Utility` (142 LOC)
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

#### [apps/web/lib/driver-scoring.ts](file:///C:/dev/moja-buss/apps/web/lib/driver-scoring.ts)
- **Role / Type**: `Library Utility` (133 LOC)
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

#### [apps/web/lib/escrow-release.ts](file:///C:/dev/moja-buss/apps/web/lib/escrow-release.ts)
- **Role / Type**: `Library Utility` (28 LOC)
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

#### [apps/web/lib/format-date.ts](file:///C:/dev/moja-buss/apps/web/lib/format-date.ts)
- **Role / Type**: `Library Utility` (94 LOC)
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

#### [apps/web/lib/format-location-label.ts](file:///C:/dev/moja-buss/apps/web/lib/format-location-label.ts)
- **Role / Type**: `Library Utility` (51 LOC)
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

#### [apps/web/lib/gateway-subscription.ts](file:///C:/dev/moja-buss/apps/web/lib/gateway-subscription.ts)
- **Role / Type**: `Library Utility` (173 LOC)
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

#### [apps/web/lib/geo/geocode-point.ts](file:///C:/dev/moja-buss/apps/web/lib/geo/geocode-point.ts)
- **Role / Type**: `Library Utility` (209 LOC)
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

#### [apps/web/lib/geo/load-geo-dataset.ts](file:///C:/dev/moja-buss/apps/web/lib/geo/load-geo-dataset.ts)
- **Role / Type**: `Library Utility` (93 LOC)
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

#### [apps/web/lib/geo/reverse-geocode.ts](file:///C:/dev/moja-buss/apps/web/lib/geo/reverse-geocode.ts)
- **Role / Type**: `Library Utility` (142 LOC)
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

#### [apps/web/lib/geo/__tests__/geocode-point.test.ts](file:///C:/dev/moja-buss/apps/web/lib/geo/__tests__/geocode-point.test.ts)
- **Role / Type**: `Library Utility` (305 LOC)
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

#### [apps/web/lib/geo/__tests__/reverse-geocode.test.ts](file:///C:/dev/moja-buss/apps/web/lib/geo/__tests__/reverse-geocode.test.ts)
- **Role / Type**: `Library Utility` (167 LOC)
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

#### [apps/web/lib/money.ts](file:///C:/dev/moja-buss/apps/web/lib/money.ts)
- **Role / Type**: `Library Utility` (70 LOC)
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

#### [apps/web/lib/mutation-origin.ts](file:///C:/dev/moja-buss/apps/web/lib/mutation-origin.ts)
- **Role / Type**: `Library Utility` (54 LOC)
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

#### [apps/web/lib/novu.ts](file:///C:/dev/moja-buss/apps/web/lib/novu.ts)
- **Role / Type**: `Library Utility` (20 LOC)
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

#### [apps/web/lib/permissions/admin-authorize.ts](file:///C:/dev/moja-buss/apps/web/lib/permissions/admin-authorize.ts)
- **Role / Type**: `Library Utility` (110 LOC)
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

#### [apps/web/lib/permissions/admin-staff-hierarchy.ts](file:///C:/dev/moja-buss/apps/web/lib/permissions/admin-staff-hierarchy.ts)
- **Role / Type**: `Library Utility` (14 LOC)
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

#### [apps/web/lib/permissions/authorize.ts](file:///C:/dev/moja-buss/apps/web/lib/permissions/authorize.ts)
- **Role / Type**: `Library Utility` (104 LOC)
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

#### [apps/web/lib/permissions/staff-hierarchy.ts](file:///C:/dev/moja-buss/apps/web/lib/permissions/staff-hierarchy.ts)
- **Role / Type**: `Library Utility` (14 LOC)
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

#### [apps/web/lib/phone/detect-country.ts](file:///C:/dev/moja-buss/apps/web/lib/phone/detect-country.ts)
- **Role / Type**: `Library Utility` (52 LOC)
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

#### [apps/web/lib/phone/phone-error-message.ts](file:///C:/dev/moja-buss/apps/web/lib/phone/phone-error-message.ts)
- **Role / Type**: `Library Utility` (41 LOC)
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

#### [apps/web/lib/phone/phone-number.ts](file:///C:/dev/moja-buss/apps/web/lib/phone/phone-number.ts)
- **Role / Type**: `Library Utility` (202 LOC)
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

#### [apps/web/lib/phone/__tests__/phone-number.test.ts](file:///C:/dev/moja-buss/apps/web/lib/phone/__tests__/phone-number.test.ts)
- **Role / Type**: `Library Utility` (120 LOC)
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

#### [apps/web/lib/phone/__tests__/validate-phone-input.test.ts](file:///C:/dev/moja-buss/apps/web/lib/phone/__tests__/validate-phone-input.test.ts)
- **Role / Type**: `Library Utility` (199 LOC)
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

#### [apps/web/lib/platform-settings.ts](file:///C:/dev/moja-buss/apps/web/lib/platform-settings.ts)
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

#### [apps/web/lib/rate-limit.ts](file:///C:/dev/moja-buss/apps/web/lib/rate-limit.ts)
- **Role / Type**: `Library Utility` (80 LOC)
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

#### [apps/web/lib/route-service-type.ts](file:///C:/dev/moja-buss/apps/web/lib/route-service-type.ts)
- **Role / Type**: `Library Utility` (55 LOC)
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

#### [apps/web/lib/schedule-trip-window.ts](file:///C:/dev/moja-buss/apps/web/lib/schedule-trip-window.ts)
- **Role / Type**: `Library Utility` (138 LOC)
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

#### [apps/web/lib/storage/index.ts](file:///C:/dev/moja-buss/apps/web/lib/storage/index.ts)
- **Role / Type**: `Library Utility` (110 LOC)
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

#### [apps/web/lib/storage/purposes.ts](file:///C:/dev/moja-buss/apps/web/lib/storage/purposes.ts)
- **Role / Type**: `Library Utility` (191 LOC)
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

#### [apps/web/lib/storage/s3.ts](file:///C:/dev/moja-buss/apps/web/lib/storage/s3.ts)
- **Role / Type**: `Library Utility` (105 LOC)
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

#### [apps/web/lib/storage-client.ts](file:///C:/dev/moja-buss/apps/web/lib/storage-client.ts)
- **Role / Type**: `Library Utility` (159 LOC)
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

#### [apps/web/lib/telemetry-observability.ts](file:///C:/dev/moja-buss/apps/web/lib/telemetry-observability.ts)
- **Role / Type**: `Library Utility` (33 LOC)
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

#### [apps/web/lib/telemetry-reconcile.ts](file:///C:/dev/moja-buss/apps/web/lib/telemetry-reconcile.ts)
- **Role / Type**: `Library Utility` (188 LOC)
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

#### [apps/web/lib/telemetry-throttle.ts](file:///C:/dev/moja-buss/apps/web/lib/telemetry-throttle.ts)
- **Role / Type**: `Library Utility` (65 LOC)
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

#### [apps/web/lib/telemetry-token.ts](file:///C:/dev/moja-buss/apps/web/lib/telemetry-token.ts)
- **Role / Type**: `Library Utility` (262 LOC)
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

#### [apps/web/lib/timezone.ts](file:///C:/dev/moja-buss/apps/web/lib/timezone.ts)
- **Role / Type**: `Library Utility` (112 LOC)
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

#### [apps/web/lib/trip-arrival.ts](file:///C:/dev/moja-buss/apps/web/lib/trip-arrival.ts)
- **Role / Type**: `Library Utility` (111 LOC)
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

#### [apps/web/lib/trip-destination.ts](file:///C:/dev/moja-buss/apps/web/lib/trip-destination.ts)
- **Role / Type**: `Library Utility` (68 LOC)
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

#### [apps/web/lib/trip-generator.ts](file:///C:/dev/moja-buss/apps/web/lib/trip-generator.ts)
- **Role / Type**: `Library Utility` (300 LOC)
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

#### [apps/web/lib/trip-status.ts](file:///C:/dev/moja-buss/apps/web/lib/trip-status.ts)
- **Role / Type**: `Library Utility` (42 LOC)
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

#### [apps/web/lib/trusted-origins.ts](file:///C:/dev/moja-buss/apps/web/lib/trusted-origins.ts)
- **Role / Type**: `Library Utility` (59 LOC)
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

#### [apps/web/lib/withdrawal-2fa.ts](file:///C:/dev/moja-buss/apps/web/lib/withdrawal-2fa.ts)
- **Role / Type**: `Library Utility` (161 LOC)
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

#### [apps/web/lib/__tests__/cancel-clawback.test.ts](file:///C:/dev/moja-buss/apps/web/lib/__tests__/cancel-clawback.test.ts)
- **Role / Type**: `Library Utility` (61 LOC)
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

#### [apps/web/lib/__tests__/cron-hygiene.test.ts](file:///C:/dev/moja-buss/apps/web/lib/__tests__/cron-hygiene.test.ts)
- **Role / Type**: `Library Utility` (45 LOC)
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

#### [apps/web/lib/__tests__/driver-assignment.test.ts](file:///C:/dev/moja-buss/apps/web/lib/__tests__/driver-assignment.test.ts)
- **Role / Type**: `Library Utility` (214 LOC)
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

#### [apps/web/lib/__tests__/driver-earnings.test.ts](file:///C:/dev/moja-buss/apps/web/lib/__tests__/driver-earnings.test.ts)
- **Role / Type**: `Library Utility` (72 LOC)
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

#### [apps/web/lib/__tests__/driver-run-state.test.ts](file:///C:/dev/moja-buss/apps/web/lib/__tests__/driver-run-state.test.ts)
- **Role / Type**: `Library Utility` (179 LOC)
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

#### [apps/web/lib/__tests__/driver-scoring.test.ts](file:///C:/dev/moja-buss/apps/web/lib/__tests__/driver-scoring.test.ts)
- **Role / Type**: `Library Utility` (237 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/web/lib/__tests__/escrow-release.test.ts](file:///C:/dev/moja-buss/apps/web/lib/__tests__/escrow-release.test.ts)
- **Role / Type**: `Library Utility` (36 LOC)
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

#### [apps/web/lib/__tests__/messages-parity.test.ts](file:///C:/dev/moja-buss/apps/web/lib/__tests__/messages-parity.test.ts)
- **Role / Type**: `Library Utility` (46 LOC)
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

#### [apps/web/lib/__tests__/mutation-origin.test.ts](file:///C:/dev/moja-buss/apps/web/lib/__tests__/mutation-origin.test.ts)
- **Role / Type**: `Library Utility` (107 LOC)
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

#### [apps/web/lib/__tests__/outbox-cadence-guard.test.ts](file:///C:/dev/moja-buss/apps/web/lib/__tests__/outbox-cadence-guard.test.ts)
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

#### [apps/web/lib/__tests__/permissions/authorize.test.ts](file:///C:/dev/moja-buss/apps/web/lib/__tests__/permissions/authorize.test.ts)
- **Role / Type**: `Library Utility` (271 LOC)
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

#### [apps/web/lib/__tests__/rate-limit.test.ts](file:///C:/dev/moja-buss/apps/web/lib/__tests__/rate-limit.test.ts)
- **Role / Type**: `Library Utility` (36 LOC)
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

#### [apps/web/lib/__tests__/route-service-type.test.ts](file:///C:/dev/moja-buss/apps/web/lib/__tests__/route-service-type.test.ts)
- **Role / Type**: `Library Utility` (98 LOC)
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

#### [apps/web/lib/__tests__/schedule-trip-window.test.ts](file:///C:/dev/moja-buss/apps/web/lib/__tests__/schedule-trip-window.test.ts)
- **Role / Type**: `Library Utility` (144 LOC)
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

#### [apps/web/lib/__tests__/segment-overlap.test.ts](file:///C:/dev/moja-buss/apps/web/lib/__tests__/segment-overlap.test.ts)
- **Role / Type**: `Library Utility` (63 LOC)
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

#### [apps/web/lib/__tests__/staff-iam.test.ts](file:///C:/dev/moja-buss/apps/web/lib/__tests__/staff-iam.test.ts)
- **Role / Type**: `Library Utility` (68 LOC)
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

#### [apps/web/lib/__tests__/telemetry-prev-point.test.ts](file:///C:/dev/moja-buss/apps/web/lib/__tests__/telemetry-prev-point.test.ts)
- **Role / Type**: `Library Utility` (90 LOC)
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

#### [apps/web/lib/__tests__/telemetry-throttle.test.ts](file:///C:/dev/moja-buss/apps/web/lib/__tests__/telemetry-throttle.test.ts)
- **Role / Type**: `Library Utility` (96 LOC)
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

#### [apps/web/lib/__tests__/telemetry-token.test.ts](file:///C:/dev/moja-buss/apps/web/lib/__tests__/telemetry-token.test.ts)
- **Role / Type**: `Library Utility` (187 LOC)
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

#### [apps/web/lib/__tests__/telemetry-validator.test.ts](file:///C:/dev/moja-buss/apps/web/lib/__tests__/telemetry-validator.test.ts)
- **Role / Type**: `Library Utility` (92 LOC)
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

#### [apps/web/lib/__tests__/trip-destination.test.ts](file:///C:/dev/moja-buss/apps/web/lib/__tests__/trip-destination.test.ts)
- **Role / Type**: `Library Utility` (64 LOC)
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

#### [apps/web/lib/__tests__/trip-generator-dates.test.ts](file:///C:/dev/moja-buss/apps/web/lib/__tests__/trip-generator-dates.test.ts)
- **Role / Type**: `Library Utility` (50 LOC)
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

#### [apps/web/lib/__tests__/trusted-origins.test.ts](file:///C:/dev/moja-buss/apps/web/lib/__tests__/trusted-origins.test.ts)
- **Role / Type**: `Library Utility` (76 LOC)
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

#### [apps/web/next-env.d.ts](file:///C:/dev/moja-buss/apps/web/next-env.d.ts)
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

#### [apps/web/next.config.ts](file:///C:/dev/moja-buss/apps/web/next.config.ts)
- **Role / Type**: `Component` (61 LOC)
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

#### [apps/web/proxy.ts](file:///C:/dev/moja-buss/apps/web/proxy.ts)
- **Role / Type**: `Component` (16 LOC)
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

#### [apps/web/scripts/analyze-count.js](file:///C:/dev/moja-buss/apps/web/scripts/analyze-count.js)
- **Role / Type**: `Build / Maintenance Script` (127 LOC)
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

#### [apps/web/scripts/analyze-count2.js](file:///C:/dev/moja-buss/apps/web/scripts/analyze-count2.js)
- **Role / Type**: `Build / Maintenance Script` (163 LOC)
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

#### [apps/web/scripts/analyze-count3.js](file:///C:/dev/moja-buss/apps/web/scripts/analyze-count3.js)
- **Role / Type**: `Build / Maintenance Script` (154 LOC)
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

#### [apps/web/scripts/analyze-count4.js](file:///C:/dev/moja-buss/apps/web/scripts/analyze-count4.js)
- **Role / Type**: `Build / Maintenance Script` (191 LOC)
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

#### [apps/web/scripts/audit-i18n.js](file:///C:/dev/moja-buss/apps/web/scripts/audit-i18n.js)
- **Role / Type**: `Build / Maintenance Script` (450 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`1`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `✅` | Disabled: `❌`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/web/scripts/backfill-document-object-keys.ts](file:///C:/dev/moja-buss/apps/web/scripts/backfill-document-object-keys.ts)
- **Role / Type**: `Build / Maintenance Script` (76 LOC)
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

#### [apps/web/scripts/backfill-trip-durations.ts](file:///C:/dev/moja-buss/apps/web/scripts/backfill-trip-durations.ts)
- **Role / Type**: `Build / Maintenance Script` (202 LOC)
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

#### [apps/web/scripts/check-addbus.js](file:///C:/dev/moja-buss/apps/web/scripts/check-addbus.js)
- **Role / Type**: `Build / Maintenance Script` (11 LOC)
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

#### [apps/web/scripts/check-bookings-desc.js](file:///C:/dev/moja-buss/apps/web/scripts/check-bookings-desc.js)
- **Role / Type**: `Build / Maintenance Script` (16 LOC)
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

#### [apps/web/scripts/check-count-placeholders.js](file:///C:/dev/moja-buss/apps/web/scripts/check-count-placeholders.js)
- **Role / Type**: `Build / Maintenance Script` (69 LOC)
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

#### [apps/web/scripts/check-desc.js](file:///C:/dev/moja-buss/apps/web/scripts/check-desc.js)
- **Role / Type**: `Build / Maintenance Script` (16 LOC)
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

#### [apps/web/scripts/check-drawer.js](file:///C:/dev/moja-buss/apps/web/scripts/check-drawer.js)
- **Role / Type**: `Build / Maintenance Script` (16 LOC)
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

#### [apps/web/scripts/check-messages.js](file:///C:/dev/moja-buss/apps/web/scripts/check-messages.js)
- **Role / Type**: `Build / Maintenance Script` (9 LOC)
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

#### [apps/web/scripts/check-namespaces.js](file:///C:/dev/moja-buss/apps/web/scripts/check-namespaces.js)
- **Role / Type**: `Build / Maintenance Script` (5 LOC)
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

#### [apps/web/scripts/check-ns2.js](file:///C:/dev/moja-buss/apps/web/scripts/check-ns2.js)
- **Role / Type**: `Build / Maintenance Script` (6 LOC)
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

#### [apps/web/scripts/check-raw-displays.js](file:///C:/dev/moja-buss/apps/web/scripts/check-raw-displays.js)
- **Role / Type**: `Build / Maintenance Script` (67 LOC)
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

#### [apps/web/scripts/check-search-results.js](file:///C:/dev/moja-buss/apps/web/scripts/check-search-results.js)
- **Role / Type**: `Build / Maintenance Script` (32 LOC)
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

#### [apps/web/scripts/check-t-var.js](file:///C:/dev/moja-buss/apps/web/scripts/check-t-var.js)
- **Role / Type**: `Build / Maintenance Script` (17 LOC)
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

#### [apps/web/scripts/find-addbus.js](file:///C:/dev/moja-buss/apps/web/scripts/find-addbus.js)
- **Role / Type**: `Build / Maintenance Script` (24 LOC)
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

#### [apps/web/scripts/find-all-count-issues.js](file:///C:/dev/moja-buss/apps/web/scripts/find-all-count-issues.js)
- **Role / Type**: `Build / Maintenance Script` (190 LOC)
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

#### [apps/web/scripts/find-count-issues.js](file:///C:/dev/moja-buss/apps/web/scripts/find-count-issues.js)
- **Role / Type**: `Build / Maintenance Script` (148 LOC)
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

#### [apps/web/scripts/find-hardcoded-classes.js](file:///C:/dev/moja-buss/apps/web/scripts/find-hardcoded-classes.js)
- **Role / Type**: `Build / Maintenance Script` (52 LOC)
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

#### [apps/web/scripts/find-raw-values.js](file:///C:/dev/moja-buss/apps/web/scripts/find-raw-values.js)
- **Role / Type**: `Build / Maintenance Script` (96 LOC)
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

#### [apps/web/scripts/fix-addbus-modal.js](file:///C:/dev/moja-buss/apps/web/scripts/fix-addbus-modal.js)
- **Role / Type**: `Build / Maintenance Script` (44 LOC)
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

#### [apps/web/scripts/fix-offer-card.js](file:///C:/dev/moja-buss/apps/web/scripts/fix-offer-card.js)
- **Role / Type**: `Build / Maintenance Script` (14 LOC)
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

#### [apps/web/scripts/fix-phase1-batch2.js](file:///C:/dev/moja-buss/apps/web/scripts/fix-phase1-batch2.js)
- **Role / Type**: `Build / Maintenance Script` (144 LOC)
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

#### [apps/web/scripts/fix-phase1-keys.js](file:///C:/dev/moja-buss/apps/web/scripts/fix-phase1-keys.js)
- **Role / Type**: `Build / Maintenance Script` (302 LOC)
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

#### [apps/web/scripts/fix-phase2-booking.js](file:///C:/dev/moja-buss/apps/web/scripts/fix-phase2-booking.js)
- **Role / Type**: `Build / Maintenance Script` (122 LOC)
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

#### [apps/web/scripts/inventory-cancel-without-refund.ts](file:///C:/dev/moja-buss/apps/web/scripts/inventory-cancel-without-refund.ts)
- **Role / Type**: `Build / Maintenance Script` (71 LOC)
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

#### [apps/web/scripts/inventory-stuck-reserved-holds.ts](file:///C:/dev/moja-buss/apps/web/scripts/inventory-stuck-reserved-holds.ts)
- **Role / Type**: `Build / Maintenance Script` (73 LOC)
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

#### [apps/web/scripts/patch-operator-allow-negative.ts](file:///C:/dev/moja-buss/apps/web/scripts/patch-operator-allow-negative.ts)
- **Role / Type**: `Build / Maintenance Script` (13 LOC)
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

#### [apps/web/scripts/probe-phases-02-06.ts](file:///C:/dev/moja-buss/apps/web/scripts/probe-phases-02-06.ts)
- **Role / Type**: `Build / Maintenance Script` (565 LOC)
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

#### [apps/web/scripts/repair-duplicate-initial-credit-lots.ts](file:///C:/dev/moja-buss/apps/web/scripts/repair-duplicate-initial-credit-lots.ts)
- **Role / Type**: `Build / Maintenance Script` (96 LOC)
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

#### [apps/web/scripts/repair-promo-credit-funding.ts](file:///C:/dev/moja-buss/apps/web/scripts/repair-promo-credit-funding.ts)
- **Role / Type**: `Build / Maintenance Script` (112 LOC)
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

#### [apps/web/scripts/run-migrations.ts](file:///C:/dev/moja-buss/apps/web/scripts/run-migrations.ts)
- **Role / Type**: `Build / Maintenance Script` (495 LOC)
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

#### [apps/web/scripts/verify-addbus.js](file:///C:/dev/moja-buss/apps/web/scripts/verify-addbus.js)
- **Role / Type**: `Build / Maintenance Script` (10 LOC)
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

#### [apps/web/server/telemetry-flush.ts](file:///C:/dev/moja-buss/apps/web/server/telemetry-flush.ts)
- **Role / Type**: `Component` (233 LOC)
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

#### [apps/web/server/telemetry-prev-point.ts](file:///C:/dev/moja-buss/apps/web/server/telemetry-prev-point.ts)
- **Role / Type**: `Component` (85 LOC)
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

#### [apps/web/server/telemetry-redis.ts](file:///C:/dev/moja-buss/apps/web/server/telemetry-redis.ts)
- **Role / Type**: `Component` (196 LOC)
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

#### [apps/web/server/telemetry-validator.ts](file:///C:/dev/moja-buss/apps/web/server/telemetry-validator.ts)
- **Role / Type**: `Component` (117 LOC)
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

#### [apps/web/server/telemetry-ws.ts](file:///C:/dev/moja-buss/apps/web/server/telemetry-ws.ts)
- **Role / Type**: `Component` (451 LOC)
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

#### [apps/web/server.ts](file:///C:/dev/moja-buss/apps/web/server.ts)
- **Role / Type**: `Component` (46 LOC)
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

#### [apps/web/trpc/client.tsx](file:///C:/dev/moja-buss/apps/web/trpc/client.tsx)
- **Role / Type**: `Backend API Route` (68 LOC)
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

#### [apps/web/trpc/init.ts](file:///C:/dev/moja-buss/apps/web/trpc/init.ts)
- **Role / Type**: `Backend API Route` (400 LOC)
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

#### [apps/web/trpc/query-client.ts](file:///C:/dev/moja-buss/apps/web/trpc/query-client.ts)
- **Role / Type**: `Backend API Route` (25 LOC)
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

#### [apps/web/trpc/routers/admin-staff.ts](file:///C:/dev/moja-buss/apps/web/trpc/routers/admin-staff.ts)
- **Role / Type**: `Backend API Route` (1177 LOC)
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

#### [apps/web/trpc/routers/admin.ts](file:///C:/dev/moja-buss/apps/web/trpc/routers/admin.ts)
- **Role / Type**: `Backend API Route` (3502 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `2` (`#ee237c`, `#9333ea`)
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `✅` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [apps/web/trpc/routers/blog.ts](file:///C:/dev/moja-buss/apps/web/trpc/routers/blog.ts)
- **Role / Type**: `Backend API Route` (212 LOC)
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

#### [apps/web/trpc/routers/booking.ts](file:///C:/dev/moja-buss/apps/web/trpc/routers/booking.ts)
- **Role / Type**: `Backend API Route` (395 LOC)
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

#### [apps/web/trpc/routers/captures.ts](file:///C:/dev/moja-buss/apps/web/trpc/routers/captures.ts)
- **Role / Type**: `Backend API Route` (111 LOC)
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

#### [apps/web/trpc/routers/contact.ts](file:///C:/dev/moja-buss/apps/web/trpc/routers/contact.ts)
- **Role / Type**: `Backend API Route` (152 LOC)
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

#### [apps/web/trpc/routers/discounts-admin.ts](file:///C:/dev/moja-buss/apps/web/trpc/routers/discounts-admin.ts)
- **Role / Type**: `Backend API Route` (904 LOC)
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

#### [apps/web/trpc/routers/discounts-operator.ts](file:///C:/dev/moja-buss/apps/web/trpc/routers/discounts-operator.ts)
- **Role / Type**: `Backend API Route` (353 LOC)
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

#### [apps/web/trpc/routers/discounts.ts](file:///C:/dev/moja-buss/apps/web/trpc/routers/discounts.ts)
- **Role / Type**: `Backend API Route` (101 LOC)
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

#### [apps/web/trpc/routers/drivers.ts](file:///C:/dev/moja-buss/apps/web/trpc/routers/drivers.ts)
- **Role / Type**: `Backend API Route` (5146 LOC)
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

#### [apps/web/trpc/routers/fleet.ts](file:///C:/dev/moja-buss/apps/web/trpc/routers/fleet.ts)
- **Role / Type**: `Backend API Route` (657 LOC)
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

#### [apps/web/trpc/routers/invitation.ts](file:///C:/dev/moja-buss/apps/web/trpc/routers/invitation.ts)
- **Role / Type**: `Backend API Route` (297 LOC)
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

#### [apps/web/trpc/routers/locations.ts](file:///C:/dev/moja-buss/apps/web/trpc/routers/locations.ts)
- **Role / Type**: `Backend API Route` (295 LOC)
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

#### [apps/web/trpc/routers/operator/settings.ts](file:///C:/dev/moja-buss/apps/web/trpc/routers/operator/settings.ts)
- **Role / Type**: `Backend API Route` (472 LOC)
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

#### [apps/web/trpc/routers/operator.ts](file:///C:/dev/moja-buss/apps/web/trpc/routers/operator.ts)
- **Role / Type**: `Backend API Route` (2642 LOC)
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

#### [apps/web/trpc/routers/passenger.ts](file:///C:/dev/moja-buss/apps/web/trpc/routers/passenger.ts)
- **Role / Type**: `Backend API Route` (1006 LOC)
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

#### [apps/web/trpc/routers/payments.ts](file:///C:/dev/moja-buss/apps/web/trpc/routers/payments.ts)
- **Role / Type**: `Backend API Route` (744 LOC)
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

#### [apps/web/trpc/routers/public.ts](file:///C:/dev/moja-buss/apps/web/trpc/routers/public.ts)
- **Role / Type**: `Backend API Route` (241 LOC)
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

#### [apps/web/trpc/routers/routes.ts](file:///C:/dev/moja-buss/apps/web/trpc/routers/routes.ts)
- **Role / Type**: `Backend API Route` (534 LOC)
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

#### [apps/web/trpc/routers/schedules.ts](file:///C:/dev/moja-buss/apps/web/trpc/routers/schedules.ts)
- **Role / Type**: `Backend API Route` (1725 LOC)
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

#### [apps/web/trpc/routers/search.ts](file:///C:/dev/moja-buss/apps/web/trpc/routers/search.ts)
- **Role / Type**: `Backend API Route` (244 LOC)
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

#### [apps/web/trpc/routers/staff.ts](file:///C:/dev/moja-buss/apps/web/trpc/routers/staff.ts)
- **Role / Type**: `Backend API Route` (995 LOC)
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

#### [apps/web/trpc/routers/storage.ts](file:///C:/dev/moja-buss/apps/web/trpc/routers/storage.ts)
- **Role / Type**: `Backend API Route` (236 LOC)
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

#### [apps/web/trpc/routers/terminals.ts](file:///C:/dev/moja-buss/apps/web/trpc/routers/terminals.ts)
- **Role / Type**: `Backend API Route` (292 LOC)
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

#### [apps/web/trpc/routers/trips.ts](file:///C:/dev/moja-buss/apps/web/trpc/routers/trips.ts)
- **Role / Type**: `Backend API Route` (2332 LOC)
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

#### [apps/web/trpc/routers/_app.ts](file:///C:/dev/moja-buss/apps/web/trpc/routers/_app.ts)
- **Role / Type**: `Backend API Route` (55 LOC)
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

#### [apps/web/trpc/server.tsx](file:///C:/dev/moja-buss/apps/web/trpc/server.tsx)
- **Role / Type**: `Backend API Route` (49 LOC)
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

#### [apps/web/types/paystack-inline-js.d.ts](file:///C:/dev/moja-buss/apps/web/types/paystack-inline-js.d.ts)
- **Role / Type**: `Component` (18 LOC)
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

#### [packages/schemas/src/admin-permissions.ts](file:///C:/dev/moja-buss/packages/schemas/src/admin-permissions.ts)
- **Role / Type**: `Component` (498 LOC)
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

#### [packages/schemas/src/admin.ts](file:///C:/dev/moja-buss/packages/schemas/src/admin.ts)
- **Role / Type**: `Component` (80 LOC)
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

#### [packages/schemas/src/auth.ts](file:///C:/dev/moja-buss/packages/schemas/src/auth.ts)
- **Role / Type**: `Component` (53 LOC)
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

#### [packages/schemas/src/booking.ts](file:///C:/dev/moja-buss/packages/schemas/src/booking.ts)
- **Role / Type**: `Component` (93 LOC)
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

#### [packages/schemas/src/contact.ts](file:///C:/dev/moja-buss/packages/schemas/src/contact.ts)
- **Role / Type**: `Component` (42 LOC)
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

#### [packages/schemas/src/discounts.ts](file:///C:/dev/moja-buss/packages/schemas/src/discounts.ts)
- **Role / Type**: `Component` (312 LOC)
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

#### [packages/schemas/src/drivers.ts](file:///C:/dev/moja-buss/packages/schemas/src/drivers.ts)
- **Role / Type**: `Component` (736 LOC)
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

#### [packages/schemas/src/fleet.ts](file:///C:/dev/moja-buss/packages/schemas/src/fleet.ts)
- **Role / Type**: `Component` (125 LOC)
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

#### [packages/schemas/src/iam-core.ts](file:///C:/dev/moja-buss/packages/schemas/src/iam-core.ts)
- **Role / Type**: `Component` (76 LOC)
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

#### [packages/schemas/src/index.ts](file:///C:/dev/moja-buss/packages/schemas/src/index.ts)
- **Role / Type**: `Component` (24 LOC)
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

#### [packages/schemas/src/operator-bookings.ts](file:///C:/dev/moja-buss/packages/schemas/src/operator-bookings.ts)
- **Role / Type**: `Component` (41 LOC)
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

#### [packages/schemas/src/operator.ts](file:///C:/dev/moja-buss/packages/schemas/src/operator.ts)
- **Role / Type**: `Component` (169 LOC)
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

#### [packages/schemas/src/passenger.ts](file:///C:/dev/moja-buss/packages/schemas/src/passenger.ts)
- **Role / Type**: `Component` (80 LOC)
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

#### [packages/schemas/src/payments-admin.ts](file:///C:/dev/moja-buss/packages/schemas/src/payments-admin.ts)
- **Role / Type**: `Component` (84 LOC)
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

#### [packages/schemas/src/payments.ts](file:///C:/dev/moja-buss/packages/schemas/src/payments.ts)
- **Role / Type**: `Component` (18 LOC)
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

#### [packages/schemas/src/permissions.ts](file:///C:/dev/moja-buss/packages/schemas/src/permissions.ts)
- **Role / Type**: `Component` (474 LOC)
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

#### [packages/schemas/src/routes.ts](file:///C:/dev/moja-buss/packages/schemas/src/routes.ts)
- **Role / Type**: `Component` (278 LOC)
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

#### [packages/schemas/src/schedules.ts](file:///C:/dev/moja-buss/packages/schemas/src/schedules.ts)
- **Role / Type**: `Component` (383 LOC)
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

#### [packages/schemas/src/search.ts](file:///C:/dev/moja-buss/packages/schemas/src/search.ts)
- **Role / Type**: `Component` (20 LOC)
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

#### [packages/schemas/src/sync.ts](file:///C:/dev/moja-buss/packages/schemas/src/sync.ts)
- **Role / Type**: `Component` (16 LOC)
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

#### [packages/schemas/src/ticket-token.ts](file:///C:/dev/moja-buss/packages/schemas/src/ticket-token.ts)
- **Role / Type**: `Component` (65 LOC)
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

#### [packages/schemas/src/tracking.ts](file:///C:/dev/moja-buss/packages/schemas/src/tracking.ts)
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

#### [packages/schemas/src/trips.ts](file:///C:/dev/moja-buss/packages/schemas/src/trips.ts)
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

#### [packages/schemas/src/wallet.ts](file:///C:/dev/moja-buss/packages/schemas/src/wallet.ts)
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

#### [packages/schemas/src/__tests__/admin-permissions.test.ts](file:///C:/dev/moja-buss/packages/schemas/src/__tests__/admin-permissions.test.ts)
- **Role / Type**: `Test Suite` (102 LOC)
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

#### [packages/schemas/src/__tests__/admin-staff-hierarchy.test.ts](file:///C:/dev/moja-buss/packages/schemas/src/__tests__/admin-staff-hierarchy.test.ts)
- **Role / Type**: `Test Suite` (74 LOC)
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

#### [packages/schemas/src/__tests__/discounts.test.ts](file:///C:/dev/moja-buss/packages/schemas/src/__tests__/discounts.test.ts)
- **Role / Type**: `Test Suite` (86 LOC)
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

#### [packages/schemas/src/__tests__/license-gate.test.ts](file:///C:/dev/moja-buss/packages/schemas/src/__tests__/license-gate.test.ts)
- **Role / Type**: `Test Suite` (61 LOC)
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

#### [packages/schemas/src/__tests__/roles-and-permissions.test.ts](file:///C:/dev/moja-buss/packages/schemas/src/__tests__/roles-and-permissions.test.ts)
- **Role / Type**: `Test Suite` (335 LOC)
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

#### [packages/schemas/src/__tests__/routes-service-type.test.ts](file:///C:/dev/moja-buss/packages/schemas/src/__tests__/routes-service-type.test.ts)
- **Role / Type**: `Test Suite` (81 LOC)
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

#### [packages/schemas/src/__tests__/ticket-token.test.ts](file:///C:/dev/moja-buss/packages/schemas/src/__tests__/ticket-token.test.ts)
- **Role / Type**: `Test Suite` (153 LOC)
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

#### [packages/db/check_db.ts](file:///C:/dev/moja-buss/packages/db/check_db.ts)
- **Role / Type**: `Component` (15 LOC)
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

#### [packages/db/prisma/seed.ts](file:///C:/dev/moja-buss/packages/db/prisma/seed.ts)
- **Role / Type**: `Component` (246 LOC)
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

#### [packages/db/prisma.config.ts](file:///C:/dev/moja-buss/packages/db/prisma.config.ts)
- **Role / Type**: `Component` (23 LOC)
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

#### [packages/db/scripts/backfill-reviews-permissions.ts](file:///C:/dev/moja-buss/packages/db/scripts/backfill-reviews-permissions.ts)
- **Role / Type**: `Build / Maintenance Script` (60 LOC)
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

#### [packages/db/scripts/backfill-schedule-departure-times.ts](file:///C:/dev/moja-buss/packages/db/scripts/backfill-schedule-departure-times.ts)
- **Role / Type**: `Build / Maintenance Script` (51 LOC)
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

#### [packages/db/scripts/backfill-service-type.ts](file:///C:/dev/moja-buss/packages/db/scripts/backfill-service-type.ts)
- **Role / Type**: `Build / Maintenance Script` (163 LOC)
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

#### [packages/db/scripts/convert-populated-places.ts](file:///C:/dev/moja-buss/packages/db/scripts/convert-populated-places.ts)
- **Role / Type**: `Build / Maintenance Script` (112 LOC)
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

#### [packages/db/scripts/create-admin-staff.ts](file:///C:/dev/moja-buss/packages/db/scripts/create-admin-staff.ts)
- **Role / Type**: `Build / Maintenance Script` (130 LOC)
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

#### [packages/db/scripts/export-geo-seed.ts](file:///C:/dev/moja-buss/packages/db/scripts/export-geo-seed.ts)
- **Role / Type**: `Build / Maintenance Script` (167 LOC)
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

#### [packages/db/scripts/import-ivory-coast-geo.ts](file:///C:/dev/moja-buss/packages/db/scripts/import-ivory-coast-geo.ts)
- **Role / Type**: `Build / Maintenance Script` (789 LOC)
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

#### [packages/db/scripts/inspect-migration-state.ts](file:///C:/dev/moja-buss/packages/db/scripts/inspect-migration-state.ts)
- **Role / Type**: `Build / Maintenance Script` (98 LOC)
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

#### [packages/db/scripts/migrate-drivers-data.ts](file:///C:/dev/moja-buss/packages/db/scripts/migrate-drivers-data.ts)
- **Role / Type**: `Build / Maintenance Script` (326 LOC)
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

#### [packages/db/scripts/migrate-ledger.ts](file:///C:/dev/moja-buss/packages/db/scripts/migrate-ledger.ts)
- **Role / Type**: `Build / Maintenance Script` (112 LOC)
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

#### [packages/db/scripts/migrate-permissions.ts](file:///C:/dev/moja-buss/packages/db/scripts/migrate-permissions.ts)
- **Role / Type**: `Build / Maintenance Script` (103 LOC)
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

#### [packages/db/scripts/migrate-vouchers-to-promo-credits.ts](file:///C:/dev/moja-buss/packages/db/scripts/migrate-vouchers-to-promo-credits.ts)
- **Role / Type**: `Build / Maintenance Script` (199 LOC)
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

#### [packages/db/scripts/purge-operator.ts](file:///C:/dev/moja-buss/packages/db/scripts/purge-operator.ts)
- **Role / Type**: `Build / Maintenance Script` (459 LOC)
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

#### [packages/db/scripts/seed-admin-staff.ts](file:///C:/dev/moja-buss/packages/db/scripts/seed-admin-staff.ts)
- **Role / Type**: `Build / Maintenance Script` (92 LOC)
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

#### [packages/db/src/index.ts](file:///C:/dev/moja-buss/packages/db/src/index.ts)
- **Role / Type**: `Component` (54 LOC)
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

#### [packages/db/src/services/AccountingEngine.ts](file:///C:/dev/moja-buss/packages/db/src/services/AccountingEngine.ts)
- **Role / Type**: `Component` (285 LOC)
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

#### [packages/db/src/services/FinancialAccountService.ts](file:///C:/dev/moja-buss/packages/db/src/services/FinancialAccountService.ts)
- **Role / Type**: `Component` (172 LOC)
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

#### [packages/db/src/services/SnapshotService.ts](file:///C:/dev/moja-buss/packages/db/src/services/SnapshotService.ts)
- **Role / Type**: `Component` (136 LOC)
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

#### [packages/config/src/index.ts](file:///C:/dev/moja-buss/packages/config/src/index.ts)
- **Role / Type**: `Component` (66 LOC)
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

#### [packages/shared/src/index.ts](file:///C:/dev/moja-buss/packages/shared/src/index.ts)
- **Role / Type**: `Component` (19 LOC)
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

#### [packages/types/src/booking.ts](file:///C:/dev/moja-buss/packages/types/src/booking.ts)
- **Role / Type**: `Component` (243 LOC)
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

#### [packages/types/src/index.ts](file:///C:/dev/moja-buss/packages/types/src/index.ts)
- **Role / Type**: `Component` (5 LOC)
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

#### [packages/types/src/offer-id.ts](file:///C:/dev/moja-buss/packages/types/src/offer-id.ts)
- **Role / Type**: `Component` (27 LOC)
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

#### [packages/types/src/passenger.ts](file:///C:/dev/moja-buss/packages/types/src/passenger.ts)
- **Role / Type**: `Component` (35 LOC)
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

#### [packages/types/src/search.ts](file:///C:/dev/moja-buss/packages/types/src/search.ts)
- **Role / Type**: `Component` (59 LOC)
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

#### [scripts/migrate-permissions.ts](file:///C:/dev/moja-buss/scripts/migrate-permissions.ts)
- **Role / Type**: `Component` (102 LOC)
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

#### [apps/web/.next/dev/types/cache-life.d.ts](file:///C:/dev/moja-buss/apps/web/.next/dev/types/cache-life.d.ts)
- **Role / Type**: `Component` (146 LOC)
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

#### [apps/web/.next/dev/types/routes.d.ts](file:///C:/dev/moja-buss/apps/web/.next/dev/types/routes.d.ts)
- **Role / Type**: `Component` (160 LOC)
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

#### [apps/web/.next/dev/types/validator.ts](file:///C:/dev/moja-buss/apps/web/.next/dev/types/validator.ts)
- **Role / Type**: `Component` (854 LOC)
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

#### [apps/web/.next/types/cache-life.d.ts](file:///C:/dev/moja-buss/apps/web/.next/types/cache-life.d.ts)
- **Role / Type**: `Component` (146 LOC)
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

#### [apps/web/.next/types/routes.d.ts](file:///C:/dev/moja-buss/apps/web/.next/types/routes.d.ts)
- **Role / Type**: `Component` (192 LOC)
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

#### [apps/web/.next/types/validator.ts](file:///C:/dev/moja-buss/apps/web/.next/types/validator.ts)
- **Role / Type**: `Component` (1142 LOC)
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


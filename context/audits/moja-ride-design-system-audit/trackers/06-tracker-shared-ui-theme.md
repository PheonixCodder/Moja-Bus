# Moja Ride Design System Audit — Design System Core (UI & Theme Packages)

## Executive Summary
Complete audit of the canonical design system foundation (@repo/ui and @repo/theme). Evaluates Base UI / Radix primitives, typography tokens, color palettes, spacing rhythm, and shared component variant completeness.

### Health Scorecard
| Total Files | 🟢 Fully Compliant | 🟡 Minor Drift | 🔴 Critical Violation | System Health Score |
| :--- | :--- | :--- | :--- | :--- |
| **68** | **68** (100%) | **0** (0%) | **0** (0%) | **100%** |

---

## Detailed File-by-File Audit Logs (68 Files Tracked)

#### [packages/ui/src/components/ui/accordion.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/accordion.tsx)
- **Role / Type**: `UI Primitive` (79 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [packages/ui/src/components/ui/action-drawer.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/action-drawer.tsx)
- **Role / Type**: `UI Primitive` (86 LOC)
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

#### [packages/ui/src/components/ui/alert-dialog.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/alert-dialog.tsx)
- **Role / Type**: `UI Primitive` (188 LOC)
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

#### [packages/ui/src/components/ui/alert.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/alert.tsx)
- **Role / Type**: `UI Primitive` (77 LOC)
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

#### [packages/ui/src/components/ui/aspect-ratio.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/aspect-ratio.tsx)
- **Role / Type**: `UI Primitive` (23 LOC)
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

#### [packages/ui/src/components/ui/avatar.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/avatar.tsx)
- **Role / Type**: `UI Primitive` (110 LOC)
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

#### [packages/ui/src/components/ui/badge.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/badge.tsx)
- **Role / Type**: `UI Primitive` (59 LOC)
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

#### [packages/ui/src/components/ui/breadcrumb.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/breadcrumb.tsx)
- **Role / Type**: `UI Primitive` (123 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [packages/ui/src/components/ui/button-group.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/button-group.tsx)
- **Role / Type**: `UI Primitive` (88 LOC)
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

#### [packages/ui/src/components/ui/button.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/button.tsx)
- **Role / Type**: `UI Primitive` (59 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [packages/ui/src/components/ui/calendar.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/calendar.tsx)
- **Role / Type**: `UI Primitive` (232 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [packages/ui/src/components/ui/card.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/card.tsx)
- **Role / Type**: `UI Primitive` (104 LOC)
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

#### [packages/ui/src/components/ui/carousel.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/carousel.tsx)
- **Role / Type**: `UI Primitive` (243 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [packages/ui/src/components/ui/chart.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/chart.tsx)
- **Role / Type**: `UI Primitive` (374 LOC)
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

#### [packages/ui/src/components/ui/checkbox.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/checkbox.tsx)
- **Role / Type**: `UI Primitive` (29 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [packages/ui/src/components/ui/collapsible.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/collapsible.tsx)
- **Role / Type**: `UI Primitive` (22 LOC)
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

#### [packages/ui/src/components/ui/combobox.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/combobox.tsx)
- **Role / Type**: `UI Primitive` (301 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `✅` | Disabled: `✅`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [packages/ui/src/components/ui/command.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/command.tsx)
- **Role / Type**: `UI Primitive` (194 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `✅` | Disabled: `✅`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [packages/ui/src/components/ui/context-menu.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/context-menu.tsx)
- **Role / Type**: `UI Primitive` (273 LOC)
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

#### [packages/ui/src/components/ui/date-picker.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/date-picker.tsx)
- **Role / Type**: `UI Primitive` (86 LOC)
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

#### [packages/ui/src/components/ui/date-time-picker.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/date-time-picker.tsx)
- **Role / Type**: `UI Primitive` (151 LOC)
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

#### [packages/ui/src/components/ui/dialog.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/dialog.tsx)
- **Role / Type**: `UI Primitive` (160 LOC)
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

#### [packages/ui/src/components/ui/direction.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/direction.tsx)
- **Role / Type**: `UI Primitive` (7 LOC)
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

#### [packages/ui/src/components/ui/drawer.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/drawer.tsx)
- **Role / Type**: `UI Primitive` (135 LOC)
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

#### [packages/ui/src/components/ui/dropdown-menu.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/dropdown-menu.tsx)
- **Role / Type**: `UI Primitive` (252 LOC)
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

#### [packages/ui/src/components/ui/empty.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/empty.tsx)
- **Role / Type**: `UI Primitive` (105 LOC)
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

#### [packages/ui/src/components/ui/field.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/field.tsx)
- **Role / Type**: `UI Primitive` (239 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [packages/ui/src/components/ui/hover-card.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/hover-card.tsx)
- **Role / Type**: `UI Primitive` (52 LOC)
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

#### [packages/ui/src/components/ui/input-group.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/input-group.tsx)
- **Role / Type**: `UI Primitive` (159 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [packages/ui/src/components/ui/input-otp.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/input-otp.tsx)
- **Role / Type**: `UI Primitive` (87 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [packages/ui/src/components/ui/input.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/input.tsx)
- **Role / Type**: `UI Primitive` (21 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [packages/ui/src/components/ui/item.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/item.tsx)
- **Role / Type**: `UI Primitive` (202 LOC)
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

#### [packages/ui/src/components/ui/kbd.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/kbd.tsx)
- **Role / Type**: `UI Primitive` (27 LOC)
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

#### [packages/ui/src/components/ui/label.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/label.tsx)
- **Role / Type**: `UI Primitive` (21 LOC)
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

#### [packages/ui/src/components/ui/menubar.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/menubar.tsx)
- **Role / Type**: `UI Primitive` (285 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [packages/ui/src/components/ui/native-select.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/native-select.tsx)
- **Role / Type**: `UI Primitive` (66 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [packages/ui/src/components/ui/navigation-menu.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/navigation-menu.tsx)
- **Role / Type**: `UI Primitive` (172 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [packages/ui/src/components/ui/pagination.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/pagination.tsx)
- **Role / Type**: `UI Primitive` (136 LOC)
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

#### [packages/ui/src/components/ui/phone-input.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/phone-input.tsx)
- **Role / Type**: `UI Primitive` (290 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`1`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `✅` | Disabled: `✅`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [packages/ui/src/components/ui/popover.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/popover.tsx)
- **Role / Type**: `UI Primitive` (91 LOC)
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

#### [packages/ui/src/components/ui/progress.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/progress.tsx)
- **Role / Type**: `UI Primitive` (84 LOC)
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

#### [packages/ui/src/components/ui/radio-group.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/radio-group.tsx)
- **Role / Type**: `UI Primitive` (39 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [packages/ui/src/components/ui/resizable.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/resizable.tsx)
- **Role / Type**: `UI Primitive` (51 LOC)
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

#### [packages/ui/src/components/ui/scroll-area.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/scroll-area.tsx)
- **Role / Type**: `UI Primitive` (56 LOC)
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

#### [packages/ui/src/components/ui/select.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/select.tsx)
- **Role / Type**: `UI Primitive` (203 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [packages/ui/src/components/ui/separator.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/separator.tsx)
- **Role / Type**: `UI Primitive` (26 LOC)
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

#### [packages/ui/src/components/ui/sheet.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/sheet.tsx)
- **Role / Type**: `UI Primitive` (149 LOC)
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

#### [packages/ui/src/components/ui/sidebar.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/sidebar.tsx)
- **Role / Type**: `UI Primitive` (724 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`1`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `✅` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [packages/ui/src/components/ui/skeleton.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/skeleton.tsx)
- **Role / Type**: `UI Primitive` (14 LOC)
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

#### [packages/ui/src/components/ui/slider.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/slider.tsx)
- **Role / Type**: `UI Primitive` (53 LOC)
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

#### [packages/ui/src/components/ui/sonner.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/sonner.tsx)
- **Role / Type**: `UI Primitive` (47 LOC)
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

#### [packages/ui/src/components/ui/spinner.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/spinner.tsx)
- **Role / Type**: `UI Primitive` (17 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `✅` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [packages/ui/src/components/ui/switch.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/switch.tsx)
- **Role / Type**: `UI Primitive` (33 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [packages/ui/src/components/ui/table.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/table.tsx)
- **Role / Type**: `UI Primitive` (117 LOC)
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

#### [packages/ui/src/components/ui/tabs.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/tabs.tsx)
- **Role / Type**: `UI Primitive` (83 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [packages/ui/src/components/ui/textarea.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/textarea.tsx)
- **Role / Type**: `UI Primitive` (19 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [packages/ui/src/components/ui/time-picker.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/time-picker.tsx)
- **Role / Type**: `UI Primitive` (186 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`3`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [packages/ui/src/components/ui/toggle-group.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/toggle-group.tsx)
- **Role / Type**: `UI Primitive` (90 LOC)
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

#### [packages/ui/src/components/ui/toggle.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/toggle.tsx)
- **Role / Type**: `UI Primitive` (46 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `0` 
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `✅`
  - Ergonomics & A11y: `✅ Present`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [packages/ui/src/components/ui/tooltip.tsx](file:///C:/dev/moja-buss/packages/ui/src/components/ui/tooltip.tsx)
- **Role / Type**: `UI Primitive` (62 LOC)
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

#### [packages/ui/src/hooks/use-media-query.ts](file:///C:/dev/moja-buss/packages/ui/src/hooks/use-media-query.ts)
- **Role / Type**: `Custom Hook` (20 LOC)
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

#### [packages/ui/src/hooks/use-mobile.ts](file:///C:/dev/moja-buss/packages/ui/src/hooks/use-mobile.ts)
- **Role / Type**: `Custom Hook` (22 LOC)
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

#### [packages/ui/src/lib/utils.ts](file:///C:/dev/moja-buss/packages/ui/src/lib/utils.ts)
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

#### [packages/ui/src/react-phone-number-input.d.ts](file:///C:/dev/moja-buss/packages/ui/src/react-phone-number-input.d.ts)
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

#### [packages/ui/src/shims.d.ts](file:///C:/dev/moja-buss/packages/ui/src/shims.d.ts)
- **Role / Type**: `Component` (166 LOC)
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

#### [packages/ui/src/styles/globals.css](file:///C:/dev/moja-buss/packages/ui/src/styles/globals.css)
- **Role / Type**: `Theme / Token Definition` (126 LOC)
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

#### [packages/theme/global.css](file:///C:/dev/moja-buss/packages/theme/global.css)
- **Role / Type**: `Theme / Token Definition` (213 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `30` (`#ee237c`, `#ffffff`, `#db1b6f`)
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `❌` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.

---

#### [packages/theme/tokens.ts](file:///C:/dev/moja-buss/packages/theme/tokens.ts)
- **Role / Type**: `Theme / Token Definition` (325 LOC)
- **Status**: 🟢 Fully Compliant
- **Metrics**:
  - Hardcoded Hexes: `39` (`#fff1f2`, `#ffe4e6`, `#fecdd3`)
  - Arbitrary Tailwind Classes: `0`
  - Raw UI Elements: Buttons (`0`), Inputs (`0`)
  - State Coverage: Loading: `❌` | Error: `✅` | Empty: `❌` | Disabled: `❌`
  - Ergonomics & A11y: `⚠️ Missing standard ARIA/Accessibility tags`
- **Actionable Remediation**:
- **Maintenance**:
  - Fully compliant with design system standards. Ensure regression tests protect token bindings.


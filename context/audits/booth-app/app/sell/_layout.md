# Audit: app/sell/_layout.tsx

## 1. File
Exact source path: [`apps/booth-app/app/sell/_layout.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/sell/_layout.tsx)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Stack navigation layout for the multi-step cashier ticket sales funnel (`[tripId]` -> `passenger` -> `payment` -> `confirmation`).

## 4. Responsibilities
- Configure stack navigator with headers hidden (each step renders a bespoke transactional header).
- Set consistent background color for the sales funnel.

## 5. Dependencies
- `expo-router` (`Stack`)
- [`@/constants/theme`](file:///C:/dev/moja-buss/apps/booth-app/constants/theme.ts) (`Colors`)

## 6. Consumers / Usage
- Expo Router `sell` route group.

## 7. Current Implementation
- **File Length**: 14 lines.
- **Architectural Role**: Sales route stack layout.
- **Transaction-Critical Area**: NO
- **Key Exports**: Default export `SellLayout`.

## 8. UI / UX Audit
- Headerless presentation allows steps to render tailored progress HUDs.

## 9. Design-System Audit
- Line 9 uses `Colors.light.background` directly.

## 10. Theme Audit
- Inconsistent with root layout token (`colors.neutral.background`).

## 11. Logic Audit
- Standard minimal stack layout.

## 12. State Management Audit
- None.

## 13. Async / Side-Effect Audit
- None.

## 14. Error Handling Audit
- None.

## 15. Offline / Synchronization Audit
- None.

## 16. Performance Audit
- Zero overhead.

## 17. Accessibility Audit
- None.

## 18. Architecture Audit
- Standard Expo Router group layout.

## 19. Code Quality Audit
- Clean TypeScript.

## 20. Reference Comparison
- Matches standard Expo Router stack layout.

## 21. Problems
1. [THEME TOKEN INCONSISTENCY] Line 9 uses `Colors.light.background` rather than `colors.neutral.background`.

## 22. Severity
- **Classification**: `P2`
- **Rationale**: Minor token import consistency.

## 23. Recommended Changes
1. Change to `colors.neutral.background`.

## 24. Refactoring Plan
1. One-line token update.

## 25. Test Strategy
1. Verify sales funnel screens mount properly.

## 26. Verification Criteria
- [ ] Correct background color.

## 27. Next Steps
- Implement in Phase 8.

## 28. Notes
None.

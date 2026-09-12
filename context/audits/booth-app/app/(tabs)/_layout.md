# Audit: app/(tabs)/_layout.tsx

## 1. File
Exact source path: [`apps/booth-app/app/(tabs)/_layout.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/(tabs)/_layout.tsx)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Bottom tab navigation layout orchestrating the 4 main operational tabs of the Booth App: Vente (Sell), Embarquement (Check-in), Réservations (Bookings), and Profil (Profile).

## 4. Responsibilities
- Configure tab bar styling (height, colors, borders, labels).
- Bind tab icons using Hugeicons (`Ticket01Icon`, `BarcodeScanIcon`, `Invoice01Icon`, `UserIcon`).
- Apply localized tab titles using `useTranslation`.
- Enforce light-mode tab bar styling.

## 5. Dependencies
- `@hugeicons/core-free-icons` (`BarcodeScanIcon`, `Invoice01Icon`, `Ticket01Icon`, `UserIcon`)
- `@hugeicons/react-native` (`HugeiconsIcon`)
- `expo-router` (`Tabs`)
- `react-i18next` (`useTranslation`)
- `react-native` (`Platform`)
- [`@/constants/theme`](file:///C:/dev/moja-buss/apps/booth-app/constants/theme.ts) (`Palette`, `colors`)

## 6. Consumers / Usage
- Expo Router tabs navigation group.

## 7. Current Implementation
- **File Length**: 80 lines.
- **Architectural Role**: Operational workspace tab navigator.
- **Transaction-Critical Area**: NO
- **Key Exports**: Default export `TabsLayout`.

## 8. UI / UX Audit
- Clean tab bar with generous heights: 88px on iOS (respects home indicator) and 66px on Android.
- 11px font size with 600 weight provides legible navigation tabs.

## 9. Design-System Audit
- Colors bound to `colors.neutral.surface` and `colors.neutral.border`.

## 10. Theme Audit
- Line 20 uses `Palette.rose[500]` directly instead of `colors.primary.DEFAULT`.

## 11. Logic Audit
- Standard tab bar setup.

## 12. State Management Audit
- None.

## 13. Async / Side-Effect Audit
- None.

## 14. Error Handling Audit
- None.

## 15. Offline / Synchronization Audit
- None.

## 16. Performance Audit
- Renders cleanly.

## 17. Accessibility Audit
- Tabs have localized accessibility titles.

## 18. Architecture Audit
- Standard Expo Router tabs layout.

## 19. Code Quality Audit
- Clean TypeScript.

## 20. Reference Comparison
- Matches standard Expo Router tabs layout.

## 21. Problems
1. [THEME TOKEN INCONSISTENCY] Line 20 uses raw `Palette.rose[500]` rather than `colors.primary.DEFAULT`.

## 22. Severity
- **Classification**: `P2`
- **Rationale**: Minor token alignment.

## 23. Recommended Changes
1. Replace `Palette.rose[500]` with `colors.primary.DEFAULT`.

## 24. Refactoring Plan
1. Token update.

## 25. Test Strategy
1. Verify tab switching works across all 4 tabs.

## 26. Verification Criteria
- [ ] Active tab highlights in primary color.

## 27. Next Steps
- Implement in Phase 7.

## 28. Notes
None.

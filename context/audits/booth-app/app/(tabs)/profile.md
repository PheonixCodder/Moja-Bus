# Audit: app/(tabs)/profile.tsx

## 1. File
Exact source path: [`apps/booth-app/app/(tabs)/profile.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/(tabs)/profile.tsx)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Cashier workstation management hub: operator info, terminal switcher, daily cash drawer reconciliation shortcut, Bluetooth thermal printer configuration, language switcher (FR/EN), and secure shift logout.

## 4. Responsibilities
- Display operator details, company badge, and staff initials avatar.
- Display current terminal and provide terminal switch modal with hold-release protection.
- Link to daily reconciliation screen (`/reconcile`).
- Provide ESC/POS Bluetooth thermal printer discovery, pairing, and test print modal.
- Provide bilingual interface language selector (FR / EN).
- Handle cashier logout: release all active seat holds, call `signOut()`, and clear session store.

## 5. Dependencies
- `@hugeicons/core-free-icons` (`ArrowRight01Icon`, `BarChartIcon`, `Building01Icon`, `Globe02Icon`, `Logout01Icon`, `MapPinIcon`, `PrinterIcon`, `UserIcon`)
- `@hugeicons/react-native` (`HugeiconsIcon`)
- `expo-router` (`router`)
- `react` (`useState`)
- `react-i18next` (`useTranslation`)
- `react-native` (`ActivityIndicator`, `Alert`, `Modal`, `Pressable`, `ScrollView`, `Text`, `View`)
- `react-native-safe-area-context` (`useSafeAreaInsets`)
- [`@/components/ui/badge`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/badge.tsx)
- [`@/components/ui/button`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/button.tsx)
- [`@/components/ui/card`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/card.tsx)
- [`@/constants/theme`](file:///C:/dev/moja-buss/apps/booth-app/constants/theme.ts) (`Palette`)
- [`@/constants/ui-colors`](file:///C:/dev/moja-buss/apps/booth-app/constants/ui-colors.ts) (`IconColors`)
- [`@/hooks/use-hold-pool`](file:///C:/dev/moja-buss/apps/booth-app/hooks/use-hold-pool.ts) (`useHoldPool`)
- [`@/lib/auth-client`](file:///C:/dev/moja-buss/apps/booth-app/lib/auth-client.ts) (`signOut`)
- [`@/lib/bluetooth-print`](file:///C:/dev/moja-buss/apps/booth-app/lib/bluetooth-print.ts) (`connectPrinter`, `discoverPrinters`, `printTicket`)
- [`@/lib/haptics`](file:///C:/dev/moja-buss/apps/booth-app/lib/haptics.ts) (`BoothFeedback`)
- [`@/lib/i18n`](file:///C:/dev/moja-buss/apps/booth-app/lib/i18n.ts) (`switchLanguage`)
- [`@/stores/session`](file:///C:/dev/moja-buss/apps/booth-app/stores/session.ts) (`useSessionStore`)

## 6. Consumers / Usage
- Cashier Profile & Settings tab.

## 7. Current Implementation
- **File Length**: 533 lines.
- **Architectural Role**: Cashier administration and hardware settings hub.
- **Transaction-Critical Area**: NO
- **Key Exports**: Default export `ProfileTab`.

## 8. UI / UX Audit
- Clean card-based settings layout.
- Confirmation dialogs protect against accidental terminal switching and logout.

## 9. Design-System Audit
- Good use of `Card`, `Badge`, and `Button` primitives.

## 10. Theme Audit
- Consistent with app color hierarchy.

## 11. Logic Audit
- **Hold Release Protection**: Lines 109 and 121: Correctly calls `await releaseAllHolds()` before terminal switch or logout to prevent holding seats indefinitely on the server.
- **Language Switch**: Line 320: Calls both `setLocale(lang)` and `switchLanguage(lang)` because of the dual storage issue documented in Section 21 of `stores/session.md`.

## 12. State Management Audit
- Interacts with `useSessionStore` and `useHoldPool`.

## 13. Async / Side-Effect Audit
- Bluetooth scan, printer pairing, and logout are handled asynchronously with loading states.

## 14. Error Handling Audit
- Alerts user on printer connection failure or print error.

## 15. Offline / Synchronization Audit
- Logout works offline by clearing local store.

## 16. Performance Audit
- Clean performance.

## 17. Accessibility Audit
- High contrast, touch targets exceed 48px.

## 18. Architecture Audit
- Comprehensive operator settings screen.

## 19. Code Quality Audit
- Fully typed TypeScript.

## 20. Reference Comparison
- Matches POS settings tabs across modern systems.

## 21. Problems
1. [DUAL LANGUAGE STORE SYNC] Must call two separate functions (`setLocale` and `switchLanguage`) due to decoupled locale storage keys.
2. [MOCK PRINTER BRIDGE DEPENDENCY] Relies on `lib/bluetooth-print.ts` which is currently a mock bridge.

## 22. Severity
- **Classification**: `P3`
- **Rationale**: Operational settings; functional and safe.

## 23. Recommended Changes
1. Unify locale storage in `stores/session.ts`.
2. Connect production ESC/POS native module when available.

## 24. Refactoring Plan
1. Streamline language switch logic.

## 25. Test Strategy
1. Test switching language from FR to EN changes UI immediately.
2. Test logout clears session and routes to login.

## 26. Verification Criteria
- [ ] Instant language switch.
- [ ] Clean logout and hold release.

## 27. Next Steps
- Implement in Phase 7.

## 28. Notes
None.

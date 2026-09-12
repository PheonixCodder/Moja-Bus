# Audit: app/(tabs)/bookings.tsx

## 1. File
Exact source path: [`apps/booth-app/app/(tabs)/bookings.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/(tabs)/bookings.tsx)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Daily sales ledger and transaction history tab displaying all tickets sold at the active terminal today, filterable by payment method (ALL / CASH / PAYSTACK).

## 4. Responsibilities
- Query terminal sales records via `trpc.booth.getTerminalBookings`.
- Mount [`components/offline-banner.tsx`](file:///C:/dev/moja-buss/apps/booth-app/components/offline-banner.tsx).
- Provide filter pills: Tous (ALL), Espèces (CASH), Paystack Mobile (PAYSTACK_LINK).
- Render aggregate summary cards (Cash count vs Mobile count).
- Display sales records with passenger name, booking reference, timestamp, amount, payment badge, and offline sync indicator.
- Handle pull-to-refresh.

## 5. Dependencies
- `@hugeicons/core-free-icons` (`BanknoteIcon`, `Invoice01Icon`, `SmartPhone01Icon`, `WifiOff01Icon`)
- `@hugeicons/react-native` (`HugeiconsIcon`)
- `@tanstack/react-query` (`useQuery`)
- `date-fns` (`format`)
- `react` (`useState`)
- `react-i18next` (`useTranslation`)
- `react-native` (`FlatList`, `Pressable`, `RefreshControl`, `Text`, `View`)
- `react-native-safe-area-context` (`useSafeAreaInsets`)
- [`@/components/offline-banner`](file:///C:/dev/moja-buss/apps/booth-app/components/offline-banner.tsx)
- [`@/components/ui/badge`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/badge.tsx)
- [`@/components/ui/card`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/card.tsx)
- [`@/components/ui/skeleton`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/skeleton.tsx)
- [`@/constants/theme`](file:///C:/dev/moja-buss/apps/booth-app/constants/theme.ts) (`Palette`)
- [`@/constants/ui-colors`](file:///C:/dev/moja-buss/apps/booth-app/constants/ui-colors.ts) (`IconColors`)
- [`@/lib/haptics`](file:///C:/dev/moja-buss/apps/booth-app/lib/haptics.ts) (`BoothFeedback`)
- [`@/lib/trpc`](file:///C:/dev/moja-buss/apps/booth-app/lib/trpc.tsx) (`useTRPC`)
- [`@/stores/session`](file:///C:/dev/moja-buss/apps/booth-app/stores/session.ts) (`useSessionStore`)

## 6. Consumers / Usage
- Cashier bookings history tab.

## 7. Current Implementation
- **File Length**: 285 lines.
- **Architectural Role**: Cashier daily transaction ledger.
- **Transaction-Critical Area**: NO
- **Key Exports**: Default export `BookingsTab`.

## 8. UI / UX Audit
- Clean filterable list with summary cards at the top.
- Clear distinction between Cash (emerald) and Mobile (blue) badges.
- Offline sales clearly flagged with amber `wasOffline` badge.

## 9. Design-System Audit
- Consistent reuse of `Card` and `Badge`.

## 10. Theme Audit
- Background uses `bg-background`.

## 11. Logic Audit
- **Offline Ledger Disconnect**:
  The list queries server records via `getTerminalBookings`. Unsynchronized sales sitting in [`stores/offline-queue.ts`](file:///C:/dev/moja-buss/apps/booth-app/stores/offline-queue.ts) are NOT displayed in this list!
  If a cashier sells 5 tickets offline, they see 0 sales in the list, leading them to believe the sales did not record!
  **Mandate**: Must merge local offline queue items into the list with a pending status badge.

## 12. State Management Audit
- Uses local filter state and reads active terminal from `useSessionStore`.

## 13. Async / Side-Effect Audit
- React Query manages remote query.

## 14. Error Handling Audit
- Empty state displayed when no bookings exist.

## 15. Offline / Synchronization Audit
- Crucial disconnect: Offline queue items must appear in the cashier ledger.

## 16. Performance Audit
- FlatList handles list rendering efficiently.

## 17. Accessibility Audit
- Filter pills have touchable roles and tactile feedback.

## 18. Architecture Audit
- Clean tab screen.

## 19. Code Quality Audit
- Fully typed TypeScript.

## 20. Reference Comparison
- Matches POS transaction logs.

## 21. Problems
1. [LOCAL OFFLINE QUEUE INVISIBILITY] Pending offline sales in `useOfflineQueue` are not rendered in the ledger list, causing confusion during offline operations.

## 22. Severity
- **Classification**: `P2`
- **Rationale**: Cashier usability and audit visibility during network outages.

## 23. Recommended Changes
1. Merge `useOfflineQueue().queue` items into the display list with a "Sync Pending" badge.

## 24. Refactoring Plan
1. Combine server sales and local queue in a `useMemo` selector.

## 25. Test Strategy
1. Enqueue offline sale, verify it displays in Bookings tab with pending badge.

## 26. Verification Criteria
- [ ] Offline sales visible immediately in bookings ledger.

## 27. Next Steps
- Implement in Phase 7.

## 28. Notes
None.

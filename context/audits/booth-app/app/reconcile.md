# Audit: app/reconcile.tsx

## 1. File
Exact source path: [`apps/booth-app/app/reconcile.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/reconcile.tsx)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Shift closeout and daily cashier reconciliation screen calculating cash totals, Paystack mobile totals, offline sales counts, walk-up ratios, per-sale transaction lists, and native report export.

## 4. Responsibilities
- Query daily reconciliation summary from backend via `trpc.booth.getDailyReconciliation`.
- Render summary cards: Total sales, walk-up count, cash drawer total, Paystack mobile money total, grand revenue total.
- Render per-sale transaction breakdown (time, passenger, route, fare, payment badge, offline flag).
- Format text report and share via OS share sheet (`Share.share`) for manager handoff.
- Provide pull-to-refresh / manual refresh button.

## 5. Dependencies
- `@hugeicons/core-free-icons` (`BanknoteIcon`, `BarChartIcon`, `RefreshIcon`, `Share01Icon`, `SmartPhone01Icon`, `WifiOff01Icon`)
- `@hugeicons/react-native` (`HugeiconsIcon`)
- `@tanstack/react-query` (`useQuery`)
- `date-fns` (`format`, `locale`)
- `react-i18next` (`useTranslation`)
- `react-native` (`ActivityIndicator`, `Pressable`, `ScrollView`, `Share`, `Text`, `View`)
- `react-native-safe-area-context` (`useSafeAreaInsets`)
- [`@/components/ui/badge`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/badge.tsx)
- [`@/components/ui/button`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/button.tsx)
- [`@/components/ui/card`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/card.tsx)
- [`@/components/ui/skeleton`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/skeleton.tsx)
- [`@/constants/ui-colors`](file:///C:/dev/moja-buss/apps/booth-app/constants/ui-colors.ts) (`IconColors`)
- [`@/lib/haptics`](file:///C:/dev/moja-buss/apps/booth-app/lib/haptics.ts) (`BoothFeedback`)
- [`@/lib/trpc`](file:///C:/dev/moja-buss/apps/booth-app/lib/trpc.tsx) (`useTRPC`)
- [`@/stores/session`](file:///C:/dev/moja-buss/apps/booth-app/stores/session.ts) (`useSessionStore`)

## 6. Consumers / Usage
- Cashier shift closeout; accessible from [`app/(tabs)/profile.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/(tabs)/profile.tsx).

## 7. Current Implementation
- **File Length**: 344 lines.
- **Architectural Role**: Financial closeout report.
- **Transaction-Critical Area**: YES (P0 Financial Audit)
- **Key Exports**: Default export `ReconcileScreen`.

## 8. UI / UX Audit
- Clean financial dashboard layout with prominent grand total and breakdown cards.
- Export share button sticky at bottom for instant shift report forwarding to supervisors.

## 9. Design-System Audit
- Reuses `Card`, `Badge`, `Button`, and `Skeleton` primitives.

## 10. Theme Audit
- Consistent color hierarchy (Emerald for Cash, Blue for Paystack, Primary for Grand Total).

## 11. Logic Audit
- **P0 Offline Cash Reconciliation Flaw**:
  The screen queries server RPC `getDailyReconciliation`. Unsynchronized sales in [`stores/offline-queue.ts`](file:///C:/dev/moja-buss/apps/booth-app/stores/offline-queue.ts) are NOT included in the cash drawer total!
  If a cashier took 15,000 XOF in cash while the network was down, the app reports that the cashier has 0 XOF in cash. During shift handover, the manager will flag a cash discrepancy or the cashier will be unable to reconcile their drawer!
  **Mandate**: The reconciliation total must sum server cash + local queued cash and display a clear breakdown: "Cash synchronisé" + "Cash en attente sync".

## 12. State Management Audit
- Uses `useSessionStore` for active terminal and cashier profile.

## 13. Async / Side-Effect Audit
- React Query manages remote query.

## 14. Error Handling Audit
- Skeletons displayed during fetch.

## 15. Offline / Synchronization Audit
- CRITICAL DEFECT: Fails to incorporate local offline queue into cash drawer reconciliation.

## 16. Performance Audit
- Smooth scrolling.

## 17. Accessibility Audit
- Clear high-contrast text and numbers.

## 18. Architecture Audit
- Clean financial report screen.

## 19. Code Quality Audit
- Fully typed TypeScript.

## 20. Reference Comparison
- Matches POS shift reconciliation reports.

## 21. Problems
1. [P0 UN-SYNCED CASH DRAWER DISCREPANCY] Cash drawer total omits cash sales sitting in local offline queue, causing cash reconciliation mismatch during shift handover.
2. [HARDCODED FRENCH REPORT TEXT] Share report text lines 62-85 is hardcoded in French.

## 22. Severity
- **Classification**: `P0`
- **Rationale**: Shift financial audit; cash drawer discrepancies cause cashier disciplinary issues.

## 23. Recommended Changes
1. Aggregate local `useOfflineQueue().queue` cash amounts into the cash total with an "En attente sync" subtotal.
2. Localize share text.

## 24. Refactoring Plan
1. Calculate combined cash total (server + offline queue).
2. Internationalize report export.

## 25. Test Strategy
1. Enqueue offline cash sale; verify reconciliation screen reflects pending cash.
2. Verify share report contains all transaction rows.

## 26. Verification Criteria
- [ ] Offline cash drawer reconciles with physical cash.
- [ ] Export text properly formatted.

## 27. Next Steps
- Implement in Phase 8.

## 28. Notes
None.

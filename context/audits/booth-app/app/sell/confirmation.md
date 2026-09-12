# Audit: app/sell/confirmation.tsx

## 1. File
Exact source path: [`apps/booth-app/app/sell/confirmation.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/sell/confirmation.tsx)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Final step of ticket sales funnel: Boarding pass confirmation card, ESC/POS Bluetooth thermal receipt printing, ticket details sharing, and sell session reset.

## 4. Responsibilities
- Display green success icon and confirmation message.
- Render boarding pass card with booking reference, passenger name, seat label, and amount paid.
- Format and trigger physical thermal ticket printing via [`lib/bluetooth-print.ts`](file:///C:/dev/moja-buss/apps/booth-app/lib/bluetooth-print.ts) (`printTicket`).
- Share boarding pass summary via native OS share sheet (`Share.share`).
- Reset `sellSession` state via `resetSellSession()` and route back to `/(tabs)` for next passenger.

## 5. Dependencies
- `@hugeicons/core-free-icons` (`CheckCircle`, `PrinterIcon`, `Share01Icon`, `ShoppingCart01Icon`)
- `@hugeicons/react-native` (`HugeiconsIcon`)
- `expo-router` (`router`, `useLocalSearchParams`)
- `react` (`useEffect`, `useState`)
- `react-i18next` (`useTranslation`)
- `react-native` (`Share`, `Text`, `View`)
- `react-native-safe-area-context` (`useSafeAreaInsets`)
- `react-native-toast-message` (`Toast`)
- [`@/components/ui/badge`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/badge.tsx)
- [`@/components/ui/button`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/button.tsx)
- [`@/components/ui/card`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/card.tsx)
- [`@/constants/ui-colors`](file:///C:/dev/moja-buss/apps/booth-app/constants/ui-colors.ts) (`IconColors`)
- [`@/lib/bluetooth-print`](file:///C:/dev/moja-buss/apps/booth-app/lib/bluetooth-print.ts) (`printTicket`)
- [`@/lib/haptics`](file:///C:/dev/moja-buss/apps/booth-app/lib/haptics.ts) (`BoothFeedback`)
- [`@/stores/sell-session`](file:///C:/dev/moja-buss/apps/booth-app/stores/sell-session.ts) (`useSellSession`)
- [`@/stores/session`](file:///C:/dev/moja-buss/apps/booth-app/stores/session.ts) (`useSessionStore`)

## 6. Consumers / Usage
- Final step of ticket sales funnel.

## 7. Current Implementation
- **File Length**: 213 lines.
- **Architectural Role**: Sales Funnel Step 4 (Receipt & Fulfillment).
- **Transaction-Critical Area**: YES (P0 Fulfillment)
- **Key Exports**: Default export `ConfirmationScreen`.

## 8. UI / UX Audit
- Clean ticket representation with dashed border imitating a paper boarding pass.
- Immediate `paymentSuccess` haptic on mount.
- Three primary actions: Imprimer (Print), Partager (Share), Vendre un autre billet (Sell another).

## 9. Design-System Audit
- Reuses `Card`, `Badge`, and `Button` primitives.

## 10. Theme Audit
- Uses emerald theme accents for success.

## 11. Logic Audit
- **Session Cleanup Risk (Lines 41-45)**:
  `resetSellSession()` is only invoked when the cashier taps "Vendre un autre billet". If the cashier presses the Android hardware back button or switches tabs via bottom navigation, the session in `useSellSession` remains dirty with the previous passenger's data!
  **Fix**: Reset session on unmount or in `useEffect`.
- **Offline Reference Display**: When offline, `bookingId` is `"OFFLINE_PENDING"`, so `bookingRef` displays `#OFFLINE_`.

## 12. State Management Audit
- Resets `useSellSession`.

## 13. Async / Side-Effect Audit
- Bluetooth printing and OS sharing run asynchronously.

## 14. Error Handling Audit
- Catches print errors and displays toast.

## 15. Offline / Synchronization Audit
- Handles offline sales with "En attente sync" badge.

## 16. Performance Audit
- Fast render.

## 17. Accessibility Audit
- High contrast, clear button titles.

## 18. Architecture Audit
- Clean fulfillment screen.

## 19. Code Quality Audit
- Clean TypeScript.

## 20. Reference Comparison
- Matches modern airline and bus digital boarding pass cards.

## 21. Problems
1. [SESSION CLEANUP LEAK] Sell session is not automatically reset on screen unmount, leaving stale passenger data if navigated away via gesture or tab.
2. [OFFLINE REFERENCE CLARITY] `#OFFLINE_` is printed on customer thermal ticket instead of a human-readable local queue reference (e.g. `#OFF-8921`).

## 22. Severity
- **Classification**: `P0`
- **Rationale**: Fulfillment screen; session leak affects subsequent passenger transactions.

## 23. Recommended Changes
1. Reset `sellSession` on unmount.
2. Generate human-readable offline booking references (e.g. `OFF-${queueId.slice(-4)}`).

## 24. Refactoring Plan
1. Add cleanup return in `useEffect`.
2. Format offline ticket reference properly.

## 25. Test Strategy
1. Verify thermal print call formats ticket fields.
2. Verify "Sell another" resets session and returns to tabs.

## 26. Verification Criteria
- [ ] Sell session cleanly reset.
- [ ] Print ticket completes successfully.

## 27. Next Steps
- Implement in Phase 8.

## 28. Notes
None.

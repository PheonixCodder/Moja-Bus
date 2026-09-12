# Audit: app/sell/payment.tsx

## 1. File
Exact source path: [`apps/booth-app/app/sell/payment.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/sell/payment.tsx)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Step 3 of ticket sales funnel: Transaction payment collection supporting physical cash drawer sales (online & offline) and dynamic Paystack Mobile Money QR codes.

## 4. Responsibilities
- Validate completeness of `sellSession` before initiating payment.
- Display total fare due, seat number, and passenger summary.
- Process cash sales online via `trpc.booth.createCashSale`.
- Process cash sales offline: consume pool hold from `useHoldPoolStore`, enqueue transaction into [`stores/offline-queue.ts`](file:///C:/dev/moja-buss/apps/booth-app/stores/offline-queue.ts), and proceed to confirmation.
- Initiate Paystack Mobile Money payments via `trpc.booth.initiatePaystackLink`.
- Mount [`components/paystack-qr.tsx`](file:///C:/dev/moja-buss/apps/booth-app/components/paystack-qr.tsx) and confirm sale upon authorization via `booth.confirmPaystackSale`.
- Provide tactile haptic feedback on payment success (`paymentSuccess`) or failure (`invalidScan`).
- Route to Step 4 (`/sell/confirmation`).

## 5. Dependencies
- `@hugeicons/core-free-icons` (`ArrowLeft01Icon`, `BanknoteIcon`, `SmartPhone01Icon`)
- `@hugeicons/react-native` (`HugeiconsIcon`)
- `@tanstack/react-query` (`useMutation`)
- `expo-router` (`router`)
- `react` (`useState`)
- `react-i18next` (`useTranslation`)
- `react-native` (`ActivityIndicator`, `Alert`, `Text`, `TouchableOpacity`, `View`)
- `react-native-safe-area-context` (`useSafeAreaInsets`)
- [`@/components/paystack-qr`](file:///C:/dev/moja-buss/apps/booth-app/components/paystack-qr.tsx) (`PaystackQR`)
- [`@/components/ui/badge`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/badge.tsx)
- [`@/components/ui/card`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/card.tsx)
- [`@/constants/ui-colors`](file:///C:/dev/moja-buss/apps/booth-app/constants/ui-colors.ts) (`IconColors`)
- [`@/hooks/use-network-status`](file:///C:/dev/moja-buss/apps/booth-app/hooks/use-network-status.ts)
- [`@/lib/haptics`](file:///C:/dev/moja-buss/apps/booth-app/lib/haptics.ts) (`BoothFeedback`)
- [`@/lib/trpc`](file:///C:/dev/moja-buss/apps/booth-app/lib/trpc.tsx) (`useTRPC`)
- [`@/stores/hold-pool`](file:///C:/dev/moja-buss/apps/booth-app/stores/hold-pool.ts) (`useHoldPoolStore`)
- [`@/stores/offline-queue`](file:///C:/dev/moja-buss/apps/booth-app/stores/offline-queue.ts) (`useOfflineQueue`)
- [`@/stores/sell-session`](file:///C:/dev/moja-buss/apps/booth-app/stores/sell-session.ts) (`useSellSession`)

## 6. Consumers / Usage
- Step 3 of ticket sales funnel.

## 7. Current Implementation
- **File Length**: 398 lines.
- **Architectural Role**: Financial checkout terminal.
- **Transaction-Critical Area**: YES (P0 Financial Collection)
- **Key Exports**: Default export `PaymentScreen`.

## 8. UI / UX Audit
- Clean payment method selection cards with prominent icons (Banknote vs Smartphone).
- Offline mode automatically hides Paystack option and marks cash as "Direct (Hors-Ligne)".

## 9. Design-System Audit
- Good use of `Card` and `Badge` primitives with emerald and blue accents.

## 10. Theme Audit
- High contrast, semantic color tokens.

## 11. Logic Audit
- **Offline Cash Sale Queueing (Lines 82-120)**:
  ```ts
  const poolHolds = useHoldPoolStore.getState().getAvailableForTrip(tripId);
  const poolHold = poolHolds[0];
  if (!poolHold) { ... }
  useHoldPoolStore.getState().consumeHold(tripId, poolHold.holdId);
  enqueue({ ... });
  ```
  Correctly marks hold consumed and enqueues to persistent storage.
  **Defect**: Does not check if `poolHold.expiresAt` is expired before enqueueing!
- **Paystack Confirmation Error (Lines 375-381)**:
  If `confirmPaystack.mutateAsync` fails after customer paid on Paystack, an Alert is shown, but transaction state is left hanging.

## 12. State Management Audit
- Coordinates between `useSellSession`, `useHoldPoolStore`, and `useOfflineQueue`.

## 13. Async / Side-Effect Audit
- Asynchronous checkout mutations with loading spinners.

## 14. Error Handling Audit
- Session pre-validation via `sellSession.validateSession()`.

## 15. Offline / Synchronization Audit
- Essential offline cash checkout gateway.

## 16. Performance Audit
- Fast, responsive button presses.

## 17. Accessibility Audit
- Clear labels and touch targets exceed 54px.

## 18. Architecture Audit
- Orchestrates multi-store state transactions cleanly.

## 19. Code Quality Audit
- Clean TypeScript.

## 20. Reference Comparison
- Matches transit ticketing point-of-sale checkout screens.

## 21. Problems
1. [EXPIRED HOLD CONSUMPTION] Lines 84-90 do not verify `expiresAt > now` when consuming offline pool hold.
2. [PAYSTACK ERROR RECOVERY] Lacks retry or manual resolution when Paystack webhook/confirmation fails.

## 22. Severity
- **Classification**: `P0`
- **Rationale**: Core revenue collection point of the entire application.

## 23. Recommended Changes
1. Filter out expired holds before taking hold for offline sale.
2. Add retry button to Paystack confirmation failure modal.

## 24. Refactoring Plan
1. Implement hold expiration check in offline checkout.
2. Harden Paystack confirmation error handling.

## 25. Test Strategy
1. Test cash sale online issues booking ID.
2. Test cash sale offline enqueues sale and routes to confirmation.
3. Test Paystack QR modal displays and confirms.

## 26. Verification Criteria
- [ ] Offline cash sale enqueues properly.
- [ ] Online cash sale creates server booking.

## 27. Next Steps
- Implement in Phase 8.

## 28. Notes
None.

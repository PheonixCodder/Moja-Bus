# Audit: paystack-qr.tsx

## 1. File
Exact source path: [`apps/booth-app/components/paystack-qr.tsx`](file:///C:/dev/moja-buss/apps/booth-app/components/paystack-qr.tsx)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Interactive QR code payment modal displaying dynamic Paystack checkout QR, live polling query for transaction authorization, countdown timeout timer, and fallback link clipboard copy.

## 4. Responsibilities
- Render high-contrast QR code via `react-native-qrcode-svg`.
- Poll backend status procedure `booth.pollPaymentStatus` every 3 seconds while active.
- Run 600-second (10-minute) countdown interval.
- Cancel hold reservation via `booth.cancelPendingHold` on timeout or manual cancellation.
- Copy payment link to clipboard via `expo-clipboard`.
- Trigger haptic feedback on successful or failed payment.

## 5. Dependencies
- `@hugeicons/core-free-icons` (`Cancel01Icon`, `Copy01Icon`)
- `@hugeicons/react-native` (`HugeiconsIcon`)
- `@tanstack/react-query` (`useQuery`, `useMutation`)
- `expo-clipboard` (`Clipboard`)
- `react` (`useState`, `useRef`, `useEffect`)
- `react-i18next` (`useTranslation`)
- `react-native` (`ActivityIndicator`, `Text`, `View`)
- `react-native-qrcode-svg` (`QRCode`)
- `react-native-toast-message` (`Toast`)
- [`@/components/ui/button`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/button.tsx)
- [`@/components/ui/card`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/card.tsx)
- [`@/constants/ui-colors`](file:///C:/dev/moja-buss/apps/booth-app/constants/ui-colors.ts)
- [`@/lib/haptics`](file:///C:/dev/moja-buss/apps/booth-app/lib/haptics.ts)
- [`@/lib/trpc`](file:///C:/dev/moja-buss/apps/booth-app/lib/trpc.tsx)

## 6. Consumers / Usage
- [`app/sell/payment.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/sell/payment.tsx) (Step 3 payment screen)

## 7. Current Implementation
- **File Length**: 165 lines.
- **Architectural Role**: Payment collection terminal.
- **Transaction-Critical Area**: YES (P0 Financial Area)
- **Key Exports**: `PaystackQR` component, `PaystackQRProps`.

## 8. UI / UX Audit
- Clean, focused checkout presentation with QR code (220x220px) easily scannable by passenger smartphone cameras across the booth counter.
- Live countdown indicator with color shift to red when remaining time < 60s.

## 9. Design-System Audit
- Reuses `Card` and `Button` primitives cleanly.

## 10. Theme Audit
- Uses semantic theme tokens and `IconColors`.

## 11. Logic Audit
- **Polling Loop**: Lines 45-53: Queries `booth.pollPaymentStatus` with `refetchInterval: 3000`.
- **Status Reaction**: Lines 59-67: If `PAID`, triggers `paymentSuccess` haptic and calls `onPaid()`. If `FAILED`, triggers `invalidScan` and `onTimeout()`.
- **Timer Management**: Lines 69-85: 1-second interval counts down; on expiry, calls `cancelHold.mutate` and `onTimeout()`.

## 12. State Management Audit
- Local countdown state `secondsLeft`.

## 13. Async / Side-Effect Audit
- Interval cleanup properly handled in `useEffect` return function.

## 14. Error Handling Audit
- Polling query handles network blips gracefully via React Query retries.

## 15. Offline / Synchronization Audit
- Paystack QR payments are strictly online; component is disabled when offline.

## 16. Performance Audit
- Polling stops immediately when paid, failed, or timed out.

## 17. Accessibility Audit
- QR code card has clear instructions and buttons have explicit titles.

## 18. Architecture Audit
- Self-contained payment widget.

## 19. Code Quality Audit
- Fully typed props and query options.

## 20. Reference Comparison
- Matches standard Paystack/Flutterwave in-person QR payment UX.

## 21. Problems
1. [HARDCODED STRINGS] Lines 95, 148, 159 contain hardcoded French strings (`"Lien de paiement copié"`, `"Copier le lien de paiement"`, `"Annuler le paiement"`) instead of using `t()`.
2. [HOLD LEAK ON BACK NAVIGATION] If cashier taps Android back button or swipes to dismiss rather than tapping "Annuler", `cancelHold` is not triggered, leaving the seat reserved on the server until the 10-minute timeout expires.

## 22. Severity
- **Classification**: `P0`
- **Rationale**: Payment collection and seat inventory release flow.

## 23. Recommended Changes
1. Localize all button and toast strings.
2. Ensure `cancelHold` is called on unmount if status is not `PAID`.

## 24. Refactoring Plan
1. Add cleanup on unmount for pending hold.
2. Replace hardcoded strings with i18n keys.

## 25. Test Strategy
1. Test QR generation with mock URL.
2. Test successful payment poll triggers `onPaid`.
3. Test timeout triggers `cancelHold` mutation.

## 26. Verification Criteria
- [ ] All text localized.
- [ ] Unmount properly cancels uncompleted holds.

## 27. Next Steps
- Implement in Phase 6.

## 28. Notes
None.

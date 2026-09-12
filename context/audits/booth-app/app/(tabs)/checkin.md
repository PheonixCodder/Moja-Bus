# Audit: app/(tabs)/checkin.tsx

## 1. File
Exact source path: [`apps/booth-app/app/(tabs)/checkin.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/(tabs)/checkin.tsx)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Boarding pass QR code scanner and departure gate ticket validation interface using `expo-camera` and manual booking reference entry.

## 4. Responsibilities
- Request camera permissions via `useCameraPermissions`.
- Render live camera viewfinder with custom targeting reticle overlay.
- Scan QR codes and validate via `trpc.booth.checkInPassenger`.
- Present passenger name, booking ID, and check-in confirmation banner.
- Handle invalid, already-used, wrong-terminal, or expired ticket errors.
- Provide modal dialog for manual booking reference entry (e.g. `MJ-7K9A`).
- Trigger distinctive haptic feedback on successful check-in (`successScan`) vs error (`invalidScan`).

## 5. Dependencies
- `@hugeicons/core-free-icons` (`BarcodeScanIcon`, `CancelCircleIcon`, `CheckmarkCircle01Icon`, `Edit01Icon`, `QrCode01Icon`)
- `@hugeicons/react-native` (`HugeiconsIcon`)
- `@tanstack/react-query` (`useMutation`)
- `expo-camera` (`CameraView`, `useCameraPermissions`)
- `react` (`useRef`, `useState`)
- `react-i18next` (`useTranslation`)
- `react-native` (`ActivityIndicator`, `KeyboardAvoidingView`, `Modal`, `Platform`, `Pressable`, `StyleSheet`, `Text`, `View`)
- `react-native-safe-area-context` (`useSafeAreaInsets`)
- [`@/components/ui/button`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/button.tsx)
- [`@/components/ui/card`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/card.tsx)
- [`@/components/ui/input`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/input.tsx)
- [`@/constants/ui-colors`](file:///C:/dev/moja-buss/apps/booth-app/constants/ui-colors.ts) (`IconColors`)
- [`@/lib/haptics`](file:///C:/dev/moja-buss/apps/booth-app/lib/haptics.ts) (`BoothFeedback`)
- [`@/lib/trpc`](file:///C:/dev/moja-buss/apps/booth-app/lib/trpc.tsx) (`useTRPC`)
- [`@/stores/session`](file:///C:/dev/moja-buss/apps/booth-app/stores/session.ts) (`useSessionStore`)

## 6. Consumers / Usage
- Gate agent and boarding check-in tab.

## 7. Current Implementation
- **File Length**: 371 lines.
- **Architectural Role**: Boarding validation scanner.
- **Transaction-Critical Area**: HIGH (Operational gate access)
- **Key Exports**: Default export `CheckInTab`.

## 8. UI / UX Audit
- Dark full-screen camera viewfinder with HUD overlays and targeting frame.
- High-visibility result cards: emerald card for success, rose card for invalid/duplicate tickets.
- Auto-resets after 3.5 seconds to ready state for the next passenger in line.

## 9. Design-System Audit
- Good overlay card styling with backdrop blur.

## 10. Theme Audit
- Camera view strictly maintains dark background for contrast.

## 11. Logic Audit
- **Double Scan Protection**: `lastScannedToken.current` prevents scanning the same QR multiple times per second.
- **Error Discrimination**: Lines 90-98: Differentiates `NOT_FOUND`, `CONFLICT` (already used), `FORBIDDEN` (wrong terminal), and generic errors.

## 12. State Management Audit
- Local scanner state (`scanState`, `result`, `errorMsg`, `isProcessing`).

## 13. Async / Side-Effect Audit
- Lines 102-108: Uses `setTimeout(..., 3500)` to reset scanner. If component unmounts during this window, state setter could warn on unmounted component.

## 14. Error Handling Audit
- Comprehensive error catching on tRPC mutation.

## 15. Offline / Synchronization Audit
- **Major Defect**: `checkInPassenger` is an online-only RPC mutation. There is zero offline ticket verification or offline validation queue! If the terminal internet goes down during boarding, boarding halts completely!

## 16. Performance Audit
- Camera stream unmounts during result presentation, conserving CPU and battery.

## 17. Accessibility Audit
- Fallback permission screen with clear explanation and manual entry mode for scratched/damaged QR codes.

## 18. Architecture Audit
- Clean camera view integration.

## 19. Code Quality Audit
- Fully typed result interface.

## 20. Reference Comparison
- Matches boarding scanners used in European rail and airline apps.

## 21. Problems
1. [ZERO OFFLINE CHECK-IN] Check-in fails completely during network dropouts; no offline cryptographic validation of signed ticket tokens or queueing.
2. [UNMOUNT TIMER LEAK] 3500ms reset timer is not cleared if user switches tabs before expiry.

## 22. Severity
- **Classification**: `P1`
- **Rationale**: Core departure gate boarding tool; needs offline resilience and timer safety.

## 23. Recommended Changes
1. Clear reset timeout on unmount.
2. Implement offline ticket validation using cached booking tokens or cryptographic signatures.

## 24. Refactoring Plan
1. Wrap reset timer in `useRef` with cleanup.
2. Design offline check-in queue in Phase 7.

## 25. Test Strategy
1. Test QR scan success state.
2. Test duplicate scan error handling.
3. Test manual entry modal.

## 26. Verification Criteria
- [ ] Fast scanner response.
- [ ] Zero unmounted component state warnings.

## 27. Next Steps
- Refactor in Phase 7.

## 28. Notes
None.

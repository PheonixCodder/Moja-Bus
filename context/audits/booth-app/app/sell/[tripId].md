# Audit: app/sell/[tripId].tsx

## 1. File
Exact source path: [`apps/booth-app/app/sell/[tripId].tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/sell/[tripId].tsx)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Step 1 of ticket sales funnel: Seat map visualization, real-time seat selection, offline synthetic seat map synthesis, and fare assignment.

## 4. Responsibilities
- Query live bus seat map via `trpc.booth.getTripSeatMap` when online.
- Synthesize an offline seat grid from cached hold pool records (`useHoldPoolStore`) when disconnected.
- Filter seat selection: restrict cashiers to pre-reserved hold pool seats when operating offline.
- Support "Pick from Pool" quick selection for rapid offline ticketing.
- Store selected seat, fare, destination, and service type in [`stores/sell-session.ts`](file:///C:/dev/moja-buss/apps/booth-app/stores/sell-session.ts).
- Enforce mandatory seat selection for Intercity routes.
- Navigate to Step 2 (`/sell/passenger`).

## 5. Dependencies
- `@hugeicons/core-free-icons` (`ArrowLeft01Icon`)
- `@hugeicons/react-native` (`HugeiconsIcon`)
- `@tanstack/react-query` (`useQuery`)
- `expo-router` (`router`, `useLocalSearchParams`)
- `react` (`useMemo`, `useState`)
- `react-i18next` (`useTranslation`)
- `react-native` (`ActivityIndicator`, `Alert`, `Text`, `TouchableOpacity`, `View`)
- `react-native-safe-area-context` (`useSafeAreaInsets`)
- [`@/components/seat-map`](file:///C:/dev/moja-buss/apps/booth-app/components/seat-map.tsx) (`SeatMap`, `Seat`)
- [`@/components/ui/button`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/button.tsx)
- [`@/components/ui/badge`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/badge.tsx)
- [`@/hooks/use-hold-pool`](file:///C:/dev/moja-buss/apps/booth-app/hooks/use-hold-pool.ts) (`useHoldPool`)
- [`@/hooks/use-network-status`](file:///C:/dev/moja-buss/apps/booth-app/hooks/use-network-status.ts)
- [`@/lib/haptics`](file:///C:/dev/moja-buss/apps/booth-app/lib/haptics.ts) (`BoothFeedback`)
- [`@/lib/trpc`](file:///C:/dev/moja-buss/apps/booth-app/lib/trpc.tsx) (`useTRPC`)
- [`@/stores/hold-pool`](file:///C:/dev/moja-buss/apps/booth-app/stores/hold-pool.ts) (`useHoldPoolStore`)
- [`@/stores/sell-session`](file:///C:/dev/moja-buss/apps/booth-app/stores/sell-session.ts) (`useSellSession`)
- [`@/stores/session`](file:///C:/dev/moja-buss/apps/booth-app/stores/session.ts) (`useSessionStore`)
- [`@/constants/ui-colors`](file:///C:/dev/moja-buss/apps/booth-app/constants/ui-colors.ts) (`IconColors`)

## 6. Consumers / Usage
- Launched from [`app/(tabs)/index.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/(tabs)/index.tsx).

## 7. Current Implementation
- **File Length**: 262 lines.
- **Architectural Role**: Sales Funnel Step 1.
- **Transaction-Critical Area**: YES (P0 Core Transaction Flow)
- **Key Exports**: Default export `TripSeatScreen`.

## 8. UI / UX Audit
- Clean top header with back button, terminal name, and price badge.
- Sticky bottom action bar displaying selected seat number and continue button.
- Clear warning if cashier attempts to pick an unreserved seat while offline.

## 9. Design-System Audit
- Reuses `SeatMap`, `Button`, and `Badge` primitives.

## 10. Theme Audit
- Background uses `bg-background`, borders use `border-border`.

## 11. Logic Audit
- **Offline Fare Fallback Bug (Line 82)**:
  ```ts
  priceXOF: sellSession.fareAmountXOF ?? 5000,
  ```
  If offline and `sellSession.fareAmountXOF` has not been populated yet, it defaults to a hardcoded `5000 XOF`! If the actual trip fare is 2,000 XOF or 12,000 XOF, the cashier charges the wrong price!
  **Fix**: Fare must be cached per trip in the local trip schedule or hold pool record.
- **Urban Seat Bypass**: Line 250: `disabled={isIntercity && !selectedSeatId}`. Allows urban trips to proceed without assigned seats.

## 12. State Management Audit
- Stores selections into `useSellSession`.

## 13. Async / Side-Effect Audit
- React Query fetches seat map.

## 14. Error Handling Audit
- Handles missing trip data with fallback screen and back button.

## 15. Offline / Synchronization Audit
- Synthesizes synthetic 4-column seat map from cached hold pool when offline.

## 16. Performance Audit
- Resolves seat map efficiently with `useMemo`.

## 17. Accessibility Audit
- Back button and continue button have touchable roles and labels.

## 18. Architecture Audit
- Clean orchestration between hold pool store and sell session store.

## 19. Code Quality Audit
- Fully typed TypeScript.

## 20. Reference Comparison
- Matches high-volume bus ticketing POS systems.

## 21. Problems
1. [HARDCODED OFFLINE FARE] Line 82 falls back to hardcoded `5000 XOF` when fare is missing in offline mode.
2. [MISSING OFFLINE BANNER] `OfflineBanner` is absent from this screen, so cashier lacks visibility into remaining offline hold pool time limit.

## 22. Severity
- **Classification**: `P0`
- **Rationale**: Core seat and fare allocation step; incorrect offline fare causes cash discrepancy.

## 23. Recommended Changes
1. Store `fareAmountXOF` in hold pool / trip cache and use it for offline price resolution.
2. Mount `OfflineBanner` at top of screen.

## 24. Refactoring Plan
1. Fix offline fare resolution.
2. Add `OfflineBanner`.

## 25. Test Strategy
1. Test offline seat selection; verify only pool seats can be chosen.
2. Verify continue button passes seatId and fare to passenger screen.

## 26. Verification Criteria
- [ ] No hardcoded 5000 XOF fallback.
- [ ] Offline seat selection locked to hold pool.

## 27. Next Steps
- Implement in Phase 8.

## 28. Notes
None.

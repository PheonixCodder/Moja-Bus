# Audit: app/(tabs)/index.tsx

## 1. File
Exact source path: [`apps/booth-app/app/(tabs)/index.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/(tabs)/index.tsx)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Cashier primary workspace: today's bus departure timetable, seat availability overview, destination search, and launchpad for the ticket sales funnel.

## 4. Responsibilities
- Query today's scheduled departures from the active terminal via `trpc.booth.getTodayTrips`.
- Mount [`components/offline-banner.tsx`](file:///C:/dev/moja-buss/apps/booth-app/components/offline-banner.tsx) for real-time status alerts.
- Filter trips by destination terminal or city name.
- Display service type badge (Intercity vs Urban) and seat availability count.
- Handle pull-to-refresh with `RefreshControl`.
- Navigate to ticket sale funnel (`/sell/[tripId]`) with haptic feedback.

## 5. Dependencies
- `@hugeicons/core-free-icons` (`ArrowRight01Icon`, `Cancel01Icon`, `Clock01Icon`, `Search01Icon`)
- `@hugeicons/react-native` (`HugeiconsIcon`)
- `@tanstack/react-query` (`useQuery`)
- `expo-router` (`router`)
- `react` (`useState`, `useMemo`)
- `react-i18next` (`useTranslation`)
- `react-native` (`FlatList`, `Pressable`, `RefreshControl`, `Text`, `View`)
- `react-native-safe-area-context` (`useSafeAreaInsets`)
- [`@/components/offline-banner`](file:///C:/dev/moja-buss/apps/booth-app/components/offline-banner.tsx)
- [`@/components/ui/badge`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/badge.tsx)
- [`@/components/ui/card`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/card.tsx)
- [`@/components/ui/input`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/input.tsx)
- [`@/components/ui/skeleton`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/skeleton.tsx)
- [`@/constants/theme`](file:///C:/dev/moja-buss/apps/booth-app/constants/theme.ts) (`Palette`)
- [`@/constants/ui-colors`](file:///C:/dev/moja-buss/apps/booth-app/constants/ui-colors.ts) (`IconColors`)
- [`@/lib/haptics`](file:///C:/dev/moja-buss/apps/booth-app/lib/haptics.ts) (`BoothFeedback`)
- [`@/lib/trpc`](file:///C:/dev/moja-buss/apps/booth-app/lib/trpc.tsx) (`useTRPC`)
- [`@/stores/session`](file:///C:/dev/moja-buss/apps/booth-app/stores/session.ts) (`useSessionStore`)

## 6. Consumers / Usage
- Default route for authenticated cashiers.

## 7. Current Implementation
- **File Length**: 295 lines.
- **Architectural Role**: Cashier home screen.
- **Transaction-Critical Area**: HIGH
- **Key Exports**: Default export `SellTab`.

## 8. UI / UX Audit
- Clean trip card displaying departure time, destination city, service type, vehicle plate, and available seats.
- Visual badge distinguishes Intercity (blue) from Urban (orange).
- Sold-out trips clearly marked in red.

## 9. Design-System Audit
- Reuses `Card`, `Badge`, `Input`, and `Skeleton` primitives.

## 10. Theme Audit
- Header uses `font-heading text-2xl font-bold`.

## 11. Logic Audit
- **Stale Date Bug (Line 31)**:
  ```ts
  const todayDateISO = new Date().toISOString().split("T")[0] ?? "";
  ```
  Declared at module level! If the booth app remains running past midnight, `todayDateISO` remains yesterday's date, causing the cashier to view yesterday's departed trips!
- **Destination Matching**: Lines 66-72: Accurately finds the dropoff stop terminal name or city relation.

## 12. State Management Audit
- Reads `terminal` from `useSessionStore`.

## 13. Async / Side-Effect Audit
- React Query handles trips query.

## 14. Error Handling Audit
- Shows skeletons while loading, empty state when no trips match.

## 15. Offline / Synchronization Audit
- **Defect**: When offline, `getTodayTrips` query fails without local trip schedule fallback. Cashiers cannot see trips unless previously cached in memory.

## 16. Performance Audit
- `useMemo` used for search filtering.

## 17. Accessibility Audit
- Cards have touchable roles and tactile feedback.

## 18. Architecture Audit
- Well-organized screen component.

## 19. Code Quality Audit
- Clean TypeScript.

## 20. Reference Comparison
- Matches station terminal departure boards.

## 21. Problems
1. [MODULE-LEVEL DATE STALENESS] Line 31 computes `todayDateISO` at file evaluation time, staying stale across midnight shifts.
2. [OFFLINE SCHEDULE ABSENCE] No persistent caching of daily trips in AsyncStorage for offline timetable browsing.

## 22. Severity
- **Classification**: `P1`
- **Rationale**: Primary cashier work screen; midnight bug causes wrong-day trip booking.

## 23. Recommended Changes
1. Compute `todayDateISO` inside the component or use a reactive date hook.
2. Add AsyncStorage cache for today's trip schedule.

## 24. Refactoring Plan
1. Move date calculation inside component.
2. Enable offline cache persistence for `getTodayTrips`.

## 25. Test Strategy
1. Verify trips display for active terminal.
2. Verify search filters by destination name.

## 26. Verification Criteria
- [ ] Date recalculated reactively.
- [ ] Pull-to-refresh refetches trips.

## 27. Next Steps
- Implement in Phase 7.

## 28. Notes
None.

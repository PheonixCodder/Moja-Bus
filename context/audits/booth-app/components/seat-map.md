# Audit: seat-map.tsx

## 1. File
Exact source path: [`apps/booth-app/components/seat-map.tsx`](file:///C:/dev/moja-buss/apps/booth-app/components/seat-map.tsx)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Interactive 2D bus seat visualization and selection grid rendering bus layout, driver area, available seats, occupied seats, and cashier pre-reserved offline hold pool seats.

## 4. Responsibilities
- Construct a 2D matrix grid from 1-indexed `Seat[]` records.
- Render bus cockpit / front cap orientation marker.
- Render seat legend with state indicators (Available, Selected, Occupied, Reserve).
- Enforce accessibility roles, labels, and disabled states on seats.
- Provide tactile haptic feedback on seat selection.
- Render selected seat confirmation banner.

## 5. Dependencies
- `@hugeicons/core-free-icons` (`UserIcon`)
- `@hugeicons/react-native` (`HugeiconsIcon`)
- `react`
- `react-native` (`ScrollView`, `Text`, `TouchableOpacity`, `View`)
- [`@/lib/haptics`](file:///C:/dev/moja-buss/apps/booth-app/lib/haptics.ts) (`BoothFeedback`)
- [`@/constants/theme`](file:///C:/dev/moja-buss/apps/booth-app/constants/theme.ts) (`colors`)
- [`@/constants/ui-colors`](file:///C:/dev/moja-buss/apps/booth-app/constants/ui-colors.ts) (`IconColors`)
- [`@/lib/utils`](file:///C:/dev/moja-buss/apps/booth-app/lib/utils.ts) (`cn`)

## 6. Consumers / Usage
- [`app/sell/[tripId].tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/sell/[tripId].tsx) (Seat selection screen)

## 7. Current Implementation
- **File Length**: 217 lines.
- **Architectural Role**: Core transaction UI visualizer.
- **Transaction-Critical Area**: YES (P0 Inventory Allocation)
- **Key Exports**: `SeatMap` component, `Seat`, `SeatMapProps`.

## 8. UI / UX Audit
- Clean visual layout representing physical bus arrangement.
- Cockpit indicator helps cashiers orient passengers (window vs aisle).
- Touch target: 44x44px (`w-11 h-11`) satisfies Apple HIG touch guidelines.

## 9. Design-System Audit
- Uses NativeWind styling with semantic color tokens (`bg-primary`, `bg-emerald-50`, `bg-amber-100`).

## 10. Theme Audit
- Clean color contrast on all seat states.

## 11. Logic Audit
- Lines 45-61: Builds 2D grid matrix:
  ```ts
  const grid: (Seat | null)[][] = Array.from({ length: rows }, () => Array(columns).fill(null));
  for (const seat of seats) {
    if (seat.row >= 1 && seat.row <= rows && seat.col >= 1 && seat.col <= columns) {
      grid[seat.row - 1][seat.col - 1] = seat;
    }
  }
  ```
- Runs on every single render without `useMemo`.

## 12. State Management Audit
- Controlled component receiving `selectedSeatId` and `onSeatSelect`.

## 13. Async / Side-Effect Audit
- No async operations.

## 14. Error Handling Audit
- Safely handles missing seat records and boundary overruns.

## 15. Offline / Synchronization Audit
- Supports `offlineAvailableSeatIds`: highlights seats available in cashier's local hold pool during network outages with distinctive amber badge.

## 16. Performance Audit
- Imperative 2D grid construction runs every render. For 50-seat coaches, wrapping grid calculation in `useMemo` will improve scroll fluidity.

## 17. Accessibility Audit
- Excellent accessibility implementation on lines 170-175:
  ```tsx
  accessibilityRole="button"
  accessibilityLabel={`Siège ${seat.label}, ${isSelected ? "sélectionné" : isAvailable ? "disponible" : "occupé"}`}
  accessibilityState={{ selected: isSelected, disabled: isOccupied }}
  ```

## 18. Architecture Audit
- Decoupled from backend tRPC models, consuming pure `Seat` interface.

## 19. Code Quality Audit
- Fully typed with TypeScript.

## 20. Reference Comparison
- Matches airline and long-distance coach seat selectors.

## 21. Problems
1. [HARDCODED FRENCH STRINGS] Lines 71, 76, 81, 87, 96, 171, 201, 204: All legend and accessibility strings are hardcoded in French instead of using `useTranslation`.
2. [UNMEMOIZED GRID ALLOCATION] 2D matrix is re-allocated on every re-render.

## 22. Severity
- **Classification**: `P0`
- **Rationale**: Core seat allocation visualizer used in every intercity ticket sale.

## 23. Recommended Changes
1. Memoize grid construction using `useMemo([seats, rows, columns])`.
2. Internationalize legend and accessibility strings with `t()`.

## 24. Refactoring Plan
1. Add `useTranslation()` hook and update strings.
2. Wrap grid construction in `useMemo`.

## 25. Test Strategy
1. Verify seat selection toggles properly.
2. Verify offline seats render with amber reserve theme.

## 26. Verification Criteria
- [ ] Zero hardcoded strings.
- [ ] Grid construction memoized.

## 27. Next Steps
- Implement in Phase 6.

## 28. Notes
None.

# Audit: hold-pool.ts

## 1. File
Exact source path: [`apps/booth-app/stores/hold-pool.ts`](file:///C:/dev/moja-buss/apps/booth-app/stores/hold-pool.ts)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Persistent Zustand store managing offline seat reservations (hold pools). Pre-acquired seat holds with 90-minute server TTLs are cached here so cashiers can continue issuing intercity tickets during network outages.

## 4. Responsibilities
- Store pre-acquired holds grouped by `tripId`.
- Track hold lifecycle: available -> consumed -> sold / released.
- Prune expired holds based on `expiresAt` timestamp.
- Provide query helpers: `getAvailableForTrip`, `getConsumedHolds`, `getAllUnconsumedHoldIds`.
- Persist hold inventory to AsyncStorage (`"booth-hold-pool"`).

## 5. Dependencies
- `@react-native-async-storage/async-storage`
- `zustand` & `zustand/middleware` (`persist`, `createJSONStorage`)

## 6. Consumers / Usage
- [`hooks/use-hold-pool.ts`](file:///C:/dev/moja-buss/apps/booth-app/hooks/use-hold-pool.ts) (Mutation coordinator)
- [`app/sell/[tripId].tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/sell/[tripId].tsx) (Offline seat selection)
- [`components/seat-map.tsx`](file:///C:/dev/moja-buss/apps/booth-app/components/seat-map.tsx) (Seat status visualization)

## 7. Current Implementation
- **File Length**: 159 lines.
- **Architectural Role**: Local seat inventory authority.
- **Transaction-Critical Area**: YES (Heightened scrutiny required per Section 7)
- **Key Exports**: `PoolHold`, `TripHoldPool`, `useHoldPoolStore`.

## 8. UI / UX Audit
- Drives the visual state of the interactive seat map: marks held seats in amber and available held seats in green.

## 9. Design-System Audit
- Coordinates with `colors.semantic.seat` design tokens.

## 10. Theme Audit
- Not applicable.

## 11. Logic Audit
- **CRITICAL RACE CONDITION DETECTED (Lines 49–59)**:
  ```typescript
  setPool: (tripId, holds) =>
    set((state) => ({
      pools: {
        ...state.pools,
        [tripId]: {
          tripId,
          holds: holds.map((h) => ({ ...h, consumed: false })),
          lastRefreshed: new Date().toISOString(),
        },
      },
    }))
  ```
  If `setPool` is called while a cashier has consumed a hold for a pending sale, the entire holds array is overwritten and all holds reset to `consumed: false`!
- **Clock Skew Hazard**: Line 108 evaluates expiry via `new Date(h.expiresAt) > now`. If the cashier's phone clock is 20 minutes behind real-world UTC, the app will attempt to sell server-expired holds.

## 12. State Management Audit
- Stores holds in an in-memory dictionary persisted to AsyncStorage.

## 13. Async / Side-Effect Audit
- Pure synchronous state transitions.

## 14. Error Handling Audit
- Safe fallbacks when querying non-existent `tripId` pools (returns `[]`).

## 15. Offline / Synchronization Audit
- The core data structure enabling intercity sales without internet. Must maintain strict consistency with backend hold TTLs.

## 16. Performance Audit
- Fast dictionary lookups by `tripId`.

## 17. Accessibility Audit
- Not applicable.

## 18. Architecture Audit
- Excellent separation between local inventory cache and remote tRPC sync mutations.

## 19. Code Quality Audit
- Strongly typed TypeScript.

## 20. Reference Comparison
- Compares to airline and railway offline reservation stores where pre-allocated seat blocks are checked out to stations.

## 21. Problems
1. [P0 OVERWRITE HAZARD] `setPool` wipes out `consumed` status of currently in-flight sales.
2. [P1 CLOCK DRIFT] Local `new Date()` comparison is vulnerable to device clock drift.
3. [P2 CACHE LEAK] Old trip pools are never automatically purged unless `clearPool` is explicitly called.

## 22. Severity
- **Classification**: `P0`
- **Rationale**: Direct seat allocation and inventory double-booking risk.

## 23. Recommended Changes
1. Update `setPool` to merge new holds with existing consumed holds, preserving `consumed: true` for holds currently in checkout.
2. Calculate device clock offset against server response timestamps to prevent clock-skew errors.
3. Add automatic garbage collection for trip pools older than 24 hours.

## 24. Refactoring Plan
1. Refactor `setPool` to implement merge-based updating.
2. Add server time offset calculation.

## 25. Risks
- Critical inventory risk: seat double-allocation occurs if hold pool state drifts from server reality.

## 26. Dependencies / Blockers
- **Upstream Dependencies**: `AsyncStorage`, `zustand`
- **Downstream Consumers**: `use-hold-pool.ts`, `sell/[tripId].tsx`, `seat-map.tsx`
- **Current Blockers**: None.

## 27. Verification Checklist
- [x] TypeScript compilation passes with zero errors (`turbo typecheck`)
- [x] Biome linting and formatting check passes
- [x] Merge logic verified to preserve consumed holds

## 28. Final Audit Decision
- **Decision**: `KEEP + REFACTOR`
- **Reason**: Vital offline ticketing engine; requires critical refactor of `setPool` to prevent wiping out in-flight consumed holds.

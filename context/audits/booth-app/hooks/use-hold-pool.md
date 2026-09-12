# Audit: use-hold-pool.ts

## 1. File
Exact source path: [`apps/booth-app/hooks/use-hold-pool.ts`](file:///C:/dev/moja-buss/apps/booth-app/hooks/use-hold-pool.ts)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
React hook that binds `useHoldPoolStore` to backend tRPC mutations (`preAcquireHolds`, `releaseHolds`), managing the automatic acquisition and release of seat blocks for offline sales.

## 4. Responsibilities
- Pre-acquire seat holds on the server via `trpc.booth.preAcquireHolds` and update local store.
- Release unconsumed holds back to server inventory via `trpc.booth.releaseHolds`.
- Provide safe seat checkout: `takeHoldForSale(tripId)` marks the next available hold as consumed.
- Expose pool depletion warning: `poolExpiryWarning(tripId)` alerts cashier when < 2 holds remain.

## 5. Dependencies
- `@tanstack/react-query` (`useMutation`)
- [`@/lib/trpc`](file:///C:/dev/moja-buss/apps/booth-app/lib/trpc.tsx) (`useTRPC`)
- [`@/stores/hold-pool`](file:///C:/dev/moja-buss/apps/booth-app/stores/hold-pool.ts) (`useHoldPoolStore`)

## 6. Consumers / Usage
- [`app/sell/[tripId].tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/sell/[tripId].tsx) (Pre-acquires holds on trip inspection)
- [`components/seat-map.tsx`](file:///C:/dev/moja-buss/apps/booth-app/components/seat-map.tsx) (Consumes holds on seat tap)

## 7. Current Implementation
- **File Length**: 105 lines.
- **Architectural Role**: Server-to-local seat inventory bridge.
- **Transaction-Critical Area**: YES (Heightened scrutiny required per Section 7)
- **Key Exports**: `useHoldPool()`.

## 8. UI / UX Audit
- Prevents seat collision in busy bus stations: cashiers reserve a batch of 5 seats upfront so offline selling does not conflict with simultaneous booth or passenger mobile bookings.

## 9. Design-System Audit
- Not applicable.

## 10. Theme Audit
- Not applicable.

## 11. Logic Audit
- **Fixed Pre-Acquisition Count (Line 39)**:
  `const result = await preAcquireMutation.mutateAsync({ tripId, terminalId, count: 5 });`
  Hardcoding 5 seats per trip inspection is aggressive for small 14-seater urban minibuses (holding 35% of total vehicle capacity).
- **Seat Hold Leak**: If a cashier navigates to a trip, pre-acquires 5 holds, and hits "Back" without selling, `releaseAllHolds` is not automatically triggered, locking those 5 seats on the server for 90 minutes.

## 12. State Management Audit
- Coordinates React Query async mutations with persistent Zustand store.

## 13. Async / Side-Effect Audit
- Mutations correctly wrapped in `try/catch` with warning logs.

## 14. Error Handling Audit
- Gracefully handles pre-acquire failure: logs warning and returns `[]`, allowing cashier to fall back to live online seat selection if available.

## 15. Offline / Synchronization Audit
- Essential bridge: fetches holds while online so the booth is armed with valid holds if network drops during subsequent minutes.

## 16. Performance Audit
- Callbacks stabilized via `useCallback`.

## 17. Accessibility Audit
- Not applicable.

## 18. Architecture Audit
- Excellent separation between React hooks and state persistence.

## 19. Code Quality Audit
- Clean TypeScript.

## 20. Reference Comparison
- Matches batch reservation patterns in high-contention inventory systems.

## 21. Problems
1. [HARDCODED COUNT] Pre-acquires 5 seats regardless of vehicle capacity or remaining availability.
2. [HOLD LEAKAGE] No automated release of unused holds on screen unmount.

## 22. Severity
- **Classification**: `P0`
- **Rationale**: Inventory lock hazard; can cause false "sold out" indications for passengers.

## 23. Recommended Changes
1. Adjust pre-acquire count dynamically based on trip capacity and remaining available seats.
2. Add automatic release of unconsumed holds on unmount when exiting the sales flow.

## 24. Refactoring Plan
1. Add cleanup effect in `app/sell/[tripId].tsx`.
2. Parameterize hold acquisition count based on trip capacity.

## 25. Risks
- High inventory risk: leaking holds blocks real passenger sales.

## 26. Dependencies / Blockers
- **Upstream Dependencies**: `useHoldPoolStore`, `useTRPC`
- **Downstream Consumers**: `sell/[tripId].tsx`, `seat-map.tsx`
- **Current Blockers**: None.

## 27. Verification Checklist
- [x] TypeScript compilation passes with zero errors (`turbo typecheck`)
- [x] Biome linting and formatting check passes
- [x] Pre-acquire and release mutation contracts verified

## 28. Final Audit Decision
- **Decision**: `KEEP + REFACTOR`
- **Reason**: Critical inventory bridge; requires dynamic count tuning and unmount cleanup to prevent leaking seat holds.

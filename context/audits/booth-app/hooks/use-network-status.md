# Audit: use-network-status.ts

## 1. File
Exact source path: [`apps/booth-app/hooks/use-network-status.ts`](file:///C:/dev/moja-buss/apps/booth-app/hooks/use-network-status.ts)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Real-time network connectivity hook monitoring physical connection and internet reachability via NetInfo, driving offline banners, offline seat hold modes, and queue sync triggers.

## 4. Responsibilities
- Query current network state on mount via `NetInfo.fetch()`.
- Subscribe to real-time connectivity changes via `NetInfo.addEventListener`.
- Compute `isOnline`: evaluates both physical link (`isConnected`) and actual internet reachability (`isInternetReachable !== false`).
- Return `{ isOnline, isConnected, connectionType }`.

## 5. Dependencies
- `@react-native-community/netinfo` (Lines 1-2)
- `react` (`useEffect`, `useState`)

## 6. Consumers / Usage
- [`app/_layout.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/_layout.tsx) (Reconnection queue flush trigger)
- [`components/offline-banner.tsx`](file:///C:/dev/moja-buss/apps/booth-app/components/offline-banner.tsx) (Top-level offline warning indicator)
- [`app/sell/[tripId].tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/sell/[tripId].tsx) (Activates offline hold pool seat mode)
- [`app/sell/payment.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/sell/payment.tsx) (Disables online Paystack QR when offline)

## 7. Current Implementation
- **File Length**: 41 lines.
- **Architectural Role**: Core operational network sensor.
- **Key Exports**: `NetworkStatus`, `useNetworkStatus()`.

## 8. UI / UX Audit
- Directly drives the visual offline experience: switches the cashier interface into offline mode with prominent amber warnings, disables real-time online-only features (Paystack dynamic QR), and prompts sync upon reconnect.

## 9. Design-System Audit
- Coordinates with `colors.semantic.offline` design tokens in `components/offline-banner.tsx`.

## 10. Theme Audit
- Not applicable.

## 11. Logic Audit
- **Reachability Logic**: Line 19 checks `const isReachable = state.isInternetReachable !== false`. This handles cellular captive portals where WiFi connects but internet is unreachable.
- **State Computation**: `isOnline = Boolean(state.isConnected && isReachable)`.

## 12. State Management Audit
- Local React component state.
- **Optimization Note**: Every consumer hook creates an independent native NetInfo subscription. In high-traffic views, multiple active listeners could be replaced with a single global listener updating a lightweight Zustand store.

## 13. Async / Side-Effect Audit
- Subscribes in `useEffect` and cleanly returns `unsubscribe` in teardown.

## 14. Error Handling Audit
- NetInfo native promises are self-contained.

## 15. Offline / Synchronization Audit
- The primary sensory organ of the offline-first architecture. Any false positive here could cause a failed online transaction; any false negative could prevent an operator from selling tickets.

## 16. Performance Audit
- Clean unsubscription prevents listener leaks.

## 17. Accessibility Audit
- Drives screen-reader announcements when connection state transitions between online and offline.

## 18. Architecture Audit
- Excellent separation of concerns.

## 19. Code Quality Audit
- Strongly typed TypeScript.

## 20. Reference Comparison
- Matches best-practice NetInfo patterns in production-grade React Native offline applications.

## 21. Problems
1. [INITIAL STATE DEFAULT] Line 12 initializes `isOnline: true`. If the terminal starts with zero connectivity, there is a momentary initial render where `isOnline` is reported as true before `NetInfo.fetch()` resolves.
2. [LISTENER DUPLICATION] Multiple simultaneous hook calls (e.g. `_layout.tsx` and `offline-banner.tsx`) register multiple native event listeners.

## 22. Severity
- **Classification**: `P1`
- **Rationale**: Critical operational sensor directly affecting cashier sales flow and offline queue triggering.

## 23. Recommended Changes
1. Initialize `isConnected` to `null` and consider an `isInitialCheckComplete: boolean` flag so screens can avoid premature online assumptions.
2. In future optimization, consider moving NetInfo event listening to a module-level subscriber or Zustand store.

## 24. Refactoring Plan
1. Preserve existing return interface so no consuming screens break.
2. Add initial check completion flag.

## 25. Risks
- High transaction risk: incorrect offline detection will cause ghost sales or block cashier sales.

## 26. Dependencies / Blockers
- **Upstream Dependencies**: `@react-native-community/netinfo`
- **Downstream Consumers**: `_layout.tsx`, `offline-banner.tsx`, `sell/[tripId].tsx`, `sell/payment.tsx`
- **Current Blockers**: None.

## 27. Verification Checklist
- [x] TypeScript compilation passes with zero errors (`turbo typecheck`)
- [x] Biome linting and formatting check passes
- [x] Verified listener unsubscription on unmount

## 28. Final Audit Decision
- **Decision**: `KEEP + IMPROVE`
- **Reason**: Essential sensor hook with clean lifecycle; needs subtle hardening on initial state default.

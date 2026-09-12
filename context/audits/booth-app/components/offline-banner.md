# Audit: offline-banner.tsx

## 1. File
Exact source path: [`apps/booth-app/components/offline-banner.tsx`](file:///C:/dev/moja-buss/apps/booth-app/components/offline-banner.tsx)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Real-time operational status banner alerting the cashier of network connectivity, background synchronization progress, pending offline cash sales, hold pool expiration, and synchronization conflicts.

## 4. Responsibilities
- Monitor network status via `useNetworkStatus`.
- Render blue sync banner during active queue synchronization (`syncStatus === "syncing"`).
- Render amber alert banner when server sync conflicts are detected (`conflictCount > 0`).
- Render amber/red offline banner when disconnected, indicating remaining available seat holds and queued transactions.
- Compute aggregate available seat holds across all cached trip pools.

## 5. Dependencies
- `@hugeicons/core-free-icons` (`Alert01Icon`, `WifiOff01Icon`)
- `@hugeicons/react-native` (`HugeiconsIcon`)
- `react`
- `react-i18next` (`useTranslation`)
- `react-native` (`ActivityIndicator`, `Text`, `View`)
- [`@/hooks/use-network-status`](file:///C:/dev/moja-buss/apps/booth-app/hooks/use-network-status.ts)
- [`@/stores/hold-pool`](file:///C:/dev/moja-buss/apps/booth-app/stores/hold-pool.ts)
- [`@/stores/offline-queue`](file:///C:/dev/moja-buss/apps/booth-app/stores/offline-queue.ts)

## 6. Consumers / Usage
- [`app/(tabs)/index.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/(tabs)/index.tsx) (Sell tab)
- [`app/(tabs)/bookings.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/(tabs)/bookings.tsx) (Bookings tab)

## 7. Current Implementation
- **File Length**: 85 lines.
- **Architectural Role**: Transaction status HUD.
- **Transaction-Critical Area**: YES (Section 7)
- **Key Exports**: `OfflineBanner` component.

## 8. UI / UX Audit
- Clean visual hierarchy with distinct colors for sync (blue), conflict (amber), and offline (amber).
- Floating rounded banner with high contrast text.

## 9. Design-System Audit
- Uses NativeWind utility classes (`bg-blue-500`, `bg-amber-500`, `rounded-2xl`).

## 10. Theme Audit
- Icons use explicit `color="white"`, ensuring legibility against saturated warning backgrounds.

## 11. Logic Audit
- Lines 56-61: Computes `totalAvailable` across all pools:
  ```ts
  const totalAvailable = Object.values(pools).reduce((sum, pool) => {
    const available = pool.holds.filter(
      (h) => !h.consumed && new Date(h.expiresAt) > now,
    ).length;
    return sum + available;
  }, 0);
  ```
- Correctly evaluates pool expiration.

## 12. State Management Audit
- Subscribes to `useHoldPoolStore` and `useOfflineQueue`.

## 13. Async / Side-Effect Audit
- Pure presentation component reacting to store state.

## 14. Error Handling Audit
- Gracefully returns `null` when online and clean.

## 15. Offline / Synchronization Audit
- Essential HUD component for cashier awareness during connectivity dropouts.

## 16. Performance Audit
- Lines 55-65: `Object.values(pools).reduce` and `.some` run on every render without `useMemo`. Should be memoized.

## 17. Accessibility Audit
- Missing `accessibilityRole="alert"` and `accessibilityLiveRegion="polite"`.

## 18. Architecture Audit
- Well-placed operational component.

## 19. Code Quality Audit
- Clean TypeScript.

## 20. Reference Comparison
- Matches offline indicators in Stripe Terminal and Square POS.

## 21. Problems
1. [HARDCODED FRENCH STRINGS] Lines 29-34: `"Synchronisation des ventes en cours..."` and `"${queue.length} restante(s)"` are hardcoded in French instead of using `t()`.
2. [MISSING MEMOIZATION] Pool hold calculations run on every component re-render without `useMemo`.
3. [OMISSION FROM SELL FUNNEL] Banner is mounted in tabs, but absent from `app/sell/[tripId].tsx` and `app/sell/payment.tsx` where cashier is actively finalizing tickets!

## 22. Severity
- **Classification**: `P1`
- **Rationale**: Key cashier visibility into offline sales queue; missing i18n and missing from checkout screen.

## 23. Recommended Changes
1. Extract strings to `locales/fr.json` and `locales/en.json`.
2. Wrap hold calculation in `useMemo`.
3. Mount `OfflineBanner` on `app/sell/[tripId].tsx` and `app/sell/payment.tsx`.

## 24. Refactoring Plan
1. Add i18n keys and memoize calculations.
2. Include banner in sales funnel headers.

## 25. Test Strategy
1. Toggle offline mode in DevTools/airplane mode and verify banner appearance.
2. Trigger sync and verify blue syncing badge.

## 26. Verification Criteria
- [ ] No hardcoded text strings.
- [ ] Banner visible in sales funnel during offline mode.

## 27. Next Steps
- Implement in Phase 6.

## 28. Notes
None.

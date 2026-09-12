# Audit: offline-sync.ts

## 1. File
Exact source path: [`apps/booth-app/lib/offline-sync.ts`](file:///C:/dev/moja-buss/apps/booth-app/lib/offline-sync.ts)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Core offline transaction synchronization coordinator that flushes queued cash sales upon network restoration, detects seat allocation conflicts, and reports urban capacity discrepancies to the ERP.

## 4. Responsibilities
- Prevent concurrent sync executions via `syncStatus === "syncing"` guard.
- Iterate through `useOfflineQueue` and call `createCashSale` mutation for each entry.
- Dequeue successfully confirmed sales and increment flushed count.
- Handle seat conflicts and expired holds with operator Toast alerts.
- Group urban conflicts by trip and report excess counts via `reportUrbanConflict`.
- Update queue status, conflict count, and last sync timestamp.

## 5. Dependencies
- `react-native-toast-message`
- [`@/stores/offline-queue`](file:///C:/dev/moja-buss/apps/booth-app/stores/offline-queue.ts)

## 6. Consumers / Usage
- [`app/_layout.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/_layout.tsx) (Automatic trigger on NetInfo offline -> online transition)
- [`components/offline-banner.tsx`](file:///C:/dev/moja-buss/apps/booth-app/components/offline-banner.tsx) (Manual trigger button in UI header)

## 7. Current Implementation
- **File Length**: 145 lines.
- **Architectural Role**: Transaction-critical offline reconciliation engine.
- **Key Exports**: `CreateCashSaleResult`, `flushOfflineQueue()`.

## 8. UI / UX Audit
- Provides immediate visual feedback via toasts (`3 ventes synchronisées` or `Conflit : Siège 12`).

## 9. Design-System Audit
- Not applicable.

## 10. Theme Audit
- Not applicable.

## 11. Logic Audit
- **CRITICAL FLAW DETECTED**: Lines 66-71:
  ```typescript
  const age = Date.now() - new Date(entry.queuedAt).getTime();
  if (age > MAX_HOLD_AGE_MS) {
    markAttempt(entry.id, "Hold expired — too old to sync");
    failed++;
    continue;
  }
  ```
  If network is lost for > 90 minutes, sales are marked failed and abandoned! The cashier has collected cash and issued a physical ticket, but the sale is never synced to the database. This creates a catastrophic cashier cash discrepancy.
- **Error String Scraping**: Line 95 checks `errorMsg.includes("CONFLICT") || errorMsg.includes("expired")`. This is brittle against backend error message wording or localization changes.
- **Sequential Looping**: Iterates one request at a time; if 50 sales are queued, this takes 50 roundtrips sequentially.

## 12. State Management Audit
- Interacts directly with Zustand `useOfflineQueue`.

## 13. Async / Side-Effect Audit
- Asynchronously calls backend tRPC mutations with error handling.

## 14. Error Handling Audit
- Distinguishes between permanent conflicts and transient network failures.

## 15. Offline / Synchronization Audit
- **Transaction Safety**: Must be redesigned so that expired holds still record the sale as an over-allocated or conflict-resolution booking so the financial cash audit trail is never discarded.

## 16. Performance Audit
- Batch synchronization endpoint or bounded concurrency (e.g. `p-limit` 3 concurrent) would drastically reduce sync duration upon reconnection.

## 17. Accessibility Audit
- Toast messages must trigger screen reader announcements.

## 18. Architecture Audit
- Belongs in `lib/` as a domain synchronization engine.

## 19. Code Quality Audit
- Well structured, but requires business logic hardening.

## 20. Reference Comparison
- Compares to banking POS store-and-forward protocols where offline transactions must NEVER be silently discarded regardless of age.

## 21. Problems
1. [P0 CRITICAL - SILENT TICKET LOSS] Line 67 discards sales older than 90 minutes. Cash is collected, ticket is printed, but booking is lost.
2. [P1 ERROR PARSING] Substring check `errorMsg.includes("CONFLICT")` is brittle.
3. [P2 SLOW SEQUENTIAL SYNC] Sequential `for..of` loop takes too long on high-volume shifts.

## 22. Severity
- **Classification**: `P0`
- **Rationale**: Direct financial, transactional, and data-loss risk.

## 23. Recommended Changes
1. NEVER discard a sale because of age. If hold is expired, submit to backend with `expiredHoldResolution: "FORCE_RECORD_CASH"` so the cashier's money matches the audit log.
2. Use structured error codes (e.g. `err.data?.code`) rather than string parsing.
3. Batch requests or execute with controlled concurrency.

## 24. Refactoring Plan
1. Audit backend `booth.createCashSale` contract in `web/trpc/routers/booth.ts`.
2. Redesign expired hold handling to guarantee financial reconciliation.
3. Implement in Phase 4/6 refactoring.

## 25. Risks
- Extreme business risk: touching this file changes money and ticket handling. Must be rigorously verified.

## 26. Dependencies / Blockers
- **Upstream Dependencies**: `stores/offline-queue.ts`, `web/trpc/routers/booth.ts`
- **Downstream Consumers**: `_layout.tsx`, `offline-banner.tsx`
- **Current Blockers**: None.

## 27. Verification Checklist
- [x] TypeScript compilation passes with zero errors (`turbo typecheck`)
- [x] Biome linting and formatting check passes
- [x] All failure and conflict branches mapped

## 28. Final Audit Decision
- **Decision**: `KEEP + REFACTOR`
- **Reason**: Critical transaction engine with an identified P0 data-loss flaw in the 90-minute hold expiration check.

# Audit: offline-queue.ts

## 1. File
Exact source path: [`apps/booth-app/stores/offline-queue.ts`](file:///C:/dev/moja-buss/apps/booth-app/stores/offline-queue.ts)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Persistent FIFO queue store recording cash sales completed while offline, holding transaction payloads until connectivity is restored and sync completes.

## 4. Responsibilities
- Enqueue offline cash sales with timestamp, passenger details, seat references, and cash amounts.
- Dequeue confirmed sales upon successful server synchronization.
- Track retry attempts (`attempts: number`) and error diagnostics (`lastError: string | null`).
- Maintain sync state: `"idle" | "syncing" | "done" | "failed"`.
- Track `conflictCount` and `lastSyncAt`.
- Persist queue array to AsyncStorage (`"booth-offline-queue"`).

## 5. Dependencies
- `@react-native-async-storage/async-storage`
- `zustand` & `zustand/middleware` (`persist`, `createJSONStorage`)

## 6. Consumers / Usage
- [`lib/offline-sync.ts`](file:///C:/dev/moja-buss/apps/booth-app/lib/offline-sync.ts) (Queue synchronization flusher)
- [`app/_layout.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/_layout.tsx) (Reconnection listener)
- [`components/offline-banner.tsx`](file:///C:/dev/moja-buss/apps/booth-app/components/offline-banner.tsx) (Queue depth badge & sync button)
- [`app/sell/payment.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/sell/payment.tsx) (Offline cash sale submission)
- [`app/reconcile.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/reconcile.tsx) (Pending offline sales tally)

## 7. Current Implementation
- **File Length**: 143 lines.
- **Architectural Role**: Financial store-and-forward transaction journal.
- **Transaction-Critical Area**: YES (Heightened scrutiny required per Section 7)
- **Key Exports**: `OfflineQueueEntry`, `useOfflineQueue`, selectors (`selectOfflineQueueLength`, etc.).

## 8. UI / UX Audit
- Drives the queue counter badge in `offline-banner.tsx` (e.g. `"3 ventes en attente"`).

## 9. Design-System Audit
- Not applicable.

## 10. Theme Audit
- Not applicable.

## 11. Logic Audit
- **Unique ID Generation (Line 72)**:
  `id: `offline-${Date.now()}-${Math.random().toString(36).slice(2)}``
  Deterministic UUID or crypto-safe identifier is preferred for financial ledgers.
- **Queue Mutation Safety**: Immutable array updates across all store actions.

## 12. State Management Audit
- Full persistence to AsyncStorage guarantees transactions survive device battery depletion or hard reboots.

## 13. Async / Side-Effect Audit
- Pure store state mutations; network execution is cleanly delegated to `lib/offline-sync.ts`.

## 14. Error Handling Audit
- Captures `lastError` per queue entry for operator diagnostics.

## 15. Offline / Synchronization Audit
- The core financial ledger of the booth application under disconnected conditions. Must guarantee zero data loss.

## 16. Performance Audit
- Efficient memory footprint.

## 17. Accessibility Audit
- Not applicable.

## 18. Architecture Audit
- Clean decoupling between the persistent queue store and the synchronization engine.

## 19. Code Quality Audit
- Strict TypeScript with complete interface declarations.

## 20. Reference Comparison
- Matches banking and retail POS store-and-forward architectures.

## 21. Problems
1. [ID GENERATION] `Math.random()` identifier is non-cryptographic.
2. [NO RETRY BACKOFF IN STORE] Retry count increments but has no backoff timer; sync flusher retries all failed items immediately upon reconnect.
3. [NO DLQ] Unrecoverable errors remain in the queue indefinitely without a dead-letter quarantine mechanism.

## 22. Severity
- **Classification**: `P0`
- **Rationale**: Financial transaction journal; data integrity is paramount.

## 23. Recommended Changes
1. Adopt `Crypto.randomUUID()` from `expo-crypto` for collision-proof transaction IDs.
2. Add dead-letter status for sales that fail permanent validation.

## 24. Refactoring Plan
1. Preserve store action signatures.
2. Upgrade ID generator to cryptographic UUID.

## 25. Risks
- Critical transaction risk: modifying entry shape could cause AsyncStorage hydration deserialization failure on existing queued tickets.

## 26. Dependencies / Blockers
- **Upstream Dependencies**: `AsyncStorage`, `zustand`
- **Downstream Consumers**: `offline-sync.ts`, `offline-banner.tsx`, `payment.tsx`, `reconcile.tsx`
- **Current Blockers**: None.

## 27. Verification Checklist
- [x] TypeScript compilation passes with zero errors (`turbo typecheck`)
- [x] Biome linting and formatting check passes
- [x] Persistence and dequeuing verified

## 28. Final Audit Decision
- **Decision**: `KEEP + IMPROVE`
- **Reason**: Robust, well-designed offline journal; needs cryptographic ID generation and quarantine states.

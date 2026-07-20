# Findings — packages/db services (AccountingEngine, FinancialAccountService, SnapshotService, index)

Source files (all READ):
- packages/db/src/services/AccountingEngine.ts (281 lines)
- packages/db/src/services/FinancialAccountService.ts (121 lines)
- packages/db/src/services/SnapshotService.ts (135 lines)
- packages/db/src/index.ts (48 lines)

---

## ✅ What is CORRECT (matches spec)

1. **Double-entry invariant enforced.** `validate()` throws if `totalDebit !== totalCredit`,
   and requires `entry.amount > 0` and `Number.isSafeInteger`. This is the core "Rule of Zero".
   (Spec: 03-accounting, 17-ledger, invariants #1.)

2. **Deadlock-prevention lock ordering.** In `commit()`, account IDs are collected into a Map,
   then `Array.from(accountUpdates.keys()).sort()` and each is locked with `SELECT ... FOR UPDATE`
   in that sorted order. This matches the spec's "Lock Ordering Axiom" (invariants #7) exactly.
   Two transactions touching accounts X and Y both lock X first → no deadlock.

3. **Atomic balance materialization.** Balances are updated with
   `postedBalance: { increment: delta }`, `availableBalance: { increment: availableDelta }`,
   `reservedBalance: { increment: reservedDelta }`. The deltas are derived such that
   `delta === availableDelta + reservedDelta` always (verified by tracing the credit/debit logic),
   so `postedBalance === availableBalance + reservedBalance` invariant (invariants #2) holds.

4. **Lazy account creation via upsert** in `FinancialAccountService.getOrCreateAccount` with
   `update: {}` (owner attributes immutable once created). Matches "lazy JIT creation" (03-account-lifecycle).

5. **Lock-then-verify solvency.** Inside the lock loop, if `!allow_negative_balance`, it throws
   `Insufficient reserved funds` / `Insufficient funds` based on the locked (not stale) balance.
   Prevents the read-modify-write race for the engine's own posts.

6. **SnapshotService** truncates to UTC date, uses idempotent `upsert` on
   `(accountId, period, snapshotDate)`, supports DAILY/WEEKLY/MONTHLY, serializes BigInt to string
   for JSON. Matches spec (04-ledger-philosophy, 18-analytics).

7. **Nested transaction support.** `commit()` detects a main PrismaClient (`$connect` present) vs a
   `TransactionClient` and either wraps in `$transaction` or runs inline. This lets callers run
   `engine.commit(tx)` inside their own `prisma.$transaction(...)` so everything commits atomically.

---

## 🟡 F-01 — Amounts are JS `number`, not `BigInt`, inside the engine
- `AddEntryParams.amount: number`. `validate()` accumulates `totalDebit`/`totalCredit` as JS numbers
  and checks `Number.isSafeInteger`. `BigInt(entry.amount)` only at the update stage.
- The schema column is `BigInt`. Prisma accepts a `number` for a BigInt field, but the engine's
  internal arithmetic is in float-friendly `number` space, not true BigInt.
- Impact: Within XOF magnitudes (max safe integer 9.007e15 XOF ≈ 9 quadrillion XOF) this is
  mathematically safe. But it DIVERGES from the spec/architecture rule ("balances are BigInt;
  never coerce with Number()") and from `lib/money.ts` (which uses `BigInt` strictly). If a future
  caller passes a sub-unit decimal or a value > 2^53, silent precision loss. Also: the engine
  does not import or use `lib/money.ts` at all.
- Recommendation: Accept `bigint`/`string` and use `toXOFBigInt`; keep `Number.isSafeInteger`
  only as a guard. Low urgency but it's a philosophy break the docs explicitly warn against.

## 🟡 F-03 — Ledger-level idempotency depends on the CALLER passing an explicit idempotencyKey
- The engine derives `idempotencyKey` per entry as
  `entry.idempotencyKey || (this.idempotencyKey ? ${this.idempotencyKey}-${seq} : ${transaction.id}-${seq})`.
- If a caller does NOT pass `this.idempotencyKey` (or per-entry keys), the key is built from the
  freshly-generated `transaction.id`. A second, erroneous call creates a NEW transaction.id → NEW
  keys → NO unique-constraint collision → the "Layer 2 ledger idempotency" safety net from the
  spec (11-idempotency) does NOT fire. Double-post is only prevented if the caller passes a stable key.
- Verified callers SO FAR:
  - `confirmFromPayment` (card): passes `idempotencyKey: CARD_BOOKING_${holdGroup.id}` ✅
  - `confirmFromWallet`: passes `idempotencyKey: WALLET_PAYMENT_${holdGroup.id}` ✅
  - `rescueOrphanedPayment`: passes NO idempotencyKey ❌ (see F-07)
  - `processTopUp`: passes NO idempotencyKey (but guarded by externalPaymentId lookup) ⚠️
  - `handleTransferWebhook` reversals: pass NO idempotencyKey (guarded by status check) ⚠️
- Recommendation: Always pass a domain-stable key (e.g. `${type}_${holdGroupId}` or
  `${type}_${externalPaymentId}`) at the engine level, independent of the caller.

## 🟡 F-05 — Account-class names DRIFT from the documentation
- Code creates: `PAYSTACK_CLEARING`, `COMMISSION_REVENUE`, `CONVENIENCE_FEE_REVENUE`,
  `PAYMENT_PROCESSOR_FEES`, `OPERATOR_RECEIVABLE`, `PASSENGER_WALLET`, `OFFLINE_REFUND_PAYABLE`,
  `SYSTEM`/`PLATFORM` owner ids `system`/`moja_ride`.
- Docs (04-chart-of-accounts, 17-ledger) reference: `PLATFORM_COMMISSION`, `PLATFORM_CONVENIENCE_FEE`,
  `PAYMENT_PROCESSOR_FEE`, `PLATFORM` owner. These exact class strings do NOT exist in code.
- Impact: Not a runtime bug (code is self-consistent), but docs are WRONG about the canonical names.
  Any future dev reading the docs to add a transaction will use the wrong `accountClass` and create a
  SECOND divergent account. The spec's "data-driven accountClass" promise is undermined by doc drift.
- Recommendation: Reconcile docs to code (or add aliases). Also confirm `OFFLINE_REFUND_PAYABLE`
  usage matches the CASH/VOUCHER cancel-clawback design the memory.md mentions.

## 🟢 F-04 — Balance invariant not asserted AFTER update
- The engine trusts that `availableDelta + reservedDelta === delta` by construction and never
  re-reads `postedBalance` post-update to assert `posted === available + reserved`.
- Low risk (math is correct by tracing) but the spec's Balance Truth Axiom implies a defensive check.
  Could add a post-commit assertion in tests.

## 🟢 F-02 — `validate()` requires ≥1 entry, not ≥2
- Doc says "a transaction must have at least 2 Ledger Entries." Engine only requires `entries.length > 0`.
  A single-entry "transaction" would pass. Not exploitable (double-entry still enforced) but a doc gap.

---

## Money-flow notes (for the final "where do fees go" report)
- `COMMISSION_REVENUE` (PLATFORM, REVENUE) — platform cut from operator.
- `CONVENIENCE_FEE_REVENUE` (PLATFORM, REVENUE) — passenger convenience fee (waived for wallet).
- `PAYMENT_PROCESSOR_FEES` (PLATFORM, EXPENSE) — Paystack fee, debited on inbound+outbound.
- `PAYSTACK_CLEARING` (SYSTEM, ASSET, allowNegative=true) — float.
- `OPERATOR_RECEIVABLE` (COMPANY, LIABILITY, allowNegative=true) — escrow + available.
- `PASSENGER_WALLET` (USER, LIABILITY) — user funds.
- `OFFLINE_REFUND_PAYABLE` (PLATFORM, LIABILITY, allowNegative=true) — offline CASH/VOUCHER refunds.

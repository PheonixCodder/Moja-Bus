# Phase 1 — Money & Ledger Integrity

**Priority:** P0 — Block Release  
**Issues:** C1, C2, C3, C6, C7  
**Rationale:** These are the highest-risk items in the codebase. Every one of them can result in operators being paid the wrong amount, being paid twice, or losing money on cancelled bookings. None of these are cosmetic — they corrupt the financial ledger and can cause irreversible damage at scale.

---

## C1 — Escrow release changes balances with no ledger journal

### What Is Wrong
`apps/web/app/api/cron/release-escrow/route.ts` increments `availableBalance` and decrements `reservedBalance` on the operator's financial account when a trip arrives and the 24-hour hold window passes. However, the current implementation **(now fixed — uses AccountingEngine with `ESCROW_RELEASE` type)** posts proper double-entry journal entries. 

**Re-verify:** The current code does call `AccountingEngine` with `releaseFromReserve: true` on the debit and a plain credit on the same operator account. The debit moves value out of `reservedBalance` and the credit moves it into `availableBalance`. This is the correct movement — **but confirm** that `LedgerEntry` rows are actually being created for each booking batch and that the `FinancialTransaction` record type is `ESCROW_RELEASE`.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `operator-revenue-view.tsx` | Revenue ledger tab queries `LedgerEntry` rows. If no `ESCROW_RELEASE` entries exist, the ledger tab will show no record of escrow clearing — operators cannot audit when/why their balance changed. |
| `operator-withdraw-view.tsx` | Withdrawal page reads `availableBalance`. Without proper ledger entries, internal audits cannot reconcile `availableBalance` changes to any recorded business event. |
| `packages/db/src/services/SnapshotService.ts` | Snapshots record balance at a point in time. If `postedBalance` is updated by raw SQL instead of via `AccountingEngine`, snapshots and live balances will diverge. |
| Admin financial reporting | Any admin-side reconciliation that joins `FinancialTransaction` to `LedgerEntry` will have gaps for the escrow release event. |

### How to Fix the Issue
1. Confirm `AccountingEngine("ESCROW_RELEASE")` is called correctly (currently appears to be in place).
2. Verify `LedgerEntry` rows are written per hold group batch.
3. Verify the idempotency key `ESCROW_RELEASE_{hgId}_{sortedBookingIds}` is stable across retry runs.
4. Add an integration test: run the cron twice for the same hold group and confirm the second run is a no-op (no duplicate `FinancialTransaction`).

### How to Fix Each Side Effect
- **Revenue view:** No code change needed if `ESCROW_RELEASE` entries are written correctly; the ledger tab will automatically show them.
- **Withdraw view:** Confirm `availableBalance` is read from the DB after the cron — already correct since `getAccountSnapshot` fetches live.
- **Snapshot service:** Snapshots run after cron in the Vercel schedule order — no change needed as long as the engine commits before snapshots run.

---

## C2 — Concurrent release-escrow can double-credit available balance

### What Is Wrong
If two cron invocations run simultaneously (e.g., Vercel runs a retry while the first is still in-flight), both can read `clearedAt: null` for the same bookings, both pass the `stillOpen` check, and both execute the `AccountingEngine.commit()` call, resulting in two `ESCROW_RELEASE` transactions for the same hold group.

**Current code (lines 127–182 of `release-escrow/route.ts`):** The inner `$transaction` does a `findMany` for `clearedAt: null` inside the transaction, but it does **not** use `SELECT ... FOR UPDATE` on those booking rows, so two concurrent transactions can both observe the same set of open booking IDs.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `operator-withdraw-view.tsx` | Operator `availableBalance` is inflated by the duplicate release amount. Operator can withdraw money they have not earned. |
| `operator-revenue-view.tsx` | Ledger shows duplicate `ESCROW_RELEASE` journal entries for the same hold group — revenue figures are double-counted. |
| `packages/db/src/services/AccountingEngine.ts` | The idempotency key on `LedgerEntry` (`ESCROW_RELEASE_{hgId}_{...}`) should cause a `P2002` unique violation on the second run **if** the key is truly unique. Verify that the ledger entry `idempotencyKey` unique constraint exists in the Prisma schema. |
| `apps/web/app/api/cron/snapshot-accounts` | Snapshot will capture the inflated balance as "correct," masking the error from future reconciliation. |

### How to Fix the Issue
1. Inside the `$transaction` block, replace `findMany` with `SELECT ... FOR UPDATE` via `$queryRaw` on the booking rows to take an exclusive row-level lock before reading `clearedAt`.
2. After locking, re-check `clearedAt: null` as a filter — if zero rows come back, return early (another transaction beat us).
3. Rely on the `LedgerEntry.idempotencyKey` unique index as the final safety net: if the engine somehow commits despite the row lock, the unique violation will cause a clean rollback.
4. Add a Postgres advisory lock at the company level (`pg_try_advisory_xact_lock(companyId hash)`) as a belt-and-suspenders guard.

### How to Fix Each Side Effect
- **Withdraw view:** No UI change needed; the balance fix resolves this automatically.
- **Revenue ledger:** No UI change; duplicate entries are prevented by the lock + idempotency key.
- **Snapshot service:** Schedule cron after escrow release completes — Vercel's cron schedule already handles ordering; document it.

---

## C3 — CASH/VOUCHER cancel does not claw back operator escrow net

### What Is Wrong
In `cancellation-service.ts`, the `CASH`/`VOUCHER` branch (lines 215–268) now **does** call `engine.addDebit` on `opAcct.id` with `releaseFromReserve`. Reading the current code confirms the operator net clawback is present for offline channels. 

**Re-verify needed:** Confirm `getOfflineRefundPayableAccount()` exists in `FinancialAccountService`. If the method doesn't exist, the CASH path will throw at runtime without appearing in type errors (depends on the return type).

**Remaining real issue:** When `booking.clearedAt !== null` (trip already arrived, escrow released), `releaseFromReserve` is `false`, meaning the debit hits `availableBalance`. But if `availableBalance` is already 0 (all withdrawn), this fails the solvency check and the cancellation is rejected. The operator can block their own refund flow by withdrawing everything first.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `trpc/routers/operator.ts` → `cancelBooking` | Operator-initiated CASH cancellation calls `CancellationService`. If the operator net debit fails due to zero available balance (post-withdrawal), the cancellation throws a 500. The booking stays CONFIRMED, the refund row is never written. |
| `lib/cancel-trip-with-refunds.ts` | Uses `CancellationService` for trip-level mass cancel. If any single CASH booking's clawback fails, that booking is force-cancelled with no ledger entry (the catch block at line 127 only sets `status: "CANCELLED"` without accounting). |
| `trpc/routers/payments.ts` → `cancelBooking` (passenger path) | Passenger-initiated cancellation also routes here for CASH bookings. Same failure mode. |
| `operator-bookings-view.tsx` | Cancel button shows success toast but the booking may remain CONFIRMED if the clawback throws. |

### How to Fix the Issue
1. When `booking.clearedAt !== null` (escrow already released), the operator net is now in `availableBalance`. The debit should **not** use `releaseFromReserve`. The current code already branches on `clearedAt` for this — verify it correctly sets `releaseFromReserve = (clearedAt === null)`.
2. Add a fallback: if `availableBalance` is insufficient but `reservedBalance` is sufficient (or vice versa), check both buckets. The `AccountingEngine` already validates the correct bucket via its `update.reservedDelta < 0n && newReservedBalance < 0n` check — make sure the operator account has `allowNegativeBalance: true` only if you intend to allow overdrafts; otherwise reject the cancellation gracefully.
3. Verify `getOfflineRefundPayableAccount()` is implemented in `FinancialAccountService.ts`. If not, add it (or reuse an existing clearing/payable account).

### How to Fix Each Side Effect
- **operator.ts cancelBooking:** Wrap in a try/catch that returns a user-friendly error ("Insufficient operator balance to process this refund — please contact support") instead of a 500.
- **cancel-trip-with-refunds.ts:** The force-cancel catch block should write a `FinancialTransaction` with type `CANCEL_WITHOUT_REFUND` explaining why the refund failed, so ops can audit it.
- **payments.ts cancelBooking:** Same defensive wrapper as above.
- **UI:** Show a specific error badge on the cancellation dialog when the operator's balance is the cause.

---

## C6 — Card booking confirmation lacks ledger idempotency

### What Is Wrong
`booking-confirmation-service.ts → confirmFromPayment` (lines 66–192) uses `holdGroup.updateMany({ where: { status: "ACTIVE" } })` as its optimistic guard. If two requests arrive simultaneously (webhook + client verify endpoint), both can read `status: "ACTIVE"`, but only one will win the `updateMany` race (since `updateMany` is not atomic with a compare-and-swap under serializable isolation by default in Postgres).

The `AccountingEngine` is called with `idempotencyKey: CARD_BOOKING_{holdGroup.id}`. The `LedgerEntry.idempotencyKey` unique constraint **is** the final guard — if it exists in the schema. If the constraint is missing, two `BOOKING` transactions can be written for the same hold group.

**Reading the current code:** The `holdGroup.updateMany` happens **inside** the `$transaction`. If both concurrent requests enter the transaction simultaneously, the first one to commit will set `status: "CONFIRMED"`, and the second one's `updateMany` will return `count: 0`, causing it to re-fetch and return the existing bookings. This is **partially correct** — but there's a race between the `updateMany` and the subsequent `AccountingEngine.commit` that is not fully serializable.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `apps/web/app/api/payments/route.ts` (webhook) | Paystack sends `charge.success` webhook. If it arrives while the client's `/verify` is mid-transaction, both can commit. |
| `apps/web/app/api/payments/route.ts` (reconcile-payments cron) | Cron also calls `confirmFromPayment`. Three simultaneous callers are possible. |
| `operator.getRevenueAnalytics` | Revenue analytics sums `BOOKING` ledger entries. Duplicate entries double-count revenue. |
| `operator-withdraw-view.tsx` | Operator `reservedBalance` is inflated by the duplicate BOOKING credit. |
| Passenger's booking list | Duplicate `CONFIRMED` bookings can appear if `booking.updateMany` also races. |

### How to Fix the Issue
1. Ensure `LedgerEntry.idempotencyKey` has a `@@unique` constraint in `schema.prisma`. Check `packages/db/prisma/schema.prisma`.
2. On `P2002` from the engine commit, treat it as success (the first commit won) and re-fetch the confirmed bookings to return to the caller.
3. Add `isolation: Prisma.TransactionIsolationLevel.Serializable` to the `$transaction` call in `confirmFromPayment` to prevent phantom reads between the `updateMany` and `engine.commit`.

### How to Fix Each Side Effect
- **Webhook vs verify race:** Both callers will hit the same `P2002` safety net. The second to commit catches it and returns the already-confirmed bookings — no user-facing change needed.
- **Revenue analytics:** Correct data if duplicate entries are prevented by the constraint.
- **Operator withdraw / reserved balance:** Correct automatically once double-posting is prevented.

---

## C7 — AccountingEngine solvency ignores reserved when releaseFromReserve

### What Is Wrong
In `AccountingEngine.ts` lines 224–232, the solvency check is:
```ts
if (update.reservedDelta < 0n && newReservedBalance < 0n) { throw ... }
if (update.availableDelta < 0n && newAvailableBalance < 0n) { throw ... }
```
This **looks correct** — but verify the `releaseFromReserve` path actually sets `reservedDelta` (not `availableDelta`) for the debit. Reading lines 180–186: `releaseFromReserve && DEBIT` sets `current.reservedDelta += increment` where `increment` is negative for a liability account (operator receivable is a **liability** — credit balance increases it). 

**The actual bug:** For a liability account, a DEBIT has `isAssetOrExpense = false`, so `increment = -amountBig`. When we add this to `reservedDelta`, we get `reservedDelta = -amount`. But the solvency check is `newReservedBalance < 0n` where `newReservedBalance = currentReserved + reservedDelta = currentReserved - amount`. If `currentReserved < amount`, this correctly throws. **This seems right.**

**What actually needs fixing:** The pre-check at `confirmFromWallet` (line 246) reads `availableBalance` before the transaction. For a pre-departure WALLET refund, we need to debit the operator's `reservedBalance`. But the pre-check compares against `availableBalance`, which can be 0 even though `reservedBalance` is sufficient. This causes legitimate refunds to fail.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `booking-confirmation-service.ts → confirmFromWallet` | Pre-departure wallet refund fails if operator has withdrawn all available balance but still has reserved balance for the trip. |
| `cancellation-service.ts` | Same issue — if `availableBalance` is 0, the WALLET cancel throws even though the reserved bucket has the funds. |
| `operator-withdraw-view.tsx` | Operators can withdraw all available balance without realizing it will block future pre-departure refunds. |

### How to Fix the Issue
1. In `AccountingEngine.commit`, for entries with `releaseFromReserve = true`, branch the solvency check to validate `reservedBalance - amount >= 0` (not `availableBalance`). **Currently this check appears correct** in the engine — the issue is with pre-checks outside the engine.
2. Remove the pre-check at `confirmFromWallet` line 246 (`walletAcctPreview.availableBalance < BigInt(totalToPay)`). Trust the engine's row-locked solvency check instead. This eliminates the TOCTOU and the wrong-bucket problem simultaneously (also fixes H24).
3. In `cancellation-service.ts`, remove any pre-check on the operator account balance before the transaction. Let the engine enforce solvency under the row lock.

### How to Fix Each Side Effect
- **confirmFromWallet pre-check:** Remove lines 246–280 (the pre-check + low-balance Novu trigger). Move the low-balance Novu trigger to **after** a failed engine commit (in the catch block), so it is sent only when actually needed.
- **cancellation-service.ts:** No external pre-check currently exists — already relying on engine. Confirm and document.
- **Withdraw view:** Add a UI warning: "Withdrawing available balance may prevent refund processing for pre-departure cancellations." No code change needed in the engine.

# 21 - Failure Scenarios & Recovery Protocols

[⬅️ Back to README](./README.md)

---

Financial systems are correct not because failures never happen, but because every possible failure has a known recovery path. This document is the canonical failure catalog for the Moja Ride payment system.

For each scenario, we specify: the failure state, the detection mechanism, the recovery action, and the invariants that must hold afterward.

---

## Failure Classification

| Class | Description | Examples |
|---|---|---|
| **Type A: Idempotent** | The same operation can be safely retried | Duplicate webhook, network timeout |
| **Type B: Atomic Rollback** | The DB ensures all-or-nothing | DB crash mid-transaction |
| **Type C: Compensating** | A new transaction must reverse the first | Payout succeeds, then must be refunded |
| **Type D: Manual Investigation** | Cannot be auto-recovered; requires human | Multi-day reconciliation mismatch |

---

## 1. Paystack API Timeout (Status Unknown)

**Classification:** Type A (Idempotent)

**Scenario:** The platform calls `POST /transaction/initialize` (to create a checkout). The HTTP connection times out after 30 seconds. Did Paystack receive the request or not?

**State at failure:**
- Our `ExternalPayment` record: `status = INITIALIZED`
- Paystack's state: **Unknown**

**Detection:** Timeout error thrown by HTTP client.

**Recovery:**
1. The platform attempts a retry with the **exact same `reference`** (idempotency key).
2. Paystack is idempotent on `reference`: if it already created the transaction, it returns the existing `authorization_url`.
3. If Paystack returns a fresh transaction, it was not processed before.
4. Either way, the passenger gets a valid checkout URL.

**Invariant that holds:** No double-charge. No lost payment. One charge per `reference`.

---

## 2. Paystack Charge Success, Webhook Never Arrives

**Classification:** Type A (Idempotent)

**Scenario:** The passenger completes payment. Paystack's charge is successful. The webhook delivery infrastructure fails. Our system never receives `charge.success`.

**State at failure:**
- `ExternalPayment.status = PENDING`
- `HoldGroup.status = ACTIVE` (seats still held)
- Passenger's money: deducted from their bank

**Detection:** The `reconcile-payments` cron runs every 5 minutes. It finds `ExternalPayment` records where `status = PENDING` and `createdAt > 5 minutes ago`.

**Recovery:**
1. For each stale PENDING payment, the cron calls `GET /transaction/verify/:reference`.
2. If Paystack responds `status: success` and the HoldGroup is **still ACTIVE**:
   - Trigger `BookingConfirmationService.confirmFromPayment()` as if the webhook arrived
   - Passenger receives ticket confirmation
3. If Paystack responds `status: success` but the HoldGroup is **EXPIRED**:
   - Trigger `BookingConfirmationService.rescueOrphanedPayment()`
   - Money is credited to `PASSENGER_WALLET` via `ORPHANED_PAYMENT_RESCUE` transaction

**Invariant that holds:** Passenger is never charged without receiving either a ticket or a wallet refund.

---

## 3. Database Crash During Ledger Transaction

**Classification:** Type B (Atomic Rollback)

**Scenario:** The `AccountingEngine` begins a `prisma.$transaction`. It has successfully written 2 `LedgerEntry` rows. Before writing the 3rd entry, the PostgreSQL server crashes (OOM killer, disk failure, etc.).

**State at failure:**
- 2 LedgerEntry rows: potentially in memory but uncommitted WAL
- `FinancialAccount` balances: unchanged

**Detection:** The Node.js process receives a TCP connection error when it tries to write the 3rd entry.

**Recovery:**
1. PostgreSQL ACID guarantees: since `COMMIT` was never received, PostgreSQL's crash recovery rolls back all in-memory writes on restart.
2. The 2 LedgerEntry rows that were written in-memory are discarded.
3. The Node.js transaction throws an error.
4. The calling function (e.g., `BookingConfirmationService`) catches the error and returns HTTP 500 to Paystack.
5. Paystack retries the webhook. The next invocation finds the WebhookEvent table does NOT have an entry (the `WebhookEvent` insert was inside the same failed transaction), so it processes normally.

**Wait** — actually the `WebhookEvent` insert happens BEFORE the `prisma.$transaction` in most implementations. Let's clarify:

**Corrected Recovery:**
- The `WebhookEvent` insert is usually a pre-flight check, NOT inside the main accounting transaction.
- If the `WebhookEvent` was committed but the accounting `prisma.$transaction` failed, the WebhookEvent row exists.
- On Paystack's retry, the idempotency check finds the existing `WebhookEvent` and returns 200 OK without re-processing.
- **This is a problem**: the passenger didn't get their ticket, but the system considers the webhook "done."

**The correct implementation** must either:
1. Put the `WebhookEvent` insert INSIDE the accounting transaction (so it rolls back with the rest), OR
2. Check for a "processed" flag on `WebhookEvent` (not just existence), and reprocess if unprocessed

**Invariant that holds:** The ledger is always consistent. Either all entries exist or none exist.

---

## 4. Server Crash After Webhook Received, Before Ledger Post

**Classification:** Type A (Idempotent, via Paystack retry)

**Scenario:** The HMAC signature is verified. The `WebhookEvent` is inserted. Before `AccountingEngine.commit()` is called, the Node.js server runs out of memory and crashes (OOM kill).

**State at failure:**
- `WebhookEvent`: created (if insert was committed before crash)
- `FinancialTransaction`: not created
- `LedgerEntry`: not created
- Passenger: no ticket

**Detection:** Paystack receives a TCP connection reset or no HTTP 200 response. Paystack's retry policy triggers.

**Recovery:**
1. Server restarts.
2. Paystack sends the webhook again (typically within 2 minutes).
3. The idempotency check finds the `WebhookEvent` row.
4. If the `WebhookEvent` is marked as "not fully processed" (or if the accounting transaction was not inside the same DB transaction as `WebhookEvent`), reprocessing occurs.

**Critical implementation note:** The `WebhookEvent.processedAt` field should be `NULL` until the accounting transaction commits. The cron job can detect `WebhookEvent` rows where `processedAt IS NULL AND receivedAt < 5 minutes ago` and reprocess them.

**Invariant that holds:** Passenger always gets a ticket or a refund.

---

## 5. Duplicate Webhook Storm

**Classification:** Type A (Idempotent)

**Scenario:** Paystack sends the exact same `charge.success` payload 1,000 times simultaneously (Paystack bug or retry storm).

**State at failure:**
- 1,000 concurrent Node.js processes race to process the same event

**Detection:** N/A — this is prevented proactively.

**Prevention:**
1. Every webhook handler immediately attempts:
   ```sql
   INSERT INTO webhook_event (idempotency_key, ...) VALUES ('PAYSTACK:charge.success:T123', ...)
   ```
2. The `idempotency_key` column has a `UNIQUE INDEX`.
3. The first insert succeeds. The other 999 fail with `UniqueConstraintViolation`.
4. The 999 failures catch the error, return HTTP 200 (so Paystack stops retrying), and halt.
5. Only the 1 successful process proceeds to `BookingConfirmationService`.

**Invariant that holds:** Exactly one booking confirmation per `charge.success` event.

---

## 6. Duplicate Payout Request (Double-Click / Race Condition)

**Classification:** Type A (Idempotent, via pessimistic lock)

**Scenario:** An operator clicks "Withdraw 50,000 XOF" and their internet connection is slow. They click it again before the first request returns. Two simultaneous requests hit the server.

**State at failure:**
- Two concurrent database transactions try to deduct from the same `availableBalance`

**Detection:** N/A — this is prevented proactively.

**Prevention (Pessimistic Lock):**
```sql
-- Both requests execute this. One wins, one waits.
SELECT "availableBalance" FROM "financial_account" WHERE id = 'acct_456' FOR UPDATE
```
1. Request A acquires the lock. Request B waits.
2. Request A reads `availableBalance = 50000`.
3. Request A deducts 50000. `availableBalance = 0`. Commits. Lock released.
4. Request B acquires the lock. Reads `availableBalance = 0`.
5. Request B fails validation: `0 < 50000`. Throws "Insufficient Funds."
6. Operator receives one success and one error. Only one payout was issued.

**Invariant that holds:** The operator can never receive more than their `availableBalance`.

---

## 7. Transfer Succeeds, Webhook Lost

**Classification:** Type A (detected by cron)

**Scenario:** Paystack executes the operator's bank transfer. The `transfer.success` webhook is never delivered to our server (Paystack webhook infrastructure failure).

**State at failure:**
- Operator's bank: +50,000 XOF
- Our ledger: `FinancialTransaction.status = CREATED` (never settled)
- `PAYSTACK_CLEARING`: still debited (correct)
- Operator's `availableBalance`: already decremented before the transfer call (correct)

**Detection:** The `reconcile-payments` cron detects `FinancialTransaction` rows where `type = OPERATOR_PAYOUT` AND `status = CREATED` AND `createdAt > 5 minutes ago`.

**Recovery:**
1. For each stale OPERATOR_PAYOUT transaction, the cron calls `GET /transfer/verify/:reference`.
2. If Paystack responds `status: success`:
   - Update `FinancialTransaction.status = SETTLED`
   - Update `ExternalPayment.status = SUCCESS`
3. The ledger now correctly reflects that the money left the platform.

**Invariant that holds:** The operator balance was already debited at Step 2 of the withdrawal flow. Whether or not we receive the webhook, the balance doesn't change. The cron merely updates the status for reporting accuracy.

---

## 8. Transfer Fails, Webhook Lost

**Classification:** Type C (Compensating transaction)

**Scenario:** The bank rejects Paystack's transfer (e.g., operator's bank account is closed). Paystack sends `transfer.failed`, but the webhook is lost.

**State at failure:**
- Operator's bank: no credit received
- Our ledger: `FinancialTransaction.status = CREATED`
- Operator's `availableBalance`: 0 (was debited during withdrawal)
- Money: physically still in Paystack's account

**Detection:** Same cron as above. `GET /transfer/verify/:reference` returns `status: failed`.

**Recovery (Compensating transaction):**
1. Cron triggers `PAYOUT_REVERSAL` transaction:
   ```
   DEBIT  PAYSTACK_CLEARING         = 50000 (re-claim the clearing credit)
   CREDIT OPERATOR_RECEIVABLE       = 50000 (restore to availableBalance)
   ```
2. `FinancialTransaction` (original): status → `FAILED`
3. `ExternalPayment`: status → `FAILED`
4. Operator notification: "Your withdrawal failed. Funds restored."

**Invariant that holds:** Operator never loses money due to a Paystack transfer failure. Funds are always restored.

---

## 9. Paystack's Daily Settlement Timing Mismatch

**Classification:** Type D (expected, not a bug)

**Scenario:** Paystack settles funds on a T+1 rolling basis. Our `PAYSTACK_CLEARING` balance shows 500,000 XOF, but Paystack's balance API shows 450,000 XOF. The difference is 50,000 XOF of today's charges that Paystack captured but hasn't credited to our balance yet.

**State:** Not a failure — this is expected.

**Detection:** Daily reconciliation reports a positive delta.

**Resolution:** Wait 24-48 hours. If the delta doesn't resolve, contact Paystack support.

---

## 10. Stale Pricing Attack (User Delays Payment)

**Classification:** Type A (prevented by HoldGroup expiry)

**Scenario:** A user initiates checkout at 10:00 AM when tickets cost 5,000 XOF. They wait until 11:00 AM (after the hold expires) and click "Pay", hoping the system uses the old price.

**State at failure:**
- `HoldGroup.status = EXPIRED` (expired after 10 minutes)
- Passenger expects old price, actual price is now higher

**Detection:** The `createHold` endpoint validates `HoldGroup.expiresAt` before initiating a payment.

**Recovery:**
1. The hold is expired. The system refuses to create a new payment for the old hold.
2. The passenger must create a new checkout, generating a fresh `PricingSnapshot` at the current price.
3. The passenger sees the updated price and must accept it.

**Invariant that holds:** Prices are always locked at a specific `PricingSnapshot.createdAt` timestamp. Old snapshots cannot be used for new payments.

---

## 11. Disk Full During Transaction Commit

**Classification:** Type B (Atomic Rollback)

**Scenario:** The database is committing a `prisma.$transaction`. The OS disk fills up during the WAL (Write-Ahead Log) flush. PostgreSQL cannot write the COMMIT record.

**Recovery:**
1. PostgreSQL aborts the transaction and rolls back all in-memory changes.
2. The Node.js process receives a fatal error.
3. The system returns an HTTP 500 error.
4. The ledger is exactly as it was before the transaction started.

**Post-recovery action:** The disk space issue must be resolved by ops before any further transactions can succeed.

---

## 12. Network Partition (Platform Isolated from Paystack)

**Classification:** Type A (handled by cron + retry)

**Scenario:** A network failure between the Moja Ride server and Paystack's API. All API calls fail with `ECONNREFUSED` or `ETIMEDOUT`.

**Impact:**
- New card payments: Fail immediately. Passengers cannot purchase via card. Wallet payments are unaffected (fully internal).
- In-flight webhooks: Lost (handled by reconcile-payments cron on reconnection).
- In-flight payouts: Status unknown (handled by reconcile-payments cron on reconnection).

**Recovery:**
1. Platform degrades gracefully: wallet payments continue.
2. When connectivity is restored, the `reconcile-payments` cron runs and recovers any stuck transactions.
3. No manual intervention required for most cases.

**Dashboard alert:** The platform should monitor Paystack API response times and trigger a P1 alert if 5+ consecutive API calls fail.

---

## 13. Power Outage (Complete Server Restart)

**Classification:** Type B (WAL guarantees recovery)

**Scenario:** The data center loses power. Both the Node.js server and the PostgreSQL database restart from scratch.

**Recovery for the Database:**
1. PostgreSQL uses WAL-based crash recovery.
2. On restart, PostgreSQL replays committed WAL records that were written before the crash.
3. Uncommitted transactions are rolled back.
4. The database returns to a consistent state.

**Recovery for In-Flight Requests:**
1. Any HTTP requests in progress when the server died receive TCP connection errors.
2. Clients (Paystack webhooks, operators, passengers) receive errors or timeouts.
3. They retry. The idempotency mechanisms handle duplicate retries.

**Recovery for Stuck States:**
1. After restart, the `reconcile-payments` cron immediately begins sweeping for stuck `ExternalPayment` records.
2. All PENDING transactions created before the crash are verified against Paystack and resolved.

**Invariant that holds:** The ledger is in a consistent, committed state after PostgreSQL crash recovery. No partial transactions persist.

---

## 14. Manual Adjustment Gone Wrong

**Classification:** Type C (Compensating transaction)

**Scenario:** An admin posts a `MANUAL_ADJUSTMENT` transaction to correct a perceived discrepancy, but makes a data entry error (e.g., adjusting the wrong account or wrong amount).

**Recovery:**
1. The admin posts a **second** `MANUAL_ADJUSTMENT` in the opposite direction.
2. The erroneous entries cannot be deleted (immutability principle).
3. Both the error and the correction exist permanently in the ledger.
4. The `description` field of both entries must clearly document what happened.

**Example:**
```
Erroneous transaction: DEBIT PASSENGER_WALLET:user_123, CREDIT PAYSTACK_CLEARING, amount: 5000, description: "Correction for wallet topup - wrong account!"
Correction:           DEBIT PAYSTACK_CLEARING, CREDIT PASSENGER_WALLET:user_456, amount: 5000, description: "Reversal of erroneous adjustment on 2024-01-15. See txn_wrong_id."
```

---

*See also: [10 - Concurrency](./10-concurrency.md) | [11 - Idempotency](./11-idempotency.md) | [07 - Reconciliation](./07-reconciliation.md)*

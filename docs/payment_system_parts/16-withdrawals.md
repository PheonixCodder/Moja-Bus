# 16 - Withdrawals

[⬅️ Back to README](./README.md)

---

The Withdrawal workflow (`OPERATOR_PAYOUT`) is the most dangerous operation in the platform. This is the moment money permanently leaves the closed loop of the ledger and goes into the real world.

If there is a race condition here, the platform loses its own money.

## The Core Danger: The Double-Click Race

Imagine an Operator has exactly 50,000 XOF in their `availableBalance`.
They open two browser tabs. They click "Withdraw All" on both tabs at the exact same millisecond.

If the backend does this:
1. `SELECT availableBalance` (Returns 50,000)
2. Verify `50,000 >= 50,000` (True)
3. Call Paystack to send 50,000.
4. `UPDATE availableBalance = availableBalance - 50,000`

Both requests will read 50,000. Both will call Paystack. Paystack will send 100,000. The database will subtract 50,000 twice, leaving the balance at -50,000. The operator just stole 50,000 XOF from Moja Ride.

## The Solution: Explicit Row-Level Locking

Moja Ride solves this entirely at the database level inside the `AccountingEngine`.

### Step 1: The Request
Operator requests 50,000 XOF.

### Step 2: The Transaction Boundary & Lock
The tRPC endpoint opens `prisma.$transaction`.
It immediately issues a raw SQL query:
```sql
SELECT "availableBalance" FROM "financial_account" WHERE id = 'OPERATOR_123' FOR UPDATE
```
**`FOR UPDATE`** is the magic command. It tells Postgres: "Lock this row. Do not let any other transaction read or write to this row until I am done."

If Tab 2 hits the database at the same time, it will freeze at Step 2 and wait.

### Step 3: Verification
The code checks if the locked `availableBalance >= 50,000`.

### Step 4: The Internal Ledger Post
The `AccountingEngine` is instantiated.
- Debit `OPERATOR_RECEIVABLE` by 50,000.
- Credit `PAYSTACK_CLEARING` by 50,000.
- Commit the transaction.

### Step 5: Lock Release
The transaction commits. The `availableBalance` is now 0. The row lock is released.

Tab 2, which was frozen, now wakes up. It executes Step 2 and reads the new balance: 0. Step 3 fails because `0 < 50,000`. Tab 2 throws a "Insufficient Balance" error.

**The attack is mathematically defeated.**

### Step 6: The External API Call
*Crucially, this happens AFTER the database transaction commits.*
The system calls `paystack.initiateTransfer(50000)`.

## Failure Scenarios

### Scenario A: Paystack API is down
The `initiateTransfer` call throws an HTTP 500.
- **Problem**: We already deducted the 50,000 from the operator in Step 4. They lost their money but didn't get a transfer.
- **Recovery**: The catch block immediately instantiates a `PAYOUT_REVERSAL` transaction in the ledger, restoring the 50,000 to the operator. It returns an error to the UI.

### Scenario B: Paystack accepts it, but the bank rejects it later
The API call succeeds. The `FinancialTransaction` is marked `POSTED`.
Three days later, the operator's bank rejects the transfer because the account number was wrong.
- **Recovery**: Paystack sends a `transfer.failed` webhook.
- The `PaymentService` routes it.
- A `PAYOUT_REVERSAL` is executed, crediting the operator's account back to 50,000.
- The `FinancialTransaction` is marked `FAILED`.

### Scenario C: The Network Black Hole
We call Paystack. The TCP connection drops. We don't know if Paystack received it or not. We throw an error to the user, but we CANNOT safely issue a `PAYOUT_REVERSAL` because Paystack might actually process it!
- **Recovery**: The `reconcile-payments` cron job.
- It finds the `POSTED` transaction stuck for > 5 minutes.
- It actively calls Paystack's `GET /transfer/:id` endpoint to verify the truth.
- If Paystack says it succeeded, it moves the status to `SETTLED`.
- If Paystack says it never received it, it issues the `PAYOUT_REVERSAL`.

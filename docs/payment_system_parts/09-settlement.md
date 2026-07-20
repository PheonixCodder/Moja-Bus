# 09. Settlement & Operator Payouts

[⬅️ Back to README](./README.md)

---

Settlement is the process of converting virtual operator earnings (internal ledger balances) into real money in an operator's bank account. This document explains the full lifecycle of a payout, from the operator's decision to withdraw through to funds arriving in their bank account.

---

## 1. The Distinction: Settlement vs. Escrow Release

These two terms are often confused.

| Concept | What it is | Trigger |
|---|---|---|
| **Escrow Release** | Moving funds from `reservedBalance` to `availableBalance` | Trip arrives + 24 hours (automated) |
| **Settlement/Payout** | Moving funds from `availableBalance` out of the platform to the operator's bank | Operator-initiated withdrawal (manual) |

Escrow release is a virtual state change inside the Moja Ride ledger.
Settlement is real money leaving the platform via Paystack Transfers.

---

## 2. Prerequisites for Settlement

An operator can only settle if all of the following are true:

1. **`availableBalance > 0`**: There are unlocked funds to withdraw.
2. **`account.status === 'ACTIVE'`**: The account has not been frozen or suspended.
3. **Recipient is configured**: A valid Paystack Transfer Recipient code exists for the operator's bank account.
4. **Amount ≥ minimum withdrawal**: A configurable minimum threshold (typically 5,000 XOF) must be met.

---

## 3. The Settlement Flow (Step by Step)

### Step 1: Operator Request

The operator initiates a withdrawal via the dashboard. The request contains:
- `amount`: How much to withdraw (must be ≤ `availableBalance`)
- The request is authenticated by the operator's session token

### Step 2: Pessimistic Lock and Ledger Debit

The platform immediately debits the ledger **before** calling Paystack. This is intentional: it prevents the double-withdrawal race condition.

```typescript
await prisma.$transaction(async (tx) => {
  // Step 2a: Acquire exclusive row lock
  const account = await tx.$queryRaw`
    SELECT "availableBalance" FROM "financial_account"
    WHERE id = ${operatorAccountId}
    FOR UPDATE
  `;

  // Step 2b: Validate funds
  if (account.availableBalance < amount) {
    throw new Error('Insufficient funds');
  }

  // Step 2c: Create the FinancialTransaction
  const txn = await tx.financialTransaction.create({
    data: {
      type: 'OPERATOR_PAYOUT',
      amount: amount,
      status: 'CREATED',
      description: `Operator withdrawal request for ${companyName}`,
      initiatedBy: operatorUserId,
    }
  });

  // Step 2d: Create the LedgerEntries (double-entry)
  await tx.ledgerEntry.createMany({
    data: [
      {
        transactionId: txn.id,
        financialAccountId: operatorAccountId,
        direction: 'DEBIT',
        amount: amount,
        idempotencyKey: `PAYOUT_DEBIT_${txn.id}`,
      },
      {
        transactionId: txn.id,
        financialAccountId: paystackClearingAccountId,
        direction: 'CREDIT',
        amount: amount,
        idempotencyKey: `PAYOUT_CREDIT_${txn.id}`,
      }
    ]
  });

  // Step 2e: Atomically update the account balance
  await tx.financialAccount.update({
    where: { id: operatorAccountId },
    data: { availableBalance: { decrement: amount } }
  });

  // Step 2f: Create the ExternalPayment record (PENDING)
  await tx.externalPayment.create({
    data: {
      type: 'PAYOUT',
      status: 'PENDING',
      amount: amount,
      reference: `TX-MOJ-${txn.id}`,
      financialTransactionId: txn.id,
    }
  });
});
// Lock is released here. Other requests can now read the updated balance.
```

### Step 3: Call Paystack Transfer API

**After the database transaction commits**, the platform calls Paystack:

```typescript
const response = await paystack.post('/transfer', {
  source: 'balance',
  amount: amount * 100, // Convert to minor units (pesewas/kobo)
  recipient: operatorRecipientCode,
  reason: `Moja Ride payout TX-MOJ-${financialTransactionId}`,
  reference: `TX-MOJ-${financialTransactionId}`,
});
```

### Step 4: Paystack Async Processing

Paystack does not transfer money instantly. The Transfer API response returns immediately with a `transfer_code`, but the actual bank transfer happens asynchronously:

```
API Response: { status: true, data: { transfer_code: 'TRF_xyz' } }

[Banking rails processing: 1 minute to several hours]

Paystack Webhook: POST /webhook { event: 'transfer.success' }
           OR
Paystack Webhook: POST /webhook { event: 'transfer.failed' }
```

### Step 5a: Transfer Success Path

When the `transfer.success` webhook arrives:

1. Signature is verified
2. `WebhookEvent` is created (idempotency gate)
3. `ExternalPayment` status → `SUCCESS`
4. `FinancialTransaction` status → `SETTLED`
5. `PAYSTACK_CLEARING.postedBalance` decrements by the payout amount

The money has now left the Moja Ride ecosystem. The operator's bank account reflects the credit.

### Step 5b: Transfer Failure Path

When the `transfer.failed` webhook arrives (or the cron detects a stuck payout):

1. Signature is verified
2. `WebhookEvent` is created
3. A `PAYOUT_REVERSAL` transaction is posted:
   ```
   DEBIT  PAYSTACK_CLEARING          = amount (re-claim the clearing debit)
   CREDIT OPERATOR_RECEIVABLE        = amount (return to availableBalance)
   ```
4. `ExternalPayment` status → `FAILED`
5. The operator's `availableBalance` is restored

The operator sees the failure in their dashboard and can retry.

---

## 4. Platform Revenue Architecture

The platform does not directly "take" money from the settlement flow. Revenue was already recognized at the time of booking.

When a `BOOKING` transaction is posted:
```
CREDIT PLATFORM_COMMISSION       = commission amount  → revenue recognized immediately
CREDIT PLATFORM_CONVENIENCE_FEE = fee amount          → revenue recognized immediately
```

These credit entries increase the `postedBalance` of `PLATFORM_COMMISSION` and `PLATFORM_CONVENIENCE_FEE` accounts. These are **Platform-owned Revenue accounts**.

The platform's total revenue is queryable at any time:
```sql
SELECT SUM(le.amount) as total_revenue
FROM ledger_entry le
JOIN financial_account fa ON fa.id = le."financialAccountId"
WHERE fa."accountCategory" = 'REVENUE'
  AND fa."ownerType" = 'PLATFORM'
  AND le.direction = 'CREDIT'
  AND le."createdAt" BETWEEN '2024-01-01' AND '2024-12-31';
```

### Revenue → Cash: The Transfer Batch

The platform's Paystack balance includes both operator receivables AND platform revenue (since all money flows through the same Paystack account).

When the platform wants to move its own revenue to the corporate bank, it executes an internal settlement:
1. Admin initiates a "Platform Revenue Withdrawal"
2. A `MANUAL_ADJUSTMENT` transaction moves funds from `PLATFORM_COMMISSION` to `PAYSTACK_CLEARING`
3. A standard Paystack transfer is executed to the corporate bank
4. `PAYSTACK_CLEARING` is debited on transfer success

---

## 5. Recipient Management

Before any payout can be made, the operator must register their bank account with Paystack to receive a **Recipient Code**.

This is a one-time process:
1. Operator submits bank account details (bank code, account number)
2. Platform calls `POST /transferrecipient` on Paystack's API
3. Paystack validates the bank account and returns a `recipient_code`
4. The `recipient_code` is stored on the `Company` model
5. All future payouts use this code

**Security note:** The platform never stores actual bank account numbers. Only the Paystack Recipient Code is stored. The actual account number is encrypted and managed by Paystack's PCI-compliant infrastructure.

---

## 6. Partial Payouts and Balance Validation

The platform supports partial payouts (withdrawing less than `availableBalance`).

The validation rule:
```typescript
if (requestedAmount > account.availableBalance) {
  throw new BadRequestError('Cannot withdraw more than available balance');
}
if (requestedAmount < MINIMUM_WITHDRAWAL_AMOUNT) {
  throw new BadRequestError(`Minimum withdrawal is ${MINIMUM_WITHDRAWAL_AMOUNT} XOF`);
}
```

After a partial payout:
- `availableBalance` decreases by `requestedAmount`
- `reservedBalance` is unchanged
- The remaining `availableBalance` can be withdrawn in subsequent requests

---

## 7. Operator Arrears (Negative `availableBalance`)

Under normal operation, `availableBalance` never goes below 0 (enforced by the `if (requestedAmount > availableBalance)` check).

However, there is one scenario where `availableBalance` can go negative:

**Scenario:** An operator withdraws their full balance. Hours later, a passenger disputes a trip that already had its escrow released. The `REFUND` transaction must debit the operator's `OPERATOR_RECEIVABLE`.

In this case:
- `allowNegativeBalance = true` on `OPERATOR_RECEIVABLE` accounts
- `availableBalance` goes negative (e.g., -5,000 XOF)
- Future ticket sale receipts (escrow releases) first fill the negative balance before becoming withdrawable

This is the "Operator Arrears" state. The platform is effectively extending the operator a short-term credit facility automatically.

**Dashboard behavior:** The operator sees `Available to Withdraw: 0 XOF` and `Outstanding Debt: 5,000 XOF`. The system automatically deducts the debt from future releases.

---

## 8. Failed Payout Retry Protocol

If a payout fails:
1. The `PAYOUT_REVERSAL` immediately restores the `availableBalance`
2. The `ExternalPayment` is marked `FAILED`
3. The operator sees an error notification
4. The operator can retry withdrawal from their dashboard (creates a new `OPERATOR_PAYOUT` transaction)

There is no automatic retry. This is intentional:
- Automatic retries on failed bank transfers can be dangerous (double-send if Paystack had a confirmation bug)
- The operator must explicitly confirm they still want the withdrawal
- This gives the platform time to investigate why the transfer failed before re-attempting

---

*See also: [06 - Escrow](./06-escrow.md) | [07 - Reconciliation](./07-reconciliation.md) | [16 - Withdrawals](./16-withdrawals.md)*

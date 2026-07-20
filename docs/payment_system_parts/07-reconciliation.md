# 07. Reconciliation: Does Our Ledger Match Reality?

[⬅️ Back to README](./README.md)

---

Reconciliation is the process of verifying that the internal Moja Ride ledger matches the external reality at Paystack. Every mature financial platform must be able to answer: **"Is every cent we think we have actually sitting in our bank account?"**

This document explains the reconciliation strategy, the data flows, and the exact protocol for detecting and resolving mismatches.

---

## 1. The Reconciliation Problem

The Moja Ride platform is not a bank. It is a ledger that *models* money held by a third party (Paystack). This creates a fundamental verification gap:

```
What We Think We Have (Internal Ledger)
         vs.
What Paystack Actually Holds (External Reality)
```

These two numbers can diverge due to:

| Cause | Description |
|---|---|
| Lost webhook | Paystack confirms a charge, webhook never arrives |
| Lost transfer confirmation | Paystack completes a transfer, webhook never arrives |
| Paystack bug | Paystack debits an incorrect amount from the platform balance |
| Our bug | We double-post a ledger entry |
| Manual intervention | An admin posts an adjustment without corresponding gateway action |
| Timing | A webhook is in-flight while reconciliation runs |

---

## 2. The Reconciliation Model

### Internal State: The Ledger

The internal ledger tracks two primary clearing positions:

**`PAYSTACK_CLEARING` (Asset Account)**
This account represents all money we believe Paystack holds on our behalf:
- **Increases** on every `charge.success` (inbound) by `(charge - paystack_fee)`
- **Decreases** on every `transfer.success` (outbound) by `transfer_amount`

The `postedBalance` of `PAYSTACK_CLEARING` is our internal view of the Paystack balance.

### External State: The Paystack API

Paystack exposes these verification endpoints:
- `GET /balance` — Returns the current settled balance in Paystack's system
- `GET /transaction/verify/:reference` — Verifies individual charge status
- `GET /transfer/verify/:reference` — Verifies individual transfer status

### The Expected Invariant

At any given moment:

```
PAYSTACK_CLEARING.postedBalance ≈ Paystack.balance
```

The `≈` (approximately equal) is intentional. There is always a small in-flight window:
- Charges captured but not yet webhoooked to us (in-flight +)
- Transfers issued but not yet confirmed (in-flight -)

A healthy system's delta should be small (under 5% of total balance) and trending toward zero over time.

---

## 3. Layer 1: Transactional Reconciliation (Real-Time)

The first and most powerful reconciliation mechanism runs *before* every state mutation.

When the `PaymentService` receives a `charge.success` webhook, it doesn't trust the webhook payload alone. It:

1. Extracts the `reference` from the webhook
2. Calls `GET /transaction/verify/:reference` on Paystack's API
3. **Only proceeds if Paystack confirms: `status === "success"`**

This prevents a common attack vector where an attacker forges a `charge.success` webhook to receive goods/services without paying.

**Cost:** One extra API call per webhook (negligible at scale; critical for security).

---

## 4. Layer 2: Cron-Based Operational Reconciliation (Every 5 Minutes)

The `reconcile-payments` cron is the automated recovery mechanism for lost webhooks.

### Phase 1: Inbound Reconciliation (Charges)

**Target:** `ExternalPayment` rows where `status = PENDING` AND `createdAt < 5 minutes ago`

These are payments that were initiated but never received a confirming webhook.

```
For each stale PENDING ExternalPayment:
  1. Call Paystack: GET /transaction/verify/:reference
  2. If SUCCESS → trigger confirmFromPayment() or rescueOrphanedPayment()
  3. If FAILED/ABANDONED → mark ExternalPayment as FAILED, release hold
  4. If STILL_PENDING → leave it alone (Paystack processing)
```

**Why 5-minute delay?** Paystack can take up to 2-3 minutes to deliver webhooks under load. Waiting 5 minutes prevents a thundering herd of unnecessary API calls for normally-delivered webhooks.

### Phase 2: Outbound Reconciliation (Transfers/Payouts)

**Target:** `FinancialTransaction` rows where `type = OPERATOR_PAYOUT` AND `status IN [CREATED, POSTED]` AND `createdAt < 5 minutes ago`

These are payouts that were issued but whose completion status is unknown.

```
For each stale OPERATOR_PAYOUT:
  1. Call Paystack: GET /transfer/verify/:reference
  2. If SUCCESS → mark FinancialTransaction as SETTLED
  3. If FAILED/REVERSED → execute PAYOUT_REVERSAL to return funds to operator
  4. If PENDING → leave it alone (transfer in banking rails)
```

**Why this matters:** Without this phase, a failed transfer could leave the operator's `availableBalance` permanently depleted while Paystack never completed the payment.

---

## 5. Layer 3: Daily Balance Reconciliation (Manual/Scheduled)

This is the highest-level reconciliation, comparing aggregate totals.

### The Procedure

Every night (or on demand), run:

```typescript
// Step 1: Get our internal view
const internalBalance = await prisma.financialAccount.findFirst({
  where: { accountClass: 'PAYSTACK_CLEARING' }
});
const ourView = internalBalance.postedBalance;

// Step 2: Get Paystack's view
const paystackResponse = await paystack.get('/balance');
const paystackView = paystackResponse.data[0].balance; // In kobo/pesewas

// Step 3: Compare
const delta = ourView - paystackView;
console.log(`Reconciliation delta: ${delta} XOF`);

// Step 4: Alert if outside tolerance
const TOLERANCE = ourView * 0.001; // 0.1% tolerance
if (Math.abs(delta) > TOLERANCE) {
  alertEngineering(`RECONCILIATION MISMATCH: ${delta} XOF`);
}
```

### Acceptable Deltas

A delta is acceptable if it is:
- **Positive and small**: We believe we have slightly more than Paystack shows. Likely: in-flight charge webhooks not yet delivered.
- **Negative and small**: We believe we have slightly less than Paystack shows. Likely: Paystack processed a settlement that hasn't been webhoooked yet.

A delta is **a crisis** if it is:
- **Large and positive**: We posted money we don't have. Possible ledger bug.
- **Large and negative**: Paystack has more money than we think. Possible missed charges.
- **Increasing over multiple days**: A systematic error, not a timing issue.

---

## 6. Layer 4: Transaction-Level Audit (Investigative)

When a mismatch is detected, the investigation requires matching each Paystack event to a corresponding ledger entry.

### The Matching Ledger

Every `LedgerEntry` stores the `externalPaymentId` that caused it. Every `ExternalPayment` stores the `reference` (Paystack's transaction ID).

This means for any Paystack event, you can reconstruct the chain:

```
Paystack Reference: T92384912
  → ExternalPayment.reference = 'T92384912'
  → ExternalPayment.id = 'ext_abc123'
  → LedgerEntry where externalPaymentId = 'ext_abc123'
  → FinancialTransaction where id = LedgerEntry.transactionId
```

### Investigation Queries

**"Find all Paystack charges without a corresponding ledger entry":**
```sql
SELECT ep.reference
FROM external_payment ep
LEFT JOIN ledger_entry le ON le."externalPaymentId" = ep.id
WHERE ep.status = 'SUCCESS'
  AND le.id IS NULL;
```

**"Find all ledger entries without a corresponding Paystack charge":**
```sql
SELECT le.*
FROM ledger_entry le
LEFT JOIN external_payment ep ON ep.id = le."externalPaymentId"
WHERE le.direction = 'DEBIT'
  AND le."accountClass" = 'PAYSTACK_CLEARING'
  AND ep.id IS NULL;
```

---

## 7. Reconciliation and the Paystack Settlement Cycle

Paystack does not transfer money to us instantly. They use a **T+1 settlement cycle**:
- Money charged today arrives in our bank account tomorrow.
- Our Paystack balance is the *unsettled* float, not our bank account.

This creates a second layer of reconciliation: **Paystack Balance vs. Bank Account Balance.**

This is handled outside the Moja Ride system by:
1. Accounting software (Quickbooks/Xero) that pulls bank statements
2. Manually comparing Paystack's "Settlement" history to bank deposits

The Moja Ride ledger only tracks the Paystack balance layer, not the bank account layer. The accounting department owns the bank reconciliation.

---

## 8. What Cannot Be Auto-Reconciled

Some mismatches require human intervention:

| Scenario | Why Manual? |
|---|---|
| Paystack charges a platform fee that differs from expected | Requires Paystack support ticket |
| FX conversion mismatch (if multi-currency) | Requires bank confirmation |
| Fraudulent chargeback processed by Paystack | Requires admin manual `MANUAL_ADJUSTMENT` transaction |
| Paystack refunded a charge without our knowledge | Requires `PAYSTACK_REFUND` transaction posted manually |

For each of these, the resolution path is always the same:
1. Identify the delta amount
2. Post a `MANUAL_ADJUSTMENT` transaction through the `AccountingEngine`
3. Document the reason in the `FinancialTransaction.description` field
4. Log in the audit trail

---

*See also: [04 - Ledger Philosophy](./04-ledger-philosophy.md) | [08 - Audit](./08-audit.md) | [Cron: Reconcile Payments](./17-implementation/crons/reconcile-payments.md)*

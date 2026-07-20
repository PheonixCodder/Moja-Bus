# 17 - Transaction Type Catalog (Complete)

[⬅️ Back to README](./README.md)

---

Every `FinancialTransaction.type` is a precisely defined business event. This document is the **exhaustive catalog** of every transaction type, its trigger, its double-entry postings, and its rollback strategy.

The fundamental rule: `Σ DEBIT = Σ CREDIT` for every transaction. No exceptions.

---

## How to Read This Document

Each transaction is described using this schema:

| Field | Description |
|---|---|
| **Trigger** | What business event creates this transaction |
| **Called By** | Which service/function creates it |
| **Reserve?** | Does the credit go to `reservedBalance` or `availableBalance`? |
| **External Payment?** | Is there a corresponding Paystack event? |
| **Rollback** | What transaction type reverses this if something goes wrong |

Accounts are described as: `[DEBIT/CREDIT] AccountClass (ledger direction)` with `→ reservedBalance` or `→ availableBalance` annotations.

---

## BOOKING

**Trigger:** Passenger successfully pays via Paystack card/mobile money and books one or more seats.

**Called By:** `BookingConfirmationService.confirmFromPayment()`

**Reserve?** Yes — operator liability goes to `reservedBalance` (escrow)

**External Payment?** Yes — linked to the `charge.success` ExternalPayment

**Rollback:** `REFUND` (partial) or `PAYSTACK_REFUND` (edge case)

**Postings:**

| Direction | Account | Amount | Notes |
|---|---|---|---|
| DEBIT | `PAYSTACK_CLEARING` (Asset) | `grossCharge - paystackFee` | What Paystack captured minus their fee |
| DEBIT | `PAYMENT_PROCESSOR_FEE` (Expense) | `paystackFee` | Paystack's ~2% processing charge |
| CREDIT | `OPERATOR_RECEIVABLE` (Liability) → **reservedBalance** | `operatorNet` | Base fare minus commission |
| CREDIT | `PLATFORM_COMMISSION` (Revenue) | `commissionAmount` | Platform's percentage |
| CREDIT | `PLATFORM_CONVENIENCE_FEE` (Revenue) | `convenienceFeeAmount` | Fixed per-booking fee |

**Invariant check:**
```
(grossCharge - paystackFee) + paystackFee = operatorNet + commissionAmount + convenienceFeeAmount
grossCharge = operatorNet + commissionAmount + convenienceFeeAmount
```

---

## WALLET_BOOKING

**Trigger:** Passenger successfully pays using their `PASSENGER_WALLET` balance and books one or more seats.

**Called By:** `BookingConfirmationService.confirmFromWallet()`

**Reserve?** Yes — operator liability goes to `reservedBalance`

**External Payment?** No — fully internal; no Paystack involvement

**Rollback:** `WALLET_REFUND`

**Postings:**

| Direction | Account | Amount | Notes |
|---|---|---|---|
| DEBIT | `PASSENGER_WALLET` (Liability) | `grossCharge` | Full booking amount leaves wallet |
| CREDIT | `OPERATOR_RECEIVABLE` (Liability) → **reservedBalance** | `operatorNet` | Base fare minus commission |
| CREDIT | `PLATFORM_COMMISSION` (Revenue) | `commissionAmount` | Platform's percentage |

**Note:** No `PAYMENT_PROCESSOR_FEE` or `PLATFORM_CONVENIENCE_FEE` is charged for wallet bookings. This is a deliberate incentive to keep money inside the ecosystem.

---

## TOP_UP

**Trigger:** A passenger explicitly adds funds to their wallet by paying via Paystack.

**Called By:** `WalletService.confirmTopUp()`

**Reserve?** No — funds go directly to `availableBalance`

**External Payment?** Yes — linked to a Paystack charge

**Rollback:** `TOP_UP_REVERSAL` (if Paystack refunds the charge)

**Postings:**

| Direction | Account | Amount | Notes |
|---|---|---|---|
| DEBIT | `PAYSTACK_CLEARING` (Asset) | `grossCharge - paystackFee` | Net received from Paystack |
| DEBIT | `PAYMENT_PROCESSOR_FEE` (Expense) | `paystackFee` | Paystack's fee |
| CREDIT | `PASSENGER_WALLET` (Liability) | `grossCharge` | **Full gross amount credited to user** |

**Design note:** The passenger is credited the full amount they charged, not the net. The platform absorbs the Paystack fee as a cost of acquisition for wallet users. This is because:
1. Wallets save fees on future bookings (no Paystack call)
2. The incentive to top-up must not be undermined by visible fee deductions

---

## OPERATOR_PAYOUT

**Trigger:** Operator requests withdrawal of their `availableBalance`.

**Called By:** `operator.ts` tRPC router (`requestWithdrawal` mutation)

**Reserve?** N/A — funds are leaving the platform

**External Payment?** Yes — linked to a Paystack Transfer

**Rollback:** `PAYOUT_REVERSAL` (if transfer fails)

**Postings:**

| Direction | Account | Amount | Notes |
|---|---|---|---|
| DEBIT | `OPERATOR_RECEIVABLE` (Liability) from `availableBalance` | `withdrawalAmount` | Reduces operator's available balance |
| CREDIT | `PAYSTACK_CLEARING` (Asset) | `withdrawalAmount` | Marks intent to send money out |

**Important:** The credit to `PAYSTACK_CLEARING` is a *deduction* of the clearing asset (we are instructing money to leave). This is correct because PAYSTACK_CLEARING is an Asset account — crediting it reduces our assets.

---

## PAYOUT_REVERSAL

**Trigger:** A Paystack transfer fails (`transfer.failed` webhook) or the reconcile-payments cron detects a stuck payout.

**Called By:** `PaymentService.handleWebhookEvent()` (on `transfer.failed`) OR `reconcile-payments` cron

**Reserve?** N/A — restored to `availableBalance`

**External Payment?** Yes — linked to the failed Paystack Transfer

**Rollback:** N/A — this IS a rollback transaction

**Postings:**

| Direction | Account | Amount | Notes |
|---|---|---|---|
| DEBIT | `PAYSTACK_CLEARING` (Asset) | `payoutAmount` | Re-claiming the asset credit |
| CREDIT | `OPERATOR_RECEIVABLE` (Liability) → **availableBalance** | `payoutAmount` | Restoring withdrawable balance |

---

## REFUND

**Trigger:** A booking is cancelled, and the passenger's money must be returned. The refund goes to the passenger's wallet (not directly to their bank card).

**Called By:** `RefundService.issueRefund()`

**Reserve?** No — wallet credit goes to `availableBalance`

**External Payment?** No — fully internal ledger movement

**Rollback:** No direct rollback (refunds are considered final)

**Postings (pre-trip, escrow still reserved):**

| Direction | Account | Amount | Notes |
|---|---|---|---|
| DEBIT | `OPERATOR_RECEIVABLE` (Liability) from **reservedBalance** | `operatorNet` | Clawing back escrowed funds |
| DEBIT | `PLATFORM_COMMISSION` (Revenue) | `commissionAmount` | Reversing recognized revenue |
| CREDIT | `PASSENGER_WALLET` (Liability) | `refundAmount` | Crediting the passenger |

**Postings (post-trip, escrow already released):**

| Direction | Account | Amount | Notes |
|---|---|---|---|
| DEBIT | `OPERATOR_RECEIVABLE` (Liability) from **availableBalance** | `operatorNet` | Debiting already-cleared funds |
| DEBIT | `PLATFORM_COMMISSION` (Revenue) | `commissionAmount` | Reversing recognized revenue |
| CREDIT | `PASSENGER_WALLET` (Liability) | `refundAmount` | Crediting the passenger |

**Note on `convenienceFeeAmount`:** The convenience fee is typically non-refundable. It is NOT debited in a standard `REFUND` transaction, meaning the platform keeps it even on cancellation.

---

## WALLET_REFUND

**Trigger:** A wallet-paid booking is cancelled. Funds are returned to the passenger's wallet.

**Called By:** `RefundService.issueRefund()` (detects the original transaction type was `WALLET_BOOKING`)

**Reserve?** No — wallet credit to `availableBalance`

**External Payment?** No

**Rollback:** N/A

**Postings:**

| Direction | Account | Amount | Notes |
|---|---|---|---|
| DEBIT | `OPERATOR_RECEIVABLE` (Liability) from **reservedBalance** | `operatorNet` | Reversing escrow |
| DEBIT | `PLATFORM_COMMISSION` (Revenue) | `commissionAmount` | Reversing commission |
| CREDIT | `PASSENGER_WALLET` (Liability) | `grossCharge` | Full amount returned (no fee to retain) |

---

## PAYSTACK_REFUND

**Trigger:** An exceptional case where the passenger legally demands a card refund (not a wallet credit). Typically admin-initiated.

**Called By:** `RefundService.issueGatewayRefund()`

**Reserve?** N/A — money leaves the platform via Paystack

**External Payment?** Yes — linked to a Paystack refund API call

**Rollback:** N/A

**Postings:**

| Direction | Account | Amount | Notes |
|---|---|---|---|
| DEBIT | `OPERATOR_RECEIVABLE` (Liability) | `operatorNet` | Clawing back operator funds |
| DEBIT | `PLATFORM_COMMISSION` (Revenue) | `commissionAmount` | Reversing commission |
| DEBIT | `PLATFORM_CONVENIENCE_FEE` (Revenue) | `convenienceFeeAmount` | Clawed back by card refund |
| CREDIT | `PAYSTACK_CLEARING` (Asset) | `grossCharge` | Instructing Paystack to send money back |

**Note:** This is the only transaction type that also debits `PLATFORM_CONVENIENCE_FEE`. When a card refund is issued, Paystack returns the full gross charge to the cardholder including the convenience fee. The platform must reverse all recognized revenue.

---

## ORPHANED_PAYMENT_RESCUE

**Trigger:** A passenger paid on Paystack, but their `HoldGroup` expired before the webhook arrived (or was processed). Money is in Paystack but the seats are gone.

**Called By:** `BookingConfirmationService.rescueOrphanedPayment()`

**Reserve?** No — wallet credit to `availableBalance`

**External Payment?** Yes — linked to the original charge

**Rollback:** N/A (the rescue IS the recovery)

**Postings:**

| Direction | Account | Amount | Notes |
|---|---|---|---|
| DEBIT | `PAYSTACK_CLEARING` (Asset) | `grossCharge - paystackFee` | Recognizing the captured funds |
| DEBIT | `PAYMENT_PROCESSOR_FEE` (Expense) | `paystackFee` | Recognizing the cost |
| CREDIT | `PASSENGER_WALLET` (Liability) | `grossCharge` | Full amount credited to wallet |

**Design note:** The platform absorbs the Paystack fee here as an operational cost. The passenger receives the full amount they paid, not the net-of-fees amount. This is because the failed ticket delivery is the platform's fault, not the passenger's.

---

## ESCROW_RELEASE

**Trigger:** 24 hours after a trip's `actualArrival`, the `release-escrow` cron moves operator funds from `reservedBalance` to `availableBalance`.

**Called By:** `release-escrow` cron job

**Reserve?** N/A — this IS the release from reserve

**External Payment?** No — internal ledger movement only

**Rollback:** No direct rollback (if a dispute is filed later, a `REFUND` is issued which debits `availableBalance`)

**Postings:**

This transaction does NOT use the normal debit/credit pattern. Instead, it uses a direct balance field update for performance (500 bookings per batch):

```typescript
await prisma.financialAccount.update({
  where: { id: operatorAccountId },
  data: {
    reservedBalance: { decrement: netToRelease },
    availableBalance: { increment: netToRelease },
  }
});
```

**Important:** This is the one exception to the "only AccountingEngine writes balances" rule. The `release-escrow` cron directly updates the balance fields because it is a pure internal reclassification, not a new ledger entry. The `postedBalance` does NOT change. Only the split between reserved and available changes.

---

## MANUAL_ADJUSTMENT

**Trigger:** An admin needs to correct a ledger discrepancy that cannot be handled by any automated transaction type.

**Called By:** Admin interface (admin user action)

**Reserve?** Depends on context

**External Payment?** Maybe (if correcting a Paystack mismatch)

**Rollback:** Another `MANUAL_ADJUSTMENT` in the opposite direction

**Postings:** Entirely context-dependent. Both DEBIT and CREDIT accounts are specified by the admin.

**Required fields:**
- `description`: Must explain WHY the adjustment is needed (mandatory, audited)
- `initiatedBy`: Admin user ID (automatically set)
- `approvedBy`: Approving admin's user ID (4-eyes principle)

---

## TOP_UP_REVERSAL

**Trigger:** A wallet top-up was fraudulently disputed by the user's bank (chargeback). Paystack claws back the funds.

**Called By:** Webhook handler for `charge.dispute.resolve` (merchant loses)

**Reserve?** N/A — wallet is debited

**External Payment?** Yes — linked to the dispute resolution

**Rollback:** N/A

**Postings:**

| Direction | Account | Amount | Notes |
|---|---|---|---|
| DEBIT | `PASSENGER_WALLET` (Liability) | `grossCharge` | Clawing back wallet funds |
| CREDIT | `PAYSTACK_CLEARING` (Asset) | `grossCharge - paystackFee` | Paystack removed the funds |
| CREDIT | `PAYMENT_PROCESSOR_FEE` (Expense) | `paystackFee` | Fee is lost (Paystack charged for the failed charge) |

**Edge case:** If the passenger already spent the wallet funds on bookings, the `PASSENGER_WALLET` could go negative. The platform must handle this via an `OPERATOR_RECEIVABLE` debit chain or a manual adjustment.

---

*See also: [03 - Account Lifecycle](./03-account-lifecycle.md) | [04 - Ledger Philosophy](./04-ledger-philosophy.md) | [06 - Escrow](./06-escrow.md)*

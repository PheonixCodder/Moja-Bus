# Chapter 3: Money In, Money Out & Single Paystack Account Abstraction

## 1. The Single Merchant Account Model

In traditional marketplace platforms, payouts are often handled via split-payment sub-accounts. In Côte d'Ivoire and the WAEMU region, sub-account onboarding adds regulatory complexity.

Instead, Moja Bus uses a **Centralized Custodial Model**:
- **One Master Paystack Account** holds all physical fiat funds ($XOF$).
- Moja Bus acts as the merchant of record for all online card and Mobile Money transactions.
- All incoming and outgoing fiat movements are reconciled in real-time against the platform's internal double-entry ledger.

```
                           ╔═══════════════════════════════════════════╗
                           ║         MOJA BUS TREASURY VAULT           ║
                           ║      (Single Paystack Account - CI)       ║
                           ╚═══════════════════════════════════════════╝
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   ▼                                                           ▼
         [ INFLOWS / MONEY IN ]                                     [ OUTFLOWS / MONEY OUT ]
  ────────────────────────────────────                       ─────────────────────────────────────
  1. Card Ticket Checkouts                                   1. Operator Bank Account Withdrawals
  2. Mobile Money Ticket Checkouts                              (Paystack Transfer API)
     (Wave, Orange, MTN, Moov)                               2. Mobile Money Operator Payouts
  3. Passenger Moja Wallet Top-Ups                           3. Paystack Interchange Fees (Deducted at source)
                                                             4. Offline Cash Refunds (Counter cash)
```

---

## 2. Inflows: How Money Enters the System

There are **two primary fiat on-ramps** into the Moja Bus ecosystem:

### 1. Direct Ticket Checkout (Card / Mobile Money)
- **Initiation:** Triggered via `trpc.booking.initiatePayment`.
- **Payload:** `chargeAmountXOF = subtotalBaseXOF + convenienceFeeXOF - discountsXOF`.
- **Paystack Webhook / Verify:** When successful, Paystack deducts its fee (e.g. $1.95\%$ for Momo, $3.2\%$ for local cards) and credits the net fiat to Moja Bus's Paystack account.
- **Internal Ledger Mapping:**
  - `PAYSTACK_CLEARING` (Asset) increases by the net fiat.
  - `PAYMENT_PROCESSOR_FEES` (Expense) increases by the gateway fee.
  - `OPERATOR_RECEIVABLE` (Liability) increases by `operatorNetXOF` (escrowed).
  - `COMMISSION_REVENUE` (Revenue) increases by `commissionXOF`.
  - `CONVENIENCE_FEE_REVENUE` (Revenue) increases by `convenienceFeeXOF`.

### 2. Moja Wallet Direct Top-Up
- **Initiation:** Triggered via `trpc.wallet.topUp`.
- **User Action:** Passenger selects an amount (e.g. $10,000\text{ XOF}$, $25,000\text{ XOF}$, or custom) and completes payment via Paystack.
- **Paystack Processing:** `PaymentPurpose === "TOP_UP"`.
- **Internal Ledger Mapping:**
  - `PAYSTACK_CLEARING` (Asset) increases by net fiat ($10,000 - \text{fee}$).
  - `PAYMENT_PROCESSOR_FEES` (Expense) increases by fee.
  - `PASSENGER_WALLET` (Liability) increases by $10,000\text{ XOF}$ (full face value).
- *Strategic Note:* Moja Bus absorbs the gateway fee on top-ups to incentivize user wallet adoption. When users spend their wallet balance later, $0$ interchange fees are incurred, and the platform retains $100\%$ of its commission.

---

## 3. Outflows: How Money Leaves the System

There are **three primary cash drains**:

### 1. Operator Withdrawals (Bank / Mobile Money Payouts)
- **Initiation:** Operator requests a withdrawal via `trpc.operator.requestWithdrawal`.
- **Validation:** 
  - Operator must have completed 2FA challenge (`withdrawal_2fa_challenge`).
  - Request amount must be $\ge \text{minWithdrawalAmount}$ (default $5,000\text{ XOF}$).
  - Frequency window respected (e.g. at most once every $24\text{ hours}$).
  - Bank account must be verified and have a `paystackTransferRecipientCode`.
- **Execution:**
  1. Internal ledger immediately debits `OPERATOR_RECEIVABLE` and credits `PAYSTACK_CLEARING` with `status: POSTED`.
  2. Server calls Paystack `/transfer` endpoint with `amount`, `recipient_code`, and `reference: tx.id`.
  3. If Paystack rejects synchronously, the ledger immediately creates a `PAYOUT_REVERSAL`.
  4. If Paystack accepts, the transfer is queued.
- **Settlement via Webhooks:**
  - `transfer.success`: Marks `FinancialTransaction` as `SETTLED`. Novu sends `operator-withdrawal-settled`.
  - `transfer.failed` / `transfer.reversed`: The ledger automatically executes a `PAYOUT_REVERSAL` journal, restoring the operator's available balance, and sends `operator-withdrawal-failed`.

### 2. Payment Processor Fees (Interchange Leakage)
- For every fiat transaction, Paystack retains its fee at settlement time.
- Tracked inside `PAYMENT_PROCESSOR_FEES` (Platform Expense).
- This account allows management to evaluate total payment processing costs against earned convenience fees (`CONVENIENCE_FEE_REVENUE`).

### 3. Offline Cash Refunds at Terminal Counters
- When a traveler cancels a ticket at an operator depot, or if an offline cash refund is issued:
- The system logs a `Refund` with `channel: CASH` and `status: PENDING_FULFILMENT`.
- The ledger claws back `operatorNetXOF` from `OPERATOR_RECEIVABLE` into `OFFLINE_REFUND_PAYABLE`.
- Physical cash is handed to the passenger by the terminal clerk. When the clerk marks it fulfilled in the admin/operator dashboard, the record moves to `COMPLETED`.

---

## 4. The Balance Sheet Equation (Treasury Reconciliation)

At any point in time, the physical balance in the Moja Bus Paystack account must equal the sum of all internal platform claims:

$$\begin{aligned}
\text{Physical Paystack Fiat} &= \text{Balance}(\text{PAYSTACK\_CLEARING}) \\
&= \sum \text{Passenger Wallets} \\
&\quad + \sum \text{Operator Available Balances} \\
&\quad + \sum \text{Operator Escrow Reservations} \\
&\quad + \sum \text{Offline Refund Payables} \\
&\quad + \text{Accumulated Platform Net Margin}
\end{aligned}$$

Where:
$$\text{Accumulated Platform Net Margin} = (\text{Commissions} + \text{Convenience Fees}) - (\text{Processor Fees} + \text{Promo Subsidies})$$

---

## 5. Webhook Architecture & Idempotency

The Paystack webhook endpoint (`apps/web/app/api/webhooks/paystack/route.ts`) handles asynchronous payment notifications with strict idempotency:

```
                                [ INCOMING WEBHOOK ]
                                         │
                                         ▼
                            [ HMAC-SHA512 VERIFY ]
                         (X-Paystack-Signature check)
                                         │
                                         ▼
                            [ IDEMPOTENCY KEY CHECK ]
                    (idempotencyKey = event + reference + id)
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
          [ ALREADY PROCESSED ]                       [ NEW EVENT ]
          Returns 200 { duplicate: true }             Upserts WebhookEvent
                                                              │
                                      ┌───────────────────────┴───────────────────────┐
                                      ▼                                               ▼
                              [ charge.success ]                             [ transfer.success / failed ]
                                      │                                               │
                                      ▼                                               ▼
                       PaymentService.verifyAndConfirm                   PaymentService.handleTransferWebhook
                       • Confirm Hold & Issue Tickets                    • Update Tx SETTLED or
                       • Or process Wallet Top-Up                        • Execute PAYOUT_REVERSAL
```

### Reconciliation Cron (`api/cron/reconcile-payments`)
- A background worker scans `ExternalPayment` rows in `PENDING` status older than $15\text{ minutes}$.
- Calls Paystack API to check if the transaction succeeded or failed out-of-band.
- Auto-completes any payment where a webhook failed to deliver.

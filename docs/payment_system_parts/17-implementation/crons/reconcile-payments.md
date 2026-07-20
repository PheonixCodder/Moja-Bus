# Cron: Reconcile Payments

[⬅️ Back to Crons Overview](./README.md)

---

**File:** `apps/web/app/api/cron/reconcile-payments/route.ts`

The `reconcile-payments` cron job is the safety net for all external network communications. 

## The Problem
When integrating with Paystack, two major network black holes can occur:
1. **The Missing Webhook**: A user pays, but Paystack's webhook server crashes and never sends `charge.success`. The user's money is gone, but they don't get a ticket.
2. **The Missing Transfer Status**: An operator requests a withdrawal. We call Paystack's transfer API. The TCP connection drops. We don't know if Paystack processed it or not.

## How it works

The cron runs continuously every 5 minutes.

### Phase 1: Reconciling Charges (Inbound)
1. **Query**: Find all `ExternalPayment` rows where `status = PENDING` and `createdAt` is older than 5 minutes.
2. **Action**: For each payment, it simulates a `charge.success` webhook.
3. **Verification**: The `PaymentService.handleWebhookEvent()` internally verifies the charge status by explicitly calling `GET /transaction/verify/:reference` on Paystack's API.
   - If Paystack says it succeeded, the orchestration proceeds as normal (Tickets confirmed or Orphan rescued).
   - If Paystack says it failed or abandoned, the `ExternalPayment` is marked as `FAILED`.

### Phase 2: Reconciling Payouts (Outbound)
1. **Query**: Find all `FinancialTransaction` rows where `type = OPERATOR_PAYOUT` and `status` is IN `[CREATED, POSTED]`, older than 5 minutes.
2. **Action**: For each transaction, it explicitly calls Paystack's `GET /transfer/verify/:reference` API.
3. **Resolution**:
   - If Paystack says `SUCCESS`, it synthetically triggers the `transfer.success` event, updating the transaction to `SETTLED`.
   - If Paystack says `FAILED`, `REVERSED`, or `NOT_FOUND`, it synthetically triggers the `transfer.failed` event, which executes a `PAYOUT_REVERSAL` to return the funds to the operator's `availableBalance`.

## Alerts & Metrics
If a webhook is caught by this cron, it usually indicates a localized network issue. However, if this cron starts processing hundreds of transactions per minute, it indicates a catastrophic failure of Paystack's webhook delivery system, and should trigger a P1 engineering alert.

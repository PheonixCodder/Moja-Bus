# Findings — apps/web/features/payments/payment-service.ts (690 lines)

Covers: PaymentService (initiateForHold, initiatePaystack, verifyAndConfirm, verifyTopUp,
handleWebhookEvent, handleTransferWebhook, processTopUp, markPaymentSuccess, assertHoldPaid, getPricingPreview).

## ✅ What is CORRECT

1. **Webhook idempotency + processedAt AFTER processing** (matches doc failure-scenario #3/#4 corrected recovery):
   - `handleWebhookEvent` upserts `WebhookEvent` (no `processedAt`) FIRST.
   - For `charge.success`: verifies via Paystack, `markPaymentSuccess`, then `confirmFromPayment`, and
     only at the VERY END sets `processedAt`. If `confirmFromPayment` throws, `processedAt` stays null →
     Paystack retry re-enters and reprocesses. ✅ This is the "correct" pattern the doc demands.
   - `existing?.processedAt` → early return (duplicate). ✅

2. **Amount mismatch check** in `verifyAndConfirm`: `if (verified.amountXOF !== payment.amountXOF) throw`.
   Prevents a tampered/partial charge from confirming. ✅

3. **TopUp idempotency**: `processTopUp` checks for an existing `TOP_UP` transaction by
   `externalPaymentId` and returns early. ✅ (Though engine has no explicit key — relies on this guard.)

4. **Payout reversal also reverses the processor fee** (Fix #4): on `transfer.failed`/`reversed`, it
   finds the `PAYMENT_PROCESSOR_FEE` transaction for the same `externalPaymentId` and posts a
   `PAYOUT_FEE_REVERSAL`. This prevents phantom processor-fee debits accumulating on failed payouts. ✅
   (Good catch by the original author.)

5. **Reversal math is correct**: for each original entry, flips DEBIT↔CREDIT on the same account.
   OPERATOR_PAYOUT (DEBIT operator / CREDIT clearing) → PAYOUT_REVERSAL (CREDIT operator / DEBIT clearing).
   Restores operator availableBalance and clearing asset. ✅

6. **`markPaymentSuccess` stores the ACTUAL Paystack `feesXOF`** (`verified.feesXOF`), so downstream
   ledger posts use the real fee, not an estimate. ✅ (Spec: "relies on actual fee reported in webhook.")

7. **initiatePaystack re-uses an existing SUCCESS payment** (returns status SUCCESS without re-init) —
   avoids double Paystack charges for an already-paid hold. ✅ And retry attempt numbering increments
   `PaymentAttempt`. ✅

---

## 🟠 F-07b — Transfer-failure reversal double-credit race (MONEY LEAK under concurrent duplicate webhooks)
- In `handleTransferWebhook`, the guard `if (tx.status !== "FAILED" && tx.status !== "REVERSED")` is
  checked OUTSIDE the `$transaction`. If two `transfer.failed` webhooks for the same transfer arrive
  concurrently (Paystack DOES send duplicates), both pass the guard (both see status POSTED/CREATED),
  both enter the transaction, both post a `PAYOUT_REVERSAL` (engine has NO explicit idempotency key →
  auto-generated keys → no unique collision), both set `status=FAILED`.
- Result: operator's `availableBalance` is credited TWICE → operator receives double the payout amount
  back. Real money leak.
- Mitigating factor: the OUTER `handleWebhookEvent` dedups by `WebhookEvent.idempotencyKey =
  ${event}:${reference}:${data.id}`. If Paystack's duplicate deliveries carry the SAME `data.id`, the
  second is dropped before reaching this code. BUT: the `reconcile-payments` cron (NOT yet read — see
  audit/08) may trigger the same reversal via a different code path (direct `paystackVerifyTransfer` →
  reversal), which would NOT share the webhook dedup. MUST VERIFY the cron path does not double-reverse.
- Fix direction: guard the reversal INSIDE the transaction (re-check status after acquiring a lock), or
  pass `idempotencyKey: PAYOUT_REVERSAL_${tx.id}` to the engine.

## 🟡 F-webhook-1 — Webhook idempotency key format differs from spec & includes `data.id`
- Key = `${event}:${reference}:${data.id ?? ""}`. Spec (19-security, 11-idempotency) says
  `${provider}:${eventType}:${reference}` (e.g. `PAYSTACK:charge.success:T123`). Code omits the
  `PAYSTACK:` prefix and appends Paystack's `data.id`. Mostly fine for dedup, but:
  - For `charge.success`, `data.id` is Paystack's transaction id (stable). OK.
  - If Paystack ever redelivers the same reference with a DIFFERENT `data.id`, it would NOT dedup. Unlikely.
  - No `provider` segment means a different gateway later (MTN MoMo per 22-future-architecture) could
    collide on key. Low severity (single gateway today).

## 🟡 F-webhook-2 — `handleTransferWebhook` looks up by `reference` as the FinancialTransaction id
- `reference = payload.data.reference` is treated as the original `FinancialTransaction.id`
  (`financialTransaction.findUnique({ where: { id: reference } })`). This means the Paystack transfer
  `reference` MUST equal the `FinancialTransaction.id`. Need to confirm `operator.ts` requestWithdrawal
  sets the Paystack transfer `reference` to the `FinancialTransaction.id` (or its own `TX-MOJ-...`).
  If it uses a different reference format, transfer webhooks will silently find no tx and do nothing
  (the `if (!tx) return;` early-exit) → payouts never settle/reverse → operator stuck. MUST VERIFY in
  operator.ts.

## 🟡 F-webhook-3 — Transfer `transfer.success` only sets status SETTLED; does NOT decrement PAYSTACK_CLEARING for the transfer
- On `transfer.success`, the code sets `FinancialTransaction.status = SETTLED` but I see NO ledger entry
  moving `PAYSTACK_CLEARING` down by the payout amount. (The clearing debit happens at WITHDRAWAL time
  via `OPERATOR_PAYOUT` CREDIT clearing.) So the ledger is internally consistent (clearing was already
  debited at withdrawal). Confirmed consistent with spec (09-settlement Step 5a: "PAYSTACK_CLEARING
  postedBalance decrements by payout amount" — but that debit occurred at requestWithdrawal, not here).
  So no missing entry; just noting the success path only flips status. ✅ (no bug, but verify operator.ts
  actually credits clearing at withdrawal.)

## Minor
- `paystackVerify` is called inside `handleWebhookEvent` for `charge.success` even when
  `payment.status !== "SUCCESS"` — good (transactional reconciliation Layer 1). ✅
- `verifyTopUp` and `verifyAndConfirm` share logic; topup path does not call confirmFromPayment (correct,
  topup credits wallet directly).
- The Novu payout notifications (settled/failed) are wrapped in try/catch and won't break the ledger. ✅

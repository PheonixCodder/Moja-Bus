# As-Built Architecture vs Spec — Plain-Language Summary (so far)

This is the "explain it like artifacts/payment_system_explanation.md" view, built ONLY from code read
so far (DB services + payments services + paystack client). It will be extended as more files are read.

## 1. WHERE OUR FEES ARE CUT (who pays the platform, and how much)

For a normal CARD booking of one seat at base fare `B` (XOF):
- Passenger pays: `B + convenienceFee` where `convenienceFee = round(B * convenienceBps/10000)`.
  (convenienceBps default 250 → 2.5%.) Example B=10,000 → passenger pays 10,250.
- Operator receives (escrowed): `B - commission` where `commission = round(B * commissionBps/10000)`.
  (commissionBps default 500 → 5%.) Example → operator net 9,500.
- Platform keeps: `commission (500) + convenienceFee (250) = 750 XOF` per seat. ✅ This is the take rate.
- Paystack fee (~2% of the charge) is paid by THE PLATFORM (debited to PAYMENT_PROCESSOR_FES expense),
  NOT passed to passenger or operator. So the platform's real margin = 750 − paystackFee.
  On 10,250 that's ~205 XOF Paystack fee → platform nets ~545 XOF. (This matches the explanation doc's
  "platform absorbs the Paystack fee" design.)

For a WALLET booking:
- Passenger pays only `B` (convenience fee WAIVED). ✅ Loyalty perk.
- Operator still receives `B - commission` (commission still taken). ✅
- NO Paystack fee (wallet is internal). ✅ So wallet bookings are MORE profitable for the platform
  (no processor fee) AND cheaper for the passenger. The platform actively incentivizes wallet use.

## 2. WHERE WE LOSE MONEY (confirmed code paths so far)
- **Orphan rescue absorbs the Paystack fee** — when a hold expires after payment, the full gross is
  refunded to the wallet and the platform eats the Paystack processing fee (F-07 context). This is
  intentional per spec but is a real cost on abandoned checkouts.
- **F-07 orphan double-credit race** — passenger could be credited the full amount TWICE under concurrent
  webhook+cron (real leak, not yet fixed in code).
- **F-07b payout-reversal double-credit race** — operator could be credited back TWICE on a failed
  transfer under concurrent duplicate webhooks (real leak, not yet fixed).
- **F-11 XOF ×100** — IF Paystack treats XOF as no-decimal, the platform would over-charge customers 100×
  (platform would receive far more than expected from Paystack, but the ledger would record the intended
  amount → reconciliation delta explodes, and customers are over-billed). This is the single biggest
  open risk. Must verify.

## 3. WHERE THE PASSENGER HAS LEVERAGE (per the user's question)
- **Wallet = closed-loop leverage.** Refunds go to PASSENGER_WALLET (not back to card). The passenger
  keeps funds inside the ecosystem and can re-book for free (no processor fee). The platform retains the
  capital. This is by design (spec 13-wallet) but means a passenger who cancels always keeps a usable
  balance — good for retention, slight float advantage to platform.
- **Convenience fee is waived for wallet** — passenger pays less if they pre-fund the wallet. Leverage
  toward cheaper travel by topping up.
- **Orphan rescue makes the passenger whole automatically** — even if they're slow at checkout, their
  money is safe in the wallet. Passenger never loses money on timing. ✅ (Good for trust.)
- **Escrow protects the passenger, not the operator.** Funds are locked until 24h after arrival, so a
  passenger can always get a refund if the trip fails. The operator only gets paid after delivery. This
  is the core trust mechanism (06-escrow) and is correctly implemented in code (reserveOnCredit).
- **Refund-to-wallet preference** (spec 15-refunds) — passenger gets instant wallet credit, no waiting on
  Paystack card refunds. Leverage: instant access to funds.

## 4. ESCROW (confirmed correct)
- Card/wallet booking credits OPERATOR_RECEIVABLE with `reserveOnCredit: true` → goes to `reservedBalance`
  (escrow). Operator cannot withdraw until `release-escrow` cron moves it to `availableBalance` 24h after
  `actualArrival`. ✅ Matches 06-escrow.
- `release-escrow` cron NOT yet read — must confirm the rounding-last-seat logic and idempotency
  (clearedAt) match spec. (PENDING.)

## 5. IDEMPOTENCY / CONCURRENCY posture (mixed)
- ✅ Card/wallet booking: strong (domain claim + explicit ledger key + Serializable + deadlock sort).
- ✅ Webhook: strong (WebhookEvent dedup + processedAt-after-processing).
- ⚠️ Orphan rescue: weak (no ledger key, EXPIRED guard misses time-expired ACTIVE holds).
- ⚠️ Payout reversal: weak (status guard outside tx; relies on webhook dedup + unverified cron path).
- ⚠️ Ledger engine idempotency: opt-in (caller must pass key).

## 6. SPEC DIVERGENCES (docs vs code) confirmed
- Account classes: docs say PLATFORM_COMMISSION / PLATFORM_CONVENIENCE_FEE / PAYMENT_PROCESSOR_FEE;
  code says COMMISSION_REVENUE / CONVENIENCE_FEE_REVENUE / PAYMENT_PROCESSOR_FEES. (F-05)
- Amounts: docs mandate BigInt everywhere; engine uses JS number. (F-01)
- New account OFFLINE_REFUND_PAYABLE exists in code (for CASH/VOUCHER refunds) — not in docs.
- Docs reference `17-implementation/` deep-dive files that DO NOT EXIST (empty 0-byte file). (from earlier scan)
- Docs query `le.direction`; schema field is `side`. (drift)

==================================================================
SESSION 2 ADDITIONS (routers / API / crons / refunds / holds / bank / UI)
==================================================================

### 7. WITHDRAWALS (operator.requestWithdrawal) — confirmed correct in structure
- Locks operator `availableBalance FOR UPDATE` inside the tx; balance check prevents over-withdrawal
  and negative balance concurrently. ✅
- Paystack transfer `reference` = `FinancialTransaction.id` (`txId`) → resolves F-webhook-2 (webhook
  lookup works). ✅
- CREDITS `PAYSTACK_CLEARING` at withdrawal (consistency with F-webhook-3 confirmed). ✅
- Separate `PAYMENT_PROCESSOR_FEE` post for the outbound transfer fee. ✅
- Compensating `OPERATOR_PAYOUT_REVERSAL` on definitive rejection carries `idempotencyKey:
  PAYOUT_REVERSE_${txId}`. ✅ Network/timeout → status PENDING, reconciled later. ✅
- Only `availableBalance` (not reserved escrow) is withdrawable. ✅ Destination is company default
  bank (not attacker-controlled). ✅
- GAP: no idempotency key / client nonce on the primary payout → double-submit double-payout (F-17).
- GAP: `require_2fa_for_withdrawals` / `withdrawal_frequency_hours` settings exist but are never
  enforced (F-18). Withdrawal gated by RBAC `withdrawals:create`, not strictly OWNER (D-4).

### 8. REFUNDS / CANCELLATION — confirmed strong
- REFUND ledger correct double-entry; convenience fee RETAINED; commission CLAWBACK; routes to WALLET
  (or OFFLINE_REFUND_PAYABLE for CASH/VOUCHER). Strong idempotency (status guard + ledger key). ✅
- GAP: no-snapshot fallback over-debits operator by commission portion / skips clawback (F-24).
- GAP: trip-cancel swallows per-booking refund failure → stranded passenger (F-31). Guest path moot
  (login required — user-confirmed).

### 9. DOUBLE-BOOKING — over-sale race (F-16)
- `createHold` conflict check is non-locked read-then-insert; `Booking` schema has NO seat-exclusivity
  constraint; `confirmFromPayment` doesn't re-verify cross-hold-group seat ownership → two concurrent
  holds on one seat can both confirm.

### 10. ADMIN — settlement / treasury / bank
- `resolveWithdrawal` FORCE_COMPLETE = status→SETTLED (no new ledger entry, correct); FORCE_FAIL =
  PAYOUT_REVERSAL (no key, no fee reversal, can dbl-reverse w/ webhook — F-21). Reason required. ✅
- `verifyBankAccount` ADMIN-only, audit-logged (activityLog), creates Paystack recipient (validates
  acct). Concurrent verification can set two `isDefault` (F-23). Admin plaintext reveals NOT logged
  to bankAccessLog (F-22).
- `recordSettlement` DEBIT operator → CREDIT clearing, NO idempotency, NO mandatory reason, NO real
  bank transfer (F-19).
- Banking AES-256-GCM + rotation; masked at client. Operator cannot self-verify bank (isVerified
  forced false) → payout-redirection blocked. ✅

### 11. GLOBAL CHECKS
- ✅ No direct `financialAccount` balance writes in any router (global 🔴 PASSED).
- ✅ All cron routes auth-protected (CRON_SECRET).
- ✅ processTopUp/confirm use stored amounts (no client inflation).
- ⚠️ release-reservations cron does direct balance write (documented exception) + no claim-count guard.

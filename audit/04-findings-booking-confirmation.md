# Findings — apps/web/features/payments/services/booking-confirmation-service.ts (530 lines)

## ✅ What is CORRECT

1. **Card (Paystack) booking double-entry balances.** For a card hold:
   - Debit clearing = `chargeAmountXOF - feesXOF`
   - Debit processor fee = `feesXOF` (if >0)
   - Credit operator = `operatorNetXOF` (reserveOnCredit → goes to reservedBalance / escrow)
   - Credit commission = `commissionXOF` (if >0)
   - Credit convenience = `convenienceFeeXOF` (if >0)
   - Σ Debit = (charge - fee) + fee = charge. Σ Credit = (subtotal-commission) + commission + convenience
     = subtotal + convenience = charge. ✅ Balances.
   - Passenger is charged exactly `chargeAmountXOF` (subtotal + convenience). Operator receives
     `operatorNetXOF` (subtotal - commission). Platform keeps commission + convenience. Paystack fee
     is absorbed by the platform (debit to expense). Matches spec BOOKING catalog EXCEPT the platform
     eats the Paystack fee (spec's BOOKING example credits operator the net and the fee is a separate
     expense debit — which is what happens here). ✅

2. **Wallet booking correctly waives convenience fee & processor fee.** `totalToPay = snapshot.subtotalBaseXOF`
   (no convenience). Posts: Debit wallet = subtotal; Credit operator = operatorNetXOF (escrowed);
   Credit commission = `subtotal - operatorNetXOF`. Updates PricingSnapshot.convenienceFeeXOF=0.
   Matches WALLET_BOOKING catalog (no processor fee, no convenience fee). ✅ Passenger pays less via wallet.

3. **Idempotency guard on confirm (domain level).** `holdGroup.updateMany({ where: {id, status:"ACTIVE"}, data:{status:"CONFIRMED"} })` —
   only the winner of a concurrent race flips the status; losers see `count===0` and return existing
   bookings. Booking-level `updateMany({where:{id,status:"PENDING_PAYMENT"}})` similarly. ✅

4. **Explicit ledger idempotency keys for card/wallet:** `CARD_BOOKING_${holdGroup.id}` /
   `WALLET_PAYMENT_${holdGroup.id}` → on a duplicate, `engine.commit` throws P2002, caught, returns
   existing confirmed bookings. ✅ This is the working safety net.

5. **Orphan rescue credits the FULL gross (`amountXOF`) to the wallet**, debits clearing by
   `amountXOF - feesXOF` and processor fee by `feesXOF`. Platform absorbs the Paystack fee
   (operational cost per spec ORPHANED_PAYMENT_RESCUE). Passenger is made whole. ✅ (intent correct)

6. **Serializable isolation + maxWait 5000 / timeout 15000** on the outer transactions. ✅

---

## 🟠 F-07 — Orphan-rescue double wallet-credit race (MONEY LEAK under concurrency)
- `rescueOrphanedPayment` is called from `confirmFromPayment` when `holdIsExpired`
  (`status !== "ACTIVE" || holdExpiresAt < now`).
- The rescue method's own guard is `if (holdGroup.status === "EXPIRED") return;` — this only
  blocks when the DB status is literally `EXPIRED`.
- Gap: A hold can be **time-expired but still `status === "ACTIVE"`** (user started checkout, 10 min
  passed, but the expiry cron hasn't flipped it to EXPIRED yet, OR the status was never flipped).
  In that state `holdIsExpired` is TRUE (time-based) but the rescue's `status === "EXPIRED"` guard is
  FALSE → it proceeds to post.
- Concurrency: a late `charge.success` webhook AND the `reconcile-payments` cron both call
  `confirmFromPayment` for this same hold within the 10-min window. Both see `status==="ACTIVE"`,
  both pass the rescue guard, both enter the transaction, both call `engine.commit` with **NO explicit
  idempotency key** (see F-03) → two `ORPHANED_PAYMENT_RESCUE` transactions → passenger wallet credited
  **TWICE** the full amount.
- Even after the first commits and sets `status=EXPIRED`, the second's transaction may have already
  passed the guard check (both read status before either commits) → double credit.
- Impact: Passenger gets paid 2×; platform loses real money (the rescue is a real wallet credit the
  passenger can spend/withdraw). This is a realistic path (Paystack sends duplicate webhooks; cron
  also fires). SEVERITY HIGH.
- Fix direction: (a) pass `idempotencyKey: ORPHAN_RESCUE_${holdGroup.id}` to the engine; (b) flip the
  hold to EXPIRED with an atomic `updateMany({where:{id, status:["ACTIVE"]}})` claim BEFORE posting,
  and treat `EXPIRED`/`CONFIRMED` as terminal; (c) ideally fold the rescue into the same locked claim.

## 🟢 F-10 — Zero-net bookings skip the ledger entirely
- `if (snapshot && snapshot.operatorNetXOF > 0)` gates the whole ledger post. If `operatorNetXOF <= 0`
  (e.g. 100% promo where commission >= subtotal), no `FinancialTransaction` is posted, yet bookings
  are still confirmed. The spec says zero-net bookings should still skip the `financialAccount.update`
  but mark `clearedAt`; here there's simply no journal. Edge case (negative-net promo); convenience/
  processor fees also unrecorded. Low severity but a ledger-completeness gap (audit trail missing).

## 🟡 F-07c — Orphan rescue has no `userId` fallback for guest checkouts
- If `targetUserId` is null (guest booking with no account), the method `console.error`s and RETURNS
  without crediting anyone. The money is then "stranded" — Paystack captured it, no wallet, no ticket.
  Manual intervention required. For a guest-checkout product this is a real trapped-funds path.
  (Acceptable as a stopgap but must be tracked; spec says orphan rescue always credits the wallet.)

## Minor
- `confirmFromPayment` early-returns the confirmed result using `pricingSnapshot.chargeAmountXOF ?? sum(farePaid)`.
  If the snapshot is missing on a confirmed hold, it falls back to `farePaid` sum — fine.
- Wallet path `totalToPay = snapshot.subtotalBaseXOF`; if snapshot missing it throws (correct).
- Novu "wallet low balance" alert on insufficient funds is a nice touch (correctly keyed off the
  "Insufficient funds" message).

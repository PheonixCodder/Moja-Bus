# 07 — Schema and data integrity

## Entity relationship (commercial)

```
Schedule 1──* Trip 1──* TripSeat
                 │
                 ├──* TripStop ←── Booking (origin/dest orders)
                 └──* HoldGroup 1──1 PricingSnapshot
                          │
                          ├──* Booking
                          ├──0..1 ExternalPayment ("payment" table)
                          │         ├──* PaymentAttempt / PaymentEvent
                          │         └──* Refund  (also → HoldGroup; paymentId required)
                          ├──* DiscountRedemption → Campaign | Coupon | Voucher | CreditLot
                          └──* MonetaryVoucher (cancel issue; schedule/company optional in DB)

FinancialAccount ←── LedgerEntry ←── FinancialTransaction (opt → ExternalPayment)
FinancialAccount ←── WalletReservation (holdGroupId soft link, NO FK)

DiscountCampaign ── Route | Trip | Schedule scopes + CompanyOptIn
ReferralProgram → ReferralCode → ReferralEdge → CreditLot
```

**Table name trap:** Prisma model `ExternalPayment` maps to SQL table `"payment"`.

---

## Write paths

| Aggregate | Writers |
|-----------|---------|
| Hold + Booking | `booking-hold-service`; confirm/expire via confirmation / releaseHold |
| Pricing + redemptions | `quote-service` freeze / release / finalize / refreeze |
| Card payment | `payment-service` |
| Ledger | `AccountingEngine` + `FinancialAccountService` |
| Cancel / refund | `cancellation-service` + `voucher-service` |
| Wallet pay | `confirmFromWallet` — **no** ExternalPayment |
| WalletReservation | cron only; **no create in apps** |

---

## Invariant checklist

| # | Invariant | Enforced? |
|---|-----------|-----------|
| 1 | One active hold/confirm per overlapping seat-segment | App FOR UPDATE + clash; **no DB exclusion** |
| 2 | Hold ACTIVE → CONFIRMED once | App updateMany |
| 3 | Booking CONFIRM ↔ Hold CONFIRMED | App; Booking.holdGroupId can SetNull |
| 4 | ExternalPayment.holdGroupId ≤ 1 | DB unique (nullable) |
| 5 | Paystack refs unique | DB |
| 6 | Ledger balanced + entry idempotency | App + LedgerEntry.idempotencyKey unique |
| 7 | posted = available + reserved | App only |
| 8 | Discount reserve → finalize/release | App |
| 9 | Cancel voucher schedule+company | App; columns nullable |
| 10 | Cancel requires payment SUCCESS | App — **breaks wallet confirms** |
| 11 | Refund ↔ Booking | **Missing** bookingId |
| 12 | Hybrid shares = 10000 bps | App |
| 13 | Money ≥ 0 / remaining ≤ original | **No CHECK** |
| 14 | dropoffStopOrder > boardingStopOrder | App |
| 15 | Trip unique schedule+departure | DB; NULL scheduleId weak |

---

## Schema gaps

- `WalletReservation.holdGroupId` — no FK; unused writers.
- `CreditLot.sourceBookingId` / `sourceHoldGroupId` — bare strings.
- `Refund` — no bookingId, no idempotency column, no unique on paystackRefundId.
- No seat-overlap exclusion constraint.
- `MonetaryVoucher.scheduleId`/`companyId` nullable; schedule delete SET NULL.
- `Trip.scheduleId` nullable (archive) — blocks voucher cancel when null.
- `ExternalPayment.holdGroupId` optional — top-ups vs checkout; wallet often null payment.
- `PricingSnapshot.preDiscount*` nullable — recon must coalesce.
- `FinancialTransaction @@unique([externalPaymentId, type])` — **multi-seat REFUND bomb**; also many null-external txs of same type allowed (PG NULL unique).
- Coupon/budget counters app-only; no check reserved+consumed ≤ budget.
- Dual enums: Booking PaymentStatus vs PaymentRecordStatus vs RefundRecordStatus.

---

## Migration risks (P0)

Discount/referral/voucher/credit/scope models and pricing snapshot discount columns exist in `schema.prisma` but **lack CREATE/ALTER in migration history** (historically `db push`).  

Present commercial-related migrations:

| Migration | Role |
|-----------|------|
| `0_init` | Baseline hold/payment/refund/ledger/booking (**no discount domain**) |
| `20260808063016` | Trip archivedAt; scheduleId nullable |
| `20260815120000` | max promotional vouchers setting |
| `20260816120000` | MonetaryVoucher schedule/company + backfill (**assumes table exists**) |

**Fresh `migrate deploy` from repo ≠ full schema.** Environments that push vs migrate diverge silently.

Backfill in `20260816120000` only fills cancellation vouchers with sourceBooking + trip still having scheduleId — orphans remain.

Cascade: HoldGroup/Company delete cascades payments/refunds/redemptions — retention risk.

---

## Findings (schema slice)

| Sev | Finding |
|-----|---------|
| P0 | Discount domain not migratable from repo alone |
| P0 | Wallet confirm vs Refund.paymentId required + cancel SUCCESS payment |
| **P0** | `FinancialTransaction @@unique([externalPaymentId, type])` blocks multi-seat REFUND *(T pack listed P2; compound elevates to P0)* |
| P1 | No seat-overlap exclusion |
| P1 | Refund not booking-scoped / no provider unique / no request idempotency |
| P1 | No money CHECKs |
| P1 | Voucher schedule nullable + SET NULL |
| P2 | WalletReservation orphan design |
| P2 | Trip scheduleId nullable unique weakness |
| P2 | Cascade erase commercial history |
| P2 | farePaid ≠ cash collected (use snapshot charge) |
| P2 | ExternalPayment purpose overload (checkout vs top-up) |
| P3 | Dual payment status enums; JSON-heavy audit; offerId non-unique |

## Good constraints retained (both packs)

Unique: PricingSnapshot.holdGroupId, ExternalPayment.holdGroupId (nullable), booking refs/tokens, coupon/referral codes, payment refs, campaign scope composites, payment attempt (payment, attemptNumber), ledger entry idempotency + (tx, sequence). Useful indexes for trip-seat-status, hold expiry, incentive status, webhooks.

---

## Reconciliation queries (ops)

```sql
-- Wallet-confirmed holds with no SUCCESS payment (cancel will fail)
SELECT hg.id, hg.status, hg."updatedAt"
FROM hold_group hg
LEFT JOIN payment p ON p."holdGroupId" = hg.id AND p.status = 'SUCCESS'
WHERE hg.status = 'CONFIRMED' AND p.id IS NULL;

-- Confirmed bookings vs hold status mismatch
SELECT b.id, b."bookingReference", b.status, hg.status AS hold_status
FROM booking b
JOIN hold_group hg ON hg.id = b."holdGroupId"
WHERE b.status = 'CONFIRMED' AND hg.status <> 'CONFIRMED';

-- Overlapping active seat segments
SELECT a.id, b.id, a."tripId", a."seatId"
FROM booking a
JOIN booking b ON a."tripId" = b."tripId" AND a."seatId" = b."seatId" AND a.id < b.id
WHERE a."boardingStopOrder" < b."dropoffStopOrder"
  AND b."boardingStopOrder" < a."dropoffStopOrder"
  AND a.status IN ('CONFIRMED','PENDING_PAYMENT')
  AND b.status IN ('CONFIRMED','PENDING_PAYMENT')
  AND (a.status = 'CONFIRMED' OR a."holdExpiresAt" > NOW())
  AND (b.status = 'CONFIRMED' OR b."holdExpiresAt" > NOW());

-- Account balance identity
SELECT id, "postedBalance", "reservedBalance", "availableBalance"
FROM financial_account
WHERE "postedBalance" <> "availableBalance" + "reservedBalance";

-- Unbalanced posted txs
SELECT t.id, t.type, t.status,
  SUM(CASE WHEN e.side='DEBIT' THEN e.amount ELSE 0 END) AS debits,
  SUM(CASE WHEN e.side='CREDIT' THEN e.amount ELSE 0 END) AS credits
FROM financial_transaction t
JOIN ledger_entry e ON e."transactionId" = t.id AND e.status = 'POSTED'
GROUP BY t.id
HAVING SUM(CASE WHEN e.side='DEBIT' THEN e.amount ELSE 0 END)
    <> SUM(CASE WHEN e.side='CREDIT' THEN e.amount ELSE 0 END);

-- Stuck discount reserves
SELECT * FROM discount_redemption WHERE status = 'RESERVED'
  AND "createdAt" < NOW() - INTERVAL '2 hours';

-- Voucher arithmetic
SELECT id, "originalAmountXOF", "remainingAmountXOF", "reservedAmountXOF"
FROM monetary_voucher
WHERE "remainingAmountXOF" + "reservedAmountXOF" > "originalAmountXOF"
   OR "remainingAmountXOF" < 0 OR "reservedAmountXOF" < 0;

-- Cancellation vouchers missing schedule
SELECT id, source, status, "scheduleId", "companyId", "sourceBookingId"
FROM monetary_voucher
WHERE source = 'CANCELLATION' AND ("scheduleId" IS NULL OR "companyId" IS NULL);

-- CANCELLED + REFUNDED without refund row
SELECT b."bookingReference", b."holdGroupId"
FROM booking b
WHERE b.status = 'CANCELLED' AND b."paymentStatus" = 'REFUNDED'
  AND NOT EXISTS (
    SELECT 1 FROM refund r WHERE r."holdGroupId" = b."holdGroupId"
  );

-- Campaign budget overshoot
SELECT id, name, "budgetXOF", "budgetReservedXOF", "budgetConsumedXOF"
FROM discount_campaign
WHERE "budgetXOF" IS NOT NULL
  AND "budgetReservedXOF" + "budgetConsumedXOF" > "budgetXOF";

-- Credit lots vs promo ledger (conceptual — implement per account class)
-- Find ACTIVE lots whose remainingXOF > financial_account available for PROMO_CREDITS

-- Orphan wallet_reservation
SELECT status, COUNT(*) FROM wallet_reservation GROUP BY status;

-- Multiple REFUND txs per payment (should be 0 or 1 today; >1 may be partial history)
SELECT "externalPaymentId", COUNT(*)
FROM financial_transaction
WHERE type = 'REFUND' AND "externalPaymentId" IS NOT NULL
GROUP BY "externalPaymentId"
HAVING COUNT(*) > 1;
```

---

## Migration file inventory

See README + table above. Unrelated geo/IAM migrations omitted from deep commercial review but present under `packages/db/prisma/migrations/`.

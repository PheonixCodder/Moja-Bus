# 12 — Incident traces and reconciliation checklist

Merged from `docs/commercial-transaction-audit/08-incident-traces-and-reconciliation.md`, with cross-links to the unified catalog.

These traces are **confirmed source behavior**, not speculation about a single production incident.

---

## Trace A — successful wallet booking cannot be cancelled (P0-1)

> **Status (2026-08-16):** Fixed in Phase 00 — settlement provenance allows cancel without ExternalPayment SUCCESS; see `docs/plans/commercial-lifecycle-hardening/03-phase-00-cancel-refund-money-safety.md`.

```text
Passenger: checkoutWithWallet(hold)
  -> confirmFromWallet: CONFIRMED / PAID bookings + WALLET_PAYMENT ledger transaction
  -> no ExternalPayment exists
Operator: payments.cancelBooking(reference)
  -> CancellationService requires holdGroup.payment.status === SUCCESS
  -> payment is null -> “No successful payment found for this booking”
```

Applies to wallet payment and zero-cash credits/vouchers payment. Same gate blocks passenger self-cancel when it always sends `channel: WALLET`.

---

## Trace B — admin/claimed credits fail credits-only checkout and trap the hold (P0-5 + P1-18)

> **Status (2026-08-16):** P0-5 fixed in Phase 01 — admin/claim grants post promo ledger credit with the lot. Historical underfunded lots: `repair-promo-credit-funding.ts`. Hold trap after failed confirm remains Phase 03 (P1-18).

```text
Admin grant / campaign claim -> CreditLot(ACTIVE, remaining=N), no promo-account credit
Search checkout preview -> sees CreditLot, calculates creditApplied=N / payable=0
createHold -> creates PENDING_PAYMENT bookings + reserves CreditLot.reservedXOF=N
checkoutWithWallet -> sees totalToPay=0, so wallet cash check passes
booking ledger -> debits passenger PROMO_CREDITS by N
account has no grant credit -> accounting engine: insufficient funds
catch remaps it -> “Insufficient wallet balance” (+ may fire low-wallet Novu)
transaction rolls back confirmation, but the previously committed hold/reservation remains
```

Wallet confirmation calculates payable from the snapshot and removes the convenience fee; missing `waiveConvenienceFee` on freeze is still a contract inconsistency (P2-1) but is **not required** for this failure.

---

## Trace C — pending page hides/discards the same hold’s credits (P1-17)

```text
Failed checkout leaves hold H and CreditLot.reservedXOF=N
Pending page preview -> quote availability = remainingXOF - reservedXOF = 0
UI shows no credit applied / cash due
User pays from pending page -> refreeze computes quote first (still 0)
then release(H) -> old N reservation removed
then freeze(new quote) -> reserves 0
wallet/Paystack charge proceeds without the original promo credit
```

**Separate** from the ledger mismatch (Trace B). Affects correctly ledger-funded **referral** credits too. Same ordering can self-block capped coupons and campaign budget.

---

## Trace D — multi-seat trip cancel unique collision (P0-2 + P0-3)

> **Status (2026-08-16):** Fixed in Phase 00 — FT unique(externalPaymentId, type) removed; per-booking `businessIdempotencyKey` / `REFUND_*_{bookingId}`; trip refund failure → `REFUND_PENDING` (D3), not CANCEL_WITHOUT_REFUND.

```text
Trip cancel with N confirmed seats on one Paystack ExternalPayment
Seat 1: CancellationService posts FinancialTransaction type=REFUND + paymentId=P -> OK
Seat 2: same type+paymentId -> unique violation
catch -> booking CANCELLED anyway + CANCEL_WITHOUT_REFUND
```

Lifecycle-pack finding; included here so ops has one place for “what goes wrong in the field.”

---

## Trace E — delayed referral double INITIAL (P0-6)

> **Status (2026-08-16):** Fixed in Phase 01 — INITIAL idempotency key is `referral:{edgeId}:INITIAL`; subsequent confirms while QUALIFIED use RECURRING only.

```text
rewardDelayHours > 0
Booking 1 confirm -> edge QUALIFIED, PENDING lot INITIAL (holdGroup H1)
Booking 2 confirm before cron -> still QUALIFIED, rewardedAt null -> kind=INITIAL again (H2)
Cron activates both INITIAL lots + two ledger posts
```

---

## Read-only data checks for operations

Run against restored/staging first. Adapt names to deployed migration state. Do **not** mutate production with these selects.

```sql
-- Pending holds whose credit reservations still consume user availability.
SELECT hg.id AS hold_id, hg.status, hg."holdExpiresAt", cl."userId",
       cl."remainingXOF", cl."reservedXOF", dr."creditAppliedXOF"
FROM hold_group hg
JOIN discount_redemption dr ON dr."holdGroupId" = hg.id AND dr.status = 'RESERVED'
JOIN credit_lot cl ON cl.id = dr."creditLotId"
WHERE hg.status = 'ACTIVE' OR hg."holdExpiresAt" < now();

-- Wallet/zero-cash confirmed bookings missing an external payment.
SELECT b."bookingReference", b."holdGroupId", b."paymentStatus"
FROM booking b
JOIN hold_group hg ON hg.id = b."holdGroupId"
LEFT JOIN payment p ON p."holdGroupId" = hg.id
WHERE b.status = 'CONFIRMED' AND b."paymentStatus" = 'PAID' AND p.id IS NULL;

-- Credit lots that need ledger-backing reconciliation (compare to PROMO_CREDITS accounts).
SELECT cl."userId", SUM(cl."remainingXOF") AS lot_remaining
FROM credit_lot cl
WHERE cl.status IN ('ACTIVE', 'PARTIALLY_REDEEMED')
GROUP BY cl."userId";

-- Referral edges with more than one INITIAL credit lot
SELECT "referralEdgeId", COUNT(*)
FROM credit_lot
WHERE "grantIdempotencyKey" LIKE '%:INITIAL'
  AND "referralEdgeId" IS NOT NULL
GROUP BY "referralEdgeId"
HAVING COUNT(*) > 1;

-- Multiple REFUND financial txs per payment (multi-seat collision survivors / attempts)
SELECT "externalPaymentId", COUNT(*)
FROM financial_transaction
WHERE type = 'REFUND' AND "externalPaymentId" IS NOT NULL
GROUP BY "externalPaymentId"
HAVING COUNT(*) > 1;
```

Additional recon SQL: [07-schema-integrity.md](./07-schema-integrity.md).

---

## Evidence required before repair

For every affected hold, preserve: pricing snapshot, redemptions, payment/ledger transactions, booking state, provider/webhook IDs. A repair must be **idempotent** and choose **one** outcome only:

1. restore/release the hold and reservations, or  
2. complete it at the originally committed quote, or  
3. issue a properly recorded compensation  

Never leave a half-released reservation and a half-confirmed booking.

# Incident traces and reconciliation checklist

## Trace A — successful wallet booking cannot be cancelled by an operator

```text
Passenger: checkoutWithWallet(hold)
  -> confirmFromWallet: CONFIRMED / PAID bookings + WALLET_PAYMENT ledger transaction
  -> no ExternalPayment exists
Operator: payments.cancelBooking(reference)
  -> CancellationService requires holdGroup.payment.status === SUCCESS
  -> payment is null -> “No successful payment found for this booking”
```

This is confirmed source behavior, not an inference about a particular operator page. It applies to a wallet payment and a zero-cash credits/vouchers payment.

## Trace B — admin/claimed credits fail credits-only checkout and trap the hold

```text
Admin grant / campaign claim -> CreditLot(ACTIVE, remaining=N), no promo-account credit
Search checkout preview -> sees CreditLot, calculates creditApplied=N / payable=0
createHold -> creates PENDING_PAYMENT bookings + reserves CreditLot.reservedXOF=N
checkoutWithWallet -> sees totalToPay=0, so wallet cash check passes
booking ledger -> debits passenger PROMO_CREDITS by N
account has no grant credit -> accounting engine: insufficient funds
catch remaps it -> “Insufficient wallet balance”
transaction rolls back confirmation, but the previously committed hold/reservation remains
```

This distinguishes the direct failure from the convenience-fee question. Wallet confirmation calculates its own payable from the snapshot and removes the convenience fee; the missing `waiveConvenienceFee` input is still a contract inconsistency but is not required for this failure.

## Trace C — pending page hides/discards the same hold's credits

```text
Failed checkout leaves hold H and CreditLot.reservedXOF=N
Pending page preview -> quote availability = remainingXOF - reservedXOF = 0
UI shows no credit applied / cash due
User pays from pending page -> refreeze computes quote first (still 0)
then release(H) -> old N reservation removed
then freeze(new quote) -> reserves 0
wallet/Paystack charge proceeds without the original promo credit
```

This is a separate defect from the ledger mismatch. It affects correctly ledger-funded referral credits too.

## Read-only data checks for operations

Run these against a restored/staging database first. Adapt quoted table/column names to the deployed migration state; do not use them to mutate production data.

```sql
-- Pending holds whose credit reservations still consume user availability.
SELECT hg.id AS hold_id, hg.status, hg."holdExpiresAt", cl."userId",
       cl."remainingXOF", cl."reservedXOF", dr."creditAppliedXOF"
FROM hold_group hg
JOIN discount_redemption dr ON dr."holdGroupId" = hg.id AND dr.status = 'RESERVED'
JOIN credit_lot cl ON cl.id = dr."creditLotId"
WHERE hg.status = 'ACTIVE' OR hg."holdExpiresAt" < now();

-- Wallet/zero-cash confirmed bookings missing an external payment. These are
-- valid under current implementation but will fail the cancellation gate.
SELECT b."bookingReference", b."holdGroupId", b."paymentStatus"
FROM booking b
JOIN hold_group hg ON hg.id = b."holdGroupId"
LEFT JOIN payment p ON p."holdGroupId" = hg.id
WHERE b.status = 'CONFIRMED' AND b."paymentStatus" = 'PAID' AND p.id IS NULL;

-- Credit lots that need ledger-backing reconciliation. Account-class spelling
-- must be confirmed in the deployed account bootstrap implementation.
SELECT cl."userId", SUM(cl."remainingXOF") AS lot_remaining
FROM credit_lot cl
WHERE cl.status IN ('ACTIVE', 'PARTIALLY_REDEEMED')
GROUP BY cl."userId";
```

## Evidence required before repair

For every affected hold, preserve the pricing snapshot, redemptions, payment/ledger transactions, booking state, and all provider/webhook IDs. A repair must be idempotent and must choose one outcome only: restore/release the hold, complete it at the originally committed quote, or issue a properly recorded compensation.

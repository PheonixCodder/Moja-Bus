# 05 — Cancellations and refunds

## Preconditions (`CancellationService`)

- Booking must be `CONFIRMED`.
- Not checked-in (`checkedInAt` set → reject).
- Before departure (trip cancel may force after departure via helper flag).
- Auth: owner / operator staff / admin.
- Hold group required.
- **`holdGroup.payment` must exist and `status === "SUCCESS"`** — fails for wallet/zero-cash confirms.

Channels accepted by service: `CASH | WALLET | VOUCHER` only.

VOUCHER additionally requires `userId` and trip `scheduleId` (issues schedule-scoped monetary voucher after tx).

---

## Amount math

- Prefer pricing snapshot: proportional share of `subtotalBaseXOF` and `operatorNetXOF`.
- Last cancelled seat absorbs rounding dust.
- Without snapshot: farePaid − default commission estimate.
- **Convenience fee is not refunded** (base/subtotal only).
- Hold `FOR UPDATE` serializes concurrent seat cancels in the same group.

---

## Ledger by channel

| Channel | Customer side | Operator / platform |
|---------|---------------|---------------------|
| WALLET | Credit `PASSENGER_WALLET` | Clawback receivable / commission as designed |
| CASH | Credit `OFFLINE_REFUND_PAYABLE` | Same clawback; ops must pay cash offline |
| VOUCHER | Offline payable + `issueCancellationVoucher` | Same; voucher schedule+company scoped |

Refund row always:

- `status: "COMPLETED"`
- `paystackRefundId: null`
- Linked to holdGroup + **payment** (required FK)

No card/MM money returns to the original instrument in product code.

---

## P0 — multi-seat REFUND uniqueness

`FinancialTransaction` has `@@unique([externalPaymentId, type])`.

Each seat cancel posts a transaction with `type: "REFUND"` and the **same** `externalPaymentId`.

| Seats cancelled | Result |
|-----------------|--------|
| First | May succeed |
| Second+ | Unique violation → cancel helper catches → booking still CANCELLED + `CANCEL_WITHOUT_REFUND` |

Trip cancel and multi-seat holds are the realistic triggers.

**Fix direction:** unique key per booking (or include bookingId in type/metadata uniqueness / separate idempotency column), not one REFUND per payment forever.

---

## P0 — wallet / zero-cash cannot cancel

`confirmFromWallet` never creates `ExternalPayment`. Cancel guard rejects with “No successful payment found for this booking”.

Affects:

- Passenger self-cancel (always sends `channel: "WALLET"`).
- Operator single cancel of wallet seats.
- Trip/bulk cancel of wallet-confirmed seats.

**Fix direction:** derive settlement from hold confirmation provenance (ledger BOOKING/WALLET_PAYMENT, snapshot instruments), not Paystack-shaped payment row alone. Define refund behavior per original instrument mix.

---

## P0 — trip cancel without refund

`cancelTripWithRefunds`:

1. Blocks if any checked-in.
2. Expires PENDING_PAYMENT bookings (without discount release — P1).
3. Cancels trip.
4. Per confirmed seat → `CancellationService`.
5. On failure: still `booking.status = CANCELLED` + `CANCEL_WITHOUT_REFUND` financialTransaction.

Passenger loses entitlement; money may remain with platform/Paystack; no durable remediation queue.

---

## Surfaces

| Surface | Channels | Checked-in | Guests |
|---------|----------|------------|--------|
| Operator booking drawer | WALLET / CASH / VOUCHER | Cancel hidden; server reject | Forced CASH for WALLET/VOUCHER |
| Manifest bulk | Same | Skip + count | Coerce to CASH |
| Trip cancel | `refundChannel` on schema | **Hard block** whole trip | Coerce to CASH |
| Passenger tickets | Hardcoded WALLET | N/A / server | Will fail for guests |

---

## Offline payable gap (P1)

CASH/VOUCHER credit `OFFLINE_REFUND_PAYABLE` with no fulfilment / paid / void lifecycle. Ops cannot distinguish “owed” vs “paid at counter” in-product.

---

## Edge notes

- Partial cancel (one of N seats): proportional math OK until unique collision.
- Refund before escrow clear: uses `releaseFromReserve` when `clearedAt` null.
- Operator insolvency: some accounts allow negative; still can throw Insufficient.
- Fee retained: product/marketing risk if “full refund” promised.
- No `bookingId` on Refund model — partial cancel reconciliation is hard (schema P1).

---

## Tests

- `lib/__tests__/cancel-clawback.test.ts` — proportional remainder math.
- **No** dedicated multi-seat trip helper tests covering unique collision or wallet path.

---

## Related findings

P0-1…P0-4, P1-4, P1-11, P2-3, P2-5, P2-14 — see [02-findings-catalog.md](./02-findings-catalog.md).

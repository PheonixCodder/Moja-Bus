# 06. Escrow: The Trust Mechanism

[⬅️ Back to README](./README.md)

---

Escrow is the most important concept in the Moja Ride financial model. Without it, the platform is a party to a fundamental trust breakdown: operators get paid immediately, but passengers have no recourse if the bus never shows up.

This document explains why escrow exists, exactly how it works, and every scenario that can release or drain it.

---

## 1. Why Escrow Exists

### The Trust Problem

In a ride-booking marketplace, there is an inherent information asymmetry:

- The **passenger** pays immediately and in full, before receiving the service.
- The **operator** provides the service days or weeks after receiving the money.

If the platform simply forwarded money to the operator immediately, the operator could:
- Cancel the trip (refund complications now fall on the platform)
- Provide substandard service (no financial leverage)
- Disappear with the funds

Without escrow, the platform is exposed to the full chargeback liability. With escrow, the platform holds the money until it is *confirmed delivered*.

### The Mathematical Guarantee

Escrow creates a two-tier balance in `OPERATOR_RECEIVABLE`:

| Balance | Meaning | Withdrawable? |
|---|---|---|
| `reservedBalance` | Money owed to operator, pending delivery of service | **No** |
| `availableBalance` | Money owed to operator, service confirmed delivered | **Yes** |

The sum `reservedBalance + availableBalance = postedBalance` is always the total operator liability.

The platform ensures: **an operator can never withdraw money for a trip that hasn't happened yet.**

---

## 2. How Money Enters Escrow

Money enters `reservedBalance` at the moment of payment confirmation.

When `BookingConfirmationService.confirmFromPayment()` runs, the `AccountingEngine` posts a `BOOKING` transaction:

```
DEBIT  PAYSTACK_CLEARING           = Gross charge amount - Paystack fee
DEBIT  PAYMENT_PROCESSOR_FEE       = Paystack fee
CREDIT OPERATOR_RECEIVABLE (net)   → goes to reservedBalance via reserveOnCredit=true
CREDIT PLATFORM_COMMISSION         = Platform fee
CREDIT PLATFORM_CONVENIENCE_FEE   = Convenience fee
```

The critical flag: **`reserveOnCredit = true`** on the `OPERATOR_RECEIVABLE` credit entry.

This instructs the `AccountingEngine` to:
1. Increment `postedBalance` by the net amount (as normal)
2. Increment `reservedBalance` by the net amount (not `availableBalance`)

The operator's dashboard immediately shows the pending revenue under "Upcoming Earnings," but the "Withdraw" button is disabled.

---

## 3. When `reservedBalance` Changes

### 3a. Increases (Money Enters Escrow)

The `reservedBalance` increases when:

| Event | Transaction Type | Amount |
|---|---|---|
| Passenger books via card | `BOOKING` | Operator net fare |
| Passenger books via wallet | `WALLET_BOOKING` | Operator net fare |

### 3b. Decreases (Money Leaves Escrow)

The `reservedBalance` decreases in two ways:

**Path 1: Release to Available (Normal Completion)**
The `release-escrow` cron sweeps into `availableBalance`:
```
reservedBalance -= netToRelease
availableBalance += netToRelease
```
This is the happy path. The service was delivered, and now the operator can withdraw.

**Path 2: Cancellation / Refund (Money Returns to Passenger)**
A booking is cancelled before the trip. The `RefundService` posts a `REFUND` transaction:
```
DEBIT  OPERATOR_RECEIVABLE (reserved)  = Net fare
DEBIT  PLATFORM_COMMISSION             = Platform commission (reversed)
CREDIT PASSENGER_WALLET                = Total refund to passenger
```
`reservedBalance` drops. The operator never gets paid for that seat.

---

## 4. When `availableBalance` Changes

### 4a. Increases (Escrow Released)

The `availableBalance` increases when:

| Trigger | Transaction | Condition |
|---|---|---|
| Trip arrives + 24 hours | `release-escrow` cron | `trip.status = ARRIVED` AND `actualArrival < NOW() - 24h` |
| Payout reversal (refund) | `PAYOUT_REVERSAL` | Bank transfer failed after debit |

### 4b. Decreases (Money Leaves the Platform)

The `availableBalance` decreases when:

| Event | Transaction Type | Where Money Goes |
|---|---|---|
| Operator withdrawal | `OPERATOR_PAYOUT` | Operator's bank account |
| Refund post-trip (edge case) | `REFUND` | Passenger wallet (very rare; disputed trips) |

---

## 5. The Escrow Release Algorithm in Detail

The `release-escrow` cron (`apps/web/app/api/cron/release-escrow/route.ts`) runs on a schedule.

### Step 1: Query

```sql
SELECT booking.*
FROM booking
JOIN trip ON booking.tripId = trip.id
WHERE booking.status = 'CONFIRMED'
  AND booking.clearedAt IS NULL
  AND trip.status = 'ARRIVED'
  AND trip.actualArrival < NOW() - INTERVAL '24 HOURS'
LIMIT 500
```

### Step 2: Group by HoldGroup

Bookings are grouped by `holdGroupId`. This is required because:
- Pricing lives at the `HoldGroup → PricingSnapshot` level
- A group of 3 seats may have a single pricing snapshot with a total operator net
- We must distribute the total net proportionally across all seats

### Step 3: Handle Rounding (Preventing XOF Leaks)

Suppose a group of 3 seats has a total operator net of 27,001 XOF.
- Per-seat standard: `round(27001 / 3) = 9000 XOF per seat`
- If we release 9000 for each of 3 seats: `27000 total`, losing 1 XOF.

**The rounding fix:**
```typescript
const standardNet = Math.round(operatorNetXOF / seatCount);
const isLastSeat = (remainingUncleared === 1);

if (isLastSeat) {
  // Absorb all rounding residual into the last seat
  netToRelease = operatorNetXOF - (clearedCount * standardNet);
} else {
  netToRelease = standardNet;
}
```

This guarantees `Σ(netToRelease for all seats) = operatorNetXOF` with no leakage.

### Step 4: Aggregate by Company

All nets for the same `companyId` are summed. Instead of 500 individual DB updates, we may need only 10 company-level updates.

### Step 5: Atomic Commit

```typescript
await prisma.$transaction([
  // Update operator balance
  prisma.financialAccount.update({
    where: { id: operatorAcct.id },
    data: {
      reservedBalance: { decrement: totalNet },
      availableBalance: { increment: totalNet },
    },
  }),
  // Mark all bookings as cleared
  prisma.booking.updateMany({
    where: { id: { in: batchBookingIds } },
    data: { clearedAt: new Date() },
  }),
]);
```

**Idempotency guarantee:** The `clearedAt` timestamp only gets set on successful commit. If the cron crashes mid-batch, all `clearedAt` fields remain `NULL` and the exact same bookings are picked up on the next invocation.

---

## 6. Grace Period Logic

The 24-hour grace period after `actualArrival` is the platform's dispute window:

- **T+0**: Trip arrives. `trip.actualArrival` is set.
- **T+24h**: Escrow is released. Operator can now withdraw.
- **T+0 to T+24h**: Passengers can file disputes. Admin can manually freeze escrow release for specific bookings by setting a flag before the cron runs.

### What Happens During a Dispute?

If a passenger files a dispute before escrow release, an admin can:
1. Set `booking.status = 'DISPUTED'` (custom status)
2. This prevents the cron from selecting the booking (it filters for `CONFIRMED` only)
3. The funds remain in `reservedBalance` indefinitely until manual resolution

---

## 7. Operator Cancellation vs. Passenger Cancellation

### If the Operator Cancels the Trip

The platform cancels all bookings on the trip. For each:
1. `booking.status → CANCELLED`
2. `RefundService.issueRefund()` runs
3. `REFUND` transaction: `reservedBalance -= net`, `PASSENGER_WALLET += refund`

The operator receives nothing for that trip. All escrowed funds flow back to passengers.

### If a Passenger Cancels Before Departure

1. `booking.status → CANCELLED`
2. Partial refund is calculated (full refund minus convenience fee if policy allows)
3. `REFUND` transaction: `reservedBalance -= net`, `PASSENGER_WALLET += refund amount`

The operator loses that seat's revenue. The platform retains the convenience fee (if applicable).

### If a Passenger Cancels After Departure

This is the post-trip dispute case. By this time:
- Escrow *may* have already been released (if >24h post-arrival)
- If released: `REFUND` debits from `availableBalance`
- This can push the operator into negative `availableBalance` (operator arrears)
- Future trip receipts automatically offset the negative balance before adding to withdrawable funds

---

## 8. Escrow and the Double-Entry System

The escrow mechanism is implemented *without* a separate ledger account. This is a deliberate design choice.

**Why not a separate `ESCROW_HOLDING` account?**

The `reservedBalance` field on `OPERATOR_RECEIVABLE` is a split of the same liability. Using a separate account would require:
- A `BOOKING → ESCROW` transaction (new account)
- An `ESCROW → OPERATOR_RECEIVABLE` transaction (on release)

This doubles the ledger entries without adding any accounting accuracy. The same `OPERATOR_RECEIVABLE` is still owed to the operator; the `reserved/available` split is purely a *permission gate*, not a different creditor.

The invariant remains: `Σ DEBIT = Σ CREDIT` on every transaction, and the total operator liability is always tracked in one place.

---

## 9. Escrow Anomalies and Edge Cases

### Double Release Prevention

The `clearedAt` field acts as the idempotency key. Once set, the booking is invisible to the cron query. A booking can never have its escrow released twice.

### Zero-Net Bookings

If the operator net is 0 (e.g., a 100% promotional discount on a seat), the cron skips the `financialAccount.update()` call but still marks `clearedAt`. No division-by-zero errors.

### Negative Net (Platform Subsidy)

In extreme promotional cases, the platform could subsidize the operator more than the passenger paid. The net would be negative, meaning the platform owes the operator more than collected. The `PAYSTACK_CLEARING` account absorbs this and may swing negative temporarily (it has `allowNegativeBalance = true`).

### Stale Trip Data

If a trip's `actualArrival` is never set (e.g., driver forgot to mark arrival), the escrow is never released. The booking remains in limbo. Operations must manually set `actualArrival` or trigger a manual override.

---

*See also: [02 - Life of Money](./02-life-of-money.md) | [16 - Withdrawals](./16-withdrawals.md) | [Cron: Release Escrow](./17-implementation/crons/release-escrow.md)*

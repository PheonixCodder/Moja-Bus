# 15 - Refunds

[⬅️ Back to README](./README.md)

---

The Refund workflow is highly complex because it must account for partial cancellations, escrow states, and external gateway limitations.

## Core Principles
1. **Never refund more than what was paid**: The system relies on the immutable `PricingSnapshot` to know exactly what fractions of XOF belong to which entity.
2. **Clawbacks**: When a refund occurs, the platform MUST claw back its commission from the revenue account. We do not subsidize operator cancellations.
3. **Wallet Preference**: Whenever possible, refunds are credited to the `PASSENGER_WALLET` rather than routed back through Paystack. This saves on external network calls, reduces refund failure rates, and retains the capital within the Moja Ride ecosystem.

## Scenario 1: Pre-Trip Cancellation (Wallet Refund)

An operator cancels a trip 2 days before departure. The funds are currently sitting in `reservedBalance` (Escrow).

### Step 1: Initiation
- Admin clicks "Cancel Trip" in the dashboard.
- The system queries all `Booking` rows for that trip.

### Step 2: The Math
- For each `HoldGroup`, it reads the `PricingSnapshot`.
- Let's say a user bought 2 seats for 20,000 XOF total. The operator net was 18,000, and commission was 2,000.

### Step 3: The Ledger Post
The `AccountingEngine("REFUND")` is constructed. It performs the exact mathematical inverse of the booking.
- Debit `OPERATOR_RECEIVABLE` by 18,000 XOF (from `reservedBalance`).
- Debit `PLATFORM_COMMISSION` by 2,000 XOF.
- Credit `PASSENGER_WALLET` by 20,000 XOF.

**Note on Fees**: The `PLATFORM_CONVENIENCE_FEE` and `PAYMENT_PROCESSOR_FEE` are typically *not* reversed, depending on business logic, as the gateway does not refund us the processing fee. The refund is often net of convenience fees.

### Step 4: Status Updates
- `Booking` statuses updated to `CANCELLED`.
- `paymentStatus` updated to `REFUNDED`.

## Scenario 2: Post-Trip Partial Refund

A passenger booked 3 seats. The bus left yesterday. Today, they complain that 1 seat was broken. Admin grants a 33% partial refund. 
Because it's past 24 hours, the `release-escrow` cron has already run! The funds are in the operator's `availableBalance`.

### Step 1: The Math
- `PricingSnapshot`: 3 seats. Operator Net = 27,000. Commission = 3,000. Total = 30,000.
- Refund fraction = 1/3.
- Refund Amount = 10,000 XOF.
- Operator Clawback = 9,000 XOF.
- Commission Clawback = 1,000 XOF.

### Step 2: The Ledger Post
- Debit `OPERATOR_RECEIVABLE` by 9,000 XOF (from `availableBalance`, NOT reserved, because escrow already released).
- Debit `PLATFORM_COMMISSION` by 1,000 XOF.
- Credit `PASSENGER_WALLET` by 10,000 XOF.

**What if the operator already withdrew the money and their balance is 0?**
The Debit to `availableBalance` will push their account into the negative (if `allowNegativeBalance` is configured for operators during refunds, or they will be put into an "Arrears" state where future ticket sales pay off the debt before they can withdraw again).

## Refund to Card (Paystack Refund) - DEPRECATED

Automated Paystack refunds have been explicitly removed from the platform (`cancellation-service.ts`). 

All automated refunds are now routed exclusively to the `PASSENGER_WALLET`, or treated as offline `CASH`/`VOUCHER` reimbursements. 

If a user legally demands a refund to their original payment method, it requires manual administrative intervention directly in the Paystack dashboard, followed by a manual ledger reconciliation. The automated system will no longer attempt to call `POST /refund` on the Paystack API.

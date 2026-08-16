# Schema, integrity, and migration audit

## Relevant aggregate relationships

```text
Trip 1--* Booking *--1 Seat
HoldGroup 1--* Booking; HoldGroup 1--1 PricingSnapshot; HoldGroup 0..1 ExternalPayment
ExternalPayment 1--* PaymentAttempt/Event; ExternalPayment 1--* Refund
HoldGroup 1--* DiscountRedemption -> campaign/coupon/voucher/credit lot
ReferralEdge 1--* CreditLot
FinancialTransaction 1--* LedgerEntry -> FinancialAccount
```

## Good constraints

- `PricingSnapshot.holdGroupId`, `ExternalPayment.holdGroupId`, booking references/tokens, coupon code, referral code/user, and provider payment reference are unique.
- Campaign scope join tables have composite uniqueness.
- Payment attempts are unique by payment/attempt number.
- Ledger entries are unique by transaction/sequence and own idempotency key.
- Key operational indexes exist for trip-seat-status, hold expiry, incentive status, and webhooks.

## Integrity gaps

| Priority | Gap | Recommendation |
|---|---|---|
| P1 | No database constraints for money non-negativity, date order, seat count, percentage/share bounds, or campaign benefit shape. | Add `CHECK` constraints/migrations: amounts >= 0, `endsAt >= startsAt`, shares sum to 10,000 when hybrid, valid benefit fields, `dropoff > boarding`. |
| P1 | `Refund` has no booking relation, external-provider unique ID, or idempotency key. | Add `bookingId`, provider reference, request idempotency key, and appropriate uniqueness indexes. |
| P1 | `Booking` lacks a database exclusion/unique constraint for overlapping confirmed seats. | Keep locking, but add a database-level strategy where supported (range exclusion) or a normalized seat-segment reservation table with a unique key. |
| P2 | `FinancialTransaction @@unique([externalPaymentId,type])` permits only one transaction of each type per payment, but null behavior/provider retries/manual flows deserve explicit idempotency fields. | Use a required business idempotency key unique across transaction type; do not rely solely on nullable relation pair semantics. |
| P2 | `WalletReservation` is optional to a hold and no unique active reservation rule is declared. | Link reservation to a required hold/payment intent where applicable; constrain one logical reservation per account/hold/type. |
| P2 | Enum naming distinguishes payment record, booking payment, refund record, and ledger transaction states without a documented transition matrix. | Publish a single state-transition table and enforce transitions in commands. |
| P2 | JSON stores critical metadata/snapshots without typed queryable columns for reconciliation. | Promote provider event ID, payment purpose, checkout owner, refund execution state, and retry fields to columns. |
| P3 | Cascade deletes on company/hold can erase transactional relations. | Define immutable financial retention policy; generally restrict deletion/soft-delete commercial aggregates after funds move. |

## Migration note

Recent voucher schedule-scope and promotional-voucher-limit migrations indicate active evolution. Before applying more changes, run a data audit for pre-existing vouchers without a schedule/company, orphaned reserved redemptions, `ACTIVE` expired holds, duplicate/refund-less cancellations, and referral edges with more than one initial credit lot.

# System map and lifecycle

## Ownership map

```text
Search page / search router
  -> offerId (serialized itinerary identity)
  -> TripDetailsService + SeatAvailabilityService
  -> BookingHoldService
       -> HoldGroup + PENDING_PAYMENT Booking rows
       -> PricingSnapshot + RESERVED DiscountRedemption rows
  -> PaymentService / Wallet confirmation
       -> ExternalPayment + PaymentAttempt + PaymentEvent
       -> BookingConfirmationService
            -> CONFIRMED Booking rows + FINALIZED redemptions + ledger
  -> CancellationService / cancelTripWithRefunds
       -> CANCELLED booking + Refund + compensating ledger / voucher
```

The hold group is the primary checkout aggregate. A booking is one passenger-seat-segment within it; `PricingSnapshot` is one-to-one with a hold; an external payment is one-to-one with a hold but also represents wallet top-ups without a hold. This overloading is a notable modeling pressure point.

## Normal card flow

```text
search -> select exact N seats -> login -> createHold
  -> DB transaction locks Trip -> verifies overlapping segment bookings
  -> creates ACTIVE hold (15 min), bookings, snapshot, reserved incentives
  -> initiate Paystack -> creates/updates payment and attempt
  -> inline popup or hosted redirect
  -> authenticated tRPC verification OR unauthenticated callback OR signed webhook
  -> Paystack server verification -> SUCCESS -> confirmation transaction
  -> booking issued, discount finalized, ledger posted, notifications best-effort
```

The return callback at `/api/payments/verify` calls `PaymentService.verifyAndConfirm` without a session user, while the authenticated client route passes a user ID. The system must treat webhook/callback confirmation as a service-to-service action and never rely on that user argument for a customer-owned state change.

## Wallet / zero-cash flow

`checkoutWithWallet` validates hold ownership before calling `confirmFromWallet`. Zero cash is modeled as a wallet-style confirmation, not as an explicit payment record. This is workable only if the confirmation ledger always represents every applied voucher/credit and zero-charge path; that behavior needs transaction-level test coverage.

## Hold exit states

| Exit | Intended effect | Current concern |
|---|---|---|
| User release | expire pending bookings and release discount reservations | implemented by `releaseHold`; caller must invoke it. |
| Time expiry | availability ignores expired holds | no inspected scheduled sweeper was found that consistently changes group/booking/redemption state after the 15-minute deadline. |
| Failed Paystack reconciliation | pending bookings marked expired | `reconcile-payments` does not update `HoldGroup` or release discount reservations. |
| Captured after expiry | wallet rescue | only works for an identified user; guest payment becomes manual intervention. |

## Cancellation / refund flow

```text
authorized cancellation -> locks hold group -> marks ticket CANCELLED
  -> creates Refund(status COMPLETED) -> posts wallet/offline ledger
  -> optionally issues a schedule-bound voucher after the transaction
```

This is an internal reimbursement flow, not a Paystack refund flow. No `paystackRefund` API call was found, and `paystackRefundId` is always null on this path. A `COMPLETED` status therefore does not mean that a card/mobile-money customer was refunded by Paystack.

## Incentive lifecycle

```text
campaign/coupon/voucher/credit quote
  -> hold reservation (campaign budget, coupon count, voucher/credit reserves)
  -> payment confirmation finalizes and consumes
  -> hold release should reverse reservations

referral code -> ReferralEdge(ATTRIBUTED)
  -> first paid booking -> QUALIFIED + CreditLot(PENDING or ACTIVE)
  -> cron activates PENDING lot and posts referral ledger
```

The two paths use separate state machines. Incentive accounting is coupled to booking confirmation but notification dispatch is best-effort and outside a durable transaction/outbox.

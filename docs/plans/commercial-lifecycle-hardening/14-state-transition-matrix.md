# Commercial state-transition matrix (Phase 02 / P3-6)

Canonical statuses for booking, payment, refund, and hold. Application code must not invent parallel string statuses.

## HoldGroup (`HoldGroupStatus`)

| From | To | Trigger |
|------|-----|---------|
| *(create)* | `ACTIVE` | Seat hold created |
| `ACTIVE` | `EXPIRED` | Past `holdExpiresAt` / expiry job (Phase 03) |
| `ACTIVE` | `CONFIRMED` | Successful pay / wallet confirm |
| `ACTIVE` | `CANCELLED` | User abandon / release before pay |

Money rows (`payment`, `refund`) **Restrict** deleting the hold after they exist.

## ExternalPayment (`PaymentRecordStatus`)

| From | To | Trigger |
|------|-----|---------|
| *(create)* | `INITIALIZED` | Checkout session started |
| `INITIALIZED` | `PENDING` | Redirect / await webhook |
| `PENDING` / `INITIALIZED` | `SUCCESS` | Webhook / verify success |
| `PENDING` / `INITIALIZED` | `FAILED` | Provider failure |
| `SUCCESS` | `DISPUTED` / `REFUNDED` | Rare provider paths; seat refunds prefer `Refund` rows |

Wallet / zero-cash confirms may never create `ExternalPayment` (Phase 00).

## Refund (`RefundRecordStatus` × `RefundChannel`)

| Channel | Happy path status | Notes |
|---------|-------------------|--------|
| `WALLET` | → `COMPLETED` | Ledger credit posted |
| `CASH` / `VOUCHER` | → `PENDING_FULFILMENT` | Offline / instrument issue |
| Any | → `FAILED` | Durable obligation; booking may be `REFUND_PENDING` (D3) |
| Paystack card/MoMo | **Out of scope** (D1=A) | No provider refund API in this program |

Idempotency: `requestIdempotencyKey` / `businessIdempotencyKey` per seat.

## Booking (`BookingStatus`) — commercial-relevant

| From | To | Trigger |
|------|-----|---------|
| *(create under hold)* | `PENDING_PAYMENT` | Seats reserved pending checkout |
| `PENDING_PAYMENT` | `CONFIRMED` | Payment success |
| `PENDING_PAYMENT` | `EXPIRED` / `CANCELLED` | Hold expiry / abandon |
| `CONFIRMED` | `CANCELLED` | Cancel with successful refund path |
| `CONFIRMED` | `REFUND_PENDING` | Trip/seat cancel when refund fulfilment failed (Phase 00) |
| `REFUND_PENDING` | `CANCELLED` | Ops completes offline refund / wallet repair |
| `CONFIRMED` | `COMPLETED` | Travelled / trip completed |

Do **not** use silent `CANCEL_WITHOUT_REFUND` as the happy failure path (fixed Phase 00).

## DiscountRedemption (`DiscountRedemptionStatus`)

| From | To | Trigger |
|------|-----|---------|
| *(create)* | `RESERVED` | Quote freeze on hold |
| `RESERVED` | `FINALIZED` | Booking confirm |
| `RESERVED` | `CANCELLED` | Hold release / expire / reprice |

## CreditLot / MonetaryVoucher (summary)

- Lots: `PENDING` → `ACTIVE` (delay cron) → `PARTIALLY_REDEEMED` / `REDEEMED` / `EXPIRED` / `REVOKED`
- Vouchers: `ACTIVE` → `PARTIALLY_REDEEMED` / `REDEEMED` / `EXPIRED` / `REVOKED`
- Available balance = remaining − reserved (reserved nested in remaining)

## Related docs

- [13-env-cutover-and-drift.md](./13-env-cutover-and-drift.md)
- [03-phase-00-cancel-refund-money-safety.md](./03-phase-00-cancel-refund-money-safety.md)
- [05-phase-02-schema-migrations-data-repair.md](./05-phase-02-schema-migrations-data-repair.md)

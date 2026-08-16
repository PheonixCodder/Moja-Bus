# 04 — Payments, Paystack, wallet, zero-cash

## Architecture

```
UI checkout
  ├─ PAYSTACK + payable>0 → initiateForHold → popup/redirect
  │     → verify (tRPC) | GET /api/payments/verify | webhook charge.success
  │     → confirmFromPayment
  └─ WALLET or payable=0 → checkoutWithWallet → confirmFromWallet
        (no ExternalPayment)

Top-up: wallet.topUp → ExternalPayment (holdless, metadata.isTopUp) → processTopUp

Ledger: AccountingEngine + FinancialAccountService
  BOOKING, TOP_UP, REFUND, ESCROW_RELEASE, SETTLEMENT, OPERATOR_PAYOUT, …
```

| Component | Role |
|-----------|------|
| `payment-service.ts` | Init / verify / webhook / top-up / transfer reconcile |
| `booking-confirmation-service.ts` | Card confirm + orphan rescue; wallet confirm |
| `paystack-client.ts` | HTTP: init, verify, banks, transfer, signature |
| `paystack-provider.ts` | Adapter including **unused** `refund()` |
| `checkout-payable.ts` | Payable after instruments; wallet fee waive |
| `pricing-resolver.ts` | Commission / fee → Paystack minor units |
| `use-paystack-checkout.ts` | Client chain |
| Cron | reconcile-payments, release-escrow, release-reservations, snapshot-accounts |

---

## Paystack integration

### Initialize

- Keys required; ExternalPayment per holdGroup (create or reuse).
- Attempt reference `moja_{holdGroupId}_{attempt}_{ts}`.
- Channels: `card`, `mobile_money`; currency XOF.
- **No `subaccount` / `split_code` / `bearer` in production init.**  
  Manual probe only: `scripts/validate-paystack-split.mjs`.
- Settlement: platform clearing + ledger escrow (`OPERATOR_RECEIVABLE` + `reserveOnCredit`).

### Verify paths

| Path | Auth | Confirms? |
|------|------|-----------|
| `booking.verifyPayment` | session / protected | yes |
| `GET /api/payments/verify` | **none** | yes + redirect |
| Webhook `charge.success` | HMAC SHA512 | re-verify + confirm |
| `mobile-callback` | none | **no** (HTML only) |

Verify checks reference + `verified.amountXOF === payment.amountXOF`, then success + confirm.

### Webhook

- Idempotency: `WebhookEvent.idempotencyKey = event:reference:id`.
- Handled: `charge.success`, `transfer.*` (payout settle/reverse).
- Other events marked processed with no business action.

### Refund API

- `PaystackProvider.refund` → `POST /refund` exists.
- **Product cancel never calls it.** Refund rows: `status: "COMPLETED"`, `paystackRefundId: null`.
- Schema enum includes `RefundChannel.PAYSTACK`; cancel input only `CASH|WALLET|VOUCHER`.

### Re-init / amount drift (P1)

On pending-pay after `refreezeHoldDiscounts`, re-init creates a new attempt and updates status/reference/metadata but **does not set `amountXOF` to the new snapshot charge** (`payment-service.ts` ~142–151). Verify still compares against stale `payment.amountXOF` (~220) → false mismatch.

---

## Wallet & zero-cash

### Payable math

- Canonical: `resolveCheckoutPayable` / `walletPayableFromSnapshot`.
- Wallet / zero-cash **waive convenience fee**; Paystack keeps fee.
- `getCheckoutPricing` exposes `payableWalletXOF`, `payablePaystackXOF`, `canZeroCash`.

### Confirm

- Locks wallet `FOR UPDATE`.
- Blocks zero-cash without promo/ticket discount when `operatorNetXOF > 0`.
- Debits `PASSENGER_WALLET` for cash portion; credits operator escrow + commission; promo legs via `appendPromoLedgerEntries`.
- Rewrites snapshot fee/charge for wallet path.
- **Does not create ExternalPayment** → cancel path broken (P0-1).

### Top-up

- Holdless ExternalPayment + `isTopUp` metadata.
- Credited in `processTopUp`; parallel path also exists under passenger router (drift risk).
- Top-up init may omit PaymentEvent parity with booking init (P2).

### WalletReservation

- Model + `release-reservations` cron exist.
- **No `walletReservation.create` in app code.** Escrow uses `FinancialAccount.reservedBalance`. Cron is effectively a no-op.

---

## Confirmation strengths

- Clash re-check on Paystack confirm path.
- Hold status claim for single confirm.
- Orphan: expired hold + SUCCESS payment → wallet rescue for logged-in users.
- Idempotent webhook processing.
- Unit tests: checkout-payable, pricing-resolver, paystack-checkout, revenue-analytics.

---

## Gaps / findings (payments slice)

See full IDs in [02-findings-catalog.md](./02-findings-catalog.md).

- P0: wallet cancel impossible; false COMPLETED refunds; multi-seat REFUND uniqueness collision.
- P1: mobile-callback; unauthenticated verify; guest orphan; daily reconcile; amount desync on re-init; createHold-then-fail leaves reservations (P1-18).
- P2: dead PAYSTACK channel; fee retained on cancel; no splits; dead WalletReservation; success URL tokens; synthetic guest emails; ExternalPayment purpose overload (checkout vs top-up); top-up lifecycle divergence; Refund missing bookingId/provider unique.

### Correct target architecture (from transaction pack)

```text
PaymentIntent (purpose, owner, quote, state)
  -> Attempt(s) -> Provider event inbox -> verified transition
  -> Confirmation transaction + transactional outbox

RefundRequest (booking, original payment, channel, amount, state)
  -> provider/offline execution worker -> reconciliation -> customer notice
```

Every external call needs: idempotency key, durable requested/received timestamps, provider identifiers, retry metadata, operator-visible exception state.

## UI coupling

- `booking-checkout-form`: createHold → Paystack if PAYSTACK && total > 0 else wallet/zero-cash.
- Pending pay tabs mirror method split; may refreeze then pay — **must exclude own hold reservations** (P1-17).
- Display pricing can show waived fee while freeze used different autoApply/useCredits — P2-1 until method is part of a versioned server quote.

---

## File inventory (payments)

`features/payments/**` (services, providers, libs, hooks, tests, validate-paystack-split script)  
`app/api/payments/verify`, `mobile-callback`  
`app/api/webhooks/paystack`  
`trpc/routers/payments.ts`, `wallet.ts`, booking initiate/verify/checkoutWithWallet  
`packages/db` AccountingEngine, FinancialAccountService  
Cron: reconcile-payments, release-escrow, release-reservations, snapshot-accounts

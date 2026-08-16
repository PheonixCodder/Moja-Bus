# Checkout, Paystack, wallet, cancellation, and refunds

## Positive controls observed

- Paystack webhook signature is verified before JSON processing.
- Webhook events use a provider/reference/event idempotency key.
- Server verification checks provider status and amount against the locally created payment.
- Confirmation claims the active hold and uses serializable work around booking/ledger paths.
- The popup has a redirect fallback and the reconciliation job can recover pending successful charges.

## Boundary assessment

| Boundary | Current behavior | Audit concern |
|---|---|---|
| Initialize | locally creates/updates one payment per hold and appends attempts | stale/failed attempts are retained, but attempt lifecycle/status updates were not consistently found. |
| Callback | GET reference verifies provider then redirects | no signed state/ownership/locale binding. |
| Webhook | signature + stored event + provider verification | no durable retry policy; a provider/API outage returns 500 and relies on provider retry/reconcile. |
| Reconciliation | checks PENDING payments older than 5 minutes | failure cleanup is partial; unlimited/parallel provider calls can strain Paystack or database for a backlog. |
| Top-up | router creates external payment directly | top-up uses a different callback URL and no `PaymentEvent` creation, increasing lifecycle divergence. |
| Refund | internal ledger/voucher/offline payable | external Paystack refund not implemented; status semantics incorrect. |

## Specific risks

1. `PaymentService.verifyAndConfirm` finds by a globally unique reference but receives an optional user; browser callback confirmation is not tied to the initiating account. Ensure the result/redirect cannot disclose booking information cross-account.
2. The email fallback derives an artificial guest email from a phone number. This is not an email address owned or verified by the passenger and can create invalid Novu recipients and personal-data leakage in provider logs.
3. `mobile-callback` only renders a “Payment Complete” page. It neither verifies nor confirms a transaction, so mobile flows depend wholly on webhook/reconciliation and can appear completed before the booking exists.
4. `ExternalPayment.holdGroupId` is unique but nullable and top-ups share the model; add a discriminated `kind`/purpose column and constraints instead of JSON `isTopUp` checks.
5. Cancellations allow cash/voucher bookkeeping but do not represent customer collection, fulfilment, or expiry of offline liabilities. Operations cannot distinguish promise, payment, failure, and settlement.
6. `Refund` has no uniqueness constraint for booking or external provider refund ID. The service lock helps a single hold’s seat cancellation, but data-level protection against a duplicate process/manual path is absent.
7. Wallet and zero-cash confirmations create no `ExternalPayment`, but cancellation rejects a hold without a successful one. This is a concrete operator cancellation failure, not merely a modeling concern.
8. `CreditLot` is treated as spendable by the quote engine, while wallet confirmation debits `PROMO_CREDITS` in the ledger. Admin and campaign-claim grant services create only the lot, unlike referral grants which also post the ledger credit. This creates an underfunded financial account and a misleading “Insufficient wallet balance” failure.

## Correct target state

```text
PaymentIntent (purpose, owner, quote, state)
  -> Attempt(s) -> Provider event inbox -> verified transition
  -> Confirmation transaction + transactional outbox

RefundRequest (booking, original payment, channel, amount, state)
  -> provider/offline execution worker -> reconciliation -> customer notice
```

Every external call must have an idempotency key, durable requested/received timestamps, provider identifiers, retry metadata, and an operator-visible exception state.

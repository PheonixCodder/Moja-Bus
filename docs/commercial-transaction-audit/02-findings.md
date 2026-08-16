# Confirmed findings and remediation order

## P0 — trip cancellation can cancel a paid ticket after its refund fails

Evidence: [`cancel-trip-with-refunds.ts`](../../apps/web/lib/cancel-trip-with-refunds.ts) catches `CancellationService.cancelBooking` failures, then updates the booking to `CANCELLED` and records `CANCEL_WITHOUT_REFUND` (around lines 164–176). The transaction commits the trip cancellation and the ticket cancellation even when the operator has insufficient funds, a database error occurs, or the reimbursement cannot be delivered.

Impact: a passenger can lose travel entitlement and receive no refund. The notification labels the refund as failed, but there is no durable remediation queue or automatic retry.

Fix order: do not cancel the booking on a refund failure. Either atomically complete the refund before cancellation, or create an explicit `REFUND_PENDING`/disruption state with a payable liability and an operations queue. Commit the trip cancellation independently only if customer entitlement is preserved and refund obligation is durable.

## P0 — Paystack refunds are not implemented but refunds are recorded as completed

Evidence: [`cancellation-service.ts`](../../apps/web/features/payments/services/cancellation-service.ts:183) creates a refund with `status: "COMPLETED"` and `paystackRefundId: null`; the Paystack provider contains initialize/verify/transfer operations but no refund call. `CASH` and `VOUCHER` use an offline reimbursement payable, while `WALLET` credits an internal wallet.

Impact: an operator or customer can read “completed refund” even though no original-payment refund happened. For card/mobile-money payment this creates financial, reconciliation, support, and regulatory exposure.

Fix order: distinguish `INTERNAL_WALLET_CREDIT`, `OFFLINE_PAYABLE`, and `PAYSTACK_REFUND_PENDING/PROCESSING/COMPLETED/FAILED`; persist provider request/response identifiers; call the provider asynchronously through an outbox/worker; reconcile each pending refund; make customer wording channel-specific.

## P1 — delayed referral initial rewards can be granted repeatedly

Evidence: [`referral-service.ts`](../../apps/web/features/discounts/services/referral-service.ts:259) sets an edge from `ATTRIBUTED` to `QUALIFIED`, but on subsequent confirmed bookings while it remains `QUALIFIED` it selects `INITIAL` unless it is already `REWARDED` (lines 284–286). The idempotency key includes the *hold group*, so each later booking creates a distinct initial credit lot.

Impact: with `rewardDelayHours > 0`, a referee can make multiple paid bookings before the cron promotes the first lot, causing multiple initial referral payouts.

Fix order: record and claim an initial-reward idempotency key at edge level before enqueueing, or make `QUALIFIED` terminal for initial enqueueing. Add concurrent confirmation and delayed-cron tests.

## P1 — failed/expired payment cleanup leaves aggregate and incentive state stale

Evidence: [`reconcile-payments/route.ts`](../../apps/web/app/api/cron/reconcile-payments/route.ts) marks only pending bookings `EXPIRED` after a definitive failed charge. It neither transitions the `HoldGroup` nor calls `releaseDiscountReservations`. Availability is eventually correct because it filters by `holdExpiresAt`, but campaign budget/coupon/voucher/credit reservations can remain reserved and the group is misleadingly `ACTIVE`.

Impact: inventory appears resolved while promotion balances/caps and user checkout state remain blocked or inaccurate; retry/release behavior is non-deterministic.

Fix order: centralize every failed/expired/released hold transition in one idempotent command that atomically updates bookings, hold group, reservations, and an audit event. Run it from user release, payment failure, expiry sweeper, and post-expiry capture handling.

## P1 — wallet/credits bookings cannot be cancelled because cancellation requires a Paystack payment

Evidence: [`cancellation-service.ts`](../../apps/web/features/payments/services/cancellation-service.ts:94) resolves the hold and rejects whenever `holdGroup.payment` is missing or is not `SUCCESS`, with “No successful payment found for this booking” at line 100. [`booking-confirmation-service.ts`](../../apps/web/features/payments/services/booking-confirmation-service.ts:342) confirms wallet and zero-cash holds by posting an internal `WALLET_PAYMENT` ledger transaction; it does not create an `ExternalPayment`. This is therefore reproducible for a confirmed/PAID wallet booking from the operator bookings page.

Impact: a valid paid ticket cannot be cancelled/refunded through normal operator operations when the customer paid by wallet or the total was zero after credits/vouchers.

Fix order: cancellation must determine payment provenance from a canonical settlement/booking-payment record, not require a Paystack-shaped `ExternalPayment`. Define refund behavior for wallet, zero-cash, Paystack, offline, and mixed instruments, then use the corresponding original accounting transaction(s).

## P1 — admin/claimed promo credit lots are not funded in the ledger, so zero-cash checkout fails after creating a hold

Evidence: [`credit-grant-service.ts`](../../apps/web/features/discounts/services/credit-grant-service.ts) and [`claim-credit-grant-service.ts`](../../apps/web/features/discounts/services/claim-credit-grant-service.ts) create `CreditLot` rows only. In contrast, [`promo-ledger.ts`](../../apps/web/features/discounts/services/promo-ledger.ts) debits the passenger `PROMO_CREDITS` financial account whenever `creditAppliedXOF > 0`; wallet confirmation always selects that account. The referral reward path is different: it posts the corresponding ledger credit. Thus a credit lot granted by admin/campaign claim can be available to quoting but its financial account can remain zero; `AccountingEngine` rejects the debit and the catch-all remaps “Insufficient funds” to “Insufficient wallet balance”.

Impact: a customer with visible promo credits can be unable to complete a fully covered booking, receives a misleading wallet error, and is sent a low-wallet notification. Since the hold was already committed, seats and credits remain reserved.

Fix order: make each credit grant a single transactional accounting event: create/activate the lot and credit the passenger promo-credit liability with a unique grant idempotency key. Add a repair/reconciliation for existing active lots whose remaining amount exceeds the ledger balance.

## P1 — pending-payment re-quote lets a hold consume its own credits, vouchers, coupon cap, and campaign budget

Evidence: [`booking-details.tsx`](../../apps/web/features/booking/components/booking-details.tsx:313) previews the pending booking through `payments.getCheckoutPricing`, which reads credit availability as `remainingXOF - reservedXOF`. The existing pending hold has already reserved its own incentive values. On payment, [`refreezeHoldDiscounts`](../../apps/web/features/discounts/services/quote-service.ts:300) calls `quoteCheckoutDiscounts` **before** entering the transaction that calls `releaseDiscountReservations` (around line 370). Consequently the incoming quote sees its own old reservation as unavailable; it may then release that reservation and freeze a new zero-credit quote.

Impact: the passenger pending tab displays no credits after a failed checkout, or replaces an originally credit-covered hold with a full-cash quote. The same ordering can self-block a capped coupon or campaign budget. This is independent of the missing promo-ledger grant and explains the user-visible “credits do not show/cut” path even for correctly funded referral credits.

Fix order: re-quote excluding reservations from the current hold, or atomically release/claim/re-quote/re-reserve with row locks and rollback protection. Never expose a preview that includes the selected hold's own reservation as unavailable. Add an integration test for re-opening an unchanged pending hold and for applying/removing every instrument.

## P1 — public ticket lookup exposes a bearer credential without documented privacy/revocation controls

Evidence: `booking.getTicketByToken` is a `publicProcedure`; `Booking.ticketToken` is a permanent unique CUID used to generate QR tickets. The booking success URL sends ticket tokens in query parameters from the client dialog.

Impact: browser history, analytics, referrer propagation, screenshots, shared URLs, or logs can disclose a ticket and its passenger/trip details. A long-lived bearer token has no expiry, rotation, or revocation field.

Fix order: avoid putting ticket tokens in URLs, minimize public ticket data, add a signed short-lived presentation token or authenticated ticket route, and explicitly document scanner authorization/revocation.

## P2 — callback verification is unauthenticated and customer recovery is inconsistent

Evidence: [`/api/payments/verify`](../../apps/web/app/api/payments/verify/route.ts:20) accepts a reference and invokes `verifyAndConfirm(reference)` without a user ID. The route verifies with Paystack, so it is not a payment-forgery bug by itself, but it can confirm/redirect a referenced hold without user ownership context. Its error redirect is not locale-prefixed, unlike the application routes.

Fix: bind callback state to a signed, short-lived checkout session; derive return locale safely; present no booking identifiers until a signed callback/session is validated. Keep webhook confirmation independent and idempotent.

## P2 — checkout display/payment-method pricing diverges from the frozen quote

`getCheckoutPricing` computes wallet and Paystack payable variants client-side from a preview. The hold is created with a quote that does not include `waiveConvenienceFee`; the checkout form creates it with `autoApply: true, useCredits: true` regardless of displayed choices. Wallet confirmation later recomputes/uses separate logic. This creates a real risk that the UI’s “wallet fee waived” total differs from the hold snapshot or charged amount.

Fix: make payment method and all instruments part of a versioned server quote; pass only a quote/hold ID to confirmation; reject stale/changed quotes with a clear refresh state.

## P2 — no durable outbox for booking, payment, refund, or incentive notifications

Confirmation, cancellation, referral, and trip-cancellation notifications run as best-effort post-transaction promises. Failures are logged or swallowed. There is no persistent dispatch state, retry policy, or customer-notification audit.

Fix: transactionally write an outbox record; a worker performs Novu/provider delivery with idempotency and retry; expose failed deliveries to operations.

## P3 — UI localization and route consistency are incomplete

The booking flow contains extensive literal English strings, while pages use `next-intl`. Several redirects/links omit locale (`/search`, `/dashboard/...`, `/book/...`). This makes locale loss and untranslated critical payment/refund copy likely.

Fix: route all navigation through locale-aware helpers and move critical checkout/error/refund text to message catalogs before more payment work.

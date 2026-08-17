# Operator Cancellation Schedule Voucher Audit

**Date:** 2026-08-17  
**Scope:** Operator cancellation, passenger cancellation, schedule-scoped monetary vouchers, checkout pricing, hold freeze, wallet/zero-cash confirmation, Paystack checkout, pending-pay, wallet display, campaigns/coupons/credits plumbing.

## Executive Verdict

The intended happy path is mostly implemented:

1. An operator can cancel a confirmed passenger booking with refund channel `VOUCHER`.
2. The cancellation service issues a `CANCELLATION` monetary voucher tied to the cancelled trip's `scheduleId` and `companyId`.
3. Search checkout lists only unscoped vouchers or vouchers whose `scheduleId` matches the selected trip schedule.
4. Pricing enforces the same schedule/company rule server-side.
5. Hold creation reserves the voucher, and confirmation finalizes the voucher balance.
6. If the voucher/credits cover the fare, search checkout uses wallet/zero-cash confirmation instead of Paystack.

Implementation update:

- Passenger self-cancel now rejects `VOUCHER` at `payments.cancelBooking`.
- Operator voucher cancellation now creates or reuses the cancellation voucher inside the cancellation transaction.
- Voucher refunds are marked `COMPLETED` once issued, with fulfilment metadata, and no longer appear in the cash offline refund queue.
- Pending-pay now routes a zero payable amount through wallet/zero-cash confirmation instead of opening Paystack.
- Wallet and voucher-issued notification copy now call out the schedule restriction for cancellation vouchers.

## Intended Goal Checked

> When an operator cancels someone's booking inside `apps/web/app/[locale]/dashboard/operator/(dashboard)/bookings/page.tsx` and selects a voucher as the refund option, the passenger can use that voucher to book another ride from the same schedule from `apps/web/app/[locale]/search/page.tsx`. This behavior should happen only for operator cancellation, not passenger cancellation.

Current status:

| Requirement | Current Status | Notes |
|---|---:|---|
| Operator booking cancel UI offers voucher | Pass | `BookingDetailDrawer` includes `WALLET`, `CASH`, `VOUCHER`. |
| Operator bulk/trip cancellation supports voucher | Pass | Manifest bulk and trip cancel expose `VOUCHER`; tRPC schemas accept it. |
| Voucher issuance stores source booking/hold | Pass | `issueCancellationVoucher` writes source links. |
| Voucher issuance stores cancelled trip schedule/company | Pass | `CancellationService` passes `booking.trip.scheduleId` and `booking.trip.companyId`. |
| Voucher redeem limited to same schedule | Pass | UI filters and engine enforces `VOUCHER_SCHEDULE_MISMATCH`. |
| Voucher redeem limited to same company | Pass | Engine enforces `VOUCHER_COMPANY_MISMATCH`. |
| Passenger can use voucher from search checkout | Pass for logged-in passengers | Voucher picker is available only when logged in and matching voucher exists. |
| Full-cover voucher avoids Paystack from search | Pass | Search checkout branches to `checkoutWithWallet` when payable is zero. |
| Passenger self-cancel cannot create voucher | Pass | Passenger UI has only wallet/cash, and `payments.cancelBooking` rejects `VOUCHER`. |
| Pending-pay same behavior as search | Pass for zero-cash routing | Vouchers can be refrozen; zero payable now confirms without Paystack. |
| Refund/voucher issuance is atomic | Pass | Voucher record creation/reuse now runs inside the cancellation transaction. |

## Flow Map

### Operator single booking cancellation

Entry:

- `apps/web/app/[locale]/dashboard/operator/(dashboard)/bookings/page.tsx`
- `apps/web/features/operator/views/operator-bookings-view.tsx`
- `apps/web/features/operator/components/bookings/booking-detail-drawer.tsx`

The page prefetches `operator.listBookings` and renders `OperatorBookingsView`. The actual cancel dialog lives in `BookingDetailDrawer`.

Observed behavior:

- `RefundChannel = "CASH" | "WALLET" | "VOUCHER"`.
- Guest bookings disable wallet and voucher.
- Checked-in bookings do not show the cancel button and show checked-in cancel-disabled copy.
- The mutation calls `trpc.operator.cancelBooking` with `bookingReference`, selected `channel`, and required reason.

Server path:

- `apps/web/trpc/routers/operator.ts`
- `apps/web/features/payments/services/cancellation-service.ts`
- `apps/web/features/discounts/services/voucher-service.ts`

`operator.cancelBooking` requires `bookings:update` and `bookings:cancel`, then calls `CancellationService.cancelBooking` with `userRole: "OPERATOR"` and `userCompanyId`.

The cancellation service:

- Loads booking, user, and trip schedule/company.
- Rejects checked-in bookings.
- Rejects voucher refunds for guest bookings.
- Rejects voucher refunds when the trip has no `scheduleId`.
- Verifies ownership/company/admin permissions.
- Requires booking status `CONFIRMED`.
- Cancels the booking and creates a `Refund` row.
- For `channel === "VOUCHER"`, calls `issueCancellationVoucher`.

`issueCancellationVoucher` creates:

- `source = "CANCELLATION"`
- `status = "ACTIVE"`
- `originalAmountXOF = refund amount`
- `remainingAmountXOF = refund amount`
- `expiresAt = now + 12 months`
- `scheduleId = cancelled trip schedule`
- `companyId = cancelled trip company`
- `sourceBookingId`
- `sourceHoldGroupId`

### Operator trip and bulk cancellation

Relevant files:

- `apps/web/app/[locale]/dashboard/operator/(dashboard)/trips/page.tsx`
- `apps/web/features/operator/components/trips/manifest-drawer.tsx`
- `apps/web/trpc/routers/operator.ts`
- `apps/web/trpc/routers/trips.ts`
- `apps/web/lib/cancel-trip-with-refunds.ts`

Current behavior:

- Bulk selected passenger cancellation supports `WALLET`, `CASH`, `VOUCHER`.
- Whole-trip cancellation supports `WALLET`, `CASH`, `VOUCHER`.
- Bulk cancellation skips checked-in bookings.
- Whole-trip cancellation blocks if any confirmed booking is checked in.
- Guest bookings requested as wallet/voucher fall back to cash in bulk/trip cancellation.

This is aligned with the later hardening plan.

### Passenger cancellation

Relevant files:

- `apps/web/features/booking/views/passenger-tickets-view.tsx`
- `apps/web/trpc/routers/payments.ts`
- `packages/schemas/src/payments-admin.ts`
- `apps/web/features/payments/services/cancellation-service.ts`

Passenger UI:

- `PassengerTicketsView` only models `refundChannel` as `"WALLET" | "CASH"`.
- The cancel dialog only renders wallet and cash options.

Server/API issue:

- `cancelBookingSchema` accepts `z.enum(["CASH", "WALLET", "VOUCHER"])`.
- `payments.cancelBooking` passes `input.channel` directly to `CancellationService`.
- `CancellationService` permits cancellation when `booking.userId === input.userId`.
- Therefore, a logged-in passenger can create a cancellation voucher with a crafted call to `payments.cancelBooking` using `channel: "VOUCHER"`.

This violates the intended goal. The UI is correct, but the API is not hardened.

## Voucher Domain and Schema

Relevant files:

- `packages/db/prisma/schema.prisma`
- `packages/db/prisma/migrations/20260816120000_voucher_schedule_scope/migration.sql`
- `packages/db/prisma/migrations/20260816170000_phase02_commercial_constraints/migration.sql`

`MonetaryVoucher` currently includes:

- `source VoucherSource`
- `status VoucherStatus`
- `originalAmountXOF`
- `remainingAmountXOF`
- `reservedAmountXOF`
- `expiresAt`
- `expiresOnFirstCompletedBooking`
- `scheduleId`
- `companyId`
- source booking/hold/admin/campaign links

The schema comment says `scheduleId` is required for cancellation vouchers, and `companyId` identifies the issuing operator company.

Migration status:

- `20260816120000_voucher_schedule_scope` adds `scheduleId` and `companyId`, with a backfill from `sourceBookingId -> booking.trip`.
- `20260816170000_phase02_commercial_constraints` backfills again, changes FK delete behavior to `RESTRICT`, and adds `monetary_voucher_cancellation_scope_chk`.

Important caveat:

- The cancellation-scope check is added `NOT VALID`, so existing dirty rows can still exist until a cleanup/validation run is completed.
- The Prisma schema expects `onDelete: Restrict`; the latest migration aligns with that, but only after it has actually run in the target environment.

## Search Checkout Redemption

Relevant files:

- `apps/web/app/[locale]/search/page.tsx`
- `apps/web/features/search/components/search-page-client.tsx`
- `apps/web/features/booking/components/booking-dialog-flow.tsx`
- `apps/web/features/booking/components/booking-checkout-form.tsx`
- `apps/web/trpc/routers/payments.ts`
- `apps/web/features/discounts/services/quote-service.ts`
- `apps/web/features/discounts/engine/evaluate.ts`

The search page itself is a server wrapper. It prefetches search data and renders `SearchPageClient`. Voucher checkout behavior is in `BookingCheckoutForm`.

Checkout UI behavior:

- If logged in, it queries `discounts.listMyVouchers`.
- The voucher dropdown filters vouchers with no `scheduleId`, or `v.scheduleId === tripDetails.scheduleId`.
- It passes `monetaryVoucherId` into `payments.getCheckoutPricing`.
- It passes the same selected voucher into `booking.createHold`.

Pricing behavior:

- `payments.getCheckoutPricing` loads the trip schedule and route.
- It calls `quoteCheckoutDiscounts` with `scheduleId`, `tripId`, `routeId`, `offerCompanyId`, selected voucher, promo code, and credits.
- `quoteCheckoutDiscounts` loads the selected voucher only if it belongs to the current user.
- `evaluateCheckoutDiscounts` rejects a schedule-scoped voucher when `input.ctx.scheduleId` does not match `voucher.scheduleId`.
- It also rejects a company-scoped voucher when `ctx.companyId` does not match `voucher.companyId`.

Hold behavior:

- `BookingHoldService.createHold` verifies the signed quote matches offer, seat count, code, voucher id, auto-apply, and credit settings.
- It requotes server-side in strict mode.
- It freezes discount redemptions and increments `MonetaryVoucher.reservedAmountXOF`.

Confirmation behavior:

- `finalizeDiscountRedemptions` decrements `reservedAmountXOF`, decrements `remainingAmountXOF`, and moves voucher status to `REDEEMED` or `PARTIALLY_REDEEMED`.
- `appendPromoLedgerEntries` splits voucher burn from promo credits using `discountBreakdownJson`; voucher burn debits `VOUCHER_LIABILITY`, not promo expense.

This correctly supports partial remaining balance on a schedule voucher.

## Zero-Cash and Paystack

Relevant files:

- `apps/web/features/payments/lib/checkout-payable.ts`
- `apps/web/features/booking/components/booking-checkout-form.tsx`
- `apps/web/features/payments/services/booking-confirmation-service.ts`
- `apps/web/features/payments/payment-service.ts`
- `apps/web/features/payments/lib/paystack-checkout.ts`

Search checkout:

- `resolveCheckoutPayable` returns `paymentMode: "ZERO_CASH"` when instruments cover the payable amount.
- `BookingCheckoutForm` sets `isZeroCash = totalAmount === 0`.
- If payment method is `PAYSTACK` but `totalAmount` is zero, it does not call Paystack. It calls `checkoutWithWallet`, which is the wallet/zero-cash confirmation path.
- `confirmFromWallet` allows `totalToPay === 0` if promo/voucher/credit coverage exists.

This is correct for the search-page voucher rebooking goal.

Pending-pay:

- `PassengerBookingsView.executePayment` always branches by selected `paymentMethod`.
- It refreezes discounts first, then if `paymentMethod === "PAYSTACK"` it calls `completePayment`.
- `PaymentService.initiateForHold` does not special-case zero amount; it initializes Paystack using `snapshot.chargeAmountXOF`.

Result:

- A pending hold fully covered by voucher/credits can still try Paystack if the user leaves the method on Card/Mobile Money.
- Search checkout is correct; pending-pay is not equivalent.

## Wallet Display

Relevant files:

- `apps/web/app/[locale]/dashboard/(passenger)/wallet/page.tsx`
- `apps/web/features/passenger/views/passenger-wallet-view.tsx`
- `apps/web/features/passenger/components/promo-incentives-panel.tsx`
- `apps/web/trpc/routers/discounts.ts`

Wallet page prefetches wallet balance, wallet ledger, active vouchers, and credit lots.

`PromoIncentivesPanel` displays vouchers, including schedule label when available. It does not filter by current schedule because wallet is an inventory surface, not a checkout surface.

This is acceptable, but the copy should be explicit that cancellation vouchers are valid only on the named schedule. Today it displays a route/name hint but does not strongly explain the restriction.

## Campaigns, Coupons, Promo Credits

Relevant files:

- `apps/web/trpc/routers/discounts.ts`
- `apps/web/trpc/routers/discounts-admin.ts`
- `apps/web/trpc/routers/discounts-operator.ts`
- `apps/web/features/discounts/services/campaign-loader.ts`
- `apps/web/features/discounts/engine/evaluate.ts`
- `apps/web/features/discounts/services/quote-service.ts`

Campaign/coupon/credit behavior is not the main blocker for cancellation vouchers, but it is involved in checkout math:

- Active campaigns load by operator company and schedule/route/trip scopes.
- User-entered coupon overrides auto-apply.
- Monetary voucher applies after ticket/fee discounts and before credit lots.
- Credit lots apply after voucher.
- The pricing snapshot stores combined payment-instrument value in `creditAppliedXOF`, while `discountBreakdownJson` preserves `creditAppliedXOF` vs `voucherAppliedXOF` split.
- Ledger split recovers voucher burn separately from promo credits.

This ordering matches the existing plan.

## Defect Register

### P0 - Passenger API can issue cancellation vouchers

Files:

- `packages/schemas/src/payments-admin.ts`
- `apps/web/trpc/routers/payments.ts`
- `apps/web/features/payments/services/cancellation-service.ts`

Impact:

- Violates the explicit product rule: voucher cancellation should only happen when operator cancels.
- UI hides voucher from passenger self-cancel, but the protected passenger API accepts it.

Recommended fix:

- In `payments.cancelBooking`, reject `input.channel === "VOUCHER"` for passenger self-cancel before calling `CancellationService`.
- Optionally split schemas:
  - passenger cancel: `CASH | WALLET`
  - operator/admin cancel: `CASH | WALLET | VOUCHER`
- Add a regression test for passenger `payments.cancelBooking` with `VOUCHER`.

### P1 - Voucher issuance is not atomic with refund cancellation

Files:

- `apps/web/features/payments/services/cancellation-service.ts`
- `apps/web/features/discounts/services/voucher-service.ts`

Impact:

- The cancellation transaction can cancel the booking and create a `Refund` row with `channel = VOUCHER`.
- Voucher creation happens afterward using `this.prisma`, not the same transaction.
- If voucher creation fails after the refund commits, the passenger has a cancelled booking and a voucher refund obligation, but no voucher.
- Because the booking is no longer `CONFIRMED`, retrying the same cancellation path will not issue the voucher.

Recommended fix:

- Issue the voucher inside the same transaction, or create a durable outbox/repair job that is idempotent by booking/refund id.
- Store a durable voucher link on the refund, or make refund fulfillment derive and repair from `MonetaryVoucher.sourceBookingId`.

### P1 - Voucher refund status stays pending after immediate voucher issue

Files:

- `packages/db/prisma/schema.prisma`
- `apps/web/features/payments/services/cancellation-service.ts`
- `apps/web/features/payments/services/offline-refund-fulfilment.ts`

Impact:

- `CASH` and `VOUCHER` refunds are both created as `PENDING_FULFILMENT`.
- Voucher issuance is immediate, but the refund row has no `voucherId` and remains in the offline fulfillment queue.
- Admin offline refund tooling can show voucher refunds as still owed even when the voucher exists.

Recommended fix:

- Decide whether a successfully issued voucher means refund fulfillment is complete.
- If yes, set voucher refund status to `COMPLETED` when voucher creation succeeds and store a fulfillment note.
- If no, add explicit copy/tooling that voucher refunds remain pending until manually verified, and add a direct relation or metadata link to the issued voucher.

### P1 - Pending-pay zero-cash can still initiate Paystack

Files:

- `apps/web/features/booking/views/passenger-bookings-view.tsx`
- `apps/web/features/booking/components/booking-details.tsx`
- `apps/web/features/payments/payment-service.ts`

Impact:

- Pending-pay supports voucher selection and refreeze, but payment execution branches on the selected method instead of effective payable.
- If voucher/credits fully cover the hold and the user leaves Card/Mobile Money selected, it can call Paystack with a zero-amount snapshot.

Recommended fix:

- After refreeze, use the returned quote/payable or re-read snapshot and route `payable === 0` to `checkoutWithWallet`.
- Disable Paystack or auto-switch to wallet/zero-cash when payable is zero.
- Add a pending-pay test for full voucher coverage.

### P2 - Schedule voucher UI copy is weak

Files:

- `apps/web/features/booking/components/booking-checkout-form.tsx`
- `apps/web/features/booking/components/booking-details.tsx`
- `apps/web/features/passenger/components/promo-incentives-panel.tsx`
- `apps/web/features/notifications/workflows/passenger/promo-incentives.ts`

Impact:

- Search checkout filters correctly, but users may not understand why a voucher is missing on a different schedule.
- Wallet display shows a route/name hint, not a clear "valid only on this schedule" statement.
- Voucher-issued notification does not include the schedule restriction.

Recommended fix:

- Add clear schedule restriction copy in wallet and voucher notification.
- In checkout, consider showing disabled ineligible vouchers with "valid only on..." instead of hiding them.

### P2 - Migration check is not validated

Files:

- `packages/db/prisma/migrations/20260816170000_phase02_commercial_constraints/migration.sql`

Impact:

- `monetary_voucher_cancellation_scope_chk` is `NOT VALID`.
- Future writes are checked, but existing dirty rows remain possible until validation.

Recommended fix:

- Add a maintenance task/runbook to validate the check after data cleanup.
- Add a one-off query to report active cancellation vouchers with null `scheduleId` or `companyId`.

## Test Coverage Observed

Relevant tests:

- `apps/web/features/discounts/engine/__tests__/evaluate.test.ts`
- `apps/web/features/payments/lib/__tests__/checkout-payable.test.ts`
- `apps/web/features/payments/lib/__tests__/phase00-cancel-refund.test.ts`
- `apps/web/features/discounts/services/__tests__/promo-ledger.test.ts`

Covered:

- Schedule-scoped voucher applies on matching schedule.
- Schedule-scoped voucher soft-fails on wrong schedule.
- Voucher burn is not platform promo expense.
- Wallet payable can resolve to zero cash.
- Cash/voucher refunds are pending fulfillment in helper tests.

Missing:

- End-to-end operator cancel with `VOUCHER` creates a schedule-bound voucher.
- Passenger `payments.cancelBooking` rejects `VOUCHER`.
- Search checkout full-cover schedule voucher confirms via zero-cash and finalizes remaining voucher balance.
- Wrong-schedule voucher is not selectable in search checkout and is rejected server-side if forced.
- Pending-pay full-cover voucher does not call Paystack.
- Voucher issue failure cannot leave cancelled booking without voucher.

## Recommended Fix Order

1. Harden passenger cancellation API so `payments.cancelBooking` rejects `VOUCHER`.
2. Make voucher issuance atomic or durably repairable from refund/booking id.
3. Decide and implement voucher refund fulfillment status semantics.
4. Fix pending-pay zero-cash branching to match search checkout.
5. Add regression tests around the exact operator-cancel-to-search-rebook flow.
6. Improve wallet/notification copy for schedule-scoped vouchers.
7. Validate the cancellation voucher scope check in the database after cleanup.

## Bottom Line

For a normal operator cancellation from the operator bookings page, selecting voucher should produce a schedule-bound voucher that the logged-in passenger can use on a future trip from the same schedule in search checkout. That happy path is present.

The system is still not production-clean for the stated rule because passenger self-cancel can request voucher at the API layer, voucher issuance is not atomic with cancellation, and pending-pay has a zero-cash Paystack divergence. Fix those before treating the schedule voucher flow as complete.

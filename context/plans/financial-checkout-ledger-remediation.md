# Implementation Plan: Financial Checkout, Promo Credits & Ledger Remediation

**Date:** September 11, 2026  
**Status:** Approved for Implementation  
**Target Systems:** `apps/web`, `apps/traveler-app`, `packages/db`  
**Related Audit:** `context/audits/comprehensive-financial-checkout-audit/`

---

## 1. What We Are Building

An end-to-end financial and checkout remediation across Moja Ride (`apps/web`, `apps/traveler-app`, and `packages/db`). This plan fixes the critical double-entry journal validation crash (`Journal validation failed: Σ Debit (1025) != Σ Credit (1000)`) on zero-cash and promo-covered bookings, prevents marketing promo credits from subsidizing electronic payment convenience fees, enforces Paystack's 100 XOF minimum transaction floor on card/mobile money checkouts, unifies web and mobile traveler checkout logic so zero-cash bookings are never blocked by an empty wallet, and secures operator-funded promotional contra entries in the general ledger.

---

## 2. Agreed Vocabulary & Domain Invariants

- **Zero-Cash (Free) Booking**: A booking where the passenger pays 0 XOF out-of-pocket because promo credits or discounts cover 100% of the ticket fare. The convenience fee is automatically waived (0 XOF), and the booking confirms internally without touching Paystack.
- **Promo Credits**: Platform-funded marketing credits that strictly subsidize the bus ticket fare (`postDiscountSubtotalXOF`), and can **never** be applied toward payment gateway convenience fees.
- **Convenience Fee**: A fee charged strictly to offset electronic card/mobile money gateway processing (Paystack). It is always 0 XOF for Moja Wallet payments and 100% Promo-covered bookings.
- **Double-Entry Equilibrium**: The strict accounting invariant where $\sum \text{Debits} \equiv \sum \text{Credits}$ down to the exact integer XOF, with zero rounding error.

---

## 3. Decisions Made

1. **Promo Boundaries & Fee Waiving**: In `auto-apply.ts` and `evaluate.ts`, promo credits are capped to `postDiscountSubtotalXOF` (the ticket fare), *never* against `provisionalChargeXOF` (which includes convenience fee). If credits cover 100% of the ticket fare, the convenience fee is set to **0 XOF** at quote evaluation time regardless of the initial `paymentMethod` selector.
2. **Paystack 100 XOF Minimum Floor**: If the user selects Card/Paystack and promo credits would leave a remaining payable between 1 and 99 XOF, the promo credit application is automatically capped to leave a remaining cash balance of at least 100 XOF (Paystack's gateway floor). If the user chooses Wallet, no floor is applied.
3. **Mobile Traveler App Parity**: In `passenger-form-sheet.tsx`, zero-cash bookings bypass the `walletBalance` gate entirely. The mobile app adopts the canonical `resolveCheckoutPayable` logic so empty wallets are never blocked when a booking is 100% covered by credits.
4. **Operator-Funded Promo Ledger Contra**: When `snapshot.operatorPromoFundedXOF > 0`, both `confirmFromPayment()` and `confirmFromWallet()` set `postOperatorContra: true`, debiting `PROMO_CONTRA_OPERATOR` and crediting the operator receivable offset so Moja Ride's clearing cash does not absorb operator discounts.

---

## 4. Key Side-Effects & Ripple-Effects Managed

1. **Hold Snapshot & Discount Freezing (`quote-service.ts`)**:
   - `reserveDiscountOnHold` stores the new `creditAppliedXOF` without the convenience fee.
   - Refreezing (`refreezeHoldDiscounts`) respects the same promo-to-ticket capping.
2. **Cancellation & Refund Math (`cancellation-policy.ts` & `cancellation-service.ts`)**:
   - `computeRefundQuote` reads `creditAppliedXOF` from `pricingSnapshot`. Because `creditAppliedXOF` now accurately equals the ticket portion (e.g. 1,000 XOF instead of 1,025 XOF), the refund quote will accurately restore 1,000 XOF to `creditLot`, preventing phantom 25 XOF promo creation on cancellation.
3. **Pending Bookings Dashboard View (`passenger-bookings-view.tsx`)**:
   - Resuming a hold from `/dashboard/bookings` invokes `refreezeHoldDiscounts`. It inherits the clean, capped quote with waived fee on zero-cash, preventing the dashboard payment retry from crashing.
4. **Receipts & Novu Notifications (`booking-receipt-email.ts`)**:
   - Line items for `convenienceFee` and `discounts` will display clean integers (`0 XOF` fee and exact fare credit) instead of conflicting math.

---

## 5. Execution Steps

### Phase 1: Discount Engine & Quote Math
- [x] Edit `apps/web/features/discounts/engine/auto-apply.ts`: Cap `creditAppliedXOF` strictly to `postDiscountSubtotalXOF`. Automatically waive `convenienceFeeXOF` when `creditAppliedXOF >= postDiscountSubtotalXOF`.
- [x] Edit `apps/web/features/discounts/engine/evaluate.ts`: Set credit lot `need` to `postDiscountSubtotalXOF`. Enforce Paystack 100 XOF floor rule when payment method is Paystack and remaining balance is between 1 and 99 XOF.

### Phase 2: Checkout Routers & Quote Signer
- [x] Edit `apps/web/trpc/routers/payments.ts`: Ensure `getCheckoutPricing` detects full promo coverage and sets `waiveConvenienceFee = true` and `displayFeeXOF = 0`.
- [x] Edit `apps/web/features/payments/lib/checkout-payable.ts`: Verify `resolveCheckoutPayable` and `walletPayableFromSnapshot`.

### Phase 3: Booking Confirmation & Double-Entry Ledger
- [x] Edit `apps/web/features/payments/services/booking-confirmation-service.ts`:
  - In `confirmFromWallet`: Clamp `creditAppliedXOF` to `snapshot.postDiscountSubtotalXOF ?? snapshot.subtotalBaseXOF`.
  - Pass `postOperatorContra: true` when `snapshot.operatorPromoFundedXOF > 0`.
  - In `confirmFromPayment`: Pass `postOperatorContra: true` when `snapshot.operatorPromoFundedXOF > 0`.

### Phase 4: Passenger Dashboards & Web UI
- [x] Edit `apps/web/features/booking/components/booking-checkout-form.tsx`: Ensure clean zero-cash badge and copy, fee waived display, and smooth submit.
- [x] Edit `apps/web/features/booking/views/passenger-bookings-view.tsx`: Ensure pending pay tab respects zero-cash and fee waiving.

### Phase 5: Mobile Traveler App
- [x] Edit `apps/traveler-app/features/search/components/passenger-form-sheet.tsx`: Fix line 266 so empty wallets never block zero-cash bookings (`!isZeroCash && walletBalance < totalAmountXOF`).

### Phase 6: Automated Testing & Verification
- [x] Run test suite and verify double-entry ledger balance invariants.

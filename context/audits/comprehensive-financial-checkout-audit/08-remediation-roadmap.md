# 08 — Remediation Roadmap & Code Solutions

**Scope:** Step-by-step technical remediation plan with exact TypeScript code diffs and architectural fixes.

---

## 1. Fix for P0 Root Cause: Journal Validation Failure & Promo-to-Fee Leak

### A. Fix `buildChargeQuote` in `apps/web/features/discounts/engine/auto-apply.ts`
Promo credits must only cover the **ticket subtotal**, NEVER the payment gateway convenience fee.

```typescript
// IN apps/web/features/discounts/engine/auto-apply.ts lines 101-109:

// BEFORE:
const provisionalChargeXOF =
  postDiscountSubtotalXOF + convenienceFeeXOF - feeDiscountXOF;

let creditAppliedXOF = input.instruments.reduce(
  (sum, i) => sum + i.creditAppliedXOF,
  0,
);
creditAppliedXOF = Math.min(creditAppliedXOF, provisionalChargeXOF);

// AFTER:
// Promo credits apply STRICTLY against post-discount ticket subtotal.
let creditAppliedXOF = input.instruments.reduce(
  (sum, i) => sum + i.creditAppliedXOF,
  0,
);
// The maximum credit that can be absorbed is the ticket subtotal itself!
creditAppliedXOF = Math.min(creditAppliedXOF, postDiscountSubtotalXOF);

// If the ticket is 100% covered by promo credits, convenience fee is automatically waived!
const effectiveConvenienceFee =
  creditAppliedXOF >= postDiscountSubtotalXOF ? 0 : convenienceFeeXOF - feeDiscountXOF;

const provisionalChargeXOF = postDiscountSubtotalXOF + effectiveConvenienceFee;
```

### B. Fix `evaluateCheckoutDiscounts` in `apps/web/features/discounts/engine/evaluate.ts`
Cap the credit lot `need` to `postDiscountSubtotalXOF`:

```typescript
// IN apps/web/features/discounts/engine/evaluate.ts line 144:

// BEFORE:
const interim = buildChargeQuote({ ctx: input.ctx, instruments });
let need = interim.provisionalChargeXOF;

// AFTER:
const interim = buildChargeQuote({ ctx: input.ctx, instruments });
// Base need strictly on post-discount subtotal:
let need = interim.postDiscountSubtotalXOF;
if (input.creditAmountXOF != null) {
  need = Math.min(need, input.creditAmountXOF);
}
```

### C. Fix `confirmFromWallet` in `apps/web/features/payments/services/booking-confirmation-service.ts`
Ensure the ledger debits promo credits strictly for the ticket portion, guaranteeing double-entry equilibrium:

```typescript
// IN apps/web/features/payments/services/booking-confirmation-service.ts lines 590-618:

const split = splitPromoPaymentInstruments(snapshot);
// In wallet confirmation, convenience fee is 0. Ensure creditApplied does not exceed postDiscountSubtotal:
const safeCreditApplied = Math.min(
  split.creditAppliedXOF,
  snapshot.postDiscountSubtotalXOF ?? snapshot.subtotalBaseXOF,
);

seq = appendPromoLedgerEntries({
  engine,
  snapshot: {
    platformPromoFundedXOF: snapshot.platformPromoFundedXOF ?? 0,
    operatorPromoFundedXOF: snapshot.operatorPromoFundedXOF ?? 0,
    creditAppliedXOF: safeCreditApplied,
    ticketDiscountXOF: snapshot.ticketDiscountXOF ?? 0,
  },
  accounts: {
    promoExpensePlatformId: promoExpense.id,
    promoCreditsUserId: promoCreditsUser.id,
    promoContraOperatorId: promoContra.id,
  },
  operatorReceivableId: operatorAcct.id,
  holdGroupId: holdGroup.id,
  sequenceStart: seq,
  postOperatorContra: false,
});
```

---

## 2. Fix for Mobile Traveler App Empty Wallet Bug

In `apps/traveler-app/features/search/components/passenger-form-sheet.tsx`:
Replace the flawed wallet balance check:

```typescript
// BEFORE:
if (effectivePaymentMethod === 'WALLET') {
  if (!isZeroCash && walletBalance < walletCharge) {
    await releaseHold.mutateAsync({ holdId });
    Alert.alert(t('booking:insufficientFunds'), ...);
    return;
  }
}

// AFTER:
if (effectivePaymentMethod === 'WALLET') {
  // If the booking is zero-cash (fully promo-covered), NEVER block on wallet balance!
  if (!isZeroCash && walletBalance < totalAmountXOF) {
    await releaseHold.mutateAsync({ holdId });
    Alert.alert(t('booking:insufficientFunds'), ...);
    return;
  }
}
```

---

## 3. Fix for Operator-Funded Discount Absorption

In `apps/web/features/payments/services/booking-confirmation-service.ts`:
When `snapshot.operatorPromoFundedXOF > 0`:
1. The operator receivable credited must be `snapshot.operatorNetXOF`.
2. `postOperatorContra` must be set to `true` if `operatorPromoFundedXOF > 0` to debit the operator contra revenue account and offset the platform clearing account.

---

## 4. Verification & Testing Probe

To verify the fix:
1. Seed a user with 5,000 Promo Credits.
2. Select an Abidjan to Bouake trip (1,000 XOF fare, 25 XOF convenience fee).
3. Search page dialog should show:
   - Base Fare: `1,000 XOF`
   - Promo Credits Applied: `-1,000 XOF`
   - Convenience Fee: `0 XOF (Free/Waived)`
   - Total to Pay: `0 XOF`
4. Click `Confirm Free Booking (0 XOF)`.
5. Ledger evaluates:
   - Debit: `USER_PROMO_CREDITS` = 1,000 XOF
   - Credit: `OPERATOR_RECEIVABLE` = 950 XOF
   - Credit: `PLATFORM_COMMISSION` = 50 XOF
   - Total Debit (1,000) === Total Credit (1,000).
6. Result: Booking confirms smoothly with `200 OK`, tickets generated, without ledger failure!

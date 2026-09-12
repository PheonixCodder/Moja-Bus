# 05 — Cross-Platform Audit: Web, Dashboards & Traveler App

**Scope:** Comparative audit of checkout implementations, fee calculations, and state machines across:
1. `apps/web/app/[locale]/search/page.tsx` & `BookingCheckoutForm`
2. `apps/web/app/[locale]/dashboard/(passenger)/bookings/page.tsx` (Pending Payments)
3. `apps/traveler-app/app/(tabs)/search.tsx` & `PassengerFormSheet`

---

## 1. Cross-Platform Comparison Matrix

| Feature / Behavior | Web Search (`BookingCheckoutForm`) | Web Pending Bookings (`PassengerBookingsView`) | Mobile App (`PassengerFormSheet`) |
| :--- | :--- | :--- | :--- |
| **Pricing Quote Engine** | `trpc.payments.getCheckoutPricing` | `trpc.booking.refreezeHoldDiscounts` | `trpc.payments.getCheckoutPricing` |
| **Convenience Fee Handling** | Display fee dynamically resolved via `resolveCheckoutPayable` | Fee conditionally waived if `paymentMethod === "WALLET"` | **Broken**: Hardcoded ternary `paymentMethod === 'WALLET' ? 0 : convenienceFeeXOF` |
| **Zero-Cash Detection** | `totalAmount === 0` | `refrozen.chargeAmountXOF === 0` | `totalAmountXOF === 0` |
| **Zero-Cash Confirmation Route** | Calls `trpc.booking.checkoutWithWallet` | Calls `trpc.booking.checkoutWithWallet` | Calls `trpc.booking.checkoutWallet` |
| **Wallet Balance Gate on Zero-Cash** | **Safe**: Bypasses balance check (`isZeroCash || walletAvailable >= total`) | **Safe**: Directly branches to wallet checkout mutation | **CRITICAL BUG**: Fails closed if wallet is empty! (`walletBalance < walletCharge` check runs before zero-cash bypass) |
| **Signed Quote Id Verification** | Verified against server hash | N/A (Refreezes existing hold) | Verified |
| **Device Hash Passing** | Passed via cookie/header | Passed via `getDeviceHash()` | Passed via `@/lib/device-hash` |

---

## 2. Deep Dive: Mobile Traveler App Checkout Bugs

In `apps/traveler-app/features/search/components/passenger-form-sheet.tsx`:

### Bug A: Zero-Cash Bookings Blocked for Users with 0 XOF Wallet
Lines 262–283:
```typescript
const walletCharge = holdResult.subtotalBaseXOF ?? subtotalBaseXOF;

if (effectivePaymentMethod === 'WALLET') {
  if (!isZeroCash && walletBalance < walletCharge) { // <--- BUG!
    await releaseHold.mutateAsync({ holdId });
    Alert.alert(t('booking:insufficientFunds'), ...);
    return;
  }
}
```
If a mobile user has **0 XOF in their wallet** but has **5,000 Promo Credits** that cover 100% of the trip:
1. In `passenger-form-sheet.tsx`, `totalAmountXOF` was computed from `pricingQuery.data?.payableXOF`.
2. But `walletCharge` is computed from `holdResult.subtotalBaseXOF` ($1,000 \text{ XOF}$), which is the gross ticket fare before promo credits!
3. If `isZeroCash` is false because of a 1 XOF rounding drift or missing query refetch, the mobile app compares `walletBalance (0) < walletCharge (1000)` and **cancels the hold group**, throwing an "Insufficient Funds" popup at the user!

### Bug B: Missing `resolveCheckoutPayable` in Mobile App
The Web app unified all pricing logic in `apps/web/features/payments/lib/checkout-payable.ts`:
- `resolveCheckoutPayable()`
- `walletPayableFromSnapshot()`

The Mobile React Native app duplicates this math locally using fragile ternaries:
```typescript
const convenienceFeeXOF =
  pricingQuery.data?.displayFeeXOF ??
  (paymentMethod === 'WALLET' ? 0 : (pricingQuery.data?.convenienceFeeXOF ?? 0));
const totalAmountXOF =
  pricingQuery.data?.payableXOF ??
  (paymentMethod === 'WALLET'
    ? Math.max(0, subtotalBaseXOF - creditAppliedXOF)
    : (pricingQuery.data?.chargeAmountXOF ?? subtotalBaseXOF + convenienceFeeXOF));
```
When `pricingQuery.data?.payableXOF` returns 0, but the user selects Card, the mobile app shows the wrong payable amount and crashes when trying to initialize a Paystack payment with 0 XOF.

---

## 3. Web Dashboard Pending Pay Tab Discrepancy

In `apps/web/features/booking/views/passenger-bookings-view.tsx` (`executePayment`):
- When a user has a hold in `PENDING_PAYMENT` state, they can resume checkout from `/dashboard/bookings`.
- The code invokes `refreezeMutation.mutateAsync()` with:
  ```typescript
  waiveConvenienceFee: discount?.waiveConvenienceFee ?? paymentMethod === "WALLET"
  ```
- If the user had 5,000 Promo Credits and `paymentMethod` was `"PAYSTACK"`, the refreeze generates the exact same broken state: `creditAppliedXOF: 1025`, crashing the double-entry ledger when confirmed!

# 02 — Root Cause Analysis: Journal Validation Failure

**Incident / Symptom:**
> User searches for an Abidjan to Bouake trip.  
> Base Fare = **1,000 XOF**. Convenience Fee = **25 XOF**.  
> User has **5,000 XOF** in available promo credits (`PARTIALLY_REDEEMED` status).  
> The checkout dialog displays:
> - Base Fare: `1,000 XOF`
> - Promo Credits: `-1,025 XOF`
> - Convenience Fee: `0 XOF` (or `-25 XOF`)
> - Final Button: `Confirm Free Booking (0 XOF)`  
> When the user clicks the button, the request crashes with:  
> `Journal validation failed: Σ Debit (1025) != Σ Credit (1000)`

---

## 1. Trace of Execution & Mathematical Anatomy

Let's dissect the exact line-by-line sequence that produces this mismatch.

### Step 1: Client Calls `getCheckoutPricing`
In `apps/web/features/booking/components/booking-checkout-form.tsx`:
```typescript
const [paymentMethod, setPaymentMethod] = useState<"PAYSTACK" | "WALLET">("PAYSTACK");

const pricingQuery = useQuery({
  ...trpc.payments.getCheckoutPricing.queryOptions({
    offerId,
    seatCount: selectedSeatIds.length,
    paymentMethod, // Defaults to "PAYSTACK"!
    code: appliedCode,
    autoApply: true,
    useCredits: true,
  }),
});
```
Notice that when the checkout form initially opens, `paymentMethod` is **`"PAYSTACK"`**.

### Step 2: Server Evaluates Quote with Convenience Fee Included
In `apps/web/trpc/routers/payments.ts`:
```typescript
const paymentMethod = input.paymentMethod; // "PAYSTACK"
const waiveConvenienceFee = paymentMethod === "WALLET"; // FALSE!
```
Because `paymentMethod` is `"PAYSTACK"`, `waiveConvenienceFee` is **`false`**.

In `apps/web/features/discounts/engine/auto-apply.ts` (`buildChargeQuote`):
```typescript
const postDiscountSubtotalXOF = 1000;
const convenienceFeeXOF = 25; // 2.5% of 1000
const provisionalChargeXOF = postDiscountSubtotalXOF + convenienceFeeXOF; // 1025 XOF!
```
Now look at how credit lots are evaluated in `apps/web/features/discounts/engine/evaluate.ts`:
```typescript
let need = interim.provisionalChargeXOF; // need = 1025 XOF!
for (const lot of lots) {
  const use = Math.min(available, need); // use = 1025 XOF!
  instruments.push({
    instrumentType: "CREDIT_LOT",
    creditAppliedXOF: use, // 1025 XOF!
    ...
  });
  need -= use;
}
```
**The discount engine allocated 1,025 XOF of promo credits to cover the ticket AND the convenience fee!**

Charge amount becomes:
$$\text{chargeAmountXOF} = \max(0, 1025 - 1025) = 0 \text{ XOF}$$

### Step 3: Hold Creation Locks In the 1,025 XOF Snapshot
In `BookingHoldService.createHold()`:
```typescript
await freezeDiscountOnHold(tx, {
  holdGroupId: holdGroup.id,
  quote: discountQuote, // creditAppliedXOF = 1025
});
```
`PricingSnapshot` is saved in the database with:
- `subtotalBaseXOF` = 1,000
- `convenienceFeeXOF` = 25
- `creditAppliedXOF` = 1,025
- `chargeAmountXOF` = 0
- `operatorNetXOF` = 950
- `commissionXOF` = 50

### Step 4: The Client Detects Zero Cash and Routes to Wallet Confirmation
In `booking-checkout-form.tsx`:
```typescript
const totalAmount = payableResolved.payableXOF; // 0 XOF
const isZeroCash = totalAmount === 0; // TRUE!

if (paymentMethod === "WALLET" || isZeroCash) {
  confirmed = await checkoutWithWalletMutation.mutateAsync({
    holdId: holdResult.holdId,
    locale,
  });
}
```
Because `totalAmount === 0`, it calls `trpc.booking.checkoutWithWallet`, which invokes `BookingConfirmationService.confirmFromWallet()`.

### Step 5: `confirmFromWallet()` Waives Fee but Keeps 1,025 Debit
Look at `apps/web/features/payments/services/booking-confirmation-service.ts` lines 525–629:

```typescript
const engine = new AccountingEngine("BOOKING", { ... });

let seq = 1;

// 1. Debit wallet:
if (totalToPay > 0) { // totalToPay is 0, so NO wallet debit is added.
  engine.addDebit({ ... });
}

// 2. Credit operator receivable:
if (snapshot.operatorNetXOF > 0) { // 950 XOF
  engine.addCredit({
    accountId: operatorAcct.id,
    amount: 950, // CREDIT 950
    sequenceNumber: seq++,
    reserveOnCredit: true,
  });
}

// 3. Convenience fee is waived on wallet / zero-cash confirmation:
await tx.pricingSnapshot.update({
  where: { holdGroupId: holdGroup.id },
  data: {
    convenienceFeeXOF: 0, // Fee wiped to 0!
    chargeAmountXOF: totalToPay,
  },
});

// 4. Credit platform commission:
if (commissionXOF > 0) { // 50 XOF
  engine.addCredit({
    accountId: platformCommissionAcct.id,
    amount: 50, // CREDIT 50
    sequenceNumber: seq++,
  });
}

// 5. Append promo ledger entries:
const split = splitPromoPaymentInstruments(snapshot); // creditAppliedXOF = 1025!
seq = appendPromoLedgerEntries({
  engine,
  snapshot: {
    ...
    creditAppliedXOF: 1025, // DEBIT 1025!
  },
  accounts: {
    promoCreditsUserId: promoCreditsUser.id,
    ...
  },
  ...
});

engine.validate(); // CRASH!
```

---

## 2. The Equation Imbalance

Let's compute the ledger journal sides inside `engine.validate()`:

### Debits:
1. `USER_PROMO_CREDITS` (via `appendPromoLedgerEntries`): **Debit 1,025 XOF**
2. Total Debits ($\sum \text{Debit}$) = **1,025 XOF**

### Credits:
1. `OPERATOR_RECEIVABLE`: **Credit 950 XOF**
2. `PLATFORM_COMMISSION`: **Credit 50 XOF**
3. `PLATFORM_CONVENIENCE_FEE`: **Credit 0 XOF** (waived!)
4. Total Credits ($\sum \text{Credit}$) = **1,000 XOF**

$$\sum \text{Debit} (1025) \ne \sum \text{Credit} (1000) \implies \Delta = +25 \text{ XOF}$$

`AccountingEngine.validate()` executes:
```typescript
if (totalDebit !== totalCredit) {
  throw new Error(
    `Journal validation failed: Σ Debit (${totalDebit}) != Σ Credit (${totalCredit})`
  );
}
```
**Boom!** The transaction is aborted with:
`Journal validation failed: Σ Debit (1025) != Σ Credit (1000)`.

---

## 3. Why This Happened: The Three Fatal Design Flaws

1. **Promo Credits should NEVER pay Convenience Fees**:
   Promo credits are promotional marketing grants issued by the platform to discount the bus ticket base fare. A convenience fee is an electronic payment surcharge charged to offset card processing gateways (Paystack). When a user pays with promo credits or wallet, no gateway fee is incurred. Allowing `provisionalChargeXOF` to include the convenience fee causes promo credits to consume non-existent gateway fees.
2. **Asymmetric Fee Waiving**:
   The quote was signed with `waiveConvenienceFee = false` (because `paymentMethod` was `"PAYSTACK"`), but `confirmFromWallet` unconditionally wiped `convenienceFeeXOF` to `0` without adjusting `creditAppliedXOF` from $1,025$ to $1,000$.
3. **Double-Entry Equilibrium Breach in `appendPromoLedgerEntries`**:
   `confirmFromWallet` did not credit `PLATFORM_CONVENIENCE_FEE`, yet debited the passenger's promo credits for that exact fee!

# 03 — Checkout Pricing, Promo & Wallet Matrix

**Scope:** Exhaustive edge-case analysis of all payment instrument combinations, fee calculations, and threshold behaviors across Moja Ride checkout.

---

## 1. Matrix of Payment Scenarios

Consider a single-seat bus booking with **Base Fare = 1,000 XOF**, **Platform Commission = 50 XOF (5%)**, **Convenience Fee = 25 XOF (2.5%)**.

| Scenario | Promo Credits Available | Wallet Available | Selected Mode | Correct Convenience Fee | Promo Used | Wallet Used | Card Charged | Ledger Balance Verification |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1. Full Promo (Zero Cash)** | 5,000 | 0 | Any | **0 XOF** (Waived) | **1,000 XOF** | 0 XOF | 0 XOF | Debits: Promo (1,000) = Credits: Operator (950) + Comm (50). **Balances (1000 == 1000)** |
| **2. Exact Promo Match** | 1,000 | 0 | Any | **0 XOF** (Waived) | **1,000 XOF** | 0 XOF | 0 XOF | Debits: Promo (1,000) = Credits: Operator (950) + Comm (50). **Balances (1000 == 1000)** |
| **3. Partial Promo + Card** | 600 | 0 | Paystack | **25 XOF** (Applied to remaining or base) | **600 XOF** | 0 XOF | **425 XOF** | Debits: Clearing (425) + Promo (600) = Credits: Operator (950) + Comm (50) + Fee (25). **Balances (1025 == 1025)** |
| **4. Partial Promo + Wallet** | 600 | 5,000 | Wallet | **0 XOF** (Waived) | **600 XOF** | **400 XOF** | 0 XOF | Debits: Wallet (400) + Promo (600) = Credits: Operator (950) + Comm (50). **Balances (1000 == 1000)** |
| **5. Pure Wallet** | 0 | 5,000 | Wallet | **0 XOF** (Waived) | 0 XOF | **1,000 XOF** | 0 XOF | Debits: Wallet (1,000) = Credits: Operator (950) + Comm (50). **Balances (1000 == 1000)** |
| **6. Pure Card / Mobile Money** | 0 | 0 | Paystack | **25 XOF** (Charged) | 0 XOF | 0 XOF | **1,025 XOF** | Debits: Clearing (1,025) = Credits: Operator (950) + Comm (50) + Fee (25). **Balances (1025 == 1025)** |
| **7. Partial Promo + Micro Balance Card** | 980 | 0 | Paystack | **25 XOF** | **980 XOF** | 0 XOF | **45 XOF** | **WARNING: Paystack Minimum Charge Threshold (100 XOF)**. Production mobile money will fail or lose money! |

---

## 2. The Micro-Charge Problem on Paystack (`< 100 XOF`)

A critical real-world payment edge case occurs in Scenario 7:
* Trip = 1,000 XOF.
* User has 980 Promo Credits.
* If Convenience Fee is 25 XOF, the remaining cash payable is $1,000 - 980 + 25 = 45 \text{ XOF}$.
* **Gateway Constraint:** Paystack Cote d'Ivoire (`XOF`) specifies a minimum transaction amount of **100 XOF** for card and mobile money. Transactions below 100 XOF either return `400 Bad Request: Amount too low` or incur a fixed processor fee that exceeds the total collected amount!

### Required Business Rule:
If remaining payable after promo credits is strictly $> 0$ and $< 100 \text{ XOF}$:
- If paying via card/mobile money: The platform must require a minimum cash top-up or round up the payable to the gateway floor, OR require wallet payment.
- Alternatively, if Promo credits cover $\ge 90\%$ of base fare, waive the convenience fee and cap promo usage to leave 0 or $\ge 100 \text{ XOF}$.

---

## 3. Convenience Fee Waiving & Allocation Invariants

1. **Convenience fee is exclusively an electronic payment gateway cost offset.**
   - Cash payments at terminal booths: Convenience Fee = 0 XOF.
   - Moja Wallet payments: Convenience Fee = 0 XOF.
   - 100% Promo Credit bookings: Convenience Fee = 0 XOF.
2. **Promo Credits can NEVER be applied toward the Convenience Fee.**
   - In `auto-apply.ts`:
   ```typescript
   // WRONG (Current Code):
   const provisionalChargeXOF = postDiscountSubtotalXOF + convenienceFeeXOF - feeDiscountXOF;
   creditAppliedXOF = Math.min(creditAppliedXOF, provisionalChargeXOF);

   // CORRECT:
   // Promo credits only discount ticket subtotal, NEVER the payment processor fee!
   creditAppliedXOF = Math.min(creditAppliedXOF, postDiscountSubtotalXOF);
   ```
3. **If `postDiscountSubtotalXOF - creditAppliedXOF === 0`:**
   - The ticket is 100% free of passenger cash.
   - Therefore, no external card charge occurs.
   - Therefore, `convenienceFeeXOF` must automatically be set to **0 XOF** regardless of whether `paymentMethod` was initialized as `"PAYSTACK"` or `"WALLET"`.

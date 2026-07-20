# 12 - Pricing

[⬅️ Back to README](./README.md)

---

The math behind the Moja Ride platform determines exactly how much the user pays and how much the operator receives. This logic is strictly centralized in the `PricingResolver`.

## Immutability vs Fluidity

Settings change over time. The platform might run a promotion to drop commission from 5% to 2% for a month. A trip's base fare might increase from 5,000 XOF to 6,000 XOF.

If these numbers are fluid, how can the financial ledger be stable?

The solution is the `PricingSnapshot` model. 
When a user begins the checkout process, the `PricingResolver` executes all the math using the *current* fluid settings. It then writes the final numbers to a `PricingSnapshot` row in the database, bound to the user's `HoldGroup`.

**Once the snapshot is written, it is immutable.** Even if the CEO changes the commission to 90% five seconds later, the user's transaction will strictly obey the numbers frozen in their snapshot. This guarantees that the ledger balances perfectly against the real-world money collected by Paystack.

## The Formulas

All percentages are stored as **Basis Points (Bps)** to prevent floating-point precision loss. 
`100 Bps = 1%`. `550 Bps = 5.5%`.

### Inputs
- `baseFareXOF`: The price set by the operator.
- `seatCount`: The number of seats requested.
- `commissionBps`: The platform's cut from the operator.
- `convenienceFeeBps`: The platform's fee charged to the passenger.

### Execution Order
The order of operations is critical to prevent fractional XOF drift.

1. **Calculate Subtotal First**
   ```javascript
   SubtotalXOF = baseFareXOF * seatCount
   ```
   *We do not calculate fees per-seat and sum them up. We sum the subtotal and apply fees globally.*

2. **Calculate Commission (Operator deduction)**
   ```javascript
   CommissionXOF = Math.round((SubtotalXOF * commissionBps) / 10000)
   ```

3. **Calculate Convenience Fee (Passenger addition)**
   ```javascript
   ConvenienceFeeXOF = Math.round((SubtotalXOF * convenienceFeeBps) / 10000)
   ```

4. **Calculate Final Outputs**
   ```javascript
   OperatorNetXOF = SubtotalXOF - CommissionXOF
   ChargeAmountXOF = SubtotalXOF + ConvenienceFeeXOF
   ```

## Special Cases

### Wallet Perks
If a user pays via their internal `PASSENGER_WALLET`, the platform waives the Convenience Fee as a loyalty perk. The `PricingSnapshot` reflects this; `chargeAmountXOF` will simply equal `SubtotalXOF`.

### Commission Distance Tiers
Commission is not a flat global variable. The `PricingResolver` queries the `CommissionDistanceTier` table using the `distanceKm` of the specific Trip. Long-haul trips may incur an 8% commission, while local trips incur a 5% commission.

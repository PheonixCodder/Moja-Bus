# Service: Pricing Resolver

[⬅️ Back to Services Overview](./README.md)

---

**File:** `apps/web/features/payments/lib/pricing-resolver.ts`

The `PricingResolver` is a pure business-logic service that calculates the immutable financial contract (`PricingSnapshot`) for a checkout session.

## Responsibilities
- Query current platform settings (commissions, convenience fees).
- Calculate exact XOF amounts for operators, platform, and passengers.
- Ensure rounding consistency.

## The Problem It Solves
If a passenger goes to the checkout page, they see a price: "10,000 XOF". 
While they are entering their credit card, an admin changes the platform commission from 5% to 7%. 
If the system recalculated the math *after* the payment, the user would be charged incorrectly, or the operator would receive the wrong payout.

The `PricingResolver` solves this by calculating the math *once* at checkout initiation, and saving it immutably into `PricingSnapshot`. The rest of the system blindly trusts the snapshot.

## Internal Algorithm

1. **Input**: `baseFareXOF`, `seatCount`, `distanceKm`.
2. **Fetch Tiers**: Queries the `CommissionDistanceTier` table to find the applicable commission rate based on how far the trip is.
3. **Fetch Fees**: Queries `PlatformSettings` for the `defaultConvenienceFeeBps`.
4. **Subtotal**: `subtotalBaseXOF = baseFareXOF * seatCount`.
5. **Commission Math**: `commissionXOF = round(subtotal * commissionBps / 10000)`.
6. **Convenience Math**: `convenienceFeeXOF = round(subtotal * convenienceFeeBps / 10000)`.
7. **Total to Charge**: `chargeAmountXOF = subtotal + convenienceFeeXOF`.
8. **Net to Operator**: `operatorNetXOF = subtotal - commissionXOF`.

### Precision & Rounding
The system uses Basis Points (Bps) for percentages. 100 Bps = 1%. 
When calculating, the system multiplies the subtotal by the Bps, and then divides by 10,000. It uses standard rounding (`Math.round()`). 

Because it calculates the subtotal *first*, and applies the percentage to the subtotal, it avoids accumulating fractional XOF errors that occur when calculating commission per-seat and then summing them up.

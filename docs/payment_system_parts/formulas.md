# Formulas

[⬅️ Back to README](./README.md)

---

All financial calculations in Moja Ride use integer arithmetic (BigInt/Int) to prevent floating-point precision loss. Percentages are defined in Basis Points (Bps) where `10,000 = 100%`.

## 1. Checkout Pricing Formula

Executed by `PricingResolver` during the creation of a `PricingSnapshot`.

```javascript
// 1. Subtotal is calculated first
SubtotalXOF = baseFareXOF * seatCount

// 2. Commission is calculated based on the Subtotal
CommissionXOF = Math.round((SubtotalXOF * commissionBps) / 10000)

// 3. Convenience Fee is calculated based on the Subtotal
ConvenienceFeeXOF = Math.round((SubtotalXOF * convenienceFeeBps) / 10000)

// 4. Final Outputs
OperatorNetXOF = SubtotalXOF - CommissionXOF
ChargeAmountXOF = SubtotalXOF + ConvenienceFeeXOF
```
*Why this specific order?* If a user buys 3 tickets, and we calculated the commission per ticket and multiplied by 3, rounding issues could cause the sum of the parts to be 1 XOF off from the total. By multiplying `seatCount` first, we guarantee mathematical consistency.

## 2. Escrow Release Formula

Executed by the `release-escrow` cron job to handle partial cancellations gracefully.

```javascript
// Calculate the standard net for a single seat in the group
StandardNetPerSeat = Math.round(OperatorNetXOF / originalSeatCount)

if (isReleasingLastSeatInGroup) {
    // If it's the last seat, we deduct whatever was already refunded
    // from the absolute total to absorb any fractional rounding errors.
    AmountToRelease = OperatorNetXOF - (alreadyRefundedCount * StandardNetPerSeat)
} else {
    AmountToRelease = seatsBeingReleasedThisRun * StandardNetPerSeat
}
```

## 3. Paystack Fee Estimation Formula

Paystack charges 1.5% to 2% (depending on country/agreement) plus a flat fee, often capped. This formula is primarily used for the `PAYMENT_PROCESSOR_FEE` expense ledger entry.

```javascript
// Example for a 2% flat fee with no cap
ProcessorFeeXOF = Math.round((ChargeAmountXOF * 200) / 10000)
```
*Note: Because Paystack rounds its own fees internally, Moja Ride relies on the actual fee reported in the `charge.success` webhook payload whenever possible. If it is missing, it falls back to this estimation.*

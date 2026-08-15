# 05 — Ledger, Cost-Share & Settlements

## Goal

Every discount must leave an **auditable double-entry trail** so operator withdrawals and platform P&L stay correct under PLATFORM / OPERATOR / HYBRID funding.

## Account classes (add)

| accountClass | owner | purpose |
|--------------|-------|---------|
| `PROMO_LIABILITY_PLATFORM` | PLATFORM | Outstanding platform-funded promo obligation |
| `PROMO_EXPENSE_PLATFORM` | PLATFORM | Recognized promo expense on confirm |
| `PROMO_CONTRA_OPERATOR` | COMPANY | Operator-funded discount contra-revenue |
| `PROMO_CREDITS` | USER | Passenger spendable promo/referral credits |
| `VOUCHER_LIABILITY` | PLATFORM or USER-scoped | Outstanding monetary vouchers (prefer PLATFORM liability with user attribution in metadata) |

Exact ownerType follows existing `FinancialAccount` patterns in payment docs — implement consistently with `AccountingEngine`.

## Event: booking confirmed with discount

### Operator-funded ticket discount D

Economic story: operator sold at lower fare.
- Revenue/receivable recognized on **post-discount** subtotal
- Commission on post-discount
- No platform promo expense

### Platform-funded ticket discount D

Economic story: passenger pays less; operator still owed as if full fare (minus normal commission on full).
- Operator receivable uses **pre-discount** basis
- Platform books promo expense D
- Passenger charge uses post-discount

### Hybrid

- Split D into platformFunded + operatorFunded
- Operator receivable reduced by operatorFunded
- Platform expense = platformFunded

## Event: monetary voucher issued (cancellation)

- Debit appropriate cancel/refund expense or clawback path (existing cancel service)
- Credit `VOUCHER_LIABILITY` / voucher remaining
- Do **not** cash-refund unless policy says Paystack path

## Event: voucher redeemed

- Debit voucher liability by applied amount
- Apply toward passenger charge (reduce external payment need)
- If voucher was platform liability covering operator ticket, funding rules apply as PLATFORM monetary

## Event: referral credit granted

- After qualify + delay: credit user `PROMO_CREDITS`
- Debit platform marketing expense / liability
- Recurring grants = additional transactions linked to `referralEdgeId` + `bookingId`

## Event: hold expired after voucher reserve

- Release soft reservation on voucher remaining / credit lot
- No expense recognition

## Settlements & operator revenue UI

Extend operator revenue views:
- Gross ticket (pre-discount)
- Operator-funded discounts
- Platform-funded discounts (info; not operator cost)
- Hybrid operator share
- Net after commission

Admin settlements:
- Promo expense by campaign
- Outstanding voucher liability aging
- Referral credit outstanding

## Paystack amount

`ExternalPayment.amountXOF` = final `chargeAmountXOF` after discounts and credits (may be 0 → skip Paystack, confirm as fully covered).

**Zero-charge bookings:** allow confirm path when chargeAmount=0 and instruments cover 100%; still create bookings + ledger.

## Reconciliation checks (nightly / admin tool)

1. Sum `DiscountRedemption.platformFundedXOF` (confirmed) ≈ platform promo expense entries
2. Voucher remaining sum ≈ liability balance
3. No ACTIVE hold with reserved voucher exceeding remaining
4. Hybrid shares sum to ticketDiscount per redemption

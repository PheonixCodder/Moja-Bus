# Discounts, campaigns, coupons, vouchers, credits, and referrals

## What is implemented

- The pure engine evaluates one coupon or best auto-promo, then a monetary voucher, then credit lots; ticket promotions do not stack with each other.
- `freezeDiscountOnHold` writes a snapshot and `RESERVED` redemptions, increments campaign budget/coupon counters, and reserves voucher/credit balances.
- Confirmation finalizes redemptions; release is intended to undo them. Campaign scope supports route, schedule, trip, company opt-in, caps, budget, user, and phone criteria.
- Admin/operator routers split platform and operator campaign ownership. Operator mutations check company ownership and permissions.

## Findings and risks

| Priority | Area | Finding |
|---|---|---|
| P1 | Referral | Repeated delayed initial grants: see `F-REF-01` in findings. |
| P1 | Reservations | Reconcile failure does not release incentive reservations: see `F-HOLD-01`. |
| P1 | Credit funding | Admin and claimed credit grants create a `CreditLot` but no matching `PROMO_CREDITS` ledger credit. A later checkout reserves the lot then fails at ledger debit; the abandonment makes the credit unavailable to a subsequent quote. |
| P1 | Re-quote | Pending booking payment previews and re-freezes before excluding/releasing the hold's own reservations. It can hide or discard its own credits, vouchers, coupon eligibility, and campaign capacity. |
| P2 | Coupon issuance | Operator bulk coupon creation uses `Math.random`, performs one insert at a time, and has no retry on a unique collision. A collision aborts the batch after partial creation; there is no batch/audit identity. |
| P2 | Abuse controls | Referral same-device checking looks only for edges involving the referrer; it does not detect a device reused among multiple referee accounts attributed to different referrers. `ipHash` exists but is not populated by the inspected attribution flow. |
| P2 | Policy semantics | `newUserOnly` and `firstBookingOnly` both use completed-booking count, so their naming implies a distinction the code does not implement. Document whether cancelled/refunded/claimed tickets count. |
| P2 | Budget control | Eligibility checks a stale loaded budget; reservation increments occur without a conditional budget guard. Concurrent holds can pass the same remaining-budget check and reserve beyond budget. |
| P2 | Coupon caps | `redemptionCount` increments at hold reservation, but correctness depends on every expiry/failure path calling release. There is no database constraint tying count to finalized/reserved rows. |
| P2 | Voucher rules | The voucher company validation runs only when both `companyId` and `scheduleId` are present. A voucher with company scope but no schedule is not restricted to its issuer. Decide whether that is intentional and enforce it plainly. |
| P2 | Campaign lifecycle | No inspected expiry worker changes scheduled/ended campaign status; eligibility time-checks protect checkout but operator/admin views can show stale statuses and notifications may not follow lifecycle. |
| P3 | Privacy | The promotion/redemption model stores device/IP hashes and full snapshots without stated retention, rotation, access, or deletion policy. |

## Required invariants

1. A promotion budget must satisfy `consumed + reserved <= budget` under concurrency.
2. An instrument reservation has exactly one terminal action: finalize or release.
3. Voucher and credit `remaining - reserved` must never be negative.
4. A referral edge can create exactly one initial reward and at most configured recurring rewards.
5. A refund voucher is usable only on the intended schedule/company and is issued exactly once per refund/booking policy.
6. An active credit lot's spendable balance must be backed one-for-one by the passenger promo-credit ledger account (or by an explicitly documented alternative liability account).

## Tests missing or required

- Parallel holds against the last campaign budget, coupon use, voucher balance, and credit lot balance.
- Payment failure/expiry/release reconciliation verifies all reservation counters and rows.
- Re-open an existing pending hold with credits/voucher/coupon: the quote must retain its own reservation, a modified quote must atomically replace it, and a failed replacement must restore it.
- Delayed reward with two confirmations before cron; concurrent referral attribution; device/IP reuse variants.
- All campaign target/scope combinations, including issuer-company-only vouchers.
- UI quote vs frozen snapshot vs ledger totals for coupon + voucher + credits + wallet and card methods.

# Phase 05 — Flag decisions

| Flag | Decision | Notes |
|------|----------|-------|
| `allowCombineWithCredit` | **WIRE** | If any applied ticket promo has `false`, skip credit lots on that quote. |
| `canStackTicketPromos` | **KEEP** (enforced by XOR) | Checkout is coupon XOR auto-apply; helper documents FAQ rule and is used in tests. |
| `applyTarget` (campaign) | **WIRE** | `ENTIRE_CHARGE` may add `feeDiscountXOF` after ticket portion; vouchers already wired. |
| `expiresOnFirstCompletedBooking` | **WIRE** | On paid confirm finalize, expire remaining vouchers with this flag for the user. |
| `requirePaidConfirmedBooking` | **WIRE** | Referral qualify/reward only when hold cash charge &gt; 0 (unless flag false). |
| `firstBookingOnly` | **KEEP** | `completedBookingCount === 0` (CONFIRMED/COMPLETED). |
| `newUserOnly` | **DIFFERENTIATE** | Account age ≤ 14 days (`userAccountAgeDays`); independent of booking count. |

See also [16-phase-04-cap-counting.md](./16-phase-04-cap-counting.md) for FINALIZED-only caps.

# Finding coverage matrix (completeness gate)

Every ID from [`docs/commercial-lifecycle-audit/02-findings-catalog.md`](../../commercial-lifecycle-audit/02-findings-catalog.md) must appear here. If a new finding is discovered, add a row before closing the program.

| ID | Summary | Phase | Notes |
|----|---------|-------|-------|
| P0-1 | Wallet/zero-cash cannot cancel | **00** | Trace A |
| P0-2 | Multi-seat REFUND unique collision | **00** | Schema + cancel service |
| P0-3 | Trip cancel without refund | **00** | Needs D3 |
| P0-4 | False COMPLETED / unused Paystack refund | **00** | Needs D1 |
| P0-5 | Unfunded admin/claim credits | **01** | Trace B + repair in **02** |
| P0-6 | Delayed referral INITIAL double-grant | **01** | Trace E |
| P0-7 | Voucher redeem as platform expense | **01** | |
| P0-8 | Discount domain not in migrations | **02** | ✅ baseline `20260816160000` |
| P1-1 | Expire/fail without releaseDiscountReservations | **03** | ✅ expireOrReleaseHold + cron |
| P1-2 | Paystack re-init amountXOF desync | **03** | ✅ sync on re-init |
| P1-3 | Segment occupancy row-sum | **04** | ✅ maxPathOccupancy / distinct seats |
| P1-4 | Trip pending expire skips discount release | **03** | Same command as P1-1 |
| P1-5 | emptyReject wipes coupon/auto | **01** | |
| P1-6 | expiresOnFirstCompletedBooking unused | **05** | ✅ expire on finalize confirm |
| P1-7 | Caps burn on RESERVE | **03** (+ **04** budget race) | ✅ FINALIZED-only eligibility + conditional reserve ([16](./16-phase-04-cap-counting.md)) |
| P1-8 | mobile-callback no verify | **03** | |
| P1-9 | Public long-lived ticketToken | **06** | ✅ presentation `pt` + grace raw |
| P1-10 | Guest orphan payment rescue | **03** | Ops queue / hold funds |
| P1-11 | Offline refund payable FSM | **05** | ✅ PENDING_FULFILMENT → COMPLETED/VOIDED + admin UI |
| P1-12 | Reconcile daily only | **03** | |
| P1-13 | Claim ignores deviceHash | **05** | ✅ enforce + claim audit event |
| P1-14 | Dead combine/stack/applyTarget | **05** | ✅ see [17](./17-phase-05-flag-decisions.md) |
| P1-15 | Admin setCampaignStatus no owner guard | **05** | ✅ existence guard + audit |
| P1-16 | Wallet confirm missing clash re-check | **03** | |
| P1-17 | Pending-pay self-reservation | **03** | ✅ Trace C excludeHoldGroupId |
| P1-18 | createHold then confirm fail no release | **03** | ✅ release on hard fail |
| P1-19 | Concurrent budget race | **04** | ✅ conditional budget/coupon UPDATE |
| P1-20 | Unauthenticated /api/payments/verify | **06** | ✅ checkout session cookie bind |
| P2-1 | Checkout UI vs frozen quote diverge | **04** | ✅ signed quoteId (D5 surgical) |
| P2-2 | No notification outbox | **07** | ✅ OutboxMessage + cron + admin DLQ |
| P2-3 | RefundChannel.PAYSTACK unused | **00** | Align with D1 |
| P2-4 | Dead WalletReservation | **03** | Remove or wire — prefer remove/document |
| P2-5 | Fee not refunded | **00** | Needs D2 — copy + optional behavior |
| P2-6 | Splits not in production | **non-goal** (D7=OUT) | ✅ wontfix — platform capture + ledger |

| P2-7 | Caps count RESERVED+FINALIZED oversell | **04** | ✅ FINALIZED-only for eligibility |
| P2-8 | No EXPIRED sweeper lots/vouchers | **05** | ✅ incentive-status-sweep cron |
| P2-9 | Admin referral fraud toggles hardcoded | **05** | ✅ persist from UI |
| P2-10 | Promo credit grant needs raw cuid | **05** | Deferred (traveler picker) |
| P2-11 | BOARDING not searchable | **04** | ✅ search includes BOARDING |
| P2-12 | UTC vs Abidjan search buckets | **06** | ✅ Africa/Abidjan day bounds |
| P2-13 | Hardcoded EN / locale drop | **06** | ✅ dialog/countdown/seat map + locale nav |
| P2-14 | Passenger cancel always WALLET | **00** (+ **06** UX) | Channel picker |
| P2-15 | Cascade erase commercial history | **02** | ✅ payment/refund→hold Restrict |
| P2-16 | Voucher schedule SET NULL orphans | **02** | ✅ Restrict + cancellation CHECK |
| P2-17 | listMyCredits vs listMyCreditLots | **06** | ✅ wallet prefetch CreditLots |
| P2-18 | Synthetic guest emails | **06** | ✅ require real email; skip Novu invent |
| P2-19 | ExternalPayment purpose overload | **03** | ✅ purpose CHECKOUT\|TOP_UP |
| P2-20 | Referral device/ipHash gaps | **05** | Partial — deviceHash on claim/referral; ipHash still optional |
| P2-21 | Company-only voucher not enforced | **05** | ✅ companyId alone restricts |
| P2-22 | Campaign status lifecycle worker | **05** | ✅ incentive-status-sweep |
| P2-23 | Seat deck forced to 1 | **06** | ✅ max deck + deck tabs |
| P2-24 | No seat reserve at selection | **06** | ✅ CONFLICT → refresh/reselect |
| P2-25 | Guest form remnants | **06** | ✅ login-required checkout; no guest invent |
| P2-26 | Abuse review metadata / FINALIZED-only KPIs | **05** | ✅ reviewStatus columns |
| P2-27 | Refund missing bookingId/idempotency | **00** | |
| P2-28 | PaymentAttempt lifecycle | **03** | |
| P2-29 | Top-up lifecycle divergence | **03** | |
| P3-1 | firstBookingOnly ≡ newUserOnly | **05** | ✅ age ≤14d vs booking count |
| P3-2 | applyTarget unused | **05** | ✅ fee path for ENTIRE_CHARGE |
| P3-3 | Abuse review-only | **05** | ✅ review lifecycle |
| P3-4 | skippedCheckedIn always 0 | **00** | |
| P3-5 | Max 6 seats undocumented | **06** | ✅ [19](./19-phase-06-privacy-notes.md) |
| P3-6 | Dual payment status enums | **02** | ✅ [14-state-transition-matrix](./14-state-transition-matrix.md) |
| P3-7 | ACCOUNT_CLASS omissions | **00** | |
| P3-8 | No cancel-trip multi-seat tests | **00** + **07** | |
| P3-9 | sweep-captures not scheduled | **03** | ✅ vercel.json every 6h |
| P3-10 | Pending-referral applier clears errors | **05** | ✅ keep on already attributed |
| P3-11 | Referral velocity on attribution day | **05** | Deferred |
| P3-12 | Bulk coupon Math.random / collision | **05** | ✅ crypto + batch report |
| P3-13 | Legacy phone hold grouping | **06** | ✅ documented support window in [19](./19-phase-06-privacy-notes.md) |
| P3-14 | Hash/snapshot retention policy | **05** / **06** | ✅ policy doc; TTL job optional |
| P3-15 | JSON audit without typed columns | **02** | Promote key fields |
| P3-16 | HoldGroup.offerId non-unique | **02** | ✅ intentional non-unique |
| P3-17 | Max promo vouchers enforcement scope | **02**/05 | ✅ issue path; Phase 05 if more surfaces |

## Coverage check

- P0: 8/8 mapped  
- P1: 20/20 mapped  
- P2: 29/29 mapped  
- P3: 17/17 mapped  

**Total: 74/74 finding IDs assigned.**

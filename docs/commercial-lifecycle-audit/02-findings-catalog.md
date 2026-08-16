# 02 — Findings catalog (unified compound)

Evidence from 2026-08-16 static review of both audit packs. Severity definitions in [README.md](./README.md).

**Legend:** `L` = first appeared / detailed in lifecycle pack · `T` = first appeared / detailed in transaction pack · `both` = present in both (merged).

---

## Severity reconciliation notes

| Topic | Transaction pack | Lifecycle pack | Compound |
|-------|------------------|----------------|----------|
| Wallet cancel blocked | P1 | P0 | **P0** |
| Unfunded admin/claim credits | P1 | P0 | **P0** |
| Delayed referral INITIAL double-grant | P1 | P0 | **P0** |
| False COMPLETED refund / no Paystack refund path | P0 (“no refund call”) | P0 (adapter unused) | **P0** — adapter exists, product never calls it |
| `@@unique([externalPaymentId, type])` | Schema P2 note | P0 multi-seat collision | **P0** |
| Pending-pay self-reservation re-quote | P1 | (missing) | **P1-17** added |
| Public ticket token | P1 | P1-9 / P2-15 | **P1-9** (privacy); URL embedding also in P2 |

---

## P0 — stop / fix before treating money as reliable

| ID | Finding | Sources | Evidence | Impact |
|----|---------|---------|----------|--------|
| **P0-1** | Wallet / zero-cash bookings cannot cancel: cancel requires SUCCESS `ExternalPayment` | both | `cancellation-service.ts` ~94–102; `confirmFromWallet` creates no payment row | Confirmed paid tickets stuck; trip/operator cancel fails for wallet seats. Trace A in [12](./12-incident-traces-and-reconciliation.md) |
| **P0-2** | Multi-seat REFUND posts collide on `FinancialTransaction @@unique([externalPaymentId, type])` | L (+ T schema note) | `schema.prisma` ~1874; each seat cancel posts `type: "REFUND"` with same payment | Second seat / trip bulk refund throws → often `CANCEL_WITHOUT_REFUND` |
| **P0-3** | Trip cancel cancels entitlement when refund fails | both | `cancel-trip-with-refunds.ts` ~166–178 | Passenger loses ticket and money; no durable remediation queue |
| **P0-4** | Refunds marked COMPLETED without executing Paystack refund; product never calls provider `refund()` | both | `cancellation-service.ts` ~166–183; `paystack-provider.ts` `refund()` unused | False “refunded”; card/MM money remains at Paystack |
| **P0-5** | Admin / claim promo credit lots unfunded in ledger | both | `credit-grant-service.ts`; `claim-credit-grant-service.ts`; contrast referral ledger | Visible credits; confirm debit fails (“Insufficient wallet balance”); hold left reserved. Trace B in [12](./12-incident-traces-and-reconciliation.md) |
| **P0-6** | Delayed referral INITIAL can double-grant | both | `referral-service.ts` ~274–294, ~316–320 | Multiple INITIAL lots + ledger posts while edge `QUALIFIED` |
| **P0-7** | Voucher redemption booked as platform expense (`platformFundedXOF`), not liability burn | L | `evaluate.ts` ~185–195; `promo-ledger.ts` | Wrong books; voucher liability never burned |
| **P0-8** | Discount/referral domain largely absent from migration history | L | No CREATE in migrations for campaigns/coupons/vouchers/credits; `20260816120000` ALTERs voucher | Fresh `migrate deploy` ≠ schema; deploy breakage / drift |

---

## P1 — material correctness / ops

| ID | Finding | Sources | Evidence |
|----|---------|---------|----------|
| **P1-1** | Soft-expired / failed payment paths expire bookings but do not `releaseDiscountReservations`; holdGroup may stay ACTIVE | both | `reconcile-payments/route.ts`; no hold-expiry sweeper; contrast `releaseHold` |
| **P1-2** | Paystack re-init after refreeze does not update `ExternalPayment.amountXOF` | L | `payment-service.ts` ~142–151 vs verify ~220–224 |
| **P1-3** | Segment occupancy counts overlapping booking **rows**, not distinct seats / max load | L | `search-read-repository.ts` getSegmentOccupancy |
| **P1-4** | Trip-cancel expiry of pending holds skips discount release | L | `cancel-trip-with-refunds.ts` ~71–74 |
| **P1-5** | Failed voucher validation via `emptyReject` wipes already-selected coupon/auto | L | `evaluate.ts` |
| **P1-6** | `expiresOnFirstCompletedBooking` on vouchers never enforced after confirm | L | schema + voucher-service write-only |
| **P1-7** | Coupon `redemptionCount` / campaign budget increments on RESERVE; correctness depends on every failure path releasing | both | `quote-service` freeze |
| **P1-8** | `mobile-callback` does not verify/confirm payment | both | `api/payments/mobile-callback/route.ts` |
| **P1-9** | Public ticket lookup is a long-lived bearer (`ticketToken` CUID); success URLs put tokens in query params; no expiry/rotation/revocation | both | `booking.getTicketByToken` publicProcedure; `booking-success-url.ts` |
| **P1-10** | Guest orphan payment rescue only logs; money not attributed | both | `booking-confirmation-service.ts` rescueOrphanedPayment |
| **P1-11** | Offline refund payable has no fulfilment state machine (promise vs paid vs void) | both | CASH/VOUCHER → `OFFLINE_REFUND_PAYABLE` only |
| **P1-12** | Reconcile-payments scheduled daily only; backlog can strain provider on catch-up | both | `vercel.json`; T also notes unlimited parallel provider calls |
| **P1-13** | Claim grant ignores `deviceHash` | L | `claim-credit-grant-service.ts` |
| **P1-14** | `allowCombineWithCredit` / `canStackTicketPromos` dead; `applyTarget` unused for coupons | L | engine + CRUD vs evaluate |
| **P1-15** | Admin `setCampaignStatus` lacks owner/company guard | L | `discounts-admin.ts` |
| **P1-16** | Wallet confirm omits seat-clash re-check present on Paystack path | L | `booking-confirmation-service.ts` |
| **P1-17** | **Pending-pay re-quote / preview self-blocks the hold’s own credits, vouchers, coupon, and budget** — quote uses `remaining - reserved` including this hold; `refreezeHoldDiscounts` quotes **before** `releaseDiscountReservations` | T | `booking-details.tsx` ~313; `quote-service.ts` refreeze ~300–370. Trace C in [12](./12-incident-traces-and-reconciliation.md) |
| **P1-18** | `createHold` commits before wallet confirm; on confirm failure client does not release — seats + incentives stay reserved (feeds P1-17) | T | checkout form + hold service |
| **P1-19** | Concurrent budget race: eligibility uses stale loaded counters; freeze increments without conditional budget guard | both | campaign-loader / quote-service |
| **P1-20** | Browser `/api/payments/verify` unauthenticated (not forgery alone; ownership/locale/disclosure risk) | both | `verify/route.ts` — ranked P2 in T for recovery; compound keeps material P1 for session binding + combines with P1-9 |

---

## P2 — inconsistency / weak control

| ID | Finding | Sources | Evidence |
|----|---------|---------|----------|
| **P2-1** | Checkout display/payment-method pricing diverges from frozen quote (fee waive / autoApply / useCredits) | both | checkout form + `getCheckoutPricing` vs freeze inputs |
| **P2-2** | No durable outbox for Novu / receipt / referral / trip-cancel side-effects | both | confirm/cancel fire-and-forget |
| **P2-3** | `RefundChannel.PAYSTACK` in schema; product only CASH\|WALLET\|VOUCHER | L | schema vs cancel schema |
| **P2-4** | `WalletReservation` + release cron with no writers | L (+ T schema) | dead path; escrow via account reservedBalance |
| **P2-5** | Convenience fee not refunded (subtotal only) | L | cancellation proportional base |
| **P2-6** | Splits not in production init | L | `validate-paystack-split.mjs` only |
| **P2-7** | Global/user/phone caps count RESERVED+FINALIZED → concurrent oversell vs intent | L | campaign-loader |
| **P2-8** | No EXPIRED status sweeper for CreditLot / MonetaryVoucher | L | reminders only |
| **P2-9** | Admin referral UI hardcodes fraud blocks true | L | admin-referral-program-card |
| **P2-10** | Promo credit grant UI requires raw user cuid | L | admin-promo-credits-card |
| **P2-11** | BOARDING bookable via deep link but not in search | L | search where vs trip-details |
| **P2-12** | UTC vs Africa/Abidjan for search day/time/cheapest strip | L | search-read-repository / search router |
| **P2-13** | Hardcoded English in book dialog / countdown / much of checkout; locale dropped on some paths | both | booking-dialog-flow, hold-countdown, checkout-form; `/search`, `/book`, `/dashboard/wallet` literals |
| **P2-14** | Passenger self-cancel always WALLET | L | passenger-tickets-view |
| **P2-15** | Cascade deletes from HoldGroup/Company erase payment/refund history | both | schema relations |
| **P2-16** | `MonetaryVoucher.scheduleId` nullable + ON DELETE SET NULL | L | can orphan unscoped cancel vouchers |
| **P2-17** | Wallet page prefetch vs panel query mismatch (`listMyCredits` vs `listMyCreditLots`) | L | wallet page / promo-incentives-panel |
| **P2-18** | Synthetic guest emails `{phone}@guest.mojaride.ci` for Paystack/Novu | both | payment-service; invalid recipients + PII in provider logs |
| **P2-19** | `ExternalPayment` overloaded for checkout + top-up via nullable holdGroupId / JSON `isTopUp`; needs purpose/kind | T | payment-service / wallet top-up |
| **P2-20** | Referral same-device check only edges involving the referrer; `ipHash` not populated on attribution | T | referral-service |
| **P2-21** | Voucher company restriction runs only when **both** companyId and scheduleId present — company-only voucher not issuer-bound | T | evaluate / voucher rules |
| **P2-22** | No campaign status expiry worker (scheduled/ended); views can show stale lifecycle | T | campaign CRUD / eligibility time-check only |
| **P2-23** | Seat map returns `deck: 1` ignoring source seat deck — multi-deck layouts broken | T | SeatAvailabilityService |
| **P2-24** | UI does not reserve seat at selection; conflict only at createHold — needs refresh/reselect UX | T | booking dialog |
| **P2-25** | Checkout form still contains guest/manual passages despite login-required hold | T | booking-checkout-form |
| **P2-26** | Abuse events lack review owner / state / resolution metadata; campaign metrics use FINALIZED only (miss reserved leak exposure) | T | abuse view / campaign performance |
| **P2-27** | `Refund` has no bookingId / provider unique / request idempotency at DB level | both | schema |
| **P2-28** | Failed/stale PaymentAttempt lifecycle not consistently closed | both | payment-service |
| **P2-29** | Top-up lifecycle diverges (different callback URL; often no PaymentEvent on init) | both | wallet router vs booking init |

---

## P3 — polish / maintainability

| ID | Finding | Sources |
|----|---------|---------|
| **P3-1** | `firstBookingOnly` ≡ `newUserOnly` in eligibility; cancelled/refunded ticket counting undocumented | both |
| **P3-2** | Campaign `applyTarget` never applied to coupon/auto fee path | L |
| **P3-3** | Abuse queue is review-only (pause if campaignId present) | L |
| **P3-4** | Trip cancel always returns `skippedCheckedIn: 0` (throws instead of skip) | L |
| **P3-5** | Max 6 seats undocumented for operators | L |
| **P3-6** | Dual payment status enums without published transition matrix | both |
| **P3-7** | `ACCOUNT_CLASS` constants omit offline refund / some fee classes | L |
| **P3-8** | No dedicated unit tests for `cancel-trip-with-refunds` multi-seat / wallet paths | both |
| **P3-9** | `sweep-captures` not in vercel.json | L |
| **P3-10** | Pending-referral applier clears storage on many errors | L |
| **P3-11** | Referral velocity checks attribution day, not qualifications | L |
| **P3-12** | Bulk coupon create sequential; `Math.random`; unique collision aborts mid-batch; no batch audit id | both |
| **P3-13** | Legacy phone hold grouping still in hold-group helpers | L |
| **P3-14** | Promotion model stores device/IP hashes + snapshots without retention/rotation/deletion policy | T |
| **P3-15** | JSON-heavy audit fields without typed recon columns | both |
| **P3-16** | `HoldGroup.offerId` non-unique | L |
| **P3-17** | Platform max promotional vouchers setting enforced only on admin issue path | L |

---

## Confirmed strengths (do not regress)

- Trip `FOR UPDATE` + overlap conflict at `createHold`; confirmation clash re-check on Paystack path.
- Paystack amount verify + webhook HMAC + webhook idempotency keys.
- Hold confirmation claim / P2002 handling on duplicate confirm.
- Wallet `FOR UPDATE` on confirm; payable helpers for zero-cash.
- Schedule voucher match in evaluate when schedule+company set.
- Operator UI channel set + guest→cash + checked-in hide/skip (single/bulk).
- Hybrid campaign funding bps split in benefits engine.
- Credit lot FIFO by expiry in evaluate.
- Referral recurring caps + cron claim via PENDING→ACTIVE updateMany.
- Unique constraints on pricing snapshot, payment refs, coupon/referral codes, campaign scope joins, ledger entry idempotency (where present).

---

## Suggested triage order

1. P0-1, P0-2, P0-3 (cancel / multi-seat / entitlement)
2. P0-4 (honest refund status + provider path)
3. P0-5, P0-6, P0-7 (incentive ledger correctness)
4. **P1-17 / P1-18** (pending-pay self-reservation — user-visible “credits disappear”)
5. P0-8 (migrations / deploy safety)
6. P1-1, P1-2, P1-3 (expiry release, amount sync, occupancy)
7. Remaining P1 → P2 UI/i18n/privacy → P3 tests/observability

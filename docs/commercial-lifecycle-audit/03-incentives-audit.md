# 03 — Incentives audit (campaigns, coupons, vouchers, credits, referrals, engine)

## Campaigns & coupons

### Flow

1. Admin: platform or operator campaigns via `campaign-crud` / `discounts-admin`.
2. Operator: forced `fundingType: "OPERATOR"`; cannot resume admin-paused campaigns (`discounts-operator`).
3. Coupons: single or bulk create → `CouponCode`.
4. Checkout: `quoteCheckoutDiscounts` → `evaluate` → optional code XOR auto-apply.
5. Hold: `freezeDiscountOnHold` creates `DiscountRedemption` RESERVED; increments coupon `redemptionCount` and campaign `budgetReservedXOF`.
6. Confirm: `finalizeDiscountRedemptions` → FINALIZED; moves reserved→consumed budget.
7. Release: `releaseDiscountReservations` decrements counters.

### Findings

| Sev | Issue |
|-----|--------|
| P1 | Caps burn on RESERVE; abandoned holds hold budget/coupon until release/expiry (and expiry may never release) |
| P2 | Concurrent RESERVED+FINALIZED counting can overshoot intended global/user/phone caps |
| P1 | Admin `setCampaignStatus` without ownerType/company guard |
| P3 | Bulk coupon inserts sequential; unique collision aborts mid-batch |
| P3 | `firstBookingOnly` and `newUserOnly` identical (`completedBookingCount > 0`) |
| P3 | Campaign `applyTarget` not applied on coupon/auto instruments (`feeDiscountXOF` often 0) |

### Edge cases

- `WALLET_CREDIT_GRANT` campaign type blocked at checkout eligibility (correct).
- User-entered code overrides auto-apply (lock honored).
- Welcome coupons: personal `assignedUserId`, best-effort mint on referral path.
- Budget eligibility uses loaded counters; freeze increments non-atomically vs concurrent freezes → race overspend possible.

### What works

- Operator opt-in / promotions summary UI.
- Redemption list panels for admin.
- Hybrid funding split via bps in `benefits.ts`.

---

## Vouchers (including schedule scope)

### Issue / evaluate

- `issueCancellationVoucher` sets `scheduleId` + `companyId`, ~12-month expiry (`voucher-service`).
- Evaluate rejects schedule mismatch; company check when both company and schedule present.
- Wallet / promo panel shows schedule name when present.
- Promotional ceiling (`promo-ceilings`) on admin issue; cancel vouchers excluded by design.

### Findings

| Sev | Issue |
|-----|--------|
| **P0** | Redeemed voucher amounts use `platformFundedXOF` / funding PLATFORM → promo expense ledger, **not** voucher liability burn |
| **P1** | Invalid voucher → `emptyReject` clears coupon/auto already selected |
| **P1** | `expiresOnFirstCompletedBooking` persisted, never enforced post-confirm |
| P2 | No job sets voucher `status: EXPIRED` (soft filter + reminders only) |
| P2 | Schema nullable schedule/company + SET NULL on schedule delete → unscoped orphans |

### Edge cases

- Guest cancel cannot use VOUCHER channel (needs userId); trip/bulk coerce to CASH.
- Voucher cancel without scheduleId rejected in cancellation service (good).
- Partial voucher use: reservedAmount / remainingAmount app-managed; no DB CHECK that remaining+reserved ≤ original.

---

## Promo credits & grants / claims

### Paths

| Source | Creates lot | Posts ledger credit? |
|--------|-------------|----------------------|
| Referral activate | yes | **yes** (expense → user promo liability) |
| Admin grant | yes (`grantAdminCreditLot`) | **no** |
| Campaign claim | yes (`claimCreditGrant`) | **no** |

Confirm apply: `promo-ledger.appendPromoLedgerEntries` **debits** user `PROMO_CREDITS` when `creditAppliedXOF > 0`. Unfunded lots → AccountingEngine insufficient funds; UI often remaps to “Insufficient wallet balance”; hold already committed.

### Findings

| Sev | Issue |
|-----|--------|
| **P0** | Admin + claim grants unfunded |
| P1 | Claim ignores `deviceHash` |
| P2 | Claim caps via coupon prefix `startsWith` (N+1 coupon load) |
| P2 | Expired lots stay ACTIVE until evaluate filters `expiresAt` |
| OK | Per-user claim idempotency `promo-grant:{couponId}:{userId}` |
| OK | Coupon claim race: `updateMany` with `redemptionCount < max` |

### UI

- Admin promo credits card: raw user cuid, no traveler search (P2).
- Passenger wallet: claim UI + pending credits in `promo-incentives-panel`.
- Prefetch mismatch `listMyCredits` vs `listMyCreditLots` (P2).

---

## Referrals

### Flow

1. Capture / apply → `ReferralEdge` ATTRIBUTED (device/same-user/velocity checks when data present).
2. Confirm booking → `qualifyReferralOnConfirm`: ATTRIBUTED→QUALIFIED; enqueue INITIAL credit lot.
3. If `rewardDelayHours > 0`: lot PENDING until cron; edge stays QUALIFIED, `rewardedAt` null.
4. Cron `process-referral-rewards` → ACTIVE + ledger → edge REWARDED.
5. Later bookings: should be RECURRING once REWARDED.

### P0 — delayed INITIAL double-grant (confirmed)

While status is `QUALIFIED` and `rewardedAt` is null, subsequent confirms still set `kind = "INITIAL"`. Idempotency key is `referral:{edgeId}:{holdGroupId}:{kind}` → each paid hold gets its own INITIAL lot and later ledger post.

Immediate path (`rewardDelayHours = 0`) sets REWARDED sooner and is safer.

### Other findings

| Sev | Issue |
|-----|--------|
| P1 | `requirePaidConfirmedBooking` appears schema-only / unused in service gate |
| P2 | Daily velocity at attribution counts `qualifiedAt` today — blocks new edges, not multi-qualify |
| P2 | Cron ledger failure can throw and skip remaining due lots that run |
| P2 | `sameDeviceBlock` skipped if client omits deviceHash |
| P3 | Pending applier clears storage on many errors |

### What works

- Recurring caps via RECURRING key + window.
- Cron auth + PENDING claim via updateMany.
- Passenger referrals share / apply / funnel UI.

---

## Discount engine

### Modules

- `evaluate.ts` — orchestration
- `auto-apply.ts` — best auto campaign
- `eligibility.ts` — scope, dates, caps, first/new user
- `benefits.ts` — percent/amount/free seat + hybrid split
- `stacking.ts` — **`canStackTicketPromos` unused**
- `promo-ceilings.ts` / `promo-policy.ts` — admin voucher ceilings

### Behavior notes

- At most one ticket promo in practice (code XOR auto), not because stacking helper runs.
- Fee computed on post-ticket subtotal; credits after provisional charge.
- Credits FIFO by expiry.
- Freeze funding: PLATFORM keeps commission on pre; OPERATOR on post; HYBRID subtracts operator funded (`quote-service`).
- `allowCombineWithCredit` stored in UI/CRUD, **never read** in evaluate.

### Tests present

- `engine/__tests__/evaluate.test.ts`
- `services/__tests__/promo-ledger.test.ts`

Gaps: no concurrent freeze budget test; no delayed-referral double INITIAL test; no admin-grant ledger funding test; no voucher-liability burn test.

---

## Admin / operator / passenger surfaces

| Surface | Path | Notes |
|---------|------|-------|
| Campaigns | `admin/marketing/campaigns` → `admin-campaigns-view` | CRUD, coupons, redemptions |
| Abuse | `admin/marketing/abuse` | Review + pause if campaignId |
| Referral program | admin card | Fraud toggles hardcoded on save |
| Promo credits | admin card | Cuid grant |
| Operator promotions | `operator/.../promotions` | Opt-in + own campaigns |
| Passenger referrals | `(passenger)/referrals` | Share / apply |
| Passenger wallet | `(passenger)/wallet` | Credits / vouchers / claim |

Abuse events from referral path often lack `campaignId` → pause action useless (P3).

---

## Cross-cutting incentive risks

1. **Ledger asymmetry** — referral funded; admin/claim unfunded; voucher → expense not liability.
2. **Reserve-before-pay** without reliable release on soft expiry / payment fail / trip expire pending.
3. **Pending-pay self-reservation** — quote/refreeze sees own `reservedXOF` as unavailable (P1-17 / Trace C). Affects referral-funded credits too.
4. **Dead product flags** — combine-with-credit, first-booking-expire voucher, paid-confirm gate, applyTarget, stacking helper.
5. **Abuse queue** log/review only — no edge reject/revoke; no review owner/state/resolution metadata; campaign metrics FINALIZED-only miss reserved exposure.
6. **Async referral** after confirm — confirm can succeed while qualify fails silently (logged).
7. **No durable marketing outbox** for blasts / campaign-starting workflows beyond best-effort.
8. **Fraud gaps** — same-device check only edges involving the referrer; `ipHash` not populated on attribution; claim ignores `deviceHash`.
9. **Voucher company-only scope** — company check runs only when scheduleId is also set (P2-21).
10. **Campaign status lifecycle** — no worker to move scheduled/ended statuses (P2-22).
11. **Privacy** — device/IP hashes + redemption snapshots lack retention/rotation/deletion policy (P3-14).

## Required invariants (from both packs)

1. Promotion budget: `consumed + reserved <= budget` under concurrency.
2. Instrument reservation has exactly one terminal action: finalize or release.
3. Voucher/credit `remaining - reserved` never negative.
4. Referral edge: exactly one INITIAL reward; recurring within configured caps.
5. Refund voucher usable only on intended schedule/company; issued once per policy.
6. Active credit lot spendable balance backed one-for-one by passenger promo-credit ledger (or documented alternative).
7. Pending-pay re-quote must exclude or atomically replace the **current hold’s** reservations (never treat them as unavailable).

---

## File inventory (incentives)

See [10-coverage-inventory.md](./10-coverage-inventory.md) for the complete list under `features/discounts/**`, routers, admin/operator/passenger views, crons, and schema models.

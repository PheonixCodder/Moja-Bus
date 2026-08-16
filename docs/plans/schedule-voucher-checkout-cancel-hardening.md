# Implementation Plan — Schedule vouchers, zero-cash checkout, operator cancel channels, pending pay

**Status:** Awaiting confirmation before implementation  
**Date:** 2026-08-16  
**Surfaces:** `apps/web` (search checkout, passenger pending pay, operator bookings + trips/manifest, discounts engine, cancellation + ledger)

---

## What we are building

Make monetary **cancellation vouchers** redeemable only on the **same schedule** (partial remaining), fix **zero-cash checkout** when promo credits/vouchers/coupons cover the fare, add **Wallet | Cash | Voucher** as a shared channel on operator single/bulk/trip cancel, **block cancel when checked in** (skip on bulk/trip), and bring **pending bookings pay** to the same discount + payment quality as search checkout — with ledger, eligibility, UI, notifications, and tests covering the full instrument matrix.

---

## Language we agreed on

| Term | Definition |
|------|------------|
| Schedule-scoped voucher | `MonetaryVoucher` with `source=CANCELLATION` bound to `scheduleId` (+ company); redeemable on any **future** trip where `trip.scheduleId` matches |
| Partial remaining | Use only what the booking needs; leftover stays schedule-bound until expiry / deplete |
| Promo credits | Unscoped `CreditLot` promo XOF; not schedule-bound |
| Zero-cash checkout | After instruments, `payableXOF === 0` → confirm without wallet debit / Paystack |
| Shared refund channel | One channel for the whole cancel action (trip or bulk) |
| Checked-in | `booking.checkedInAt != null` |

---

## Decisions made

1. **Scope:** Same **schedule** (any future departure), not trip-only / not route-wide.  
2. **Residual:** Partial remaining on same schedule.  
3. **Bulk/trip cancel:** One shared channel for all passengers in that action.  
4. **Zero payable:** Dedicated zero-cash confirm + clear “covered by…” copy.  
5. **Which vouchers bind:** Only **CANCELLATION** requires `scheduleId`; admin/goodwill/marketing stay unscoped.  
6. **Checked-in:** Single cancel disabled; bulk/trip **skip** checked-in + report skipped count.  
7. **Pending pay:** Re-price + **re-freeze** hold snapshot, then pay (same instruments as search).

---

## Assumptions (confirm if wrong)

- Passenger self-cancel stays **WALLET-only** (no passenger-issued schedule voucher).  
- Cancel voucher TTL stays **12 months** unless product changes it later.  
- Guests without `userId`: **no voucher** → Cash only (or Wallet if they somehow have an account).  
- Web first; traveler-app parity is a **follow-up** slice after web is green.  
- On cancel with `VOUCHER`: keep existing clawback economics on the cancelled booking; new redeem draws **voucher liability** so the rebook operator still settles per current promo-ledger rules (finance recon in QA).  
- Stacking order stays engine default: ticket promo/coupon → monetary voucher → credits.

---

## Current defects (root causes)

| # | Symptom | Root cause |
|---|---------|------------|
| A | Wallet pay fails with credits covering fare / “insufficient balance” while UI shows ~0 | Client wallet gate and/or server `checkoutWithWallet` path not treating `payableXOF === 0`; WALLET total math uses `subtotalBaseXOF - creditAppliedXOF` and can ignore voucher / wrong payable; zero-cash ledger may omit promo legs |
| B | Booking detail cancel: only Wallet / Cash | UI `RefundChannel = "CASH" \| "WALLET"` omits `VOUCHER` though service accepts it |
| C | Trip cancel / bulk cancel always wallet | `cancel-trip-with-refunds.ts` and `bulkCancelBookings` hardcode `channel: "WALLET"` |
| D | Cancel vouchers usable anywhere | `MonetaryVoucher` has no `scheduleId`; evaluate has no schedule match |
| E | Pending tab pay ≠ search checkout | Pay Paystack/Wallet only; no coupon/voucher/credits; no re-freeze |
| F | Cancel still offered after check-in | Detail drawer does not gate on `checkedInAt` |

---

## How to build it

### Phase 0 — Shared payable contract (foundation)

Define one canonical payable shape used by search checkout, pending pay, hold freeze, and wallet confirm:

```ts
payableXOF          // max(0, charge after fee policy − instruments), cash to collect
creditAppliedXOF
voucherAppliedXOF
ticketDiscountXOF
convenienceFeeXOF   // 0 when WALLET or when payable would be fee-only edge cases per policy
paymentMode         // PAYSTACK | WALLET | ZERO_CASH
```

Rules:

- `payableXOF === 0` ⇒ `paymentMode = ZERO_CASH` (or WALLET with zero debit — same server path).  
- Never compare cash wallet balance against pre-instrument fare.  
- Never require `availableBalance > 0` when `payableXOF === 0`.  
- Accounting: if `payableXOF === 0` and `operatorNetXOF > 0`, **must** post promo/voucher/credit legs so BOOKING balances (extend `appendPromoLedgerEntries` / confirmation service).

**Touch:** `getCheckoutPricing`, hold discount freeze, `booking-confirmation-service` wallet path, `booking-checkout-form`, pending pay UI.

---

### Phase 1 — Schedule-scoped cancellation vouchers

#### 1.1 Schema

`MonetaryVoucher`:

- `scheduleId String?` + FK to `Schedule`  
- `companyId String?` + FK to `Company` (issuing operator company)  
- Indexes: `[userId, status]`, `[scheduleId]`, `[companyId]`  
- Migration + Prisma generate  

Invariants (service-level):

- `source === CANCELLATION` ⇒ `scheduleId` and `companyId` **required**  
- Other sources ⇒ both null  

#### 1.2 Issue path

`issueCancellationVoucher`:

- Load cancelled booking → `trip.scheduleId`, `trip.companyId`  
- Reject issue if `scheduleId` missing (orphan trip) — fall back messaging: use WALLET/CASH  
- Persist amount, 12m expiry, `sourceBookingId` / `sourceHoldGroupId` as today  
- Notify passenger: amount + **schedule name / route** (“valid on this service only”)

#### 1.3 Eligibility / evaluate

Before applying `MONETARY_VOUCHER`:

- If voucher.`scheduleId` set: require `trip.scheduleId === voucher.scheduleId` (and optionally same `companyId`)  
- Else: unscoped (admin grants)  
- Soft-fail codes: e.g. `VOUCHER_SCHEDULE_MISMATCH` with human message  

Partial apply: min(remaining, remaining payable after ticket discounts) — keep leftover.

#### 1.4 List / wallet UI

- `listMyVouchers`: return `scheduleId`, schedule label (route + time name)  
- Wallet / checkout voucher picker: show “Valid on: {schedule}”; disable or hide if current trip schedule ≠ bind  
- Pending + search: only selectable vouchers that match current trip schedule (or unscoped)

#### 1.5 Side effects

- FAQ / Terms: cancellation voucher = same schedule, partial remaining, not cash  
- Finance recon doc: cancel clawback + voucher liability on redeem  
- Ceiling: `CANCELLATION` stays **outside** promotional voucher ceiling (already via source lists — verify)

---

### Phase 2 — Zero-cash + checkout instrument matrix

#### 2.1 Fix search checkout (`booking-checkout-form`)

- Derive `payableXOF` from pricing snapshot (include voucher + credits + coupon), not ad-hoc `subtotal - credits` only.  
- Wallet fee waiver: fee = 0 for WALLET **and** for ZERO_CASH.  
- If `payableXOF === 0`: enable confirm without balance check; label “Covered by promo / voucher”.  
- If `payableXOF > 0` and WALLET: require `availableBalance >= payableXOF` only.  
- Paystack only when `payableXOF > 0` and method PAYSTACK.

#### 2.2 Server wallet / zero-cash confirm

- `totalToPay = payable from snapshot` (already fee-adjusted); if `0`, skip wallet debit, **still** confirm hold + post liability legs.  
- Guard: reject if snapshot instruments don’t cover `operatorNet` / charge (prevent free rides without reserved lots).  
- Consume / finalize credit lots + voucher remaining on confirm (existing freeze/consume paths — verify zero-cash hits them).

#### 2.3 Edge-case matrix (must pass)

| Case | Expected |
|------|----------|
| Credits only = full fare | ZERO_CASH confirm; lots reserved/consumed; wallet untouched |
| Credits + coupon | Coupon first, credits fill; payable ≥ 0 |
| Coupon only | Charge reduced; cash/wallet for rest |
| Unscoped voucher full fare | ZERO_CASH or partial |
| Schedule voucher + matching schedule | Applies; partial leftover |
| Schedule voucher + **wrong** schedule | Not listed / soft-fail; full fare |
| Schedule voucher + credits | Voucher then credits (engine order) |
| Voucher + coupon + credits | Stacking rules; never negative payable |
| Multi-seat; instruments cover all | ZERO_CASH |
| Multi-seat; instruments cover part | Cash/wallet for remainder |
| WALLET + fee waiver | Fee 0; payable = post-instrument ticket |
| PAYSTACK + instruments | chargeAmount includes fee on remainder only (existing policy) |
| Guest checkout | No credits/vouchers; pay full |
| Expired / empty voucher | Soft-fail |
| Concurrent double-spend voucher/credits | Idempotent reserve; second hold fails soft |

**Tests:** unit evaluate + pricing; integration confirmation with mocked accounts; UI smoke checklist in Phase 19 doc.

---

### Phase 3 — Operator cancel channels + checked-in

#### 3.1 Booking detail drawer (`booking-detail-drawer.tsx`)

- `RefundChannel = "WALLET" | "CASH" | "VOUCHER"`  
- Three options; guest: no WALLET (and no VOUCHER if no `userId`)  
- If `checkedInAt`: **hide cancel block** / show “Checked in — cancel disabled”  
- On VOUCHER success: toast with voucher amount + schedule hint  
- Wire existing `operator.cancelBooking` channel through (already supports VOUCHER at service)

#### 3.2 Server guards

- `cancelBooking`: if `checkedInAt` set → `BAD_REQUEST` / FORBIDDEN with clear message (UI + API).  
- `issueCancellationVoucher`: require schedule on booking trip.

#### 3.3 Bulk cancel (`operator.bulkCancelBookings`)

- Input: `channel: WALLET | CASH | VOUCHER`  
- Filter: only `CONFIRMED` and `checkedInAt == null`  
- Return `{ cancelled, failed, skippedCheckedIn }`  
- Manifest bulk UI: channel picker + reason; show skipped count

#### 3.4 Whole-trip cancel (`cancelTripWithRefunds` + `trips.cancel` + manifest)

- Param: `refundChannel` (shared)  
- Skip checked-in confirmed bookings (leave them CONFIRMED? or block entire trip cancel if any checked-in?)  

**Locked product rule from Decision 6:** skip checked-in; cancel trip status still CANCELLED for the departure — **document ops risk**: checked-in passengers may remain CONFIRMED on a CANCELLED trip.

**Mitigation in this plan (required):**

- If any checked-in exist: either (A) **block trip cancel** until ops un-check-in / handle those seats, or (B) cancel trip but keep those bookings CONFIRMED and surface a loud warning + admin follow-up list.  

**Recommendation to implement:** **(A) block whole-trip cancel when any `checkedInAt` present**, with message listing count; bulk-selected cancel still skips checked-in. Rationale: avoids CONFIRMED-on-CANCELLED-trip inconsistency. *(If you prefer B, say so before build.)*

Default in this plan: **(A) for full trip cancel; skip for bulk selected.**

#### 3.5 Manifest drawer UX

- Full trip cancel: reason + **channel radios** (Wallet / Cash / Voucher) + confirm.  
- Bulk selected: same channel radios.  
- Disable full trip cancel button when `checkedInCount > 0` (if A), with helper text.  
- i18n strings for all new copy.

#### 3.6 Side effects

- Novu `passenger-trip-cancelled` / refunded: include channel + voucher schedule text when VOUCHER.  
- Operator insufficient-balance clawback errors: surface per-booking in trip refund results (already partially there).

---

### Phase 4 — Passenger pending bookings pay

#### 4.1 UI (`passenger-bookings-view` pending flow)

Reuse shared checkout pricing panel (extract from search form if needed):

- Promo code apply  
- Voucher select (schedule-filtered)  
- Credits auto (useCredits true)  
- Payable breakdown + ZERO_CASH / WALLET / PAYSTACK  
- Hold countdown still enforced  

#### 4.2 API

- `getCheckoutPricing` from hold (offerId/seats/trip from hold) **or** dedicated `getHoldCheckoutPricing({ holdId, code, voucherId, useCredits })`  
- Before pay: `refreezeHoldDiscount` / extend `createHold` freeze to **update active hold** snapshot idempotently  
- Then existing `completePayment` / `checkoutWithWallet` / zero-cash  

#### 4.3 Edge cases

- Hold expired → cannot re-freeze; force new search.  
- Seat no longer available → fail soft.  
- Instrument applied after freeze mismatch → reject pay.  
- Pending hold created as guest then user logged in — credits/vouchers only if `userId` on hold.

---

### Phase 5 — Docs, QA, rollout

1. Update Phase 19 QA matrix rows for: schedule voucher redeem, wrong-schedule reject, zero-cash, three cancel channels, checked-in block, pending re-freeze.  
2. Finance recon: cancel VOUCHER channel → liability; redeem → drawdown; zero-cash BOOKING balanced.  
3. FAQ/Terms honesty.  
4. `memory.md` after ship.  
5. Feature flag: none required if treated as bugfix + completion; optional `SCHEDULE_VOUCHERS_ENABLED` only if you want staged rollout.

---

## File / module map (expected)

| Area | Files (primary) |
|------|-----------------|
| Schema | `packages/db/prisma/schema.prisma`, new migration |
| Issue voucher | `voucher-service.ts`, `cancellation-service.ts` |
| Evaluate | `evaluate.ts`, `eligibility` helpers, `campaign-loader` / voucher load |
| Pricing / confirm | `getCheckoutPricing` router, `booking-confirmation-service.ts`, `promo-ledger.ts` |
| Search UI | `booking-checkout-form.tsx` (+ extract shared `CheckoutPricingPanel`) |
| Pending UI | `passenger-bookings-view.tsx` |
| Operator booking | `booking-detail-drawer.tsx`, `operator.ts` cancel/bulk |
| Trip cancel | `cancel-trip-with-refunds.ts`, `trips.ts`, `manifest-drawer.tsx` |
| Wallet list | `promo-incentives-panel.tsx`, voucher list queries |
| Tests | engine tests, pricing tests, confirmation zero-cash, cancel channel |
| Copy | next-intl operator/passenger/discounts namespaces |

---

## Side effects checklist (do not miss)

- [ ] Ledger balance on ZERO_CASH with operatorNet > 0  
- [ ] Credit lot reserve release on abandoned hold  
- [ ] Voucher reserve on hold + release on expire  
- [ ] Schedule mismatch never silently ignores voucher  
- [ ] Guest cancel cannot select VOUCHER  
- [ ] Checked-in API enforcement (not UI-only)  
- [ ] Trip cancel vs checked-in policy (A)  
- [ ] Bulk result counts: cancelled / failed / skippedCheckedIn  
- [ ] Notifications copy for voucher-on-schedule  
- [ ] Existing ACTIVE cancellation vouchers **without** `scheduleId` after migrate: backfill from `sourceBooking.trip.scheduleId` where possible; else leave unscoped **or** expire — **recommend backfill**, fail closed to unscoped only if booking gone  
- [ ] Operator clawback insufficient funds mid trip-cancel  
- [ ] Traveler-app: document as follow-up (wallet panel already lists vouchers; redeem still via API)  
- [ ] Admin cancel paths if any — same channel + checked-in rules  
- [ ] Search dialog vs full page checkout both use shared panel  

---

## Implementation order

1. Phase 0 payable contract + zero-cash server/client (unblocks your credits bug)  
2. Phase 3 cancel channels + checked-in (unblocks operator UX; VOUCHER issue still needs Phase 1 schedule fields)  
3. Phase 1 schema + issue + evaluate schedule bind  
4. Phase 2 matrix tests + UI polish  
5. Phase 4 pending re-freeze  
6. Phase 5 docs/QA  

(Phases 1 and 3 can parallelize after 0 if needed: add nullable `scheduleId` first, then require on issue.)

---

## Out of scope (this plan)

- Passenger self-cancel → schedule voucher  
- Points / loyalty currency  
- Traveler-app UI parity (follow-up)  
- Changing promotional voucher ceiling rules  
- Operator-funded campaign promos redesign  

---

## Open micro-choice (one default set)

**Whole-trip cancel when someone is checked in:** default **block (A)** as above. Confirm or switch to warn-and-skip (B) before coding Phase 3.4.

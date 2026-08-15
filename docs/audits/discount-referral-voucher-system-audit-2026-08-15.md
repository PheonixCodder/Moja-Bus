# Audit Report — Discount / Referral / Voucher System

**Date:** 2026-08-15  
**Product:** Moja Ride (web + traveler-app)  
**Scope:** Schema, tRPC routers, discount engine, admin/operator/passenger/traveler UIs, referral attribution, abuse, checkout integration, enterprise UX comparison  
**Verdict:** **Not production-ready.** Domain model and core engine are substantially built; ops and passenger surfaces are incomplete and several end-to-end journeys are broken.

---

## Executive summary

The system has a strong **backend skeleton** (Prisma models, evaluation engine, hold freeze/finalize, referral credit ledger, admin/operator routers) but fails the journeys operators, admins, and passengers actually need:

| Reported symptom | Root cause (code-backed) | Severity |
|------------------|--------------------------|----------|
| Create promo/campaign + coupons but **can't see codes** | Admin & operator UIs never call `getCampaign` / `listCoupons`; coupon panel is create-only | **P0** |
| Invite link `https://…/?ref=MRCFHCL9` does nothing | No reader of `?ref=`; auth/signup never attributes; link is marketing fiction | **P0** |
| Exchanging referral codes “doesn't work” | Program defaults `isActive: false`; apply requires login + active program; no UX for inactive state | **P0** |
| Applying someone else’s coupon is unclear / fails | Works only if campaign is **ACTIVE** + code valid; DRAFT campaigns reject; bad codes **throw** and break pricing query instead of soft-fail | **P0** |
| UI feels unusable / non-instructional | Minimal forms (bps inputs, no scopes/caps/wizard), no detail pages, copy lies about signup attribution | **P1** |

**Enterprise readiness score (honest):** ~35/100 for launch bar. Schema/engine ~70; ops UI ~25; referral growth loop ~15; passenger trust UX ~30.

**Points vs credits:** The locked product decision (and `27-future-enhancements.md`) explicitly chose **wallet promo credits + coupons**, not an airline-style points catalog. That can still be enterprise-grade if attribution, rewards clarity, and ops tooling work. Today they do not. Adding points without fixing the broken referral loop would not help.

---

## 1. What was audited

### Plans
- `docs/plans/discount-referral-voucher-system/` (vision, schema, phases 01–21, abuse, future)

### Schema
- `packages/db/prisma/schema.prisma` — `DiscountCampaign`, `CouponCode`, `MonetaryVoucher`, `CreditLot`, `ReferralProgram`, `ReferralCode`, `ReferralEdge`, `DiscountRedemption`, scopes, opt-ins, `PromoAbuseEvent`

### Routers / services
- `apps/web/trpc/routers/discounts.ts`
- `apps/web/trpc/routers/discounts-admin.ts`
- `apps/web/trpc/routers/discounts-operator.ts`
- `apps/web/trpc/routers/payments.ts` (`getCheckoutPricing`)
- `apps/web/features/discounts/**` (engine + services)
- `apps/web/features/booking/services/booking-hold-service.ts`
- `apps/web/features/payments/services/booking-confirmation-service.ts` (referral hook)
- `apps/web/app/api/cron/process-referral-rewards/route.ts`

### UI
- Admin: `…/admin/marketing/campaigns`, abuse queue, referral settings card
- Operator: `…/operator/promotions`
- Passenger web: `…/(passenger)/referrals`, checkout promo block
- Traveler app: `features/settings/screens/referrals.tsx`, checkout promo in `passenger-form-sheet.tsx`

### Schemas package
- `packages/schemas/src/discounts.ts`

---

## 2. Architecture snapshot (what exists)

```
Instruments (DB)          Evaluation                 Surfaces
─────────────────         ──────────                 ────────
DiscountCampaign    →     eligibility + benefits  →  Admin campaigns (partial)
CouponCode          →     stacking / auto-apply   →  Operator promos (partial)
MonetaryVoucher     →     quoteCheckoutDiscounts  →  Checkout web + app (partial)
CreditLot           →     freeze on hold          →  Passenger referrals (broken loop)
ReferralProgram     →     finalize / release      →  Abuse queue (thin)
ReferralCode/Edge         referral reward cron
DiscountRedemption
```

**Strength:** Money path thinking (funding shares, pricing snapshot fields, reserve/finalize, referral ledger via `AccountingEngine`) is closer to enterprise than a naive “% off string field.”

**Weakness:** Product surfaces stop at “create draft + type a code,” leaving APIs and schema capabilities unused.

---

## 3. Confirmed broken journeys (user-reported + code)

### 3.1 Admin / operator: create coupons but cannot see them — **CONFIRMED**

**Evidence**

1. **Admin UI** (`admin-campaigns-view.tsx`): selecting “Coupon” only opens an **Add coupon code** form. There is **no table/list** of existing codes. After create, success toast clears the input; **no invalidate** of campaign list / coupon list; **never** calls `discountsAdmin.listCoupons` or `discountsAdmin.getCampaign`.

2. **Operator UI** (`operator-promotions-view.tsx`): same pattern — create-only panel; `discountsOperator.getCampaign` (which includes `coupons: { take: 50 }`) is **never used** by any client file (repo grep: zero UI callers).

3. Phase plans require:
   - Admin: `/marketing/campaigns/[id]`, `/marketing/coupons`, coupon manager with bulk/export/deactivate (`08-phase-03`)
   - Operator: list + detail with redemptions (`09-phase-04`)  
   None of those routes/views exist (only `campaigns/page.tsx` and `abuse/page.tsx` under marketing).

**User-visible effect:** Codes are written to DB; `_count.coupons` on the campaign row may eventually show a number after refresh, but operators/admins cannot read, copy, deactivate, or audit the actual code strings. Feels “broken” even when create succeeded.

**Also missing after coupon create:** query invalidation so the “N codes” column updates immediately.

---

### 3.2 Referral invite link does nothing — **CONFIRMED**

**Evidence**

1. Web share URL built as `` `${origin}/?ref=${code}` `` in `passenger-referrals-view.tsx`.
2. Traveler app builds the **same** web URL (`referrals.tsx` → `WEB_ORIGIN/?ref=…`).
3. Repo search for URL `ref` capture under `apps/web/app` and auth: **no** `searchParams.get("ref")`, **no** localStorage/sessionStorage stash, **no** signup hook applying a referral code.
4. Phase 10 (`15-phase-10-referral-core.md`) acceptance requires:  
   - “Signup/login deep link `?ref=CODE`”  
   - “Auth signup hook: optional `referralCode` query param”  
   - “User A shares link; user B signs up attributed”  
   Status in plan: **Partial** — and the deep-link half is missing.

**User-visible effect:** Friend opens homepage; Moja marketing page ignores `ref`; no attribution, no welcome coupon, no funnel step.

**Copy lie:** i18n says *“Friends enter this at signup or on the referrals page.”* Signup has no invite field. Only logged-in users on `/dashboard/referrals` (or app `/referrals`) can manually apply — and only if the program is active.

---

### 3.3 Manual referral code exchange fails / feels broken — **CONFIRMED (conditional)**

**Evidence (`referral-service.ts`)**

- `applyReferralCode` requires `ReferralProgram.isActive === true`.
- Schema default: `isActive Boolean @default(false)`.
- Admin card can turn it on, but defaults for credits are **0 XOF** unless configured.
- Self / same-phone / same-device / velocity caps can reject with generic messages.
- Passenger UI does **not** surface program active state, reward amounts, or delay hours — so users get opaque `BAD_REQUEST` toasts.

Even when active:

1. Attribution only creates `ReferralEdge` status `ATTRIBUTED`.
2. Referrer reward requires later **paid CONFIRMED** booking + cron/delay (`onBookingConfirmedForReferral` + `processDueReferralRewards`).
3. `refereeCouponCampaignId` exists on `ReferralProgram` but is **never read** on apply — **no welcome coupon issued** to referee (Phase 10 product rule unmet).

---

### 3.4 Applying a promo / coupon at checkout — **PARTIAL / FRAGILE**

**What works (when conditions met)**

- Checkout (web + traveler) can pass `code` into `payments.getCheckoutPricing` → `quoteCheckoutDiscounts` → engine.
- Hold path freezes instruments into `PricingSnapshot` + `DiscountRedemption` (`freezeDiscountOnHold`).
- Engine rejects inactive coupons, expired codes, personal codes, exhausted codes, ineligible campaigns.

**How it fails in practice**

| Condition | Behavior |
|-----------|----------|
| Campaign still **DRAFT** (default create status in both UIs) | Coupon row may exist, but `loadActiveCampaignsForCheckout` only loads `status: "ACTIVE"` → engine `CAMPAIGN_MISSING` / inactive path |
| User never clicks **Activate** | Code exists in DB, never redeemable |
| Invalid / ineligible code | `quoteCheckoutDiscounts` **throws** `TRPCError` when `!quote.ok && input.code` — entire pricing query errors |
| UI expects soft fail | Checkout checks `pricing?.discountOk === false` — often **never reached** because the query fails hard |
| Operator coupon on wrong company trip | Eligible only for that `companyId` — correct, but error messaging is i18n keys / generic, not operator-friendly |

So “I created a 10% code and applied it” commonly fails unless: create → activate → apply on matching operator trip → program/campaign rules pass.

---

## 4. Backend routers — depth review

### 4.1 `discounts` (passenger)

| Procedure | Status |
|-----------|--------|
| `listMyVouchers` | Implemented; used at checkout |
| `listMyCredits` | Implemented; **no passenger UI** consuming it |
| `myReferral` | Ensures code + counts; used |
| `applyReferralCode` | Implemented; no device fingerprint from clients usually |

Gaps: no public `programPublic` (planned Phase 10), no deep-link apply, no welcome coupon grant.

### 4.2 `discountsAdmin`

Broad surface: list/create/update/status, coupons list/create/bulk/deactivate, vouchers issue, referral program, abuse list/resolve, marketing summary, performance, CSV export, opt-in notify blast.

**UI consumes only a thin slice:** list campaigns, create, status, create coupon, summary/performance, referral card, abuse list. Unused by UI: `listCoupons`, `getCampaign`, `bulkCreateCoupons`, `deactivateCoupon`, `issueVoucher`, full update/scopes, hybrid editor.

### 4.3 `discountsOperator`

Same pattern: solid list/create/status/coupon APIs + platform opt-in + summary. **UI ignores** `getCampaign`, opt-in list/set, update with scopes, deactivate coupon.

### 4.4 Checkout integration

- Preview: `payments.getCheckoutPricing` — good entry point.
- Hold: `booking-hold-service` quotes + freezes — good.
- Confirm: referral hook in booking confirmation — good **if** edge exists.
- Cron: referral reward activation — present.

**Bug-shaped behavior:** throwing on invalid code at quote time is hostile to UX and analytics.

---

## 5. Discount engine — quality assessment

### Solid
- Pure `evaluateCheckoutDiscounts` with clear instrument types.
- Eligibility: window, operator, opt-in, route/schedule/trip scope, min spend/seats, first/new user, global/user caps, budget remaining.
- Auto-apply selector + user code override (plan lock).
- Monetary voucher + credit lot application after ticket discount.
- Unit tests under `engine/__tests__` and promo-ledger tests exist.

### Gaps / defects
- `maxRedemptionsPerPhone` stored on campaign, **not enforced** in `eligibility.ts`.
- FAQ “max 3 promotional vouchers per person” — **not enforced** in engine (Phase 14 still open).
- `deviceHash` / `ipHash` on redemptions — schema-ready; checkout apply does not consistently populate.
- No rate-limit on coupon/referral apply attempts (Phase 14 “code spraying”).
- `FREE_SEAT` / `WALLET_CREDIT_GRANT` in schema; UI cannot create them; credit grant is rejected at checkout eligibility.
- Stacking UI / education almost absent (engine may allow combinations; passenger cannot understand rules).

---

## 6. Schema vs product vision

Schema is **ahead of UI** (good). Notable unused / half-wired fields:

| Field / model | Wired? |
|---------------|--------|
| Route/schedule/trip scopes | DB + engine yes; **create UI no** |
| Hybrid `platformShareBps` / `operatorShareBps` | Schema + admin create forces PLATFORM 100%; no hybrid editor UX |
| `requireOperatorOptIn` + `CampaignCompanyOptIn` | Router yes; **operator UI no** |
| `refereeCouponCampaignId` | Schema + admin update schema possible; **runtime unused** |
| `isAutoApply`, budget, priority, stackGroup | Defaults only in create forms |
| `PromoAbuseEvent` | Written on some referral blocks; thin review metadata |

---

## 7. UI / UX audit (enterprise bar)

### Admin campaigns
- KPI cards and CSV export are useful stubs.
- Create form: name + benefit + **bps** (operators/admins should enter “10%”, not `1000`).
- No date window, budget, caps, scopes, auto-apply, hybrid, description, bulk codes.
- No campaign detail page; no coupon inventory; no deactivate UI.
- “Coupon” button label is unclear (sounds like navigate; opens create form).

### Operator promotions
- Same thin create flow; no route picker (core ERP job-to-be-done).
- No cost explanation (“this reduces your net by X”).
- Opt-in to platform hybrid campaigns: API only.
- No redemption list (privacy-masked passengers planned, missing).

### Passenger referrals (web + app)
- Code + copy + manual apply + funnel bars.
- Missing: how rewards work, amounts, delay, program off state, WhatsApp share (web), landing page, signup capture.
- Stats labels (“Sign-ups”) overstate — counts edges, not verified signups from links.

### Abuse queue
- Filter chips + mark reviewed.
- Shows raw `userId` and `JSON.stringify(metadata)` — not trust-ops grade (no user profile link, no edge graph, no action to pause campaign / freeze user).

### Checkout
- Promo + voucher select present on web and app.
- Credits auto-applied silently (`useCredits: true`) with little explanation.
- Rejection path brittle (throw vs soft fail).
- No clear stacking education (“one code or voucher + credits”).

**UX grade:** Functional prototype, not operator-market or passenger-market ready.

---

## 8. Abuse & fraud vs Phase 14

| Control (plan) | Status |
|----------------|--------|
| Self-referral block | Implemented |
| Same phone block | Implemented (if phones set) |
| Same device block | Code path exists; **clients rarely send `deviceHash`** |
| Velocity per referrer/day | Implemented on apply (uses qualified count — check timing vs “qualified”) |
| Paid confirm before reward | Implemented |
| Reward delay | Implemented via PENDING lots + cron |
| Creator caps | Partially (global/user in engine; phone cap not) |
| Global 3 promo vouchers | **Missing** |
| Rate-limit code apply | **Missing** |
| Admin pause campaign | Implemented |
| Clawback unspent credits | **Not evidenced as complete** |
| Admin freeze user promo privileges | **Missing** |

Abuse UI is a log viewer, not a case-management tool.

---

## 9. Points system recommendation

**Product lock today:** recurring **promo credits (XOF)** for referrers + **coupons** for acquisition — not airline miles/points (`01-locked-decisions`, `27-future-enhancements`).

### vs airline / large travel apps

| Pattern | Airlines / OTAs | Moja today | Gap |
|---------|-----------------|------------|-----|
| Invite deep link → account bind | Standard | Broken | P0 |
| Referee incentive at signup | Standard | Field unused | P0 |
| Referrer reward after qualified trip | Common | Built but hard to reach | P1 |
| Points balance + catalog | Airline FF | Explicitly deferred | OK if credits UX clear |
| Status tiers | Airline | None | Post-v1 |
| Clear “how it works” UI | Standard | Weak | P1 |
| Ops coupon inventory | Standard | Broken visibility | P0 |

**Recommendation:** Do **not** pivot to points before fixing the growth loop. Points add catalog, liability accounting, and earn-rate complexity. Fix credits/coupons first so behavior matches Terms/FAQ. Revisit points only if marketing needs gamified earn rates / non-cash catalog (Phase 27).

If you want a “points-like” feel without a catalog: show **credit balance**, earn rules, and expiry prominently (still XOF-backed `CreditLot`).

---

## 10. Enterprise pattern scorecard

| Area | Score | Notes |
|------|-------|-------|
| Domain model | 8/10 | Rich, fundable, instrumented |
| Evaluation engine | 7/10 | Strong core; phone/FAQ caps incomplete |
| Ledger / cost share | 7/10 | Thoughtful; needs finance recon QA |
| Admin ops UI | 3/10 | Create without manage |
| Operator growth UI | 2/10 | No scopes, no code inventory |
| Passenger referral loop | 2/10 | Dead links; inactive default |
| Checkout apply UX | 4/10 | Present but fragile |
| Abuse / trust | 4/10 | Floor events only |
| i18n / legal honesty | 4/10 | Copy claims signup attribution |
| Traveler parity | 5/10 | Referrals + promo exist; same link bug |
| Observability / QA | 3/10 | Plan Phase 19 not closed |

**Overall: ~3.5/10 enterprise launch readiness** for this subsystem.

---

## 11. File-level defect register (priority)

### P0 — broken or false journeys
1. No `?ref=` capture / signup attribution — `passenger-referrals-view.tsx`, traveler `referrals.tsx`, auth flow, home page.
2. Coupon inventory UI missing — `admin-campaigns-view.tsx`, `operator-promotions-view.tsx`; unused `getCampaign` / `listCoupons`.
3. Referral program default inactive + zero rewards + no passenger status — schema + admin card + passenger UI.
4. `refereeCouponCampaignId` never applied — `referral-service.ts`.
5. Invalid promo code throws in `quote-service.ts` instead of returning soft rejection for preview.

### P1 — major product gaps
6. Create UIs omit scopes, windows, caps, budget, auto-apply, hybrid, FREE_SEAT.
7. No campaign detail / coupons routes from Phase 03–04.
8. Operator platform opt-in APIs without UI.
9. `maxRedemptionsPerPhone` not enforced in eligibility.
10. Device fingerprint not collected on apply/checkout.
11. Passenger `listMyCredits` unused; credits silent at checkout.
12. i18n promises signup entry of codes — false.

### P2 — polish / enterprise
13. Abuse queue UX (IDs + raw JSON).
14. Bulk coupon UI unused (`bulkCreateCoupons`).
15. Rate limits, global voucher ceiling, clawback tooling.
16. bps-facing percent inputs.
17. Web WhatsApp / share sheet; dedicated invite landing (`/invite` or `/r/[code]`).
18. Simulate-checkout for admins (mentioned in future/plan, not shipped).

---

## 12. What is implemented well (keep)

- Prisma models match the master plan closely.
- Evaluation engine separation (pure functions + loaders).
- Hold freeze / release / finalize redemption lifecycle.
- Platform vs operator funding fields and commission base adjustments in freeze.
- Admin force-pause of operator campaigns + notify path.
- Referral reward delay + idempotent credit lots + ledger posting.
- Cron route for due referral rewards.
- Permissions hooks (`promotions:*`, `marketing:*`).
- Marketing activity audit on several admin mutations.
- Checkout pricing preview plumbing on web and traveler app.
- Tests for evaluate + promo ledger.

These are assets; the failure mode is **incomplete productization**, not “wrong schema.”

---

## 13. Recommended fix order (delivery)

### Sprint A — Make truth match UI (P0)
1. Coupon list panel: call `getCampaign` / `listCoupons`; show code, active, redemptions, deactivate; invalidate queries.
2. Soft-fail invalid codes in `quoteCheckoutDiscounts` (return `ok: false` for preview; throw only on hold if desired).
3. Create wizard: percent as %; require Activate explanation; optional “create + activate + first code” path.
4. Referral: public landing `/invite` or `/r/[code]` that stores code and applies after auth; fix share URLs; stop using bare `/?ref=`.
5. Surface program `isActive` + reward amounts on passenger referrals; block share when inactive.

### Sprint B — Complete referral product (P0/P1)
6. Wire `refereeCouponCampaignId` issuance on first attribution.
7. Collect device hash (web + app) into `applyReferralCode`.
8. Auth signup optional referral field + restore from stored invite.
9. Credits wallet section using `listMyCredits`.

### Sprint C — Ops completeness (P1)
10. Campaign detail pages; scopes pickers; caps/budget/dates; bulk codes.
11. Operator hybrid opt-in UI.
12. Enforce phone caps + FAQ voucher ceiling; rate-limit applies.
13. Abuse queue: link users, pause actions, hide raw JSON.

### Sprint D — Enterprise polish
14. Honest Terms/FAQ/i18n; QA matrix Phase 19; finance recon.
15. Re-evaluate points **only after** credit referral loop converts.

---

## 14. Alignment with plans (status honesty)

Many phase docs already say **Partial**. This audit confirms they are **over-credited** if anyone treated Partial as “works for users”:

| Phase | Doc status | Audit reality |
|-------|------------|---------------|
| 03 Admin campaigns | Partial | Create/list/status yes; coupon manage / detail **no** |
| 04 Operator promos | Partial | Same; scopes/opt-in **no** |
| 05–07 Checkout | (assumed landed) | Preview+hold yes; soft-fail UX weak |
| 10 Referral core | Partial | Codes/apply yes; **deep link / signup / welcome coupon no** |
| 11 Recurring rewards | (built in service) | Hard to observe without working attribution |
| 14 Abuse | Partial | Floor events yes; ceilings/rate limits/clawback incomplete |
| 21 Polish | Done per memory | Funnel bars/copy ≠ working growth loop |

---

## 15. Conclusion

The discount/referral/voucher system is an **incomplete commercial incentives platform**: the ledger-aware engine and schema are credible; the **operator/admin coupon lifecycle UI** and **referral acquisition loop** are not. Until invite links attribute, coupons are listable/manageable, campaigns are clearly activated, and checkout rejects codes softly with human messages, the subsystem will correctly feel “fully broken” in manual QA — matching the reports that triggered this audit.

**Do not ship growth marketing on this stack yet.** Prioritize Sprint A–B above before any points redesign.

---

## Appendix A — Key paths

```
packages/db/prisma/schema.prisma          # models ~2365–2698
packages/schemas/src/discounts.ts
apps/web/trpc/routers/discounts*.ts
apps/web/features/discounts/engine/*
apps/web/features/discounts/services/*
apps/web/features/admin/views/admin-campaigns-view.tsx
apps/web/features/admin/views/admin-promo-abuse-view.tsx
apps/web/features/admin/components/admin-referral-program-card.tsx
apps/web/features/operator/views/operator-promotions-view.tsx
apps/web/features/passenger/views/passenger-referrals-view.tsx
apps/web/features/booking/components/booking-checkout-form.tsx
apps/traveler-app/features/settings/screens/referrals.tsx
docs/plans/discount-referral-voucher-system/
```

## Appendix B — Minimal repro matrix (manual)

1. Operator: create draft promo → add coupon → close panel → **cannot see code string**.
2. Admin: same.
3. Copy invite link → open in private window → lands on home → **no attribution**.
4. Apply friend code while program inactive → error.
5. Create coupon on DRAFT campaign → activate later → apply at checkout on matching trip → works only after ACTIVE.
6. Apply garbage code at checkout → pricing query **errors** (not inline reject).

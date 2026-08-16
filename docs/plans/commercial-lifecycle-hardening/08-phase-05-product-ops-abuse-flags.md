# Phase 05 — Product flags, ops, abuse & offline fulfilment

**Status:** Implemented (2026-08-16)  
**Depends on:** Phases 00–02 for money/schema; Phase 01 for voucher rules  
**Unlocks:** Coherent product flags; ops can fulfil offline refunds; abuse actionable  
**Findings:** P1-6, P1-11, P1-13, P1-14, P1-15, P2-8…10, P2-20…22, P2-26, P3-1…3, P3-10…12, P3-14, P3-17

## Goal

Eliminate dead/misleading product flags, complete offline refund operations, tighten fraud controls, and make admin/operator marketing tools trustworthy.

## Delivered

### 05.1 — Flag triage
See [17-phase-05-flag-decisions.md](./17-phase-05-flag-decisions.md). Wired: `allowCombineWithCredit`, campaign `applyTarget` fee path, `expiresOnFirstCompletedBooking`, `requirePaidConfirmedBooking`, differentiated `newUserOnly` (≤14d account age).

### 05.2 — Offline refund FSM
`PENDING_FULFILMENT` → `COMPLETED` / `VOIDED` with actor timestamps. Admin UI `/dashboard/admin/financials/offline-refunds`. Migration `20260816190000_phase05_ops_abuse`.

### 05.3 — Sweepers
Cron `/api/cron/incentive-status-sweep` (hourly :15): expire lots/vouchers; SCHEDULED→ACTIVE; ACTIVE→EXPIRED by window.

### 05.4 — Abuse & fraud
`PromoAbuseReviewStatus` + assignee/resolution columns; claim `deviceHash` enforced; referral fraud toggles persist from admin UI.

### 05.5 — Tooling
Admin `setCampaignStatus` NOT_FOUND guard; crypto bulk coupons + batchId + partial failure report.

### 05.6 — Company-only voucher
Evaluate rejects when `companyId` mismatches even without `scheduleId`.

### 05.7 — Privacy
[18-phase-05-privacy-retention.md](./18-phase-05-privacy-retention.md)

### 05.8 — Pending referral
Do not clear storage on “already attributed”; only clear on definitive invalid/self.

## Remaining / deferred

- Traveler search picker for promo credit grants (P2-10) — light UX
- Max promotional vouchers on all issue paths (P3-17) — inventory
- Optional hash anonymization cron (policy documented)
- Referral velocity on qualifications/day (P3-11) — follow-up

## Exit checklist

- [x] Flag decision table checked in
- [x] Ops can mark offline refunds paid/void
- [x] Sweeper cron registered
- [x] Abuse review lifecycle columns
- [x] Bulk coupon collision report
- [ ] Staging migrate `20260816190000` + smoke offline refunds / claim deviceHash

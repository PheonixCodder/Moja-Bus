# Phase 20 — Rollout & Launch Checklist

**Status:** Flags removed — incentives are always-on; GA checklist remains  
**Depends on:** Phase 19 gate  
**Unlocks:** Production launch of incentives layer

## Always-on (2026-08-15)

Env kill switches (`DISCOUNTS_ENABLED`, `REFERRALS_ENABLED`, `CANCEL_VOUCHERS_ENABLED`, UI/auto-apply flags) were **removed**. Discounts, referrals, cancel vouchers, and admin/operator promo UIs are native.

Operational controls (use these instead of env flags):

- Campaign `status` (DRAFT / ACTIVE / PAUSED / …)
- Referral program `isActive` on the default program
- Pause campaigns from admin / operator UI
- Abuse review queue + marketing audit log

## Rollout steps

1. Deploy schema + app (incentives live)
2. Create platform campaigns as drafts → activate when ready
3. Enable referral program via admin toggle when ready to attribute
4. Pilot operator promotions with a few companies
5. General availability
6. Monitor promo liability + fraud queue daily for 2 weeks

## Acceptance criteria

- [ ] GA checklist completed (support runbook, finance recon, legal FAQ)
- [ ] Novu bridge sync confirms promo workflows
- [ ] `context/progress-tracker.md` updated
- [ ] `memory.md` /remember save after launch week

## Runbook (support)

- “Code not working” → check status, window, scope, caps, pause
- “Missing voucher after cancel” → channel + issuance log
- “Referral not paid” → edge status, delay job, fraud flags, program active

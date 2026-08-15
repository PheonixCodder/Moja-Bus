# Phase 15 — Notifications

**Status:** Partial (code triggers + code-first Novu workflows registered; bridge sync / staging receive still needed)  
**Depends on:** Phases 08–11 for events; Novu already in stack  
**Unlocks:** Passenger awareness loop

## Workflows (Novu)

| Event | Channels | Audience | Code status |
|-------|----------|----------|-------------|
| Voucher issued (cancel) | Email + push + in-app | Passenger | `passenger-voucher-issued` |
| Referral attributed | in-app | Referrer | `passenger-referral-attributed` |
| Referral reward posted | Email + push | Referrer | `passenger-referral-reward` |
| Admin paused your campaign | Email | Operator owners | `operator-campaign-paused` |
| Budget exhausted | Email | Campaign creator / operator | `campaign-budget-exhausted` |
| Voucher expiring in 7 days | Email + push | Passenger | `passenger-voucher-expiring` + daily cron |
| Credit expiring | push | Passenger | `passenger-credit-expiring` + daily cron |
| Coupon campaign starting | push | Opt-in users | Not started |

## Work items

1. ~~Define workflow IDs in code~~ — see `DISCOUNT_NOVU_WORKFLOWS`
2. ~~Trigger from services~~ — voucher, referral, pause, budget, expiry reminders
3. Create matching workflows in Novu dashboard (staging)
4. i18n templates EN/FR in Novu
5. Respect marketing opt-in flags for blast workflows only

## Acceptance criteria

- [ ] Cancel → voucher notification received in staging
- [ ] Referral reward notification after grant job
- [x] Code paths fire safely when Novu unset (no-op)
- [x] Daily cron `/api/cron/promo-expiry-reminders` registered
- [ ] Opted-out users skip marketing blasts but still get transactional voucher/referral reward messages

## Out

- SMS until provider cost approved (design hooks only)

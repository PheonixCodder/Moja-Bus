# Phase 10 — Referral Core (Codes, Links, Attribution)

**Status:** Partial (codes, apply, abuse floor, passenger myReferral API + `/dashboard/referrals` invite UX)  
**Depends on:** Phase 01; Phase 03 for referee welcome coupon campaign; Phase 05–07 for applying welcome coupon  
**Unlocks:** Phase 11 recurring rewards

## Goal

Every passenger gets a referral code + share link; referees can attribute; fraud basics for self-referral.

## Product rules (locked)

- Attribution on signup or first checkout (“invite code”) — **locked: allow both; first write wins; immutable after QUALIFIED**
- Referee welcome: coupon campaign (acquisition)
- Referrer: credit lots (Phase 11 for recurring); initial credit on first paid confirm
- Require paid **CONFIRMED** booking before referrer reward
- Block self-referral (same userId)
- Block same phone as referrer primary phone
- Block same device fingerprint when available
- Reward delay default 48h after confirm (FAQ-aligned); configurable

## Models used

`ReferralProgram`, `ReferralCode`, `ReferralEdge`

## APIs

- `referral.me` — my code, link, stats
- `referral.applyCode` — attribute before qualify
- `referral.programPublic` — landing copy amounts
- Auth signup hook: optional `referralCode` query param

## UI

- Passenger web + app: Invite friends page (code, copy link, WhatsApp share)
- Signup/login deep link `?ref=CODE`
- Admin: referral program settings

## Acceptance criteria

- [ ] User A shares link; user B signs up attributed
- [ ] Self code rejected
- [ ] Duplicate edge for same referee rejected
- [ ] Stats show pending/qualified counts

## Out

- Recurring multi-booking credits (Phase 11)
- Full fraud graph (Phase 14)

# Phase 14 — Abuse & Fraud Controls

**Status:** Partial (self/phone/device/velocity + PromoAbuseEvent + admin abuse queue UI)  
**Depends on:** Phases 05, 08, 10–11 (instruments live)  
**Unlocks:** Decision #7 hard floor

## Goal

Prevent referral rings, voucher farming, and infinite code sharing from breaking unit economics — while letting creators set per-campaign redemption limits.

## Controls (must ship)

| Control | Detail |
|---------|--------|
| Creator caps | `maxRedemptionsPerUser` etc. on campaign (already in schema) |
| Platform ceilings | Global max promotional vouchers per user (FAQ: 3) via `PlatformSettings` |
| Self-referral | Block same userId |
| Same phone | Block referrer/referee phone match; block multi-account same phone redeem if configured |
| Same device | Store fingerprint hash on attribution + redeem; block obvious loops |
| Paid confirm gate | No referrer credit until CONFIRMED payment |
| Velocity | Max referrals qualified per referrer / day |
| Code spraying | Rate-limit code apply attempts per IP/user |
| Admin kill switch | Pause campaign, revoke voucher, freeze user promo privileges |
| Clawback | Pending referral grants cancellable; posted credits revoke only if unspent (policy) |

## Data

- `PromoAbuseEvent` log table (optional but recommended)
- Fields on redemption: `deviceHash`, `ipHash`

## UI

- Admin Trust: flagged edges queue
- Operator: read-only note when admin paused their campaign

## Acceptance criteria

- [ ] Self-referral cannot qualify
- [ ] One-time code cannot be used twice by same user
- [ ] Global promo voucher limit enforced
- [ ] Admin can pause campaign → new checkouts stop within seconds
- [ ] Rate limit returns friendly errors

## Out

- Full graph ML anomaly detection (future)

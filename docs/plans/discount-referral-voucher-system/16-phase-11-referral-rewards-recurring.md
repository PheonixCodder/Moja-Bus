# Phase 11 — Referral Rewards (Recurring Credits)

**Status:** Partial (PENDING lots + process-referral-rewards cron every 15m)  
**Depends on:** Phase 10, Phase 08/12 credit redemption path, confirm hooks in Phase 05  
**Unlocks:** Decision #2 (recurring wallet credits)

## Goal

When a referee completes paid bookings, referrer receives **config-driven recurring `CreditLot`s**, not only a one-time bonus.

## Program knobs

- `referrerInitialCreditXOF`
- `refereeWelcomeCampaignId` (coupon — already in Phase 10)
- `recurringCreditAmountXOF`
- `recurringMaxBookings` (e.g. first 3 paid trips)
- `recurringWindowDays` (e.g. 180 days from qualify)
- `rewardDelayHours`
- Caps: max credits earned per referrer per month (abuse)

## State machine

```
ATTRIBUTED → QUALIFIED (first confirm)
QUALIFIED → reward initial credit (after delay job)
each subsequent confirm by referee (within window & under max):
  → enqueue recurring credit (delay + fraud checks)
```

## Jobs

- `processReferralRewards` — scans due grants
- Idempotent grant keys: `referralEdgeId + bookingId + kind`

## Acceptance criteria

- [ ] First confirm → initial credit after delay
- [ ] 2nd/3rd confirms → recurring credits until max
- [ ] Outside window → no credit
- [ ] Cancelled/fraud edge → no grants; pending grants voided
- [ ] Double-confirm webhook does not double-pay

## Out

- Spending credits (Phase 12 if not done)
- SMS referral marketing blasts

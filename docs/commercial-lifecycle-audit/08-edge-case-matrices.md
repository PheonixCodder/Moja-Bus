# 08 — Edge-case matrices

## Payments & confirm

| Scenario | Expected | Actual / risk |
|----------|----------|---------------|
| Paystack 1-seat success via webhook then verify | Idempotent confirm | OK (claim + webhook idempotency) |
| Amount mismatch verify | Reject | OK |
| Pay after hold soft expiry | Rescue or reject | Wallet rescue if logged in; guests stuck |
| PENDING forever | Sweep soon | Daily reconcile only — P1 |
| Top-up charge.success | Credit wallet once | OK via (externalPaymentId, TOP_UP) |
| Transfer failed | Reverse ledger | handleTransferWebhook + P2002 soft-ignore |
| Zero-cash with funded credits | Confirm, no wallet debit | OK |
| Zero-cash with unfunded admin credits | Confirm | Hold created; ledger debit fails — P0 |
| Escrow before arrival | Reserved | release-escrow after ARRIVED+24h |

## Cancel & refund

| Scenario | Expected | Actual / risk |
|----------|----------|---------------|
| Paystack 1-seat cancel → WALLET | Clawback + wallet credit | Works if ExternalPayment SUCCESS; **no card refund** |
| Paystack N-seat, cancel seat 2+ | Proportional refunds | **P0 unique REFUND collision** |
| Trip cancel multi confirmed | All refunded | First may OK; others CANCEL_WITHOUT_REFUND |
| Wallet / zero-cash cancel | Refund to channel | **P0 No successful payment** |
| Guest cancel → WALLET | Refuse / cash | Trip/bulk coerce CASH; passenger UI always WALLET |
| VOUCHER cancel | Offline + schedule voucher | Needs account + schedule |
| Checked-in seat | Block | Single blocked; trip blocked if any |
| After departure | Block | Unless forceAfterDeparture |
| Refund before escrow clear | releaseFromReserve | Implemented |
| Convenience fee | Product decision | Not refunded — P2 |

## Incentives

| Scenario | Expected | Actual / risk |
|----------|----------|---------------|
| Abandoned hold with coupon | Cap freed | Stuck until releaseHold — P1 |
| Soft expiry without release | Caps freed | Caps stuck — P1 |
| Pending pay reopen with credits | Same credit quote | Self-blocks reserved; may refreeze to 0 — **P1-17 Trace C** |
| createHold then wallet confirm fails | Release hold | Reservations stick — P1-18 |
| Invalid voucher after coupon selected | Soft fail voucher | emptyReject wipes coupon — P1 |
| Schedule voucher wrong schedule | Reject | OK |
| Company-only voucher (no schedule) | Issuer-bound | Company check skipped — P2-21 |
| Admin credit then full cover checkout | Works | Unfunded ledger — P0 Trace B |
| Claim credit same user twice | Idempotent | OK |
| Claim with deviceHash fraud | Enforce | Hash ignored — P1 |
| Delayed referral 2 paid bookings | 1 INITIAL + RECURRING | 2 INITIAL — P0 Trace E |
| Immediate referral delay=0 | 1 INITIAL | Safer (REWARDED) |
| Concurrent freeze same budget | Cap honored | Race overspend possible — P1-19 |
| Voucher redeem accounting | Burn liability | Platform expense — P0 |

## Holds / seats / search

| Scenario | Expected | Actual |
|----------|----------|--------|
| Two users same seat same segment | One wins | OK trip lock |
| Same seat A→B and B→C | Both | OK |
| Mid-route reuse, search A→C | Capacity − max load | Row-sum understates remaining — P1 |
| Hold expires | Free seats + instruments | Seats free; instruments reserved — P1 |
| Pending pay promo change + Paystack | Charge new amount | Init OK; verify amount mismatch — P1 |
| BOARDING deep link | Consistent with search | Bookable, not searchable — P2 |
| Max 7 seats | Reject | Max 6 — P3 |
| Guest booking | Hold | Must login first |

## UI / token / locale

| Scenario | Expected | Actual |
|----------|----------|--------|
| Locale FR book dialog | Translated | EN hardcoded — P2 |
| Success share URL | Short-lived / auth | Long-lived ticketToken in query — P1/P2 |
| Public ticket token leak | Revocable | Permanent CUID publicProcedure — P2 |
| Midnight CI search day | Local day | UTC bucket — P2 |

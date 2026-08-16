# Phase 07 — Staging smoke checklist

**Program:** Commercial lifecycle hardening  
**Gate:** Run on staging after migrations `20260816140000` … `20260816200000`  
**D7:** OUT (no Paystack splits)

## Prerequisites

- [ ] Migrations applied through `20260816200000_phase07_outbox`
- [ ] Cron secrets configured; `/api/cron/process-outbox` reachable
- [ ] Novu workflows exist for commercial IDs (confirm/refund/trip-cancelled/referral/hold)

## Smoke scenarios

1. **Multi-seat Paystack** — Book 2+ seats → cancel each seat (wallet/cash) → trip-cancel another trip with refunds  
2. **Wallet + zero-cash** — Book with wallet; book with credits/voucher covering charge → cancel all refund channels  
3. **Claim credit full cover** — Claim grant → book with payable ≈ 0  
4. **Delayed referral** — Two bookings before referral cron; confirm single INITIAL grant  
5. **Pending-pay abandon** — Create hold → abandon → reopen pending-pay → pay with credits (Trace C)  
6. **FR locale** — `/fr` book → pay → success → cancel copy  
7. **Mobile callback / verify** — Paystack return + `moja_checkout_session` bind; presentation `pt` on success URL  
8. **Outbox** — Confirm booking with Novu down or invalid key → row in admin `/dashboard/admin/financials/outbox` → fix Novu → Retry → SENT  
9. **Recon** — Run SQL from audit docs 07 + 12; zero unexpected P0 drift (or owned exceptions)

## Sign-off

| Role | Name | Date | Go/No-go |
|------|------|------|----------|
| Eng | | | |
| Ops | | | |

## Notes

_File results / exceptions below._

# 26 — Edge Cases & Risks

## Pricing & money

1. Rounding: percent off then fee on post-discount — document always `Math.round` XOF
2. Hybrid shares that don’t sum to discount after rounding — allocate remainder to platform
3. Charge amount 0 with Paystack initiated — forbid initiate; confirm directly
4. Wallet fee waiver + credits + coupon — order matrix tested
5. Seat count change after code apply — must re-quote before hold
6. Fare changes between search and hold — hold recomputes fare then discount (existing fare recompute stays)
7. FREE_SEAT with multi-seat uniform fare OK; heterogeneous seat prices future risk
8. Commission distance tiers + discounts — commission base rules per funding still apply
9. Operator withdrawal after heavy operator-funded promos — net may be low; show warnings at campaign create if budget large vs historical revenue

## Instruments

10. Personal assigned coupon used by another user — reject
11. Code case/spacing — normalize trim + uppercase
12. Unicode homoglyph codes — restrict charset `[A-Z0-9-]`
13. Bulk codes colliding — unique constraint + retry
14. Voucher expires mid-hold — freeze remaining at hold; honor frozen amount through confirm even if clock passes (policy locked: **honor freeze**)
15. Marketing voucher `expiresOnFirstCompletedBooking` — expire siblings after confirm
16. Two devices applying same one-time code — transactional lock

## Referral

17. Referrer deletes account — stop recurring; don’t delete historical edges
18. Referee books then full refund — clawback pending; if credit spent, flag for manual
19. Attribution after first booking already completed — reject late codes
20. Staff/test accounts excluded from rewards via flag

## Multi-tenant

21. Operator code applied to another operator’s trip — reject (scope)
22. Platform campaign scoped to companies without opt-in when required — skip
23. Admin pause vs operator pause — either inactive for engine

## UX / product

24. Guest checkout: discounts require auth (already hold requires auth) — prompt login keeping code in URL/state
25. PromoBanner “15% OFF” without campaign — avoid false advertising; link banners to campaign IDs when possible (enhancement)
26. FareType.PROMO schedule price + coupon — allow unless stack policy forbids “already discounted fare” (default allow; operator responsibility)

## Compliance

27. Non-transferable: no API to attach voucher to other userId
28. No cash refund of voucher — UI must not offer
29. Fraudulent voucher bookings cancellable per Terms — admin tool

## Operational risks

30. Budget not reserved → oversell discount — Phase 05 soft reserve mandatory
31. Job delay backlog pays old referrals late — monitor queue depth
32. Clock skew on `startsAt` — use DB `now()`
33. i18n missing keys showing raw paths — lint message catalogs

## Open risks to watch (not blockers)

- Agent/partner office redemption not in v1
- Influencer unique codes at scale (bulk OK; portal later)
- Accounting chart of accounts naming may need finance advisor rename — keep aliases in constants

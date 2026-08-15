# Phase 13 — Auto-Apply & Stacking UX Polish

**Status:** Partial (engine auto-apply; dedicated UX thin)  
**Depends on:** Phase 02 engine, Phase 05–07 checkout UIs  
**Unlocks:** Decision #4 auto-apply + stacking clarity for passengers

## Goal

Make auto-apply and stacking understandable and controllable, not surprising.

## UX

- Always show “Best available offer applied” when auto promo used
- If user enters code cheaper/worse: show comparison toast “Your code saves less than Early Bird — switch?”
- **Locked default:** user-entered valid code **overrides** auto promo
- Explain “Credits can combine; two promo codes cannot”
- Operator/admin preview tool: “simulate checkout” with phone/user test harness (admin only)

## Work items

1. Wire `autoApply` default true on web+app
2. Comparison UI when code conflicts with auto
3. Snapshot JSON includes `rejectedAlternatives` for support
4. Admin simulation page

## Acceptance criteria

- [ ] Eligible auto promo applies with zero typing
- [ ] Code override works
- [ ] Stacking error messages match FAQ
- [ ] Support can read breakdown from hold admin view

## Out

- ML personalized offers

# 11 — Remediation roadmap

Ordered for risk reduction. This is a sequencing guide, not a full design spec.

---

## Wave 0 — stop the bleeding (P0 money / entitlement)

1. **Cancel without ExternalPayment**  
   Detect settlement from hold confirmation (wallet ledger tx / zero-cash / Paystack payment). Branch refund logic per provenance. Unblock operator + passenger cancel for wallet seats.

2. **Multi-seat REFUND uniqueness**  
   Change ledger uniqueness so each booking (or each refund row) can post independently. Add regression test: 2+ seats same hold, cancel all.

3. **Never cancel entitlement on refund failure**  
   Trip/bulk cancel: keep CONFIRMED (or move to `REFUND_PENDING` / disruption state) until refund obligation is durable. Queue failed refunds for ops. Remove silent `CANCEL_WITHOUT_REFUND` as the happy path for failures.

4. **Honest refund statuses**  
   Distinguish `INTERNAL_WALLET_CREDIT`, `OFFLINE_PAYABLE`, `PAYSTACK_REFUND_PENDING|PROCESSING|COMPLETED|FAILED`. Do not write COMPLETED with null provider id for card/MM.

5. **Optional: call Paystack refund API** for card/MM when channel policy requires original instrument return — or explicitly document “wallet/offline only” and hide COMPLETED wording.

---

## Wave 1 — incentive ledger correctness (P0/P1)

6. **Fund admin + claim credit grants** in the same transaction as `CreditLot` create (mirror referral activation). Repair job for existing ACTIVE lots vs promo account balance.

7. **Fix delayed referral INITIAL**  
   Edge-level claim: only one INITIAL while QUALIFIED; subsequent confirms → RECURRING. Concurrent confirm + cron tests.

8. **Voucher redeem → liability burn**, not platform promo expense. Soft-fail invalid voucher without wiping coupon/auto.

9. **Migrations**  
   Baseline discount/referral/voucher/credit/scope + pricing discount columns into proper migrations; make `20260816120000` safe; document push→migrate cutover.

---

## Wave 2 — hold / pay lifecycle integrity (P1)

10. **Fix pending-pay self-reservation (P1-17 / Trace C)**  
    Re-quote excluding reservations from the **current** hold, or atomically release → quote → re-reserve under row locks with rollback. Never preview a hold that treats its own reservation as unavailable. Integration tests: reopen unchanged pending hold; apply/remove each instrument; failed replacement restores prior freeze.

11. **Client compensation on wallet/Paystack confirm failure after createHold (P1-18)**  
    Call `releaseHold` (or equivalent) on failed confirm; do not leave seats/credits reserved orphaned.

12. **Central expire/fail command**  
    Atomically: bookings EXPIRED, holdGroup terminal, `releaseDiscountReservations`, audit event. Call from releaseHold, reconcile failure, hold-expiry cron, trip pending expire.

13. **Sync `ExternalPayment.amountXOF`** on every re-init to current snapshot charge (and/or verify against attempt metadata).

14. **Fix segment occupancy** to distinct seats or max concurrent load on path — align search remaining with seat map.

15. **Wallet confirm clash re-check** parity with Paystack.

16. **mobile-callback** should verify+confirm or clearly say “processing” until webhook.

17. **Increase reconcile frequency** for pending charges (e.g. every 5–15m); bound parallel provider catch-up.

18. **PaymentIntent / purpose discrimination** for checkout vs top-up (P2-19); close stale PaymentAttempt lifecycle.

---

## Wave 3 — product flags, abuse, offline ops (P1/P2)

19. Wire or remove dead flags: `allowCombineWithCredit`, `canStackTicketPromos`, `expiresOnFirstCompletedBooking`, `applyTarget`, `requirePaidConfirmedBooking`.

20. Expiry sweeper for CreditLot / MonetaryVoucher statuses; campaign status lifecycle worker.

21. Offline refund payable fulfilment states (owed → paid/void).

22. Abuse actions beyond pause (edge reject/revoke); review owner/state metadata.

23. Admin campaign status owner guards; traveler search for credit grants; company-only voucher enforcement; populate/use ipHash + deviceHash.

---

## Wave 4 — UX / privacy / i18n (P2)

24. i18n book dialog, countdown, checkout, refund copy; locale-aware redirects.

25. Passenger cancel channel picker; guest restrictions; remove dead guest form paths.

26. Remove ticket tokens from durable URLs; short-lived presentation tokens; document scanner auth.

27. Bind browser verify to signed checkout session.

28. UTC→Africa/Abidjan for search day/time buckets; multi-deck seat map; seat conflict refresh UX.

29. Traveler-app pending-pay / schedule voucher parity.

---

## Wave 5 — observability & tests

30. Durable outbox for Novu/receipts/referral side-effects.

31. Tests for: Trace A–E, multi-seat REFUND unique, pending-pay self-reservation, unfunded grants, delayed INITIAL, amount sync after refreeze — see [10-coverage-inventory.md](./10-coverage-inventory.md).

32. Run recon SQL from [07-schema-integrity.md](./07-schema-integrity.md) and [12-incident-traces-and-reconciliation.md](./12-incident-traces-and-reconciliation.md) in staging before each commercial release.

33. Staging smoke: multi-seat Paystack, wallet zero-cash, cancel all channels, delayed referral, claim credit full-cover, pending-pay refreeze (credits must reappear).

---

## Suggested owners (logical)

| Wave | Domain owner |
|------|----------------|
| 0 | Payments / ledger |
| 1 | Growth / discounts + ledger |
| 2 | Booking / payments |
| 3 | Growth + ops |
| 4 | Web UI / privacy |
| 5 | Platform QA |

---

## Do not

- Treat `docs/commercial-transaction-audit/` as the live findings source (it is superseded).
- Commit secrets or service-account JSON while fixing.
- Ship more campaign types until Waves 0–1 (+ P1-17) land.
- Confuse promo credits with loyalty points in UI copy.

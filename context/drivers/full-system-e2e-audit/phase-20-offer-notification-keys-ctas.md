# Phase 20 — Offer-Notification Keys & Email CTAs

> **Closes:** F-NF-04, F-NF-09 (partially — review-request done in Phase 19), F-DV-13 · Evidence: `08-notifications-novu-outbox.md`; `02-operator-admin-lifecycle.md` F-OP-05; `04-driver-trip-execution.md` F-DV-13.
> **Status: ✅ CODE COMPLETE 2026-08-23** — gates green (19/19 · web **445/445** incl. 4 new key-collision tests). Staging leg: two-operator company both receive counter/accept/expiry notices; expiry sweep still yields EXPIRED event + notices.

## Objective
Multi-operator companies receive every offer/conflict notice; remaining hardcoded-host CTAs resolve; offer expiry is audit-complete regardless of which path wins.

## Tasks
- [x] Recipient-scoped keys moved INSIDE the helpers so callers can't forget: `operator-offer-countered`, counter-resolved trio, `offer-expiring-soon`, `offer-expired`, `driver-affiliation-ended`, and the assignment-conflict alert now append a truncated SHA-256 tag of the subscriber id (`txIdWithRecipient` in `outbox/tx-id.ts`). Raw ids are NOT used — bounded length + no identifiers in dead-letter exports.
      Single-recipient helpers unchanged. Old pending keys unaffected.
- [x] F-DV-13 closed: both lazy sweeps (`getMyOffers`, `listSentOffers`) replaced with `$transaction` + fetch-due → loop the existing `expireOfferIfDue` (audit event + both-side outbox notices), bounded by offer caps. No silent status flips remain in the file.
- [x] CTA standardization: new `utils/app-url.ts::dashboardUrl(path)`; fixed payout-failed (admin/withdrawals), operator-verification-approved (**was admin-surface link on an operator notice** — copy-paste-class bug), verification-rejected. operator-welcome left producer-driven ✓; review-request done in Phase 19.
- [x] Tests: `tx-id.test.ts` — determinism, 8-char bound, distinct-recipients-distinct-keys (the literal F-NF-04 bug as regression test), bare-base passthrough. Wired into web suite.

## Acceptance criteria
Two-operator company both see counter/accept/expiry notices *(staging leg)*; zero bare-Date.now or host-hardcoded templates in driver/operator domains ✓ (grep-audited); opening offers screen after expiry still yields EXPIRED event + notifications ✓ (sweep path shares cron semantics).

## Follow-up noted
Contract rows for the seven single/trio offer workflows ride the next notification-touching phase (harness pattern established; not a gap this phase introduced).

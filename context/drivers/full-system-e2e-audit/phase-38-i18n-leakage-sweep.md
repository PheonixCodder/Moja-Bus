# Phase 38 — i18n Leakage Sweep

> **Closes:** F-PS-12 + cross-app hardcoded-string inventory · Evidence: `07-passenger-tracking-reviews.md` F-PS-12; `10-cross-cutting-observations.md` §2.
> Web cancel dialog hardcodes French beside adjacent `t()` (`passenger-tickets-view.tsx:304-313`); traveler tracking screen fully French-hardcoded (`tracking/[tripId].tsx:29-46`); traveler ReviewSheet + PendingReviewPrompt English-hardcoded; driver scanner strings English. Namespace key parity itself is clean (verified) — the leak is literals bypassing i18n.

## Objective
FR and EN users see one language on every screen, especially money and review moments. fr-first per workspace rules.

## Tasks
- [ ] Inventory sweep: grep the named surfaces + both apps for hardcoded user-facing literals adjacent to `useTranslation` usage.
- [ ] Move strings into `locales/{en,fr}/booking.json` (web), traveler booking/settings namespaces, driver-app namespaces — keeping en↔fr key parity (re-run the parity script from the audit).
- [ ] Traveler tracking screen + review prompt + review sheet + web cancel dialog + driver scanner covered as the minimum set.
- [ ] Spot-check rendered output in both locales.

## Acceptance criteria
No mixed-language screens in the audited surfaces (manual FR/EN device pass); parity script green.

## Dependencies
Phases 18/19/33 touch these same components — run this sweep LAST so strings aren't moved twice.

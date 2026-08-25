# Phase 24 — Offers & Marketplace Polish

> **Closes:** F-OP-05, F-OP-06, F-OP-07, F-OP-08 · Evidence: `02-operator-admin-lifecycle.md` findings.
> **Status: ✅ CODE COMPLETE 2026-08-23** — F-OP-05 was already closed by Phase 20's sweep conversion (inherited, verified). Gates green (19/19 · web **447/447** · biome clean). Staging legs: >20 sent offers accumulate on Load-more; public sheet CTA disabled for own-roster drivers.

> Verified broken surfaces at session start: sheet CTA always-enabled (`driver-public-profile-sheet.tsx`, profile response lacked `isOnMyRoster`); sent-offers Load-more replaced the list instead of appending; marketplace featured/suspended keys embedded Date.now().

## Objective
The offer board behaves identically from every entry point, paginates correctly, and never silently drops a negotiation notice.

## Tasks
- [x] ~~F-OP-05 lazy sweeps bypass audit~~ ✅ closed early in Phase 20 (both sweeps routed through `expireOfferIfDue` in-tx). Inherited this session.
- [x] **F-OP-06** — `getPublicDriverProfile` response gains `isOnMyRoster` (caller-company ACTIVE affiliation); public-profile sheet disables Send-Offer with "On Your Roster" when true, closing the sheet-level gap that the card-level P3-1 fix left. Affiliations select now includes `companyId`.
- [x] **F-OP-07** — sent-offers view adopts the accumulate pattern: page batches collected per page index, Load-more APPENDS (`pageBatches.flat()`), reset on status-tab change. Previously only the current page rendered while hasMore was computed from total.
- [x] **F-OP-08 remainder** — `marketplace-admin.ts` featured/suspended keys: `Date.now()` → day-bucketed (`{action}-{driverProfileId}-{date}`). Identical re-actions dedupe within a day (kills toggle-spam); suspend→re-feature same day still fires both notices because the actions differ; next-day re-feature re-notifies. Counter equal-salary edge accepted + documented (recipient tag from Phase 20 already distinguishes operators).
- [x] F-NF-13 marketplace half ✓ closed here.

## Acceptance criteria
Load-more appends without losing earlier rows ✓; CTA disabled on own roster ✓; toggle-spam impossible ✓. Staging legs pending (visible after Neon top-up migrate).

## Follow-up noted
Equal-salary-same-day counter collision remains theoretically possible (rare) — if it ever bites, pass the created DriverOfferEvent id into the helper's key.

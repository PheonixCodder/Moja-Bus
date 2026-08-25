# Phase 34 — Notification Small-Fixes Batch

> **Closes:** F-NF-11, F-NF-12, F-NF-13, F-NF-14, F-NF-15 · Evidence: `08-notifications-novu-outbox.md` findings.
> Retry grants one extra attempt (`process.ts:174-187`); pause reason key mismatch (`notify.ts:132-136` vs `promo-campaigns.ts:24-28`); marketplace keys embed Date.now() (`marketplace-admin.ts:11/:29`); conflict alert dies on email-less operators (`dispatch.ts:154` vs `driver-conflict.ts:48`); in-app lists mark-read but never navigate (both apps).

## Objective
Five tiny notification defects fixed in one sweep — all mechanical, all testable.

## Tasks
- [ ] `retryOutboxMessage`: reset `attempts = 0` (fresh budget) — document deliberate retry policy.
- [ ] Rename caller key `reason` → `pauseReason` (or schema-side accept both); template renders the reason.
- [ ] Marketplace featured/suspended keys: event-sourced (driverProfileId+action+status-transition-id) instead of Date.now().
- [ ] Conflict alert email field: conditional spread (omit when absent), matching bank helpers.
- [ ] In-app list tap navigation on driver notifications screen + traveler settings/notifications, routing by type using the same maps as push handlers (Phase 21 data).

## Acceptance criteria
Retried DEAD rows get a full attempt budget; campaign-pause emails include reasons; toggle-spam impossible; email-less operators don't poison conflict fan-out; tapping an in-app row navigates.

## Dependencies
Phase 21 (push data maps exist to reuse). Last notification phase before hygiene waves.

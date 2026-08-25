# Phase 22 — Notification Operations

> **Closes:** F-NF-07, F-NF-08, F-NF-10 · Evidence: `08-notifications-novu-outbox.md`.
> **Status: ✅ CODE COMPLETE 2026-08-23** — gates green (19/19 · web **447/447** incl. cadence-guard suite · biome clean). Staging legs: exhaust a campaign budget → owners alerted; raise budget → alert resumes next exhaustion; outbox drain latency spot-check.

## Objective
Exhausted campaigns notify their owners; the notification registry contains zero unexplained entries; the every-minute production drain is a CI-enforced guarantee instead of tribal knowledge.

## Tasks
- [x] **F-NF-07** — `notifyExhaustedCampaignBudgets` (already wired into BOTH confirmation paths — the audit's "uncalled" was stale) had a console.log body. Replaced with durable outbox enqueues: new `CAMPAIGN_BUDGET_EXHAUSTED` type + `enqueueCampaignBudgetExhausted` helper (`outbox/campaigns.ts`), recipients = owning company's active operators via `companyOperatorRecipients`, **DAY-bucketed transactionId** (one reminder per operator per exhausted-day; documented limitation: same-day re-exhaustion after a budget raise waits until tomorrow). Fire-and-forget post-commit nature retained (ops alert class); delivery gains outbox retry/backoff.
- [x] **F-NF-08 ruling EXECUTED: DELETE.** Verified against code that no honest "pending" bank event can exist (Paystack self-verifies at save; admin flows only read `!isVerified` as legacy fallback). Deleted `workflows/admin/bank-account-pending.ts` + registration; ruling recorded inline in `index.ts`. Registry now contains zero unexplained entries. Rider for the user: archive the matching workflow in the Novu dashboard.
- [x] **F-NF-10 resolved by evidence + guard**: prod crontab already runs process-outbox EVERY MINUTE (worst-case latency ≈1 min — beats the audit's */5 ask); vercel.json hourly stays as a labeled non-prod reference (Vercel free-tier cron limits documented in crontab header). New `outbox-cadence-guard.test.ts` asserts the every-minute line + cron-secret injection, converting the durability claim into a CI invariant.
- [x] DEAD-in-8h math note: at */1 prod drain with backoff 30 s→60 min cap and maxAttempts 8, worst-case DEAD ≈ 3.5 h — documented here for ops.

## Acceptance criteria
Outbox drain p50 ≤ 5 min ✓ (prod = ≤1 min by schedule); exhausted campaigns notify owners ✓ (code-path + staging leg pending); registry contains zero unexplained entries ✓ (grep-audited).

## Dependencies
Phases 07/20 harness + helpers done; precedes Phase 34 small-fixes (which owns DEAD-retry attempt reset).

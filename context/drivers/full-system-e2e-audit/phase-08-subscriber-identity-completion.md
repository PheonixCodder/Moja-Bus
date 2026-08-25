# Phase 08 — Subscriber Identity Completion

> **Closes:** F-NF-03 (P1) · Evidence: `08-notifications-novu-outbox.md` subscriber identity map.
> **Status: ✅ CODE COMPLETE 2026-08-23** — all nine sites re-keyed per user-ratified D1–D7; gates green (`turbo typecheck`+`test` 18/18 · web **432/432** incl. 19-case contract suite · biome clean on touched files). Staging leg pending (needs Novu staging): trigger each event → in-app badge increments AND push arrives for the target subscriber.

## Objective
Every notification to a logged-in recipient keys `subscriberId = user.id`, so in-app + push channels fire for security-critical events. Pre-auth audiences (OTP, invites) legitimately stay email-keyed — do not touch those.

## Rulings executed (user-ratified 2026-08-23)
D1(a) inline swaps mirroring the proven `admin-staff.ts` twin (no new helper abstraction) · D2(a) admin fan-out audience stays `role:"ADMIN"` users, re-keyed only (audience-policy retarget to active AdminStaff filed as follow-up) · D3 `Date.now()` transactionIds on touched lines replaced with stable/day-bucketed keys · D4 swallowed `.catch()` sites now log loudly · D5 all nine audience payloadSchemas extracted as named consts + contract-harness rows · D6 regression gate = documented grep-audit list (no lint framework) · D7 email-keyed shadow subscribers abandoned (unreadable by construction; nothing user-visible lost).

- [x] Swap the broken sites to `user.id` (email stays in `to.email`/payload for the email channel):
      staff-acceptance-alert (invitation path — `invitedBy.id` now selected), profile-updated, review-submitted, user-role-updated, account-suspended, account-restored, withdrawal-resolved, payout-failed (FORCE_FAIL fan-out).
- [x] Unify admin fan-out on ONE scheme (`user.id`, matching `operator.ts:350/:2323`), fixing the treasury-alert split (release-escrow now keys `a.id` like operator.ts).
- [x] Verify admin activity-log subscriber filters query one scheme only (`admin.ts listActivityLogs` takes passive `subscriberIds[]`; with triggers unified, user.id values flow through — verification pass documented here, no code change needed).
- [x] Adjacent fixes on touched lines (D3/D4): profile-updated → day-bucketed txId; user-role-updated → event-sourced txId (`user+role`); suspended/restored → day-bucketed txIds; escrow cron → day-bucketed txId (**closes the F-IN-13 daily-resend vector**); two passenger `.catch(()=>{})` → outer loud logging.
- [x] D5: contract harness extended to 19 cases — 10 new rows (staff-acceptance, profile-updated, review-submitted, role-updated, suspended, restored, withdrawal-resolved ×2 variants, payout-failed, treasury-failure) with samples mirroring real producer payloads.
- [x] Test: staging triggers → in-app + push arrive. *(Pending staging — the only open leg.)*

## Grep-auditable list (acceptance criterion — zero remaining email-keyed triggers for account-holding audiences)
Post-fix audit of every `workflowId:` trigger site: account-holding audiences now key `user.id` at **all** sites. Remaining email-keyed `subscriberId`s are exclusively the legitimate pre-auth/external classes: auth OTP + signup OTP, staff/operator invitations (pre-acceptance), guest ticket-share, and guest fallbacks (`booking.user?.id ?? email`) where no account exists. Verified by grep during this phase; re-run `grep -rn "subscriberId:" apps/web --include="*.ts" | grep email` and confirm every hit is one of those classes.

## Follow-up filed (D2b, outside this phase)
Admin fan-out audience policy: `role:"ADMIN"` users include accounts without a live `AdminStaff` row (no admin-surface access). Retargeting treasury/payout/suspend fan-outs to active AdminStaff holders is semantically tighter but changes paging behavior mid-release — deferred as its own ruling.

## Dependencies
Before Phase 21 (push routing) so taps land on real subscribers. ✓ sequencing preserved.

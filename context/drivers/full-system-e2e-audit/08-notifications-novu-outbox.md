# 08 — Notifications Fabric: Novu Workflows × Triggers × Outbox Audit

> **Audit date:** 2026-08-22 · **Method:** full read of all 46 registered workflow definitions, every outbox helper, all direct `novu.trigger` sites across routers/services/crons/libs, both mobile Novu stacks, web Inbox components, admin dead-letter tooling. Every claim cites `file:line`.
> **Scope:** registry × trigger-site inventory · outbox mechanics · subscriber identity · consumers (inbox/push/tap-routing) · content/locale gaps · missing notifications.

---

## Inventory summary (full tables condensed)

**46 registered workflows. Zero 👻 ghosts remain** — every triggered ID exists in `workflows/index.ts` (cross-checked all direct-site `workflowId:` literals + all outbox payload IDs). Status by domain:

- **Auth/staff**: ✅ coherent pre-auth email-keyed OTP/invite flows. ⚠️ `staff-acceptance-alert` split-brain: admin path user.id (`admin-staff.ts:348`), invitation path inviter-email (`invitation.ts:262`) → operator inviters never see acceptance in-app.
- **Passenger commerce**: hold-created / booking-confirmed / refunded / wallet-topup / low-balance all ✅ OUTBOX or correctly keyed DIRECT. ⚠️ **trip-cancelled payload violates its own schema (F-NF-01)** · **operator-path trip-delayed fails schema (F-NF-02)** · boarding/gate-updated/review-request ✅ keyed but review-request email CTA 404s (F-NF-09).
- **Referral/campaign**: attributed/reward/expiring/starting ✅. 🏝️ **campaign-budget-exhausted orphan** — helper exists, production hook only console.logs (F-NF-07). ⚠️ campaign-paused reason key mismatch (F-NF-12).
- **Operator lifecycle**: withdrawal requested/settled/failed ✅; bank verified/rejected now enqueued atomically inside admin transactions (**D5 FIXED**, `admin.ts:459/:562`). ⚠️ Eight logged-in audiences still email-keyed (F-NF-03): user-role-updated, account-suspended/restored, withdrawal-resolved, payout-failed, treasury-failure (split audience vs operator.ts's id-keying), staff-acceptance (invitation path), profile-updated, review-submitted.
- **Driver marketplace/dispatch**: all offer lifecycle + affiliation-ended + trip-assigned/unassigned + marketplace featured/suspended ride the OUTBOX with sensible keys — except five helpers whose keys omit subscriberId while looping over multiple operators (**F-NF-04**: countered/accepted/declined/expiry×2/conflict) so only the first operator per company is ever notified.
- 🏝️ `admin-bank-account-pending` still registered with zero trigger sites and no code comment documenting intent (F-NF-08). `test-workflow.ts` deletion confirmed (P2-3 cleanup ✅).

## Outbox mechanics trace

- **Enqueue atomicity holds where it matters**: commercial/driver/dispatch/bank callers enqueue INSIDE the business `$transaction` (`booking.ts:120`, `trips.ts:1738/1864`, drivers offer actions, `cancellation-service.ts:208`, `admin.ts:459/562`, `cancel-trip-with-refunds.ts:273`) — a rolled-back write cannot strand an orphan notice. Idempotency via unique key + P2002-swallow (`enqueue.ts:73-122`).
- **Claim state machine** (`process.ts:50-171`): picks PENDING/FAILED due OR PROCESSING older than 15 min (**P2-6 FIXED** w/ loud warning); single-winner via attempts-equality guarded updateMany with claim-time attempt burn; malformed shape → immediate DEAD; backoff 30 s→1 h cap; DEAD at maxAttempts 8.
- **Cadence**: process-outbox hourly (`vercel.json:49`). Backoff effectively flattened to "retry next hour"; worst-case first-delivery ≈ 60 min for EVERYTHING outboxed — including booking receipts, refund/cancel notices and `driver-dispatch-urgent`. Urgent dispatch is saved in-product only by the client's 60 s tRPC poll. → **F-NF-10**.
- **Dead-letter tooling**: admin list/retry gated by settlement permissions + UI shipped. Retry resets status but NOT attempts → one extra attempt then DEAD again (**F-NF-11**).

## Subscriber identity map (post-16.3)

Canonical scheme = **user.id**, HMAC'd once in `getNotificationToken` (`public.ts:17-29`). All three consumers agree: web Inbox (passenger/admin/operator layouts), driver NovuProvider+bell, traveler provider+bell+Expo credential registration (`public.ts:43-53`). **P0-3 verified fixed end-to-end.**

Remaining email-keyed triggers (in-app/push land on shadow subscribers nobody reads):

| Class | Sites | Verdict |
|---|---|---|
| Pre-auth audiences | auth-otp, signup-otp, invites | ✅ coherent (no account exists) |
| External guests | ticket-shared recipient | ✅ coherent (email-only workflow) |
| Hybrid guest fallback | `booking.user?.id ?? email` (delayed/boarding/gate/review-request/cancelled) | ✅ acceptable |
| **Broken logged-in splits** | invitation.ts:264 · passenger.ts:345/:467 · admin.ts:756/~832/~907/~1255/FORCE_FAIL · release-escrow:258 | ❌ **F-NF-03** |

## Findings

| ID | Sev | Finding | Evidence | Fix sketch |
|---|---|---|---|---|
| **F-NF-01** | **P1** | `passenger-trip-cancelled` payload violates its own Zod schema (missing required `bookingReference`, sends unknown `refundStatus`, conditional refund amount) → bridge parse fails for email/inApp/push, yet row already marked SENT at trigger acceptance. Flagship cancellation notice is dead code in prod | cancel-trip-with-refunds.ts:253-263 vs workflows/operator/trip-cancelled.ts:51-61; process.ts:137-144 | Send bookingReference + unconditional numeric refundAmountXOF; add enqueue↔payloadSchema contract tests |
| **F-NF-02** | **P1** | Operator-initiated delay notification fails schema validation (omits required `bookingReference`/`reportedBy`) while driver variant works; failure invisible behind `.catch(()=>{})`. Also transactionId dedupes ALL subsequent delays for same booking (driver path buckets hourly) | trips.ts:1077-1106 vs drivers.ts:1709-1731 | Add missing fields; bucket transactionId like driver path |
| **F-NF-03** | **P1** | Subscriber identity split persists for 8 logged-in audiences — security-critical in-app/push silently dropped (role changed, account suspended/restored, payout resolved/failed, treasury failure); admin inbox fragmented across two schemes | see table above; public.ts:17-29 canonical scheme | Swap to user.id everywhere (email attr stays for email channel); unify admin fan-out on admin.id |
| F-NF-04 | P2 | Shared idempotency keys drop fan-out to all but FIRST operator: 5 offer helpers + conflict alert loop over recipients without appending subscriberId (bank helpers do it correctly) | outbox/driver-offers.ts:63,126,149,:195,:224; dispatch.ts:146 | Append `-recipient.subscriberId` pattern from operator-bank.ts |
| F-NF-05 | P2 | Push TAP-ROUTING dead on both apps: clients route on `data.type`, but no workflow defines push-step payload overrides and Novu doesn't forward trigger payload as Expo data → taps open app root | driver _layout.tsx:110-128; traveler _layout.tsx:134-170 vs e.g. workflows/driver/dispatch.ts:75-79 | Emit `step.push(overrides.expo.data)` carrying type+routing ids |
| F-NF-06 | P2 | Push credential registration last-writer-wins per subscriber: driver+traveler share user.id → whichever app registers last breaks push on the other; multi-device likewise; `platform` input validated but unused | public.ts:47-53 | Merge deviceTokens arrays; prune stale |
| F-NF-07 | P2 | campaign-budget-exhausted true orphan: notify helper uncalled; production hook console.logs only | quote-service.ts:593-611; notify.ts:142-160 | Call helper w/ company owner users |
| F-NF-08 | P2/P3 | admin-bank-account-pending unwired, undocumented (ruling from Phase 17 never recorded in code) | grep: zero trigger sites | Delete or wire + document decision inline |
| F-NF-09 | P2 | Review-request/welcome/signup-pending email CTAs: nonexistent routes + missing locale prefix; two templates hardcode absolute hosts | operator/review-request.ts:17; operator-welcome.ts:25; payout-failed.ts:31; operator-verification-approved.ts:17 | getAppOrigin() + locale; point CTAs at existing screens |
| F-NF-10 | P2 | Hourly outbox cadence caps durability guarantee (~60 min worst-case latency incl. receipts/refunds/urgent dispatch; DEAD in ~8 h) | vercel.json:49; process.ts:5-17 | */5 cadence or post-commit kick/worker |
| F-NF-11 | P3 | Admin DEAD-retry grants exactly one more attempt (attempts not reset) | process.ts:174-187 | Reset attempts on retry |
| F-NF-12 | P3 | Campaign-pause reason lost (caller `reason` vs schema/template `pauseReason`) | notify.ts:132-136 vs promo-campaigns.ts:24-28 | Rename caller key |
| F-NF-13 | P3 | Marketplace featured/suspended keys embed Date.now() → zero dedupe, toggle-spam possible | marketplace-admin.ts:11,:29 | Event-sourced keys |
| F-NF-14 | P3 | Conflict alert dies for email-less operators (`email ?? ""` vs z.string().email() poisons that row) | dispatch.ts:154 vs driver-conflict.ts:48 | Conditional spread |
| F-NF-15 | P3 | In-app notification lists don't navigate on tap (mark-read only) on both apps | driver notifications.tsx:57; traveler settings/notifications.tsx | Route by type after F-NF-05 lands |
| F-NF-16 | P3 | OTP codes logged to stdout in every environment | auth-email.ts:22 | Gate behind NODE_ENV |

**Missing-notification gaps (no trigger exists where one belongs)**: hold lapsed unpaid (silent expiry); marketplace RESTORE/UNFEATURE (only FEATURE/SUSPEND notify); operator roster removal (no driver notice outside exclusive-auto-term path); refund FAILURE copy (refunded workflow has no status field — failed cash refund reads as success receipt).

## Prior-findings scorecard (this domain)

| Prior ID | State |
|---|---|
| P0-3 subscriber split-brain | ✅ FIXED canonically — residual 8-audience split is new scope (F-NF-03) |
| P2-2 ghost acceptance-alert | ✅ FIXED |
| P2-3 orphans (test-workflow, ticket-share) | ✅ FIXED (admin-bank-pending consciously left — ruling undocumented in code, F-NF-08) |
| P2-6 stale-PROCESSING reclaim | ✅ FIXED |
| P2-7 hourly cadence | 🟡 PARTIAL — correctness yes, cadence unchanged (F-NF-10) |
| P3-6 bus-assigned via outbox | ✅ FIXED |

**Severity roll-up:** P1×3 · P2×7 · P3×7 (+gaps list).

# 08 — Consolidated Findings Catalog (P0 → P3)

> Every finding from all four audits, deduplicated, severity-ranked, with evidence. P0 = launch blocker · P1 = fix before public traffic · P2 = fix within two weeks of launch · P3 = polish/backlog.

---

## 🔴 P0 — Launch Blockers (5)

| ID | Finding | Evidence | Fix sketch |
|---|---|---|---|
| **P0-1** | Telemetry identity hardcoded: Start Run passes no driverProfileId → background pings persist under phantom `"drv_active"` forever | `driver-app/app/(tabs)/trips.tsx:67` (call site `:280` omits arg) | Thread real `ctx.driver.id` (trip payload already carries role/trip; add driverProfileId to getMyTrips items or read profile store) |
| **P0-2** | "Complete Run" never calls `drivers.completeTrip` — only stops local tracking; trips can't finish, drivers stranded ON_TRIP, ARRIVED-side automations never fire | `driver-app/app/(tabs)/live.tsx:72-76` | Wire mutation + invalidate queries + navigate; mirror trips-tab success handling |
| **P0-3** | Novu subscriber split-brain: clients auth inbox/push as `email`, servers trigger as `user.id` → in-app+push dead platform-wide for most notifications | `public.ts:17,42` vs `trips.ts:1220/1238/1335`, `booking-receipt-email.ts:86`, payment/booking-confirmation services, all offer/dispatch helpers | Switch the three client identity call sites to `user.id`; legacy email-keyed triggers remain valid for their audiences |
| **P0-4** | Exclusive-switch consent dead-end: client parses `EXCLUSIVE_CONFLICT_REQUIRED::companies`, shows alert, but never retries ACCEPT with `confirmExclusiveSwitch:true` — second exclusive offers are unacceptably in-product | `drivers.ts:2310-2326` ↔ `offers.tsx:244-263` (`acceptWithConsent` unused for retry) | On match, show confirm dialog listing companies → re-mutate with flag |
| **P0-5** | Raw `<div>` in RN crashes Earnings screen on Android | `earnings.tsx:89,96` | Replace with `<View>` |

## 🟠 P1 — Pre-Public-Traffic (7)

| ID | Finding | Evidence |
|---|---|---|
| **P1-1** | `expire-offers` cron not scheduled in vercel.json → offers never auto-expire in production | vercel.json (12 entries) vs 14 routes |
| **P1-2** | `reconcile-driver-stats` not scheduled → ratings/scores/distance drift indefinitely | same |
| **P1-3** | Cross-tenant IDOR: operator `verifyDriver` takes bare id with no company scope → any verifier flips any platform driver's verification (marketplace + dispatch eligibility), incl. self-verifying their own pending adds | `drivers.ts:600-608` vs scoped siblings |
| **P1-4** | Telemetry ingest unauthenticated end-to-end: WS upgrade trusts query-string identity; HTTP route accepts arbitrary driver batches → GPS spoofing poisons scores/rooms | `telemetry-ws.ts:36-50`; `api/v1/telemetry/ping/route.ts` |
| **P1-5** | WS gateway has no production run path (Vercel can't host; Docker standalone excludes it); traveler tracking consumer doesn't exist and current screen is a simulation wired to bookingId-as-tripId | `package.json:7,10`; `Dockerfile:119-129`; `tracking/[tripId].tsx:22-72`; `booking-detail.tsx:416` |
| **P1-6** | Self-service cancellation sends zero notification; `passenger-booking-refunded` workflow orphaned (helper has no callers) | `commercial.ts:36`; `cancellation-service.ts:189-235` |
| **P1-7** | Operator-added drivers receive no credentials (cannot log in) while email/phone matching can silently bind a DriverProfile onto an existing passenger's account | `drivers.ts:424-539`; no handoff in `add-driver-modal.tsx` |

## 🟡 P2 — Early-Launch Hardening (15)

1. Auto-created Operator rows for drivers over-provision staff powers AND cause rostered drivers to receive company offer-notifications (`drivers.ts:512-532` + `companyRecipients` lacking DRIVER exclusion).
2. Admin-staff ghost workflow: `admin-staff-acceptance-alert` triggered but unregistered (registered twin is `staff-acceptance-alert`) → admin inviters never alerted.
3. Three bank workflows registered but never triggered (`admin-bank-account-pending`, `operator-bank-verified/rejected`).
4. Low-balance alert misses the common pre-check rejection path (silent throw).
5. No automatic post-trip review prompt on traveler launch (push deep-link currently depends on P0-3 delivery).
6. Outbox PROCESSING stranding: crash between trigger and SENT permanently stalls rows (picker excludes PROCESSING).
7. process-outbox daily schedule vs 30s retry floor → worst-case ~24h notification latency.
8. Assignment double-book race: assignDriver transaction takes no lock while conflict check is plain-read (contrast FOR UPDATE in assignBus); no DB constraint enforces one-active-exclusive.
9. Driver passport header reads affiliations[0] unfiltered → wrong badge/hire-date/employer shown for multi-affiliated contractors.
10. WS cross-instance fanout broken (`redisSub` imported, never subscribed); GEOADD exists only on mock Redis.
11. Serverless flush hazard: module buffer + timer can drop pings when HTTP invocation ends first.
12. Web refund dialog always displays full-fare refund though service computes proportional minus fee, possibly cash PENDING_FULFILMENT.
13. Traveler "Track Live Bus" button conditions + simulation internals mislead users pre-departure (tie into P1-5 scope-out or feature-flag).
14. Mobile apps ship zero `.env.example`; Mapbox silently falls back to dummy token.
15. General tRPC rate limiting absent (Better Auth covers auth only).

## 🟢 P3 — Backlog / Polish (13)

1. Marketplace shows own-roster urban contractors with live Send Offer CTA that then fails server-side (card ignores `_count.companyAffiliations`).
2. Lazy expiry sweeps flip status without audit rows/notification depending on which path wins; only the cron does both consistently.
3. HYBRID affiliations labeled "Urban Contractor" in roster/detail views (binary label).
4. Roster KPI strip counts only the loaded page (>50 fleets disagree with totals).
5. Conflict-engine fallback durations diverge from fare-derived trip durations; candidate scan capped at 50; delay-shifted departures don't revalidate assignments.
6. `operator-bus-assigned` bypasses outbox guarantees (direct trigger in assignBus).
7. Web passenger reviews have no driverRating input (web cohort invisible in driver scores).
8. Raw ticket-token grace accepts any ≥16-char string until departure — consider TTL enforcement.
9. Telemetry broadcasts/Redis publishes currently have zero subscribers (unused infra note).
10. Cron-auth drift: three implementations (shared helper, inline publish-blogs, duplicated assertCronAuth in release-escrow).
11. Stale artifacts: tracked empty `tsc-errors.txt`; dead `revealBankAccountNumber` import in operator.ts; `test-workflow.ts` unregistered.
12. Delay-report modal on live.tsx collects input but never submits to `reportTripDelay`.
13. Dual-mode INTERCITY/URBAN switcher on trips tab is cosmetic (doesn't filter).

---

## Counts

**5 × P0 · 7 × P1 · 15 × P2 · 13 × P3 — total 40 findings.**

Every P0 verified firsthand during this audit; all other findings carry file:line evidence from the domain auditors (see per-domain files for full traces).

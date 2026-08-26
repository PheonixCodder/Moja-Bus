# 17 — Consolidated Gap Register (severity-ranked)

> Audit date: 2026-08-26 · Cross-module findings, deduplicated. Severity: 🔴 ship-blocker / 🟠 high / 🟡 medium / ⚪ low-polish. "Verified" = confirmed by code inspection this audit, not inherited from prior audits.
>
> **Status updates (2026-08-26, Phase 1 executed):** #1 FIXED (plus two sibling crashers found by follow-up grep: `register/carrier.tsx:125` and `register/license.tsx:162` — same fix). #21 FIXED (real defect was fail-closed-on-error trapping offline drivers in onboarding; now retry-once → fail-open, see `19-phased-implementation-plan.md` Phase 1). #25 ADDRESSED (dead keys documented in `permissions.ts`). #26 FIXED (copy softened).
>
> **Status updates (2026-08-26, Phase 2 executed — `20-phase2-execution-plan.md`):** #2 CLOSED (passport inspector + docs inside BOTH approval dialogs). #4 CLOSED (queue pagination + debounce; de-presigned list query also kills F6's per-keystroke presign tax and F1's expired-URL staleness). #13 CLOSED (medical tile renders via the shared preview). #14 CLOSED (operator replacement slots + atomic `DRIVER_DOCS_REPLACED` ActivityLog; D3b=audit-log-only). NEW shared infra: `drivers.presignDoc` + `admin.presignDoc` with driver-scoped namespace guards; `<DriverDocPreview>` is the single renderer. #18 remains open → immediate post-P2 i18n micro-phase (D6). D8 selfie bug (#27 candidate) still deferred to Phase 7.

## 🔴 Blockers

1. **Android crash in registration wizard** — `<div>` rendered inside the RN tree at `apps/driver-app/app/(auth)/register/index.tsx:116` ("Header Intro"). Same crash class previously fixed at earnings.tsx (P0-5) and documents.tsx (Phase 15 rider). New-driver onboarding step 1 breaks on device. One-line fix.

## 🟠 High

2. **Operator passport renders no compliance documents** — `drivers.getDriver` presigns licence front/back + medical precisely for dossier rendering (drivers.ts:588-616), but `driver-detail-view.tsx` never displays them; operators approve licences sight-unseen while F-OP-16 requires ≥1 doc to verify. Add a document inspector card (admin dialog already has the pattern incl. legacy-URI handling).
3. **No employmentType↔serviceType assignment guard** — urban contractors can be dispatched intercity and exclusives onto urban loops (zero employmentType references in trips.ts assign paths). At minimum warn dispatchers; ideally filter/rank listAssignableDrivers.
4. **Verifications queue truncates at 50** — `listDriversForVerification` called with fixed `limit:50, offset:0`, no pagination UI (admin-driver-verifications-view.tsx:54-55). Silent backlog invisibility past 50.
5. **One-active-exclusive rule lacks a DB guard** — application-enforced only in resolveAcceptance/createDriver upsert paths; no partial unique index like the offer-pair constraint. A race or direct write can produce two active exclusives.

## 🟡 Medium

6. **Passenger tracking OFF with no interim signal** — flag-gated button → honest coming-soon screen; orphan map component unwired. Cheapest honest step: authenticated `passenger.getTripTracking` poll over existing last* cache (module 12 §4).
7. **WS gateway + pub/sub fully dormant** — channels published with zero subscribers; operator fleet channel intentionally HTTP-unpublished; revival checklist open (host image, Caddy passthrough, operator credentials design).
8. **No ping retention/TTL** — ~~DriverLocationPing grows unbounded (~5.8k rows/driver-day while streaming); no pruning job anywhere.~~ FIXED: 180-day prune cron (`prune-telemetry`) + reconcile-driver-stats date-windowed to 181 days.
9. **Trip History tab is a stub** — ~~shows active trip only; completed-run history query never wired despite tab name (driver-detail-view.tsx:303-331).~~ FIXED: `trips.list` accepts `driverProfileId` filter; Trips tab renders completed trip history via `TripDriverAssignment`.
10. **Per-stop execution missing** — TripStop.actualArrival/actualDeparture written by nothing; overview-promised waypoint checklist unbuilt.
11. **routeExperience/cityBase free text** — ~~no validation, no Route linkage; matching engine roadmap; typos fragment marketplace filters.~~ FIXED: `cityBase` validated against `CIV_CITY_HUBS` enum; free-text input removed from driver-app (chips-only); `routeExperience` normalized server-side (trim + dedup).
12. **minMonthlyRateCFA collected nowhere** — ~~schema-private field with zero UI (preferences screen always sends null).~~ REMOVED: field deleted from schema, Zod, handler, and all UI references.
13. **Medical doc has no preview tile** in admin verification dialog though it gates approval.
14. **No operator-side medical-doc attach/edit post-onboarding**; updateDriver supports URLs but no UI exposes them.
15. **Shift.tripsCompleted dead field** — never incremented; reconcile covers driver-level totals only.
16. ~~passenger-review-request bypasses outbox~~ — FIXED: `finalizeTripArrival` now enqueues via `enqueuePassengerReviewRequest` outbox helper instead of direct novu.trigger.
17. **Earnings payout rail absent** — informational estimates only; placeholder rate flagged honestly; real pay model pending product decision.

## ⚪ Low / polish

18. Hardcoded English throughout operator/admin driver UIs (repo elsewhere uses i18n namespaces; fr.json parity rule violated here).
19. `respondToOffer` sets respondedAt on WITHDRAWN path semantics oddity; counter-round cap unbounded.
20. Offer creation doesn't warn on licence-class vs contract fit.
21. Boot preference-gate fails open on network error (silent skip of marketplace onboarding).
22. Adaptive telemetry cadence is cosmetic (labels only; fixed 5 s/10 m task config).
23. No bulk verification/onboarding tools; no review-assignment queue.
24. ~~Re-verification after EXPIRED has no reminder loop to operators beyond the 30-day warning notice family.~~ FIXED: `expire-driver-licenses` cron already notifies operators for both EXPIRING_SOON and EXPIRED. Driver-app EXPIRED state UI added (status.tsx). Recurring reminders and re-verification flow deferred to Phase 7.
25. Catalog hygiene: dead `drivers:assign`/`telemetry:stream` runtime consumers; document in next permissions sweep.
26. Tracking button copy says "Realtime" while destination is a status screen when flag enabled partially.

## Verified-solid (explicitly checked, no action)

- Tenancy scoping on every operator driver read/write; IDOR fixes holding.
- Offer board integrity (immutable originals, append-only events, one-active DB index, lazy-expiry parity, in-tx notices).
- Telemetry validation parity across transports; anti-evasion reference rule; daily-capped scoring with row locks.
- Assignment race safety (lock ordering + partial unique backstops + batch conflict scan sharing one pure core).
- Check-in guard pipeline + token stripping + presentation-token resolution.
- Private storage pipeline for compliance docs with reader-agnostic presigning.
- Cron coverage for offers/licenses/stats reconciliation with unified cron-auth.

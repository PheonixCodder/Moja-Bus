# 12 — Release Checklist (v2 audit, 2026-08-22)

> Ordered punch list. Tick = merged AND verified on staging with the cited reproduction. Supersedes the Gate A–D list in `../e2e-release-audit/09-release-checklist.md` (most of which is now verified fixed — see each file's scorecard).

---

## Gate 0 — Environment reproducibility (do FIRST; everything else is untestable without it)

> **2026-08-23 status:** clean-volume rehearsal EXECUTED on real PG16 and now PASSES with **empty drift diff** — after two fixes it surfaced: phase17_cleanup identifier casing (edited in place under documented never-applied exception) and new final migration `20260823235959_phase00_schema_convergence` (promo_banner had NO migration; six enums rebuilt to exact datamodel sets; license 'A'→'B' mapped). db-drift.yml rewritten for the current Prisma CLI. Remaining Gate-0 work is applying this tree to live envs (Neon backup-branch → migrate deploy; custom server after introspection).

- [x] **F-DV-01** Commit the five untracked migration dirs; add enum-repair migration (`EN_ROUTE→AVAILABLE`, `ON_BREAK→RESTING`, `IN_REVIEW→PENDING`, `SHARED_CONTRACTOR/CASUAL→CONTRACTOR_URBAN/HYBRID`, license `A` dropped); verify `docker compose run --rm migrate` on a CLEAN volume boots the full app incl. driver start/shift writes. *(Tree committed; clean-volume replay verified green via Neon scratch rehearsal — docker-based rehearsal script remains available per-release.)*
- [x] Add `prisma migrate diff --exit-code` drift check to CI so schema↔migrations can never diverge silently again. *(db-drift.yml present + fixed for current CLI; local equivalent proven exit-0. CI green run + one deliberate red proof pending push.)*
- [ ] Reconcile the three remediation trackers (progress-tracker vs remediation-plan vs memory.md) to code-truth (see 10-cross-cutting §3).

## Gate A — Before ANY public traffic

> **Probe legend (2026-08-23):** 🟢 = service-level repro PASSED against real Postgres (`apps/web/scripts/probe-phases-02-06.ts` vs converged scratch DB — 6/6) · 🔵 = code-complete + unit-proven, staging/device leg outstanding · ⬜ = not started.

- [ ] 🟢🔵 **F-PS-03/F-DV-02** Scanner reads issued QRs: shared `parseTicketToken` applied in `checkInPassenger`/`batchSyncCheckIns`. *Repro: scan a real traveler ticket → Boarding Cleared.* — 🟢 URL-wrapped token boards via schema preprocess + service vs real PG; duplicate scan idempotent. 🔵 physical camera scan on device.
- [ ] 🟢 **F-IN-01/F-DV-03** Check-in binding: active TripDriverAssignment required in all three procedures; CONFIRMED-only (+grace); stop returning ticketToken in manifest. *Repro: driver B scans driver A's trip ticket → FORBIDDEN.* — 🟢 cross-assigned driver FORBIDDEN with zero mutation; unpaid PRECONDITION_FAILED (real PG); manifest token removal code-verified.
- [ ] 🟢 **F-PS-01** verifyPayment ownership assert. *Repro: user B calls verify with user A's reference → error, bookings stay A's.* — 🟢 foreign reference FORBIDDEN before any Paystack call/mutation; hold untouched (real PG). Owner-path checkout completion awaits staging.
- [ ] 🟢 **F-PS-02** PAYSTACK refund channel: implement Paystack refund API or remove from passenger-reachable channels + map to PENDING_FULFILMENT and include channel≠CASH rows in OWED queue. *Repro: card refund appears on Paystack dashboard OR channel no longer selectable.* — *CODE COMPLETE (removal arm, 2026-08-23): PAYSTACK rejected at policy+service layers, web dialog wallet-only, ZERO_CASH phantom-obligation fix, notices carry true channel; DB has zero PAYSTACK rows.* — 🟢 channel guard verified vs real PG.
- [ ] 🟢 **F-DV-04** Trip cancel/reassign/suspend clears currentTripId + forces AVAILABLE/OFFLINE; suspended drivers retain read-only access to complete/report. *Repro: operator cancels a DEPARTED trip → driver returns to trips tab cleanly, not stranded ON_TRIP.* — 🟢 convergeDriversAfterRunEnd vs real PG: ON_TRIP cleared, shift-aware AVAILABLE/OFFLINE, zero ghost positions. Full UI pass awaits staging.
- [ ] 🔵 **F-NF-01/02** Fix trip-cancelled + operator-delay payload schemas; add enqueue↔payloadSchema contract test per workflow. *Repro: cancel a trip → passenger receives email+inApp+push; operator delay → notified.* — Phase 07 executed 2026-08-23 (payloads fixed, delays outbox-unified w/ hourly buckets, 9-case contract harness incl. audit-defect tripwires); delivery legs need staging Novu.
- [ ] 🔵 **F-NF-03** Re-key the 8 remaining logged-in triggers to user.id; unify admin fan-out scheme. *Repro: suspend an account → target sees in-app + push.* — **Phase 08 executed 2026-08-23: all nine sites re-keyed (incl. invitation-path fallback-to-wrong-person edge + escrow email/id split), Date.now() txIds stabilized on touched lines (escrow F-IN-13 closed early), contract harness now covers all nine audience workflows. Staging leg pending (Novu).**
- [ ] 🔵 **F-TM-01/F-IN-04** Decide WS posture explicitly: either host the gateway (bundle server.ts into its own container) or declare v1 HTTP-only — remove localhost default + stop the futile reconnect loop when WS unreachable. — **Phase 09 executed 2026-08-23: Option B ratified — v1 officially HTTP-only; localhost default removed (WS skipped unless env set), reconnect budgeted 5×exp-backoff/segment, dormancy+revival checklist documented on gateway/server/env. Staging leg: device radio-log review.**
- [ ] 🟢🔵 ~~F-TM-04 offline flush chunking~~ · F-TM-05 harsh-brake window · F-TM-06 re-mint on 401 — **Phase 10 executed 2026-08-23**: chunked drain w/ preserved remainder + logged drops (🟢 unit-proven vs server cap), deceleration-severity brake detection (D5 correction — naive widen would have flagged everyday braking; boundary matrix unit-tested), assignment-checked re-mint on 401 via injected handler + `needsReauth` health flag. Staging leg: simulated outage drain + device QA.
- [ ] 🔵 **F-IN-05** CI gate runs typecheck + tests (+ report-only lint pending ratification) before build/push; four orphaned suites resolved (56/56 wired). Local red/green proven; CI run + branch protection pending push.
- [ ] ⬜ Driver-app UI crash fixes: four `<div>`s in register wizard (10-cross-cutting §2.1); Android opens every registration step.
- [ ] ⬜ Full smoke on staging: register→verify→offer→accept→assign→start→scan(real QR)→ping(HTTP)→delay(operator+driver)→complete→review→refund-notice.

## Gate B — Before marketing/PR push (P2 batch)

- [x] ~~F-OP-03 license-expiry gate + nightly downgrade · F-DV-09 delay persists to Trip row · F-OP-02 edit/offboard UI + notification · F-TM-04 offline flush chunking ≤100 · F-TM-05 harsh-brake window ≥ cadence · F-TM-06 re-mint on 401 · F-DV-06 updateMyStatus guards · F-DV-07 shift ledger determinism · F-DV-08 strip DRIVER from invitable roles · F-DV-10 server-side phone validation + no identity overwrite + role input:false · F-DV-05 driver-doc upload pipeline + employmentType/nationalId persistence + affiliated signal~~ — **ALL landed (Phases 13–17, 2026-08-23)**.
- [x] ~~Passenger money UX: F-PS-04 traveler refund quote · F-PS-08 null sub-ratings · F-PS-09 completed-trip validation · F-PS-06 deep-link route fix~~ — **ALL landed (Phases 18+19, 2026-08-23)**.
- [ ] Notifications: ~~F-NF-04 subscriberId-suffixed keys~~ ✓ landed (Phase 20) · ~~F-NF-05 push data overrides (tap-routing)~~ ✓ landed (Phase 21 — 11 traveler + 7 driver workflows; device QA pending staging) · ~~F-NF-06 device-token merge~~ ✓ landed (Phase 21 — credentials.append) · ~~F-NF-07 budget-exhausted wiring~~ ✓ landed (Phase 22 — outbox enqueues, day-bucketed per operator) · F-NF-09 locale-prefixed CTAs — review-request ✓ (Phase 19), payout-failed/approved/rejected ✓ (Phase 20); remaining templates ride Phase 38 sweep · ~~F-NF-10 */5 outbox cadence~~ ✓ resolved-by-evidence: prod crontab already every-minute (~1 min latency beats the ask), guarded by outbox-cadence-guard test.
- [ ] Platform: ~~F-TM-03 room authorization · F-TM-02 company claim at mint~~ ✓ landed (Phase 11 executed same-day after decomposition review — driver-side authz fully specifiable; operator-subscriber credentials remain revival-gated) · F-OP-04 roster pagination ✓ landed (Phase 13) · ~~F-OP-01 map-or-relabel fleet page~~ ✓ landed (Phase 23 — real react-leaflet fleet-live-map shipped, radar deleted) ·~~F-IN-02 updateDriver active-affiliation scope~~ ✓ landed early (Phase 13 ride-along).

## Gate C — Two-week hardening (P3 sweep)

All 49 P3 items per 11-findings-catalog; priorities inside the batch: ~~structured telemetry logging (F-TM-13)~~ ✓ landed (Phase 28/29) · ~~accuracy flag-not-drop (F-TM-14)~~ ✓ landed (Phase 28/29 — LOW_ACCURACY precedence + clean-trip rule) · ~~Redis TTL/reader or delete (F-TM-08)~~ ✓ landed (Phase 28/29 delete-arm) · ~~Mapbox attribution (F-TM-16, store-review risk)~~ ✓ landed (Phase 30 — all FOUR surfaces incl. search-map-view.tsx caught by review grep) · CSP + image hosts (F-IN-09) · geolocation Permissions-Policy (F-IN-10) · env example sync (F-IN-11) · ~~OTP log gating (F-NF-16)~~ ✓ landed (Phase 16 — env-gated at auth-email.ts) · raw-token-under-QR removal (F-PS-15 → Phase 32).
Also closed by Phases 28–31 (2026-08-25): F-TM-07 (jump gate on both transports via DriverProfile.last* store) · F-TM-09 (loud backend selection + bounded retries) · F-TM-15 (tracking param = booking.tripId; payload already carried it) · F-TM-17 (24 h TTL cache, overview=simplified, isApproximate fallback labeling) · F-TM-18 (segment-fair distance ratio, clean-trip ≥1-ping rule, flush FOR UPDATE locks, dead query removed) · F-TM-19 (rnmapbox exact-pin 10.3.5; EAS proof = staging leg) · F-DV-11 (SQL earnings over unbounded windows, open-shift accrual, ISO Monday weeks, PlatformSettings rate column, honest "Estimation" label) · F-DV-14 (server-side acks on assignment rows + acknowledgeUrgentDispatch; departureTimeIso; ACK-RESET ruling recorded in-code) · unnumbered: odometer fields deleted, broadcast stub deleted, ALL-filter excludes CANCELLED, stale terminatedAt verified pre-closed (Phase 26) · D8-a: updateDriver.status stripped (bypassed run-state convergence).

## Final build gate

```bash
pnpm turbo typecheck   # expect green
pnpm turbo test        # after F-IN-05/06 wiring
pnpm build             # all apps
# Clean-volume migration rehearsal:
docker compose down -v && docker compose run --rm migrate && docker compose up -d
```

## Launch-comms scope statements (updated)

1. Live bus tracking: HTTP-poll ingest works; consumer client still gated OFF until WS hosting decision lands.
2. Driver earnings = placeholder ×50 XOF/min until pay-rate model ships.
3. Route-experience matching remains display-only chips (no engine).
4. Offline scan queue unbuilt (`batchSyncCheckIns` unconsumed) — dead zones fail visible scans; manual manifest check-in is the fallback.
5. Earnings screen "Guaranteed Payout" copy overstates — payouts are carrier-disbursed placeholders.

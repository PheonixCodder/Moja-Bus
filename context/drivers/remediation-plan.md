# Moja Driver System — Release Remediation Plan (Phases 16–19)

> **Source:** `e2e-release-audit/` (Phase 15 audit, 40 findings: 5×P0 · 7×P1 · 15×P2 · 13×P3)
> **Rule:** every task cites its finding ID from `08-findings-catalog-p0-p3.md`; acceptance criteria mirror `09-release-checklist.md`. No phase starts before the previous one's gate passes.
> **Execution order:** 16 → 17 → 18 → 19. Gate A must clear before ANY public traffic.

---

## Phase 16 — Critical Blockers (Gate A) 🔴

*Everything here sits on the driver's working-day critical path or the notification fabric. Target: one focused week.*

- [x] **16.1 Real telemetry identity** *(P0-1)*
  - Thread the authenticated `driverProfileId` through Start Run → `startBackgroundLocationTracking` (`driver-app/app/(tabs)/trips.tsx:67,280`); remove the `"drv_active"` fallback entirely.
  - **Accept:** mid-trip pings persist against the correct `driver_location_ping.driverProfileId`.
- [x] **16.2 Complete Run wired to backend** *(P0-2)*
  - `live.tsx handleEndTrip` calls `drivers.completeTrip`, invalidates trips/profile queries; keep local tracking-stop.
  - **Accept:** trip → ARRIVED; driver → AVAILABLE; review-request + escrow eligibility fire on a staging run.
- [x] **16.3 Novu subscriber unification to `user.id`** *(P0-3)*
  - Switch `public.getNotificationToken` + `registerPushToken` to `ctx.user.id` (`public.ts:17,42`); verify web Inbox consumer keying matches.
  - Legacy email-keyed triggers stay as-is (separate audiences).
  - **Accept:** inbox badge increments for booking-confirmed / trip-assigned / offer-received on a fresh account; push arrives on a real device.
- [x] **16.4 Exclusive-consent retry** *(P0-4)*
  - On `EXCLUSIVE_CONFLICT_REQUIRED::<companies>` show a confirm dialog listing affected companies → re-send ACCEPT with `confirmExclusiveSwitch: true` (`offers.tsx:244-263`).
  - **Accept:** second exclusive accepted in-product; old affiliation terminated + displaced operator notified.
- [x] **16.5 Earnings crash fix** *(P0-5)* — `<div>` → `<View>` at `earnings.tsx:89,96`. **Accept:** Android opens Earnings cleanly.
- [x] **16.6 Schedule `expire-offers` cron** *(P1-1)* — add to `vercel.json` (hourly acceptable); manual trigger returns 200 and flips a due offer with both-side notifications.
- [x] **16.7 Schedule `reconcile-driver-stats` cron** *(P1-2)* — nightly entry; first production run completes backfill without touching history-free drivers.
- [x] **16.8 Telemetry ingest authentication** *(P1-4)*
  - Mint short-lived dispatch token in `drivers.startTrip`; require it as WS query param + HTTP bearer on `/api/v1/telemetry/ping`; reject unknown/expired pairs.
  - **Accept:** spoofed ping rejected 401/403; legit staged run streams end-to-end.

### Gate 16
All boxes ticked on staging + `turbo typecheck` 10/10 + smoke script: register→verify→offer→accept→assign→start→ping→complete→review with zero phantom rows.

---

## Phase 17 — Security & Credential Integrity 🟠

*Closes identity/trust holes before marketing push.*

- [x] **17.1 Scope `verifyDriver` to company** *(P1-3, D1=A keep semantics)* — active-affiliation check mirroring `getDriver`/`updateDriver`; profile-level verification stays platform-wide. **Accept:** cross-company id → FORBIDDEN.
- [x] **17.2 Operator-added driver credential handoff** *(P1-7, D3=guided handoff)*
  - Server: `EXISTING_USER_BINDING_REQUIRED::<name>|<phone>|<email>|<hasProfile>` unless `confirmBinding:true` (mirrors EXCLUSIVE_CONFLICT_REQUIRED idiom); response adds `accountCreated/existingDriver/existingCompanies`.
  - UI: confirm dialog with masked identity; success = phone-OTP login instructions with copy/share. No SMS infra dependency.
  - **Accept:** no silent stranger-binding possible; operator-added driver receives login instructions.
- [x] **17.3 Stop DRIVER staff over-provisioning** *(P2-1, D2=remove entirely, D2b=UserRole.DRIVER enum)* — createDriver no longer creates Operator rows; migration soft-deletes legacy DRIVER rows and re-roles placeholder users via new `UserRole.DRIVER` value (two migrations — PG can't use a fresh enum value in its own adding tx); canonical `companyOperatorRecipients` helper excludes DRIVER, replacing drivers.ts + expire-offers-cron copies.
  - **Accept:** rostered drivers get zero ERP access and no company notifications.
- [x] **17.4 Notification workflow hygiene** *(P2-2, P2-3, 👻 ticket-share, D5/D6)*
  - Ghost fixed: `admin-staff.ts` triggers registered `staff-acceptance-alert`.
  - Bank: `operator-bank-verified/-rejected` enqueued via outbox from verifyOperator/rejectOperator (keys keyed by bankAccountId+decidedAt). ⚠️ `admin-bank-account-pending` left unwired by design: Paystack self-verifies at save, so no pending event exists — ruling pending (delete or wire at a future path).
  - Ticket-share (D6=build now): email CTA built from APP_URL + locale at trigger time; Share dialogs shipped on web tickets sheet and traveler booking detail.
- [x] **17.5 Self-cancel refund notification** *(P1-6, D7=all paths in-service)* — `enqueueBookingRefunded` inside CancellationService transaction behind `notifyRefunded` flag; trip-cancel path passes false (already notifies); guests skipped (no email on Booking).

### Gate 17
Code complete + typecheck green. Staging probes pending: IDOR probe blocked; binding-confirm flow E2E; refund notices for WALLET+CASH; driver placeholder has role DRIVER and zero ERP access. Workflow inventory clean except consciously-documented `admin-bank-account-pending`.

---

## Phase 18 — Reliability & Delivery Hardening 🟡

*Infrastructure decisions that make the system survivable under real load.*

- [x] **18.1 Outbox stale-PROCESSING reclaim** *(P2-6)* — picker also claims PROCESSING older than 15 min; accept: forced-crash simulation recovers.
- [x] **18.2 process-outbox cadence** *(P2-7)* — hourly schedule; worst-case latency ≤ ~1h.
- [x] **18.3 Assignment race safety** *(P2-8)* — bump transaction isolation / row-lock driver assignments in `assignDriver`; evaluate partial unique index for one-active-exclusive per driver.
- [x] **18.4 WS hosting decision executed** *(P1-5 part 1)* — Docker/self-host WITH gateway, OR ship v1 HTTP-only with live-tracking feature-flagged off; either way remove simulated tracking from user-facing surfaces until real consumer exists.
- [x] **18.5 Fanout & flush strategy** *(P2-10, P2-11)* — Redis subscriber relay for multi-instance, or document single-instance requirement; serverless-safe flush (direct write on HTTP path or guaranteed background flush).
- [ ] **18.6 Baseline tRPC mutation rate-limiting** *(P2-15)* — middleware floor for authenticated mutations.

### Gate 18
Load/staging pass: concurrent double-assign attempt loses cleanly; outbox survives kill -9 mid-batch; notification latency ≤ schedule bound.

---

## Phase 19 — UX Correctness & Polish Sweep 🟢

*Post-launch two-week sweep; batched by surface to minimize context switching.*

- [x] **19.1 Driver app**: delay-modal submits to `reportTripDelay` *(P3-12)*; dual-mode switcher filters query *(P3-13)*; `.env.example` for both mobile apps + fail-loud Mapbox dummy token in prod builds *(P2-14)*.
- [x] **19.2 Operator ERP**: passport header scopes affiliation to requesting company *(P2-9)*; HYBRID labels fixed in roster/detail *(P3-3)*; KPI strip uses server aggregates *(P3-4)*; marketplace card disables Send Offer for own-roster drivers *(P3-1)*.
- [x] **19.3 Offers engine**: lazy-expiry paths write audit events consistently *(P3-2)*; conflict durations derive from fare data not static fallbacks; delay-shifted departures revalidate assignments *(P3-5)*; bus-assigned migrates to outbox *(P3-6)*.
- [x] **19.4 Passenger web**: refund dialog shows service-computed amount/status *(P2-12)*; reviews gain optional driverRating input *(P3-7)*; traveler launch-time review prompt *(P2-5)*; low-balance alert on common rejection path *(P2-4)*.
- [x] **19.5 Platform housekeeping**: unified cron-auth helper everywhere *(P3-10)*; artifact cleanup (`tsc-errors.txt`, dead import, test-workflow) *(P3-11)*; ticket-token TTL enforcement decision *(P3-8)*; general tRPC rate limit if not landed in 18.6.

### Gate 19
Zero open P2/P3 items in the catalog (or consciously deferred with owner + date).

---

## Post-Launch Product Roadmap (not remediation — features)

| Item | Origin |
|---|---|
| Live-tracking consumer client + WS hosting scale-out | Audit scope statement #1 |
| Driver pay-rate model (per-affiliation rates replacing ×50/min placeholder) | `04-driver-trip-execution-telemetry.md` |
| Route-experience matching engine (terminal cities ↔ declared routes) | `02-operator-side-lifecycle.md` Flow 7 |
| Offline scan queue UI for rural check-ins (`batchSyncCheckIns` consumer) | `04-driver-trip-execution-telemetry.md` |

---

## Progress

| Phase | Status | Completed | Total |
|---|---|---|---|
| 16 — Critical Blockers | ✅ Code complete — Gate A staging run pending | 8 | 8 |
| 17 — Security & Credentials | ✅ Code complete — Gate B staging probes pending | 5 | 5 |
| 18 — Reliability Hardening | ✅ Code complete — Gate C staging pass pending | 6 | 6 |
| 19 — UX Polish Sweep | ✅ Code complete — Gate D review pending | 5 | 5 batches |

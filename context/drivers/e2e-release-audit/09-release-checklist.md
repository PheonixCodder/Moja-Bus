# 09 — Release Checklist

> Ordered punch list mapped to [08-findings](08-findings-catalog-p0-p3.md). Tick = merged AND verified on staging with the cited reproduction.

---

## Gate A — Blockers (do not deploy publicly until all ticked)

- [ ] **P0-1** Real driver identity in telemetry: pass `driverProfileId` through Start Run → `startBackgroundLocationTracking`; verify pings land on the correct `driver_location_ping.driverProfileId` mid-trip.
- [ ] **P0-2** Complete Run calls `drivers.completeTrip` (+ invalidations); verify trip → ARRIVED, driver → AVAILABLE, review-request + escrow eligibility fire.
- [ ] **P0-3** Novu identity unification to `user.id` at the three client call sites (`public.ts` getNotificationToken/registerPushToken + web Inbox consumer if separately keyed); verify inbox badge increments for booking-confirmed, trip-assigned, offer-received on a fresh test account.
- [ ] **P0-4** Exclusive-consent retry: accept flow shows company list confirm → re-sends ACCEPT with `confirmExclusiveSwitch:true`; verify old exclusive terminated + displaced operator notified.
- [ ] **P0-5** `<div>` → `<View>` in earnings.tsx; Android build opens Earnings cleanly.
- [ ] **P1-1/P1-2** Add `expire-offers` + `reconcile-driver-stats` to vercel.json; trigger manually once and confirm cron-auth 200s + rows flip/recompute.
- [ ] **P1-4** Telemetry auth: dispatch token minted at startTrip, required by WS query + HTTP bearer; spoofed ping rejected; legit run streams.

## Gate B — Trust-critical (before marketing/PR push)

- [ ] **P1-3** Scope `verifyDriver` to requesting company affiliation (or split operator-verify vs platform-verify explicitly).
- [ ] **P1-5** Decide WS hosting: self-host/Docker WITH gateway, or ship v1 as HTTP-only behind a "coming soon" tracking button; either way stop presenting simulated live tracking as real (feature-flag or relabel).
- [ ] **P1-6** Wire refund notification into self-service cancellation (reuse orphaned workflow helper).
- [ ] **P1-7** Operator-added driver credentials: invite-SMS/deep-link with setup token, or force self-registration path; add confirmation step when email/phone matches an existing user.
- [ ] **P2 batch 1**: DRIVER-role notification exclusion in `companyRecipients`; ghost/orphan workflow cleanup (admin-staff acceptance ID + three bank orphans); outbox stale-PROCESSING reclaim; process-outbox → hourly schedule.

## Gate C — Two-week hardening

- [ ] P2: assignDriver lock/isolation bump + consider one-active-exclusive DB constraint.
- [ ] P2: driver passport header scopes affiliation to requesting company.
- [ ] P2: Redis subscriber relay for multi-instance fanout OR document single-instance requirement.
- [ ] P2: serverless-safe flush (direct write on HTTP route, or background flush guarantee).
- [ ] P2: web refund amount display from service computation; low-balance alert on common path; traveler launch-time review prompt.
- [ ] P2: mobile `.env.example` files (six EXPO_PUBLIC_* vars) + fail loudly on dummy Mapbox token in prod builds.
- [ ] P2: baseline tRPC rate-limit middleware for mutations.

## Gate D — Polish / backlog (post-launch)

- [ ] All P3 items in [08-findings](08-findings-catalog-p0-p3.md): marketplace CTA state, lazy-expiry audit parity, HYBRID labels, page-scoped KPI fix, conflict-engine duration source, bus-assigned via outbox, web driverRating input, ticket-token TTL, cron-auth unification, artifact cleanup (`tsc-errors.txt`, dead imports, test-workflow), delay-modal submission, dual-mode filter wiring.

## Final Build Gate (Phase 15 close-out)

```bash
pnpm turbo typecheck   # expect 10/10, 0 errors
pnpm build             # all apps build
```

- [x] `turbo typecheck` — verified green at audit time (10/10 tasks)
- [ ] `pnpm build` full monorepo pass on release branch
- [ ] Migration dry-run on staging snapshot (21 dirs sequential)
- [ ] Secrets checklist against [07 §env table](07-security-iam-cron-audit.md)

## Known Scope Statements for Launch Comms

1. Live bus tracking: not functional in production until Gate B WS decision lands.
2. Driver earnings figures are placeholder math (×50 XOF/min) until a real rate model ships.
3. Route-experience matching is human-judgment only (chips displayed, no engine).
4. Web passenger reviews don't affect driver scores yet.

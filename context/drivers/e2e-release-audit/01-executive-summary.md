# 01 — Executive Summary

## Audit Coverage

| Domain | Auditor | Flows traced | Findings |
|---|---|---|---|
| Operator lifecycle (recruitment→offers→roster→dispatch) | Deep agent + verification | 8 flows | 13 findings |
| Passenger journey + notifications infra | Deep agent | 9 areas, 59 workflows | 13 findings |
| Driver app end-to-end | Deep agent + first-hand P0 verification | 11 flows | 5 headline P0s + partials |
| Backend infra / security / crons | Deep agent | 5 areas, 14 crons | 11 findings |

Cross-checked invariants: all four DB integrity constraints confirmed present; typecheck green; migration history clean (21 sequential dirs).

---

## What Is Genuinely Solid (verified working)

**Commercial core**
- Hold → Paystack/wallet checkout → webhook (HMAC-SHA512 verified, idempotent) → ticket issuance chain with over-sale defense and serializable transactions (`booking-confirmation-service.ts:20-136`)
- Ledger/escrow money math race-safe: advisory locks, `FOR UPDATE`, idempotency keys (`release-escrow/route.ts:195-259`)
- Refunds via operator trip-cancel notify passengers durably

**Driver marketplace & offer board (Phases 9–14)**
- Salary provably private; anti-spam caps (25 sent/20 received) inside the send transaction + DB partial unique index backstop
- Rolling 7-day expiry with claim-guard cron; Seen chips; trust badges computed-on-read
- Cross-company double-booking engine with 45-min turnaround buffer; license gate B<C<D<E; consent-gated slot replacement
- Admin feature/suspend with mandatory reason, activity log, driver notifications, featured cap

**Security fabric**
- Full tRPC procedure chain (session → role → company binding/suspension → driver profile → admin-staff liveness) + mutation Origin CSRF check
- OWNER/SUPER_ADMIN implicit-all RBAC with grant-subset enforcement; bank numbers AES-256-GCM w/ key rotation + access audit log
- Signed ticket tokens (`pt.` HMAC, 1h TTL); Paystack webhook signature verified before processing
- All shared-auth crons fail closed without `CRON_SECRET`

**Notifications plumbing**
- Transactional outbox: idempotent enqueue, exponential backoff, DEAD-lettering, admin retry UI
- 59 registered Novu workflows covering every domain event; HMAC inbox auth; Expo push registration

---

## The Five Launch Blockers (P0)

| # | Finding | Where | Impact |
|---|---|---|---|
| **P0-1** | Telemetry identity is hardcoded fallback `"drv_active"` — the Start Run call site never passes the real `driverProfileId` | `driver-app/app/(tabs)/trips.tsx:67` (call site `:280` passes nothing) | Every GPS ping persists against a phantom driver. Live tracking, safety scoring, distance — all orphaned |
| **P0-2** | "Complete Run" only stops local tracking + flips local state; **never calls `drivers.completeTrip`** | `driver-app/app/(tabs)/live.tsx:72-76` | Trips stay DEPARTED forever from the app's perspective; driver status stuck ON_TRIP; no ARRIVED trigger for review requests or escrow release |
| **P0-3** | Subscriber split-brain: clients authenticate the Novu inbox as `subscriberId = user.email` (`public.ts:17`) while nearly all server triggers/outbox payloads key `subscriberId = user.id` | `public.ts:17` vs `trips.ts:1220/1238/1335`, `booking-receipt-email.ts:86`, etc. | In-app inbox and push are dead for most notifications platform-wide (email steps still deliver). Affects travelers AND drivers |
| **P0-4** | Exclusive-switch consent dead-end: server demands `confirmExclusiveSwitch`, client shows an alert but **never retries with the flag** | `drivers.ts:2310-2326` ↔ `driver-app/app/(tabs)/offers.tsx:244-263` | A driver already exclusively affiliated elsewhere can never accept another exclusive offer through the product |
| **P0-5** | Raw `<div>` elements in React Native | `driver-app/app/(tabs)/earnings.tsx:89,96` | Red-screen crash on Android when opening Earnings |

## The Two Silent Cron Gaps (P1)

`expire-offers` and `reconcile-driver-stats` exist but are **absent from `vercel.json`** (12 scheduled vs 14 routes). Offers would never auto-expire in production; driver stats would drift indefinitely.

## Top Structural Risks Beyond Blockers

- **Telemetry ingest is unauthenticated end-to-end** (WS gateway has zero handshake validation; HTTP ping route accepts arbitrary driver IDs) — anyone can spoof GPS and poison safety scores *(P0-grade for public launch; grouped P1 in catalog because it requires the WS deployment path to exist first)*
- **The WS gateway has no production run path at all** (Vercel can't host it; Dockerfile runs Next standalone without it)
- **Operator-added drivers get no credentials** — they can't actually log in; worse, entering an existing passenger's phone/email silently binds a driver profile onto that stranger's account
- **Traveler "Track Live Bus" is a simulation wired to the wrong ID** — the real telemetry pipeline has no consumer client anywhere
- **Self-service passenger cancellation sends zero notification** (registered refund workflow has no callers)

---

## Recommended Launch Sequence

1. **Week 1 — Blockers:** fix P0-1…P0-5 + schedule the two missing crons + close the telemetry auth hole (issue per-driver tokens on trip start; verify on both ingests)
2. **Week 2 — Trust-critical P1/P2:** operator-added driver credential handoff, self-cancel notification, cross-tenant verifyDriver IDOR, ghost/orphan workflow cleanup, outbox PROCESSING-stranding guard, hourly process-outbox
3. **Then:** decide WS hosting (self-host/Docker with gateway, or accept HTTP-poll-only v1), traveler tracking consumer, remaining P2/P3 polish per [09-release-checklist.md](09-release-checklist.md)

Full evidence per finding: [08-findings-catalog-p0-p3.md](08-findings-catalog-p0-p3.md).

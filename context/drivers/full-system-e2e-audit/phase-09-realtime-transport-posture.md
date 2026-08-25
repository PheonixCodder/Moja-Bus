# Phase 09 — Realtime Transport Posture

> **Closes:** F-TM-01 ≡ F-IN-04 (P1), F-TM-10 (P3) · Evidence: `05-telemetry-and-maps.md` F-TM-01; `09-security-iam-crons-infra.md` F-IN-04.
> **Status: ✅ CODE COMPLETE 2026-08-23** — **Option B ratified and executed** (user ruling after physics/reversibility challenge): v1 transport is officially HTTP-only. Gates green (`turbo typecheck`+`test` 19/19 incl. new driver-app suite). Staging leg: verify zero futile WS attempts in device radio logs during a run.

## Decision (ratified 2026-08-23)
**Option B** — declare HTTP-only v1. Rationale recorded for posterity: zero WS consumers exist platform-wide; the producer already runs fully on authenticated, serverless-safe HTTP ingest; hosting a gateway would add container+Caddy+ops surface feeding nobody, while B's client changes are the exact precondition of a future A (reversal cost ≈ 0). Revival is explicitly gated on the live-tracking-consumer roadmap item.

## Tasks
- [x] Execute ratified option end-to-end:
      - **Server**: dormancy banners on `server.ts` + `server/telemetry-ws.ts` documenting posture and the revival checklist (`runner-ws` image or custom-server image · Caddy upgrade passthrough · Phase 11 room-authz/fleet-channel first). Files kept intact — no deletion of working code needed verbatim post-launch.
      - **Client**: `EXPO_PUBLIC_WS_URL` has NO default; unset ⇒ WS skipped entirely (one-time log), ids registered and offline queue drained over HTTP as before.
- [x] Client reconnect policy when a URL IS set (future-proofing for A): exponential backoff 5 s → 10 s → 20 s → 40 s → 60 s cap, budget of 5 attempts per trip segment (reset on segment change/successful open); after exhaustion HTTP ingest continues silently. *(Pure logic in `lib/telemetry-core.ts::nextWsBackoffMs`, unit-tested.)*
- [x] Update `.env.example`s: driver-app WS var commented out with posture explanation + pointer to the gateway revival checklist.
- [x] Coupling fix (discovered this session — without it Option B breaks offline draining): the queue flush previously triggered ONLY on WS-open. Now drains at tracking start, after every successful live ping, via a 60 s sweep while tracking is active, and on legacy WS-open. *(Landed inside Phase 10's chunked flush.)*

## Acceptance criteria
Prod topology matches documentation exactly ✓ (standalone Next = HTTP-only, documented in three places). Driver devices make zero futile WS connection attempts under Option B — *staging leg*: radio-log review during one full simulated run.

## Dependencies
Phase 00 ✓. Everything telemetry-related (10 ✓ same session, 11/23/28/29/30) builds on this decision.

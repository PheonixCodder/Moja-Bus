# Phase 11 — Gateway Authorization & Fleet Channel

> **Closes:** F-TM-02 (P2), F-TM-03 ≡ F-IN-03 (P2) · Evidence: `05-telemetry-and-maps.md` traces 1 + findings.
> **Status: ✅ CODE COMPLETE 2026-08-23** — deferral reversed after decomposition review: the original bundle conflated driver-token authz (fully specifiable now) with operator-subscriber credentials (genuinely undefined, NOT part of this phase's scope text). Driver-side scope executed in full; **operator subscriber authz remains revival-gated** as the first revival workstream alongside the consumer client. Gates green (`turbo typecheck`+`test` 19/19 · web **440/440** incl. new 8-case token/ACL suite · biome clean).
> Original findings: `telemetry-ws.ts` companyId only set in unenforced dev branch → operator channel never published; `subscribe` accepts any room + `joinRoom` has no ACL.

## Objective
The authenticated gateway leaks nothing across tenants and actually feeds the fleet channel: room membership derives exclusively from signed claims, and the operator fan-out works when a subscriber relay eventually exists.

## Tasks
- [x] Extend dispatch-token claims with company id `c`, resolved from the bound trip at mint (`trip.companyId`; both `startTrip` and `getTelemetryToken`). New `mintTelemetryDispatchTokenWithCompany`; legacy `mintTelemetryDispatchToken` retained for compatibility. `verify` accepts absent `c` (pre-Phase-11 tokens, 24 h TTL) but rejects malformed types.
- [x] Enforced mode: reject `subscribe` for any room not derivable from claims (`isRoomAllowedForClaims`: exactly `trip:${claims.t}`); company rooms granted server-side from the claim, never by client request. Dev-unenforced mode keeps permissive behavior for local testing.
- [x] Publish `operator:{claims.c}:fleet` on accepted pings (WS path) — fleet attribution now flows from the signed claim via `ws.companyId`, so the channel works under enforcement when a subscriber relay exists.
- [x] HTTP-path gap documented in-code (`ping/route.ts`): operator attribution there would cost a hot-path DB lookup per ping for a channel with zero subscribers; tokens already carry `c` for revisiting.
- [x] Tests: 8-case pure suite (`lib/__tests__/telemetry-token.test.ts`) — claim round-trip, legacy-token backward compat, malformed-`c` rejection, tamper rejection, expiry, and the full ACL matrix (own trip ✓ / foreign trip ✗ / all company rooms ✗ / claimless ✗).

## Acceptance criteria
Adversarial socket session (valid token, hostile subscribes) gets only its own trip's frames ✓ (pure-layer proven); fleet publish verified with a test subscriber *(revival-staging leg — gateway remains dormant per Phase 09 Option B)*.

## Dependencies
Phase 09 ✓ (same-day). Operator subscriber credentials + consumer client remain the revival-gated successors; Phase 23 keeps its conditional (WS consumption only if hosted AND this landed — landing is now done).


## Objective
The authenticated gateway leaks nothing across tenants and actually feeds the fleet channel: room membership derives exclusively from signed claims, and the operator fan-out works when a subscriber relay eventually exists.

## Tasks
- [ ] Extend `mintTelemetryDispatchToken` claims with company id `c` (resolved from the driver's active affiliation at mint; both `startTrip` and `getTelemetryToken`).
- [ ] Enforced mode: reject `subscribe` for any room not derivable from claims (`trip:${claims.t}`); never accept client-supplied `company:` rooms.
- [ ] Publish `operator:{claims.c}:fleet` on accepted pings (WS path); document HTTP-path gap or resolve companyId there too via token claims.
- [ ] Tests: claim-forged room join rejected; cross-trip subscribe rejected; fleet channel receives frames in enforced mode.

## Acceptance criteria
Adversarial socket session (valid token, hostile subscribes) gets only its own trip's frames; fleet publish verified with a test subscriber.

## Dependencies
After Phase 09 (gateway hosting decided — this work targets whichever host exists). Before Phase 23 (fleet map consumer).

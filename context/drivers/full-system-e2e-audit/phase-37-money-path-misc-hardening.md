# Phase 37 — Money-Path Misc Hardening

> **Closes:** F-IN-12, F-IN-13, F-IN-15 · Evidence: `09-security-iam-crons-infra.md` findings.
> `reconcile-driver-stats` uses `$queryRawUnsafe` with interpolated literals + dead computed variable (`route.ts:439-463/:465-487/:533-548`); release-escrow ops alert embeds Date.now() in dedupe key so fallback emails re-send daily (`route.ts:1048`), mid-flight proration approximate (`:971-974`); rate-limit store is per-instance in-memory, telemetry ingest unthrottled beyond token validation (`rate-limit.ts:31-41`, ping route).

## Objective
Treasury-adjacent code is query-safe, alert-dedupe honest, and scaling assumptions explicit.

## Tasks
- [ ] Convert `$queryRawUnsafe` → tagged `$queryRaw`; delete the dead variable.
- [ ] Stable escrow-alert transactionId per condition-window (e.g. holdGroupId+fallback-type+day) so repeated failures dedupe; document proration semantics for treasury sign-off.
- [ ] Rate limiting: document single-instance assumption prominently OR implement Redis-backed store (recommend documenting now, Redis at scale-out per Phase 28's Redis work); add a modest IP throttle to `/api/v1/telemetry/ping` even when token-valid (abuse cost control).

## Acceptance criteria
No unsafe raw-query patterns remain in cron code (grep); escrow fallback alerts dedupe within their window; telemetry endpoint throttled and documented.

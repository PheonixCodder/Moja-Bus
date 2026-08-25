# 07 — Security, IAM & Cron Audit

> tRPC chain · RBAC engines · telemetry ingest exposure · cron fleet (14 routes) · env gaps · data integrity

---

## tRPC Procedure Chain — **WIRED**

| Layer | Validates | Ref |
|---|---|---|
| csrfMiddleware | Origin/Host match on mutations (no-Origin bypasses by design for mobile) | `init.ts:72-91` |
| publicProcedure | CSRF only | :93 |
| protectedProcedure | Better Auth session user | :95-108 |
| operatorProcedure | role ∈ {OPERATOR, ADMIN} | :110-124 |
| operatorCompanyProcedure | live Operator row, companyId bound, not SUSPENDED, memoized | :126-166 |
| adminProcedure | role ADMIN **and** live non-suspended AdminStaff row (single gate for whole admin surface) | :168-204 |
| driverProcedure | DriverProfile + active affiliations; rejects SUSPENDED verification | :208-263 |

## RBAC Engines — **WIRED**

- Operator: catalog ~55 keys; OWNER implicit-all at runtime; ADMIN bypasses; grant-subset enforcement (`requireCanGrant`); hierarchy levels; suspension gates.
- Admin: SUPER_ADMIN implicit-all (`iam-core.ts:34` + short-circuit `admin-authorize.ts:36`); empty stored permissions fall back to role template (defense-in-depth); Phase 14 added `marketplace:read|manage`.
- DRIVER template is intentionally narrow: `trips:read, bookings:read, bookings:checkin, telemetry:stream, reviews:read` — but see P2 over-provisioning via auto-created Operator rows ([03](03-driver-registration-auth.md)).

## Telemetry Ingest — **EXPOSED (launch blocker class)**

- **WS gateway**: no token issued or verified on upgrade anywhere in the repo; query-string identity trusted (`telemetry-ws.ts:36-50`). Anyone can impersonate any driver, join any trip/company room, inject GPS.
- **HTTP fallback**: unauthenticated batch ingest (≤100 pings/call) for arbitrary drivers (`api/v1/telemetry/ping/route.ts`).
- Blast radius: poisoned safety scores (−5/−10 penalties), fake live positions, room eavesdropping.
- Validation gates themselves are correct and identical on both paths (bounds / 50 m accuracy / 200 km/h / jump velocity).
- **Recommended closure**: mint a short-lived per-trip dispatch token at `startTrip`, require it as WS query param + HTTP bearer; reject unknown pairs. ~half a day.

## Deployment Reality of the Gateway

Only runs under manual `tsx server.ts`; Vercel cannot host custom servers; Dockerfile's Next standalone build excludes the gateway. Until a self-host/Docker decision is made, production tracking would rely solely on HTTP ingest. Serverless buffer-flush hazard noted in [04](04-driver-trip-execution-telemetry.md). Cross-instance fanout broken (`redisSub` never subscribed; GEOADD mock-only).

## Cron Fleet (14 routes)

Shared auth: Bearer `CRON_SECRET`, fail-closed in prod (`cron-auth.ts`); Vercel auto-injects for same-project schedules.

| Route | Purpose | Schedule | Double-run safety |
|---|---|---|---|
| reconcile-payments | rescue stuck charges/withdrawals | daily | ✅ idempotent webhook synth |
| expire-holds | expire holds, release reservations | daily | ✅ FOR UPDATE + status guard |
| release-reservations | wallet reservations | daily | ✅ conditional-update claim |
| sweep-captures | geo-capture TTLs | daily | ✅ convergent |
| snapshot-accounts | balance snapshots | daily | ✅ upsert |
| publish-blogs | scheduled posts | daily | ✅ (⚠️ inline auth variant) |
| release-escrow | escrow ≥24h post-arrival | 01:00 | ✅ advisory lock + claim guards |
| generate-trips | rolling 14-day generation | 02:00 | ✅ unique key + P2002 swallow |
| process-referral-rewards | grants | daily | delegated service |
| promo-expiry-reminders | incentive notices | daily | delegated + deduped |
| incentive-status-sweep | credit/campaign windows | daily | naturally idempotent |
| process-outbox | Novu delivery drain | daily ⚠️ should be hourly | mostly safe; PROCESSING-stranding edge |
| **expire-offers** | offer lifecycle | ❌ NOT SCHEDULED | claim-style flip safe |
| **reconcile-driver-stats** | stats/score recompute | ❌ NOT SCHEDULED | full recompute self-healing |

**Fix**: add the last two to `vercel.json` + move process-outbox to hourly.

## Other Security Surfaces — **WIRED**

- Paystack webhook HMAC-SHA512 verified at route entry before processing; event dedupe by idempotency key.
- Signed ticket tokens `pt.<payload>.<HMAC-SHA256>`, 1h TTL, timing-safe compare, raw-token grace documented.
- Bank numbers AES-256-GCM (`enc:v1:`) with previous-key rotation; VIEW_MASKED/VIEW_FULL/create/update all audit-logged and surfaced admin-side.
- Rate limiting: Better Auth DB-backed with custom OTP rules ✓; bespoke limiter only wraps Mapbox reverse geocoding; **no general tRPC rate limit** (authenticated mutation flooding unthrottled — acceptable v1 risk, note for hardening).

## Env Var Gaps (missing from examples)

| Var | Used by | Gap |
|---|---|---|
| REDIS_URL / KV_URL | telemetry redis | ❌ both example files |
| EXPO_PUBLIC_WS_URL | driver telemetry | ❌ mobile apps ship no `.env.example` at all |
| EXPO_PUBLIC_API_URL | both mobile apps | ❌ |
| EXPO_PUBLIC_MAPBOX_TOKEN | both maps (silent dummy fallback!) | ❌ |
| EXPO_PUBLIC_POSTHOG_KEY/_HOST | traveler analytics | ❌ |
| EXPO_PUBLIC_WEB_URL | traveler referrals | ❌ |
| CHECKOUT_QUOTE_SECRET / ALLOWED_ORIGINS / OTEL_SERVICE_NAME | web lib | root example ✓, apps/web example ❌ |

Housekeeping: stale tracked `apps/web/tsc-errors.txt` (empty) → delete/gitignore; dead import `revealBankAccountNumber` in operator.ts; three divergent cron-auth implementations to unify.

## Data-Integrity Constraints — ALL CONFIRMED

One ACTIVE offer per (company,driver) partial index · assignment triple key `(tripId,driverProfileId,role)` · affiliation pair key · review-per-booking unique. Migration history clean: 21 sequential dirs, postgresql lock file, latest models present in schema.

Zero TODO/FIXME/HACK debt in driver/marketplace/dispatch code paths.

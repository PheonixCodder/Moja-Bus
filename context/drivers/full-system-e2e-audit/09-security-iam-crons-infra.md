# 09 — Security, IAM, Crons, Rate Limiting, Env & Deployment Audit

> **Audit date:** 2026-08-22 · **Method:** full read of tRPC core + RBAC engines, all 14 cron routes + both schedule sources, money/security routes (Paystack webhook, tickets verify, telemetry token, bank crypto, withdrawal 2FA), Dockerfile/compose/Caddy/CI workflow, all four `.env.example` files (+ var names only of real env files), test-runner configs and suite inventory.
> **Scope:** request pipeline · RBAC · cron fleet · rate limiting · secrets/env matrix · deployment reality · test suite map · hygiene.

---

## 1. tRPC request pipeline (per request)

```
request
 → proxy.ts (locale routing only; matcher EXCLUDES /api/** — no auth/security here) [proxy.ts:14]
 → app/api/trpc/[...trpc]/route.ts
 → createContextFromHeaders [init.ts:8-45]
     • auth.api.getSession; throw caught → console.error [init.ts:22-24]
     • Set-Cookie propagated to response headers [init.ts:31-35]
     • ctx = { prisma, user?, headers, resHeaders, _cache: Map } — per-request memoization
 → csrfMiddleware [init.ts:73-92]: MUTATIONS ONLY. Origin present + host mismatch ⇒ FORBIDDEN;
   missing Origin passes (mobile/curl by design). ALLOWED_ORIGINS not consulted at this layer.
 → publicProcedure: mutation floor limiter — 120/min per client IP [init.ts:99,102-106,125]
 → protectedProcedure: !ctx.user.id ⇒ UNAUTHORIZED; mutation floor 60/min per user [init.ts:130-145]
 → operatorProcedure: role ∈ {OPERATOR, ADMIN} else FORBIDDEN [init.ts:147-161]
 → operatorCompanyProcedure: live Operator row memoized per request; none/no companyId ⇒ FORBIDDEN;
   status === SUSPENDED ⇒ FORBIDDEN (only SUSPENDED gated) [init.ts:163-203]
 → adminProcedure: role ADMIN AND live non-suspended AdminStaff row — single gate for the admin
   surface [init.ts:205-241]
 → driverProcedure: DriverProfile by userId incl. active affiliations; none ⇒ FORBIDDEN "complete
   driver registration"; verificationStatus SUSPENDED ⇒ FORBIDDEN [init.ts:245-300]
```

Per-procedure permission layer on top: `requirePermission/requireAnyPermission/requireAllPermissions/requireCanGrant/requireOwner` (`lib/permissions/authorize.ts:34-101`); admin equivalents in `admin-authorize.ts`. Error leakage disciplined: NOT_FOUND generic; FORBIDDEN names only the missing permission key.

Suspension gates: Operator SUSPENDED blocked at procedure layer · AdminStaff SUSPENDED blocked · DriverProfile verification SUSPENDED blocked · platform USER suspension rides Better Auth session.

## 2. RBAC engine trace

- Catalogs: operator 54 keys / 13 groups (`permissions.ts:26-105`); platform 68 keys incl. `marketplace:read|manage` (`admin-permissions.ts:28-131, 74-81`).
- Implicit-all runtime bypasses: operator OWNER returns ALL keys regardless of stored list (`iam-core.ts:20-21`; `permissions.ts:134-137`); platform SUPER_ADMIN identical. Cross-surface: `operatorHasPermission` returns true for `user.role === ADMIN` (`authorize.ts:38`) — platform admins outrank company OWNERs on the operator surface by design; `adminHasPermission` requires BOTH role ADMIN **and** AdminStaff SUPER_ADMIN (`admin-authorize.ts:36`) — tighter.
- Grant-subset enforcement wired via `requireCanGrant` on invite/update paths (`staff.ts:208, 264, 598`); role assignment additionally gated by ASSIGNABLE_ROLES hierarchy maps; OWNER/SUPER_ADMIN never grantable via invite.
- ROLE_LEVELS strict-greater modification rule (OWNER 600 … DRIVER 150).
- Empty-permissions fallback: stored empty array silently regains the role's default template ("defense-in-depth", `iam-core.ts:25-33, 47-51`). Consequence: demotion-by-emptying is impossible — use role change instead.
- Narrow DRIVER template `[trips:read, bookings:read, bookings:checkin, telemetry:stream, reviews:read]` (`permissions.ts:297-303`); placeholder accounts carry `UserRole.DRIVER`, failing operatorProcedure's OPERATOR|ADMIN test — zero ERP access confirmed.
- DRIVER exclusion from company notification recipients verified consistent across offer lifecycle + crons (`company-recipients.ts:16-24`; call sites `drivers.ts:148,216,276,2809,2851`).

## 3. Cron fleet table

Auth for ALL 14 routes: shared `assertCronAuthorized` (Bearer `CRON_SECRET`, fail-closed in prod). **P3-10 FIXED — zero divergent implementations remain** (publish-blogs carries the migration note at `route.ts:348`; release-escrow uses the helper too).

Two schedule sources exist (→ F-IN-07): `apps/web/vercel.json` (non-prod reference) and `deploy/cron/crontab.template` (**the actual prod path**, docker-compose deployment).

| Route | vercel.json | Prod crontab | Double-run safety |
|---|---|---|---|
| process-outbox | hourly | every minute | atomic single-winner claim + stale PROCESSING reclaim (15 min) + claim-time attempt burn; Novu transactionId dedupe |
| expire-holds | daily | */5 min | status-guarded sweep, limit 75 |
| reconcile-payments | daily | 5-min spread | idempotent webhook replay; 5-min age floor vs webhook race |
| release-reservations | daily | 15-min spread | exactly-once `releasedAt: null` guard + atomic SQL increments |
| process-referral-rewards | daily | 15-min spread | delegated service |
| publish-blogs | daily | 15-min spread | updateMany status-guarded |
| incentive-status-sweep | daily | hourly :15 | delegated |
| **expire-offers** | **hourly ✅ (16.6)** | hourly | claim-style guard before event+notify |
| sweep-captures | daily | every 6 h | service sweep |
| release-escrow | daily 01:00 | daily 01:00 | pg_advisory_xact_lock per company + FOR UPDATE + clearedAt guards + idempotency keys |
| generate-trips | daily 02:00 | daily 02:00 | upsert window, per-schedule try/catch |
| **reconcile-driver-stats** | **02:30 daily ✅ (16.7)** | daily 02:30 | full recompute = idempotent; history-free drivers untouched |
| snapshot-accounts | daily | daily 03:30 | upsert |
| promo-expiry-reminders | daily | daily 09:00 | reminder service |

Coverage verdict: **all 14 routes scheduled in both files; no orphans, no missing schedules.** Cron container refuses boot without CRON_SECRET (entrypoint fail-closed).

## 4. Rate limiting inventory

- tRPC: public mutations 120/min/IP, authenticated mutations 60/min/user floors (**18.6 FIXED**, `init.ts:99-137`) — note `remediation-plan.md` still shows 18.6 unchecked while progress-tracker shows checked (tracker drift).
- Better Auth DB-backed limits w/ custom OTP rules ✓; bespoke limiter wraps Mapbox reverse geocoding ✓.
- Telemetry ingest has NO rate limit beyond token validation (acceptable when enforced; open in dev-no-secret mode). Store is per-instance in-memory — correct for current single-container compose, silent no-op if ever multi-replica.

## 5. Secrets/env matrix (gaps)

| Var | Issue |
|---|---|
| `TELEMETRY_TOKEN_SECRET` | works via BETTER_AUTH_SECRET fallback but absent from apps/web/.env.example AND not passed by compose.yml |
| `REDIS_URL` / `KV_URL` | read by telemetry-redis but documented NOWHERE; compose never passes them → mock always |
| `CHECKOUT_QUOTE_SECRET` | missing from apps/web/.env.production (present in root example; BETTER_AUTH_SECRET fallback exists) |
| `EXPO_PUBLIC_NOVU_APPLICATION_IDENTIFIER` | used in traveler .env.local but absent from every example |
| Hardcoded emails | `treasury@mojaride.com` hard-coded as owner-email fallback in admin.ts:308 (env-var candidate); guest temp-email scheme `@guest.mojaride.ci` functional constant |

No live `sk_live`/`pk_live` tokens anywhere in source. `.env*` properly gitignored.

## 6. Deployment reality

- **Actual prod target: Docker Compose self-hosted** via `.github/workflows/deploy.yml` (push master → typecheck gate → build/push images → SSH `docker compose run --rm migrate` → `up -d` → `/api/health` healthcheck). **Vercel is NOT in the deployment path** — `vercel.json` is a non-prod reference (Hobby tier rejects sub-daily schedules anyway).
- WS gateway unreachable in prod (standalone server.js CMD; custom `server.ts` only runs under tsx scripts) → driver-app WS dead, HTTP ping fallback carries telemetry (cross-ref F-TM-01).
- Good hygiene: standalone output + outputFileTracingRoot, serverExternalPackages pinned, non-root container, healthcheck, no baked runtime secrets, build args for NEXT_PUBLIC_*.
- Headers: Caddy adds HSTS/nosniff/referrer/XFO/Permissions-Policy but **no CSP anywhere**; `Permissions-Policy "geolocation=()"` disables browser geolocation platform-wide despite geocapture features (F-IN-10). Next image optimizer allows `hostname:"**"` (F-IN-09).
- CSRF posture: mobile clients send no Origin → pass by construction; malformed Origin throws INTERNAL instead of FORBIDDEN (minor); localhost + bare `exp://` permanently trusted in Better Auth origins even in prod.

Money-critical surfaces verified solid: Paystack raw-body HMAC webhook verification, escrow advisory-lock + claim-guard release, AES-256-GCM bank storage with key rotation + BankAccessLog audit, hashed single-use withdrawal 2FA with attempt budget + constant-time compare, fail-closed cron auth.

## 7. Test suite map

Runner: node:test via tsx. **54 test files ≈ 440 test blocks** discovered (prior claim was 340). Coverage: payments/booking money chain, search/geo/timezone, discounts/incentives, RBAC schemas, ticket-token parsing, trip generation/dates, phone libs, capture service.

**Gaps for a release gate**: drivers router procedures (verifyDriver scoping, offer state machine, check-ins) — ZERO tests · assignment conflict engine untested · driver scoring untested · telemetry validator/token untested · cron services untested in CI · **four test files orphaned from the runner** (outbox.test.ts, staff-hierarchy.test.ts, authorize.test.ts, roles-and-permissions.test.ts) · **CI runs NO tests at all** (typecheck-only gate, traveler-app excluded even from that — F-IN-05).

Run: `pnpm turbo test` / `pnpm turbo typecheck`.

## Findings

| ID | Sev | Finding | Evidence | Fix sketch |
|---|---|---|---|---|
| **F-IN-01** | **P2** | Driver check-in endpoints lack trip-assignment binding: `checkInPassenger` looks up booking by ticketToken only (schema makes tripId OPTIONAL, compared only `if (input.tripId && …)`); `manualCheckInPassenger` matches `{id, tripId}` with no assignment check; `batchSyncCheckIns` flips boardedAt for any token, empty catch. Any driver-profile holder can board passengers on OTHER companies' trips given a circulating ticket token | drivers.ts:1278-1352, 1354-1395, 1397-1420; schemas drivers.ts:244-247 | Resolve caller's active assignment for booking.tripId in all three → FORBIDDEN otherwise; make tripId required |
| F-IN-02 | P2 | `updateDriver` affiliation scope weaker than the P1-3 fix — no `isActive:true` (contrast verifyDriver): terminated-affiliation operators retain platform-wide write (license/status) over drivers now exclusive to competitors *(same root as F-OP-13)* | drivers.ts:663-668 vs 735-741 | Add isActive:true or restrict to affiliation-scoped columns |
| F-IN-03 | P2 | Telemetry WS room subscription unauthorized (duplicate record of F-TM-03 — cross-referenced) | telemetry-ws.ts:139-143, 234-236 | Claims-derived rooms only |
| F-IN-04 | P2 | Production image cannot serve telemetry WS (duplicate record of F-TM-01) | Dockerfile CMD; package.json scripts | Document HTTP-only v1 or add gateway container |
| **F-IN-05** | **P1** | CI deploys without running tests or lint: quality gate = typecheck only, traveler-app excluded even from typecheck; 440 tests exist but never gate master deploys | .github/workflows/deploy.yml | Add `pnpm turbo test` + biome check to gate (after wiring orphaned suites) |
| F-IN-06 | P2 | Four test files orphaned from runner: outbox.test.ts, staff-hierarchy.test.ts, permissions/authorize.test.ts, roles-and-permissions.test.ts not in their packages' test scripts — exact IAM/outbox guarantees can rot silently | package.json test scripts vs __tests__ dirs | Append to scripts |
| F-IN-07 | P3 | Two competing cron schedules; vercel.json dead config in a compose-deployed world | vercel.json vs deploy/cron/crontab.template; deploy.yml | Mark/delete vercel.json; unit-check route↔schedule parity |
| F-IN-08 | P3 | CSRF gaps: missing Origin allowed; malformed Origin → INTERNAL error instead of FORBIDDEN | init.ts:79-88 | try/catch URL parse; reject unknown-origin cookie-auth mutations |
| F-IN-09 | P3 | Unrestricted Next image optimizer (`hostname:"**"`) + no CSP anywhere | next.config.ts:27-32; Caddyfile | Constrain remotePatterns; baseline CSP at Caddy |
| F-IN-10 | P3 | Caddy disables browser geolocation platform-wide while product ships GPS capture/geocode | deploy/caddy/Caddyfile Permissions-Policy | Allow self |
| F-IN-11 | P3 | Env drift: TELEMETRY_TOKEN_SECRET / REDIS_URL undocumented+unpassed; CHECKOUT_QUOTE_SECRET missing from web prod env; traveler Novu identifier var absent from examples | see §5 table | Sync examples + compose passthroughs |
| F-IN-12 | P3 | reconcile-driver-stats hygiene: `$queryRawUnsafe` w/ interpolated literals (safe today), dead computed-then-voided variable | reconcile route.ts:439-463, 465-487, 533-548 | Tagged `$queryRaw`; delete dead code |
| F-IN-13 | P3 | release-escrow ops-alert embeds Date.now() in dedupe key → re-sends daily while fallback condition persists; mid-flight proration approximate | release-escrow/route.ts:1048, 971-974 | Stable transactionId; document proration |
| F-IN-14 | P3 | Artifact residue *(prior P3-11 PARTIAL)*: FIXED — test-workflow deleted, tsc-errors.txt gone, scratch empty. REMAINING — tracked junk `scripts/count-issues-output.txt` (UTF-16 mojibake committed); local logs untracked; orphan vitest-style setup file w/ no vitest installed | apps/web/scripts/count-issues-output.txt; \_\_tests\_\_/setup/security-setup.ts | Delete tracked junk; wire or remove setup |
| F-IN-15 | P3 | In-memory rate-limit store fine for single-container, silent no-op multi-replica; telemetry ingest rate-unlimited beyond token check | rate-limit.ts:31-41; init.ts:96-98 | Redis store if scaling; keep dev-open documented |
| F-IN-16 | P3 | Better Auth trustedOrigins permanently includes localhost + bare exp:// even in production | auth-server.ts:14-39 | Gate localhost entries behind NODE_ENV |

---

## Prior-findings scorecard (this domain)

| Prior ID | State |
|---|---|
| 16.6 expire-offers schedule | ✅ FIXED (both schedule files) |
| 16.7 reconcile-driver-stats schedule | ✅ FIXED |
| 18.6 tRPC rate limiting | ✅ FIXED (tracker docs disagree — drift noted) |
| P3-10 cron-auth unification | ✅ FIXED — single shared helper, zero inline variants |
| P1-3 verifyDriver scoping | ✅ FIXED for verifyDriver; 🟡 partially regressed for updateDriver (F-IN-02/F-OP-13) |
| P3-11 artifact cleanup | 🟡 PARTIAL (F-IN-14) |
| 19.5 ticket-token TTL ruling | ✅ DECIDED — pt. HMAC 1h TTL enforced; raw ≥16-char grace until departure accepted v1 risk (documented at tickets/verify/route.ts:6-14) |

**Severity roll-up:** P1×1 · P2×4 (two cross-recorded with F-TM/F-OP domains) · P3×10.

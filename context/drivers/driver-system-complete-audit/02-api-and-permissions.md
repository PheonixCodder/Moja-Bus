# 02 — API Surface & Permission Model (drivers domain)

> Audit date: 2026-08-26 · Sources: `apps/web/trpc/routers/drivers.ts` (3,860 l), `apps/web/trpc/init.ts`, `apps/web/trpc/routers/_app.ts`.

## 1. Router mounting

`driversRouter` is mounted as `drivers` in `appRouter` (`_app.ts:32`). Driver-related procedures also live in: `trips` (`assignDriver`/`unassignDriver`, Phase 12 hardening), `admin` (`listDriversForVerification`, `verifyDriver` admin twin, marketplace controls, offers audit browser — see 03/05), `public` (`registerPushToken`/`getNotificationToken`, subscriber = `user.id`), `storage` (driver doc upload purposes). No other router writes driver models (verified by grep of routers for `driverProfile.` usage).

## 2. Procedure middleware stack (`init.ts`)

Every procedure chains: CSRF origin check on mutations (`csrfMiddleware`, `init.ts:80-94`; policy in `lib/mutation-origin.ts`) → rate limit → auth layer.

| Base | Guards | Rate limit |
|---|---|---|
| `publicProcedure` | CSRF | 120 mutations/min per IP (`init.ts:101`) |
| `protectedProcedure` | session required | +60 mutations/min per user (`:102-105,142`) |
| `operatorProcedure` | role OPERATOR or ADMIN (`:152-166`) | inherited |
| `operatorCompanyProcedure` | live `Operator` row (deletedAt null, latest joinedAt), company resolved to ctx.companyId, SUSPENDED blocked (`:168-208`); operator profile cached per request | inherited |
| `adminProcedure` | role ADMIN **and** live non-suspended AdminStaff row (`:210-246`) — closes the "role without staff row" hole from the staff audit; per-procedure IAM keys via `requireAdminPermission` (e.g. Phase 25's `drivers:verify.read|manage`, `marketplace:read|manage`) | inherited |
| `driverProcedure` | loads DriverProfile 1:1 by userId into ctx.driver (`loadDriverProfile`, `:254-301`) then the run-state policy gate below | inherited |

### driverProcedure runtime policy (`init.ts:303-349`) — the single source of truth
- SUSPENDED drivers: read-only. All queries allowed EXCEPT `getTelemetryToken` + `getMyUrgentDispatches` (capability grants stay sealed). Every mutation refused.
- Non-VERIFIED (PENDING/REJECTED/EXPIRED): full reads + never-strand exceptions — may still call `completeTrip` and `reportTripDelay` mid-run, but `startTrip` and `toggleShift` are denied (`NON_VERIFIED_DENIED_MUTATIONS`).
- Marketplace suspension (`servicePreference.isSuspended`) deliberately does NOT affect app access (F-DV-15 note).

## 3. Operator-side procedures (`drivers.ts`)

| Procedure | Perm key | Behaviour highlights |
|---|---|---|
| `getPermissions` (:369) | — | UI gating flags; `canAssign` backed by `trips:update` (F-OP-15 fix) |
| `listDrivers` (:383) | `drivers:read` | Active-affiliation scope; filters status/verification/employmentType/licenseCategory/search(name,email,phone,licence); KPI groupBy under SAME filters (P3-4); paginated |
| `getDriver` (:500) | `drivers:read` | First-match affiliation scope (NOT_FOUND if not affiliated); P2-9 affiliation scoping; presigned GETs for the 3 compliance docs (:588-616); recent reviews+shifts scoped to company |
| `createDriver` (:627) | `drivers:create` | Operator adds a driver — see 04-roster module |
| `updateDriver` (:811) | `drivers:update` | Active-affiliation check; profile fields + affiliation employmentType/badgeNumber/notes; **`status` stripped** (Phase 31 D8-a) |
| `verifyDriver` (:889) | `drivers:verify` | Active-roster guard (P1-3 IDOR fix); VERIFIED requires ≥1 compliance doc (F-OP-16); owns operational state machine transitions (SUSPEND→teardown, REJECT→OFFLINE, restore→AVAILABLE); sets verifiedAt/ById + per-company isVerified |
| `deleteDriverAffiliation` (:999) | `drivers:delete` | Soft-offboard; CONFLICT if currentTripId (mid-run guard, F-OP-02); atomic offboard + `enqueueDriverRosterRemoved` notice in-tx |
| `getAvailableDriversForTrip` (:1089) | `drivers:read` | Simple eligible list (status AVAILABLE/ON_DUTY/OFFLINE, VERIFIED), rating-sorted (legacy; dispatch board uses listAssignableDrivers) |
| `getLivePositions` (:1119) | `drivers:read` | ON_TRIP/ON_DUTY drivers with non-null last coords; returns last* cache + currentTrip {id, serviceType, status, bus plate}. **This single query IS the operator live map's data feed** (10 s poll — see 11-operator-fleet-map) |
| `getPublicDriverProfile` (:2460) | `drivers:read` | VERIFIED-only public card; conditional redaction when off-market/suspended (F-OP-10): name+verification only, contact/history nulled; `isOnMyRoster` flag drives Send-Offer CTA disable; trustBadges computed on read |
| `listMarketplaceDrivers` (:2584) | `drivers:read` | Filters licenseCategory/preferredType/cityBase/minRating/minSafetyScore; excludes own exclusive affiliations; featured-first ordering; raw affiliation rows replaced with boolean `isOnMyRoster` (P3-1); salary excluded everywhere |
| `getDriverAnalytics` (:2701) | `drivers:read` | 12-month rating trend + star distribution ($queryRawUnsafe, parameterized) + last 20 OVERSPEED/HARSH_BRAKING anomalies → Insights charts |
| `listAssignableDrivers` (:3082) | `drivers:read` | Dispatch eligibility engine — see 07-dispatch module |
| `sendEmploymentOffer` (:2805) | `drivers:create` | Serializable-tx offer creation; guards: VERIFIED + available + not already rostered + anti-spam caps + one-active-per-pair (P2002→CONFLICT); SENT event + `enqueueDriverOfferReceived` in-tx |
| `listSentOffers` (:3564) | `drivers:read` | Lazy-expiry sweep first (`expireOfferIfDue`), Seen chips via firstViewedAt, counter review data |
| `respondToCounterOffer` (:3651) | `drivers:update` | ACCEPT_COUNTER (runs full acceptance resolution incl. exclusive-conflict teardown) / DECLINE_COUNTER / COUNTER_BACK (+7d refresh); all notify driver via outbox |
| `withdrawOffer` (:3799) | `drivers:create` | PENDING/COUNTERED only; WITHDRAWN event + driver notice |

## 4. Driver-side procedures (`drivers.ts`)

Self-service lifecycle: `getMyProfile`, `getMyVerificationStatus` (**protectedProcedure** — reachable pre-profile, boot gate), `registerDriver` (protectedProcedure — any logged-in user can self-register; see 03), `updateMyStatus` (restricted matrix — see 09), `setServicePreference`/`getMyServicePreference`, earnings (`getMyEarnings`, `getMyShifts`, `getMyCurrentShift`).

Trips & execution: `getMyTrips` (filters TODAY/UPCOMING/COMPLETED/ALL + optional serviceType dual-mode filter P3-13; ALL excludes CANCELLED), `getMyTripDetail`, `getMyTripManifest` (no durable ticketTokens leave the server — F-IN-01), `checkInPassenger`/`manualCheckInPassenger`/`batchSyncCheckIns` (DriverCheckInService — see 08), `startTrip` (mints telemetry token — see 10), `getTelemetryToken` (re-mint path), `completeTrip` (DEPARTED→ARRIVED only; finalizeTripArrival parity — see 08), `reportTripDelay` (5-min throttle via synthetic anomaly row :1971-1987; mirrors operator delay formula; conflict revalidation + passenger fan-out — see 08).

Dispatch awareness: `getMyUrgentDispatches` (<2h window URGENT_DISPATCH_WINDOW_HOURS, 15-min just-departed grace, licence-through-arrival filter, deterministic order, take 5) + `acknowledgeUrgentDispatch` (persists ack on assignment row).

Offers inbox: `getMyOffers` (lazy expiry sweep first; timeline events included), `markMyOffersSeen` (firstViewedAt + VIEWED events batch), `respondToOffer` (ACCEPT with server-enforced `EXCLUSIVE_CONFLICT_REQUIRED::<names>` consent gate / DECLINE / COUNTER with rolling expiry).

## 5. Shared helpers worth knowing

- `expireOfferIfDue` (`:141-202`): lazy expiry == cron parity (status flip + EXPIRED event + both-side outbox notices).
- `resolveAcceptance` (`:210-327`): one-active-exclusive enforcement + affiliation upsert (re-hire safe) + AFFILIATION_CREATED event + hiring-company notifications.
- Masking helpers `maskName`/`maskIdentifier` (`:110-128`) for structured binding/conflict errors.
- Outbox enqueue family lives in `features/notifications/outbox/driver-offers.ts` + `dispatch.ts` + `commercial.ts` — all enqueued INSIDE their transactions.

## 6. Observations

- Permission keys actually enforced: `drivers:read/create/update/delete/verify` + `trips:update` (assignment). The advertised `drivers:assign` key is dead (F-OP-15); catalog keys `company:*`-style drift documented in the staff audit.
- Structured error protocol (parseable `CODE::payload` strings: `EXISTING_USER_BINDING_REQUIRED`, `AMBIGUOUS_BINDING`, `EXCLUSIVE_CONFLICT_REQUIRED`, `PHONE_REVERIFICATION_REQUIRED`) is a pragmatic client-contract idiom used consistently across registration and offers.
- `getDriverAnalytics` uses `$queryRawUnsafe` but with bound parameters only (safe); repo-wide `$queryRawUnsafe` was audited to zero in remediation.
- Verified absences: no tRPC procedure ingests GPS pings (HTTP route + dormant WS gateway only); no subscription/live procedures anywhere in the router set; no driver-facing document-upload mutation (uploads go through `storage` purposes, URLs passed as fields).

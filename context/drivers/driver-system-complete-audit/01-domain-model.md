# 01 — Domain Model & Data Architecture (Driver System)

> Audit date: 2026-08-26 · Source: `packages/db/prisma/schema.prisma` (all line refs below are into that file unless noted).

## 1. Identity spine

| Model | Table | Role |
|---|---|---|
| `User.role = DRIVER` | `user` | App-side identity only, **never ERP access** (`schema.prisma:16-22`). Distinct from `StaffRole.DRIVER` (`:207`) which exists on `Operator` rows for staff directories but is excluded from invite flows (`INVITABLE_STAFF_ROLES`, Phase 17 D2). |
| `DriverProfile` | `driver_profile` | Lifetime portable career identity, 1:1 with `User` (`:2280-2340`). Survives company changes; companies can never delete it (only their affiliation row). |
| `Operator` | `operator` | ERP staff membership. **Deliberately NOT created for roster drivers** (Phase 17 D2; legacy DRIVER Operator rows soft-deleted by migration `20260822000001`). |

## 2. Professional credentials (on `DriverProfile`, `:2285-2297`)

- `licenseNumber` — **globally unique** (`@unique`, `:2286`) → a licence can exist on only one profile platform-wide. Uniqueness conflicts surface as CONFLICT errors in both `drivers.createDriver` (`drivers.ts:731-741`) and `drivers.registerDriver` (`drivers.ts:1257-1267`).
- `licenseCategory B|C|D|E` (`:258-263`, CI ordering B<C<D<E) — checked against `BusType.requiredLicenseCategory` (`:1247-1249`) at assignment/start via `licenseMeetsRequirement` (@moja/schemas).
- `licenseExpiryDate` — gated at shift-start/trip-start/assignment against **estimatedArrival**, not "now" (Phase 14 F-DV-15 ruling, `isLicenseUsableThrough`). Nightly `expire-driver-licenses` cron flips VERIFIED→EXPIRED.
- Documents: `licenseFrontUrl`, `licenseBackUrl`, `medicalDocUrl` — private storage object keys (`documents/…`) swapped for presigned GETs at read time (`drivers.getDriver`, `drivers.ts:588-616`); legacy `file://`/http values pass through and render as missing.
- `medicalClearanceDate`, `yearsOfExperience`, `nationalIdNumber` (Phase 15 F-DV-05 — collected by wizard, previously dropped).
- Verification block: `verificationStatus PENDING|VERIFIED|REJECTED|EXPIRED|SUSPENDED` (`:244-250`), `verifiedAt`, `verifiedById → User("DriverVerifiedBy")`, `rejectionReason`.

## 3. Live operational state (on `DriverProfile`, `:2306-2313`)

- `status OFFLINE|AVAILABLE|ON_DUTY|ON_TRIP|RESTING|SUSPENDED` (`:235-242`).
- `currentTripId` / `currentTrip` ("DriverCurrentTrip", SetNull) — the single source of "mid-run".
- Telemetry cache columns: `lastPingAt`, `lastLatitude`, `lastLongitude`, `lastHeading`, `lastSpeedKmh`. Written ONLY by the flush pipeline for *good-reference* fixes (`server/telemetry-flush.ts:175-203`); double as the shared Haversine jump-gate reference store (`server/telemetry-prev-point.ts:60-84`).
- Career aggregates: `averageRating`, `totalReviews`, `totalTripsCompleted`, `totalDistanceKm`, `safetyScore` (default 100, floor 0, −20/day catastrophe cap) — mutated by ping flush penalties, trip completion (+1 trip), review submission (rating recompute), and the nightly `reconcile-driver-stats` full recompute.

## 4. Company relationship models

### DriverCompanyAffiliation (`:2343-2364`)
- Unique `(driverProfileId, companyId)`; `employmentType EXCLUSIVE_INTERCITY|CONTRACTOR_URBAN|HYBRID`; `isActive`; `isVerified` (per-company mirror of platform verification, set by `verifyDriver` updateMany `drivers.ts:983-991`); `badgeNumber`, `hiredAt`, `terminatedAt`, `notes`.
- Platform invariant: **one active EXCLUSIVE_INTERCITY affiliation at a time**; urban contractors may hold many affiliations simultaneously (project-overview decision table, 2026-08-21). Enforced in `resolveAcceptance` (`drivers.ts:230-271`: conflicting exclusives auto-terminated with `EXCLUSIVE_ENDED` audit events + notifications to displaced operators). NOTE: no DB partial unique index backs this rule — it is application-enforced only (see gap register).
- Termination semantics: soft (`isActive:false` + `terminatedAt`). Rehire clears markers (`createDriver` upsert update branch, `drivers.ts:778-787`; offer path sets `terminatedAt:null`, `drivers.ts:290-296`).

### TripDriverAssignment (`:2366-2391`)
- Junction with `role PRIMARY|RELIEF|CONDUCTOR` (free string, default PRIMARY), unique `(tripId, driverProfileId, role)`; `assignedByStaffId`; duty segment `startStopOrder/endStopOrder/distanceKm`.
- Phase 31 F-DV-14: `urgentDispatchAckAt` — server-side ack grain = **driver×trip×role** row; survives reinstalls/re-logins.
- This row is ALSO the check-in tenancy proof (`DriverCheckInService.assertBoardable` requires an active assignment) and the telemetry identity anchor (dispatch token minted per trip).

### DriverShift (`:2418-2436`)
- Duty ledger: `companyId`, `startedAt/endedAt/totalMinutes`, `serviceType INTERCITY|URBAN`, `tripsCompleted`.
- Exactly one open shift per driver enforced by partial unique index (migration `20260824000001`) + `toggleShift` checks (`drivers.ts:2211-2220`); clock-off binds to resolved companyId (`:2240-2277`).
- Earnings source: `getMyEarnings` aggregates shift minutes over unbounded history (raw SQL FILTER clauses; open shifts accrue live) × `PlatformSettings.driverPayRateXofPerMinute` placeholder rate (`drivers.ts:2305-2376`).

## 5. Marketplace & offers models

### DriverServicePreference (`:2440-2474`)
- 1:1 with profile. `isAvailableForHire` (explicit toggle, never auto-flipped — comment at `drivers.ts:2416-2420`), `preferredType` (mirrors employment enum), free-text `cityBase`, `routeExperience String[]` (**free-text route strings**, e.g. "Abidjan–Bouaké" — no FK to Route; see gap register), private `minMonthlyRateCFA` (never selected in any operator-facing query — verified in `getPublicDriverProfile` `drivers.ts:2502-2512` and `listMarketplaceDrivers` `:2654-2663`), `bio`, admin flags `isFeatured`, `isSuspended` (marketplace suspension ≠ verification suspension).
- Indexes `[isAvailableForHire, preferredType]`, `[cityBase]`.

### DriverEmploymentOffer (`:2480-2523`) + DriverOfferEvent (`:2528-2547`)
- Immutable originals (`initial*`) vs current effective terms (`current*`); status machine `PENDING → COUNTERED ⇄ … → ACCEPTED|DECLINED|EXPIRED|WITHDRAWN`; rolling 7-day `expiresAt` refreshed on every counter (`addDays(now, OFFER_EXPIRY_DAYS)`, `drivers.ts:3532`).
- One ACTIVE offer per pair: DB **partial unique index** (migration SQL, referenced `:2517-2518`) + P2002→CONFLICT mapping (`drivers.ts:2951-2962`) + anti-spam caps `MAX_ACTIVE_SENT_OFFERS_PER_COMPANY` / `MAX_ACTIVE_RECEIVED_OFFERS_PER_DRIVER` (`:2860-2886`).
- Trust signals: `firstViewedAt`, `respondedAt`, `resolvedAt`. Append-only event log carries actorType COMPANY|DRIVER|SYSTEM + terms snapshots — powers timeline UI, disputes, admin analytics.

## 6. Trip integration

- `Trip.driverId`/`reliefDriverId` FKs ("TripAssignedDriver"/"TripReliefDriver", SetNull) — denormalized primary/relief pointers used by dispatch board & conflict engine; `activeForDrivers` back-relation "DriverCurrentTrip".
- `Trip.serviceType` snapshot (`:1584-1586`) frozen at generation — search + dual-mode UI filter on it instead of re-deriving geometry.
- `Review.driverId` multi-dimensional ratings (`:2151-2157`, driver/bus/punctuality sub-ratings, operator response fields L11).

## 7. Telemetry model

`DriverLocationPing` (`:2393-2416`): lat/lng/heading/speedKmh/accuracyMeters/altitudeMeters, `isAnomaly`/`anomalyReason` (OVERSPEED, HARSH_BRAKING, LOW_ACCURACY, DELAY_<reason> synthetic incidents), `recordedAt`; indexes `(tripId, recordedAt)` and `(driverProfileId, recordedAt)`. Trip FK SetNull (ping history survives schedule deletion/archival). No retention/TTL mechanism anywhere (see gap register).

## 8. Observed strengths

- Clean separation: platform verification (profile-level) vs per-company affiliation state vs marketplace availability — three independent axes, each with its own owner.
- Offer negotiation has immutable originals + append-only events + DB-level one-active constraint: dispute-grade by construction.
- Telemetry cache columns serve triple duty (live map payload, jump-gate reference, freshness) with a documented good-fix-only write rule.

## 9. Weaknesses / gaps (detail in 17-gap-register.md)

1. One-active-exclusive rule is app-code only — no DB guard; direct writes or races outside `resolveAcceptance` can violate it.
2. `routeExperience` is unstructured free text; no linkage to actual Route entities (matching engine explicitly roadmap).
3. `TripDriverAssignment.role` is an unconstrained string, not an enum.
4. No retention policy on `DriverLocationPing` (unbounded growth at ~12 pings/min/driver).
5. `DriverProfile.safetyScore`/aggregates are eventually-consistent caches without versioning; reconcile job is the only repair path.

# 16 — Security & Permission Posture (driver domain)

> Audit date: 2026-08-26 · Sources: `init.ts`, `packages/schemas/src/permissions.ts`, router guards, telemetry token/throttle libs, storage purposes.

## 1. IAM keys actually enforced (operator catalog)

`drivers:read` · `drivers:create` · `drivers:update` · `drivers:delete` · `drivers:verify` — plus assignment behind `trips:update`. Admin side: `drivers:verify.read|manage`, `marketplace:read|manage` via `requireAdminPermission` (Phase 25; ADMIN role template seeded so the empty-permissions fallback can't strip hubs). Dead/advisory key: `drivers:assign` advertised in catalog + templates but no procedure checks it (F-OP-15 corrected the UI advertisement to trips:update); `telemetry:stream` exists as a catalog key with no runtime consumer (ingestion auth is token-based instead).

Role templates grant drivers:* to OWNER/ADMIN/MANAGER/DISPATCHER subsets per lines 227-302 of permissions.ts.

## 2. Tenancy boundaries (verified)

- Every operator driver query filters through `companyAffiliations.some({companyId, isActive})`; single-driver reads use findFirst on affiliation scope → cross-company id yields NOT_FOUND/FORBIDDEN (P1-3 closed).
- Writes (update/verify/delete-affiliation) require ACTIVE roster membership.
- Marketplace queries exclude own exclusive affiliations and redact off-market profiles.
- Admin surface gated by live non-suspended AdminStaff row + per-procedure keys (the old role-only hole from the staff audit is closed at adminProcedure level).

## 3. Driver self-service authorization

- Session → 1:1 DriverProfile resolution (`loadDriverProfile`); no driverId ever accepted from client bodies for identity.
- Run-state policy gate denies mutations to SUSPENDED (read-only, capability reads sealed) and start/shift actions to non-VERIFIED (never-strand exceptions documented).
- Telemetry ingest: HMAC dispatch tokens minted server-side at startTrip/re-mint; claims pin driver+trip+company; spoofed ids rejected; enforcement toggle for staged rollout; tiered throttling (IP pre-gate before crypto, then per-driver ceiling keyed on verified identity).
- Check-in tenancy via assignment rows; ticket tokens never leave server; presentation tokens resolve server-side.

## 4. Input safety

Zod everywhere (@moja/schemas shared between web + both apps); structured error protocol strings are parsed client-side but never interpolated into HTML; raw SQL usage is `$queryRaw` tagged or parameterized `$queryRawUnsafe` only (repo-wide unsafe grep = zero, remediation-audited); CSRF origin middleware on all mutations w/ native-app no-Origin bypass documented; baseline mutation rate limits (120/min public IP, 60/min user) under tighter per-endpoint limiters.

## 5. Privacy

Driver salary field never leaves driver-owned surfaces (verified selects). Off-market public-profile redaction. Compliance docs private + presigned-at-render. Manifest strips durable ticket tokens. PII masking helpers on binding/conflict errors.

## 6. Residual risks / observations

1. Operator-side verify writes NO audit log row (admin path does).
2. Placeholder user accounts created by operators have role DRIVER + operator-chosen email — email uniqueness means a typo'd email could bind a stranger's future signup path into a DRIVER-role account (mitigated by AMBIGUOUS_BINDING/binding-confirm flows; residual risk = operator malice, acceptable).
3. `getMyVerificationStatus` is protectedProcedure (any logged-in user can poll their own status) — correct, but returns licence number/category to the caller; self-only data, fine.
4. WS revival checklist includes operator subscriber credentials as an OPEN design item until then no consumer attack surface exists.
5. Rate-limit stores are in-memory per-instance (documented; swap to Redis if replicas appear).

# 03 — Driver Registration (Both Paths), Auth & Status Machine Audit

> **Audit date:** 2026-08-22 · **Method:** full read of `trpc/routers/drivers.ts` (3,150 lines), `packages/schemas/src/drivers.ts`, Better Auth server config + OTP hook + route handler, tRPC init gates, all driver-related migrations, cross-checked against the wizard store/payloads in `apps/driver-app`. Every claim cites `file:line`.
> **Scope:** self-registration wizard vs operator-added path field-by-field · OTP auth · placeholder accounts · status machine (every writer).

---

## Registration data-map — Path A: driver self-registration (`registerDriver`, drivers.ts:949-1033)

| Wizard field | Sent? | Schema field | DB target | Verdict |
|---|---|---|---|---|
| fullName | ✅ :49 | min2 max100 | `user.fullName` (overwrite :981) | Stored |
| phone | ✅ :50 | min6, **no format check** | `user.phoneNumber` (overwrite :982) | Stored **unverified** → F-DV-10 |
| profileSelfieUri → selfieUrl | ✅ :58 | plain string, no `.url()` | `user.image` (:983) | Raw device URI (`file://`/`ph://`) — **no upload pipeline** → F-DV-05 |
| yearsOfExperience | ✅ :57 | int 0..60 default 1 | `yearsOfExperience` | Stored |
| licenseNumber / category / expiry | ✅ :51-53 | unique; enum B/C/D/E; `z.coerce.date()` (past accepted) | license columns | Stored; expiry never compared to now anywhere → F-DV-12 |
| licenseFront/BackUri | ✅ :54-55 | plain strings | `licenseFrontUrl/BackUrl` (:994-995) | Raw `file://` URIs persisted → F-DV-05 |
| medicalDocUri | ✅ :59 | plain string | `medicalDocUrl` (:997) | Raw URI → F-DV-05 |
| **nationalIdNumber** | ❌ never sent | **absent from schema** | column exists only on Operator (schema.prisma:774) | Collected at step 3, silently dropped — no storage target exists |
| **employmentType** (chosen step 4) | ❌ never sent | **absent from schema** | affiliation hardcoded `"EXCLUSIVE_INTERCITY"` (:1020) | Silent drop → every self-reg invite affiliation is EXCLUSIVE_INTERCITY regardless of choice |
| carrierCode → carrierInviteCode | ✅ :60 | trim optional | drives affiliation create (:1016-1024) | Match by company slug/id, status ACTIVE (:1005-1013); **no match ⇒ silent zero-affiliation account** — response gives no signal (:1028-1032) |

Other server behaviors: existing DriverProfile → CONFLICT (:953-962); duplicate license platform-wide → CONFLICT (:965-975); no phone/email dedupe vs other users — binds to the authenticated user and overwrites its identity fields (:978-985); UserRole untouched (self-registering TRAVELER stays TRAVELER — inconsistency, not a break since gates key on DriverProfile existence); defaults PENDING/OFFLINE (:998-999); **no Operator row created** (Phase 17 D2 correct).

## Path B: operator-added (`createDriver`, drivers.ts:508-656)

Dedupe by lowercased email OR exact phone incl. active affiliations (:516-533); structured conflict `EXISTING_USER_BINDING_REQUIRED::<masked>` unless `confirmBinding` (:535-546) — client parses into confirm dialog (`add-driver-modal.tsx:35, 92-119`). Fresh user gets role **DRIVER** placeholder (:554-561) — kept out of ERP by procedure gates. Profile created once; existing-profile case silently ignores input license data (:579-612); PENDING/OFFLINE defaults; affiliation upsert re-hire-safe but the update branch does NOT clear stale `terminatedAt` (:631-638). **No credentials minted server-side** — the modal shows phone-OTP instructions for the operator to relay manually (`add-driver-modal.tsx:127, 167-180`). No Operator row (:641-643). Response includes `accountCreated/existingDriver/existingCompanies` (:645-655).

## Auth trace (Better Auth)

- Server config `auth-server.ts`: prisma adapter; email+password disabled; session 30 d / refresh 7 d; cookieCache disabled with Expo rationale (:105-114); DB rate limits `/phone-number/send-otp` 3/min, verify 5/min (:115-124); trusted origins include `driver-app://`, `traveler-app://`, `exp://`, localhost (:13-39); `phoneNumber({sendOTP})` delegates to Novu `auth-otp` w/ temp email `<phone>@guest.mojaride.ci` (:281-289); `role` additionalField **input:true** (:146-150).
- OTP delivery logs the plaintext code to console (`auth-email.ts:22`); if Novu unconfigured the OTP is generated/stored but never deliverable (:26-29).
- Mobile session: SecureStore cookie jar injected per request (`driver-app/lib/trpc.tsx:43-48`), one retry after cookie refresh on 401 (:69-72), Set-Cookie sync (:74), 4-min keepalive interval.
- SUSPENDED block: `driverProcedure` FORBIDDENs on verificationStatus SUSPENDED (`init.ts:286-291`) — context-level block of every driver call. REJECTED/PENDING/EXPIRED do **not** block (→ F-DV-15).
- Placeholder accounts (role=DRIVER): fail operatorProcedure (role gate) AND adminProcedure (role + live AdminStaff row); grep confirms zero procedures key off role DRIVER — verified zero ERP access.
- **+225 lock is client-only** (`login.tsx:30-33` prepends; no server validation anywhere) → F-DV-10.

## Status machine — every write site of DriverProfile.status

| Value | Writers |
|---|---|
| OFFLINE | DB default; createDriver :609; registerDriver :999; toggleShift(false) :1829-1832; admin APPROVE→AVAILABLE/REJECT→OFFLINE/SUSPEND→SUSPENDED (admin.ts:2884-2909); updateDriver may set ANY value (:693) |
| ON_DUTY | toggleShift(true) :1798-1801 (creates shift row first) |
| ON_TRIP | startTrip :1468-1474 (+currentTripId) |
| AVAILABLE | completeTrip :1570-1577 (+currentTripId null, trips++); admin APPROVE |
| RESTING | updateMyStatus only :1035-1045 |
| SUSPENDED (status) | admin verify action only — note this does NOT gate driverProcedure (that checks verificationStatus) |

Dead/unreachable: `verificationStatus EXPIRED` written nowhere; committed enum values EN_ROUTE/ON_BREAK/IN_REVIEW exist in no code path (part of **F-DV-01**); no cron/procedure compares licenseExpiryDate (**F-DV-12**); updateMyStatus has NO transition guards — OFFLINE/RESTING allowed mid-run, ON_DUTY without any shift row (**F-DV-06**).

## Findings

| ID | Sev | Finding | Evidence | Fix sketch |
|---|---|---|---|---|
| **F-DV-01** | **P0** | Migration tree cannot reproduce the DB the code assumes: baseline migration creates `DriverStatus('OFFLINE','AVAILABLE','EN_ROUTE','ON_BREAK','SUSPENDED')`, `DriverVerificationStatus(...'IN_REVIEW')`, `DriverEmploymentType(...'SHARED_CONTRACTOR','CASUAL')`, `LicenseCategory 'A'..'E'` — while schema+code use ON_DUTY/ON_TRIP/RESTING, EXPIRED, CONTRACTOR_URBAN/HYBRID, B..E. No ALTER TYPE ever amends them, and the phase09/11/12/17_user_role_driver_enum/18/17_cleanup migration dirs are **untracked in git**. A clean-environment `migrate deploy` rejects every ON_TRIP/ON_DUTY write and lacks service-preference/offer tables entirely — the whole driver backend fails on fresh deploy while working only on this machine's drifted dev DB | migrations/20260821000000/migration.sql:15-40 vs schema.prisma:229-255; git status shows `??` on five migration dirs | Commit the untracked migrations; add a repair migration altering the four enums (CASE-migrate legacy values); add `prisma migrate diff` drift check to CI |
| F-DV-05 | P2 | Self-registration silently discards employmentType + nationalIdNumber and stores device-local photo URIs as document URLs; S3 purpose registry has NO driver-document purpose (storage/purposes.ts:22-28) so there's no upload path at all — verification dialogs render broken images for every self-registered driver (unverifiable in practice); unmatched invite codes yield silent zero-affiliation accounts that later die at toggleShift ("No affiliated carrier company") with no submit-time signal | carrier.tsx:47-61; schemas/drivers.ts:214-228; drivers.ts:983,994-997,:1016-1024,:1780-1785 | Driver-doc upload purpose + presign flow in wizard; persist employmentType/nationalId (new column); return `affiliated:boolean` |
| F-DV-06 | P2 | updateMyStatus is an ungated side door around the whole machine: any of OFFLINE/AVAILABLE/ON_DUTY/RESTING with no checks vs shift ledger/currentTripId — mid-run driver can set RESTING (bus vanishes from ops live view while trip stays DEPARTED) or claim ON_DUTY with no ledger row | drivers.ts:1035-1045; schemas/drivers.ts:230-233 | Forbid transitions while currentTripId set; require open shift for ON_DUTY |
| F-DV-08 | P2 | Staff-invite surface can resurrect the Phase-17-deleted DRIVER Operator rows: StaffRole still contains DRIVER with template perms; server validation accepts full StaffRoleSchema (only UI lists omit it) — a crafted call re-creates exactly the over-provisioned row migration 20260822000001 deletes | permissions.ts:9-20, 297-318; features/operator/lib/validations/staff.ts:11,30,66 | Server-side refine rejecting "DRIVER" in invitable/assignable roles |
| F-DV-10 | P2 | Identity/phone hygiene: +225 lock client-only (server accepts any ≥6-char string); registerDriver overwrites session user's canonical fullName/phone/image from unverified input (breaks operator-path dedupe, enables repointing binding toward someone else's number); OTP plaintext logged; role additionalField client-writable | login.tsx:30-33; drivers.ts:978-985; auth-email.ts:22; auth-server.ts:146-150 | Server E.164 +225 validation; drop/re-OTP the phone overwrite; remove log; role input:false |
| F-DV-12 | P3 | *(also filed under trip-execution)* License expiry stored/displayed/never enforced; EXPIRED dead — expired-license drivers remain assignable indefinitely | grep: display-only uses | Nightly cron downgrade + eligibility exclusion |

## Prior-findings scorecard (this domain)

| Prior ID | State |
|---|---|
| P0-1 telemetry identity | ✅ FIXED (startTrip response threads driverProfileId + token) |
| P0-4 exclusive-consent retry | ✅ FIXED (client parses error, re-mutates w/ confirmExclusiveSwitch) |
| 17.2 binding confirmation | ✅ FIXED end-to-end |
| 17.3 DRIVER over-provisioning | ✅ FIXED (but staff-invite loophole remains — F-DV-08) |
| P1-7 credential handoff | ✅ FIXED as designed (instructions UI, no SMS dependency) |

**Severity roll-up:** P0×1 · P2×4 · P3×1 (+cross-domain F-DV-12).

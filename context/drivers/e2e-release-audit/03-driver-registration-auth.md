# 03 — Driver Registration & Auth Audit

> Two entry paths into the same DriverProfile identity · OTP auth · boot gate · status machine

---

## Path A — Self-Registration Wizard (driver-app) — **WIRED**

Five steps, state in `stores/driver-registration.ts` Zustand draft store:

| Step | Screen | Data collected |
|---|---|---|
| 1 | `register/index.tsx` | Full name, demographics, profile selfie (camera capture) — pre-populated from active session phone |
| 2 | `register/license.tsx` | License class (B/C/D/E), license number, expiry, front/back photo capture |
| 3 | `register/documents.tsx` | National ID number, optional medical fitness certificate upload |
| 4 | `register/carrier.tsx` | Employment model (EXCLUSIVE_INTERCITY / CONTRACTOR_URBAN / HYBRID), optional carrier invite code → `registerDriver` mutation |
| 5 | `register/status.tsx` | Live compliance polling (PENDING/VERIFIED/REJECTED) with dashboard unlock on VERIFIED |

- `registerDriver` (`drivers.ts:430+`) creates the User + DriverProfile (`PENDING`) and matches `carrierInviteCode` against operator invitations when supplied.
- Post-verification: Phase 9 preference gate (`app/index.tsx` fail-open check → `(auth)/preferences.tsx`) collects city hub, employment type, route experience, availability; skip saves a safe default so the gate never repeats.

## Path B — Operator-Added Driver — **PARTIAL / HAZARDOUS**

- `add-driver-modal.tsx` → `createDriver`: creates/uses a User by email-or-phone match, DriverProfile PENDING, active affiliation, **auto-created Operator row (role DRIVER)**.
- **No credentials are ever issued** — no password, no magic link, no SMS code, nothing displayed. A driver onboarded this way cannot log in unless they self-register with the same phone number, at which point OTP lands them inside the operator-created account.
- Silent-binding hazard: entering an existing *passenger's* phone/email attaches a DriverProfile to that stranger's account with zero confirmation.
- The auto-created Operator row grants the DRIVER permission template (`trips:read`, `bookings:read`, `bookings:checkin`, `telemetry:stream`, `reviews:read`) and satisfies the OPERATOR-role gate for dashboards — over-provisioned relative to intent.

## Authentication — **WIRED**

- Passwordless Phone OTP via Better Auth (`authClient.phoneNumber.sendOtp/verify`), 6-digit input, CI-locked dial code (+225), i18n fr-first.
- Sessions handled by Better Auth cookie model shared with web; refresh tokens separate table.
- Boot sequence `app/index.tsx`: cold-start session probe → login redirect if absent → service-preference existence probe → tabs (fail-open on error).

## Status Machine — **WIRED** (transitions mapped)

| State | Set by | Notes |
|---|---|---|
| OFFLINE | default; driver toggle | |
| AVAILABLE | `updateMyStatus`; `completeTrip` resets to it | |
| ON_DUTY | `toggleShift(true)` (`drivers.ts:1390`) | shift ledger opens |
| ON_TRIP | `startTrip` (`drivers.ts:1252`) | guards currentTripId |
| RESTING | `updateMyStatus` UI option | |
| SUSPENDED | platform verification action | blocks all `driverProcedure` calls at the context level |

Dead states: none observed; every set has a clear path out. ⚠️ But see P0-2 (Complete Run never fires) which strands drivers in ON_TRIP in practice.

## Trips Visibility — **WIRED**

- `getMyTrips` reads `TripDriverAssignment` junction (so dispatch assignments surface automatically); TODAY/UPCOMING/COMPLETED windows computed server-side; 30s polling added in Phase 12.
- Dual-mode INTERCITY/URBAN switcher exists in UI but does not filter the query (cosmetic).
- Past trips + per-trip reviews: COMPLETED tab lists ARRIVED runs; career stats/reviews aggregate on Passport screen.

## Gaps specific to this file's scope

1. **P0-4** Exclusive-consent dead-end on accept (retry missing) — full entry in [08-findings](08-findings-catalog-p0-p3.md).
2. **P2** No credential handoff for operator-added drivers (+ silent account binding).
3. **P2** Auto-created Operator rows over-provision + cause drivers to receive company notifications.
4. **P3** Dual-mode switcher is cosmetic only.

# Phase 14 — Dispatch Eligibility Gates

> **Closes:** F-OP-03 (P2), F-DV-12 (P3), F-DV-15 (P3), F-IN-02 ≡ F-OP-13 (P2) · Evidence: `02-operator-admin-lifecycle.md`, `03-driver-registration-auth.md`, `04-driver-trip-execution.md`, `09-security-iam-crons-infra.md`.
> **Status: ✅ CODE COMPLETE 2026-08-23** — executed same-day as 15/16/17; gates green (`turbo typecheck`+`test` **19/19** · web 440 · driver-app 10 · schemas 86 incl. new licence-gate suite · biome clean). F-IN-02 landed early as the Phase-13 ride-along. Staging legs: backdate a licence → assignment combobox greys w/ reason; nightly flip + single notification.
> **D1 corrected during challenge**: gates compare licence validity against **trip `estimatedArrival`**, not "now" — a Monday assignment for a Sunday run must fail at the combobox, not dead-block at Start Run on Saturday night.

## Tasks
- [x] Trip-aware expiry gate in `assignDriver` (after the class gate): `isLicenseUsableThrough(licenceExpiryDate, estimatedArrival ?? departureDate)` → explicit BAD_REQUEST naming both dates.
- [x] `listAssignableDrivers.licenseOk` = class fit AND valid-through-run (combobox greys with the existing ineligible-reason UX).
- [x] Urgent-dispatch feed drops runs the driver cannot legally complete (row-level filter vs each trip's arrival).
- [x] `startTrip`: `canOperateRuns(verificationStatus)` + valid-through-run gate. `toggleShift(onDuty)`: same, vs today. **In-flight operations stay ungated** — complete/report never strand a driver whose licence lapsed mid-route (Phase 06 invariant).
- [x] Nightly cron `expire-driver-licenses` (02:15, registered in BOTH schedule sources): flips VERIFIED→EXPIRED once (re-guarded updateMany), notices driver + active-roster operators via outbox (`driver-license-status` workflow, fr-first; EXPIRING_SOON deduped by month-bucket transactionId — no warned-state column).
- [x] Runtime policy documented at `init.ts` driverProcedure: only VERIFIED operates; PENDING/REJECTED/EXPIRED lose `{startTrip, toggleShift}`, keep reads + in-flight completions; marketplace-suspend deliberately separate.
- [x] Expiry badges: shared `LicenseExpiryBadge` (amber ≤30 d / red expired) on roster rows + passport header; pure `licenseExpiryStatus` boundary-tested (≤30 d is EXPIRING_SOON — off-by-one caught by test).
- [x] ~~updateDriver active-affiliation~~ ✓ landed Phase 13.

## Tests
`packages/schemas/src/__tests__/license-gate.test.ts`: trip-end trap (valid-today/lapses-before-arrival → false), exact-day boundary, null-expiry allowed (legacy rows never locked out), badge boundaries, operate-policy matrix.

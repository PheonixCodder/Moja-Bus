# Phase 16 — Driver-Domain Server Guardrails

> **Closes:** F-DV-06, F-DV-08, F-DV-10 (P2×3), F-NF-16 (P3) · Evidence: `03-driver-registration-auth.md`, `08-notifications-novu-outbox.md`.
> **Status: ✅ CODE COMPLETE 2026-08-23** — all four guards landed; gates green (19/19 · web 440 · driver-app 10 · schemas 86 · biome clean). Staging legs: mid-run status change → rejected; crafted staff-invite with role DRIVER → validation error; foreign-format phone rejected at registration.
> **D3 corrected during challenge**: names/avatars are self-owned and overwrite freely; only the canonical PHONE is gated. Caller audit found ZERO `updateMyStatus` consumers in the driver app, so the strict matrix breaks no UI.

## Objective
Small server-side guard set closing identity and state-machine side doors.

## Tasks
- [x] `updateMyStatus` state machine (F-DV-06) — one authority per transition:
      `currentTripId` set → reject everything (Phase 06 convergence owns the state); open shift → reject (only `toggleShift` may change status — kills ledgerless ON_DUTY and silent shift-abandonment); idle+shiftless → OFFLINE/RESTING/AVAILABLE free, ON_DUTY refused with "use the duty toggle".
- [x] DRIVER stripped from ERP-staff invites server-side (F-DV-08) — `INVITABLE_STAFF_ROLES` exported from `@moja/schemas`; invite + role-update schemas parse through it, RoleSheet/InviteSheet share the same constant (UI can no longer drift from the server). Distinction preserved in comments/tests: OPERATIONS→DRIVER trip *assignment* stays legal; only ERP *membership* is blocked.
- [x] Identity hygiene (F-DV-10): server-side validation via `lib/phone` (`getPhoneValidationError` + E.164 normalize, "+225" default); name/avatar overwrite freely; phone writes only when empty or matching, else structured `PHONE_REVERIFICATION_REQUIRED::<masked>::<masked>` which the wizard parses into an honest alert. Full OTP-change flow filed as follow-up.
- [x] Better Auth `role` additionalField `input:false` — signup payload can no longer set the platform role (verified nothing legitimate did).
- [x] OTP console log gated: non-production only (`LOG_OTP=false` opts out in dev).

## Tests
Licence-gate suite covers `canOperateRuns`; guard matrix is procedure-level (staging probes above). Invite-schema exclusion is compile-time via the narrowed enum.

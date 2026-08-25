# Phase 25 — Admin Governance & Profile Privacy

> **Closes:** F-OP-09 (P3), F-OP-10 (P3) · Evidence: `02-operator-admin-lifecycle.md` findings.
> `admin.verifyDriver`/`listDriversForVerification` behind bare `adminProcedure` (`init.ts:205-233`), no activity log, no driver notification despite dialog copy claiming "Displayed to Driver" (`driver-verification-dialog.tsx:226`); `getPublicDriverProfile` gates only on VERIFIED (`drivers.ts:1985-2030`) — suspended drivers stay contactable.
> **Status: ✅ CODE COMPLETE 2026-08-25** — executed across two sessions; the first session's direct-`novu.trigger` transport and unconditional redaction were found defective on review and reworked this session. Gates green: schemas tsc ✓ · web tsc ✓ · turbo test 9/9 (web **461/461**) · biome clean on new lines. Staging legs: junior admin without keys → hub hidden + FORBIDDEN; suspend → driver receives in-app+email; stale id of off-market driver → redacted payload.

## Objective
Platform driver verification is governed like marketplace controls already are (Phase 14 parity), and off-market/suspended profiles disappear from operator reach.

## Tasks
- [x] Add admin permission keys (e.g. `drivers:verify.read|manage`) + `requireAdminPermission` on both procedures; gate the sidebar entry.
      *(Keys in the `admin-permissions.ts` catalog; both hub procedures gated; sidebar item carries `permission:"drivers:verify.read"`. DEVIATION-RULING: keys also seeded into the ADMIN role template — without that, the empty-permissions fallback resolved to a template lacking the keys and EVERY non-SUPER_ADMIN admin would lose the hub at deploy. Template-backed staff keep access; explicit-grant-list staff still need individual grants; custom roles simply omit.)*
- [x] Write `adminStaffActivityLog` rows on approve/reject/suspend with reason.
      *(action `DRIVER_VERIFY_{ACTION}` with reason + metadata + targetUserId — written INSIDE the flip transaction, stronger than the marketplace precedent which logs post-hoc.)*
- [x] New outbox workflow(s) notifying the driver of verification outcome incl. rejection reason.
      *(`driver-verification-outcome` workflow — fr-first in-app + email, no push per Phase 21's time-criticality precedent; payload schema exported as const. Transport = durable OUTBOX (`DRIVER_VERIFICATION_OUTCOME`, `enqueueDriverVerificationOutcome`) enqueued INSIDE the flip tx — the first session's direct `novu.trigger` + try/catch was the exact F-NF/F-PS-14 defect class and was replaced. Day-bucketed-per-action txId: SUSPEND→RESTORE→SUSPEND same day fires both suspend notices (actions differ); only identical same-day repeats dedupe. Contract-harness row added (3 samples).)*
- [x] `getPublicDriverProfile`: require `isAvailableForHire && !isSuspended`; return redacted shape otherwise.
      *(Conditional redaction via shared `PublicDriverProfileView` type — redacted branch nulls contact/history/hire fields keeping name+verification state; full branch restores phoneNumber + computed isOnMyRoster + trustBadges. First session shipped this UNCONDITIONALLY (every profile contact-less, isOnMyRoster hardcoded false regressing Phase 24 F-OP-06, trustBadges silently deleted behind an `as any`) — reworked this session. Sheet gains an "Off Market" disabled CTA state when servicePreference is null. No NOT_FOUND: stale links see why contact stopped.)*

## Acceptance criteria
Junior admin without keys cannot flip verification; every action leaves an audit row and notifies the driver; a suspended driver's id yields no contact data to operators.

## Dependencies
Phase 14 (eligibility semantics), Phase 07 harness for the new workflow contract test.

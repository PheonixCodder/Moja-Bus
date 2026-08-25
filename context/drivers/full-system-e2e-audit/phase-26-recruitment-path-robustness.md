# Phase 26 — Recruitment Path Robustness

> **Closes:** F-OP-11 (P3), F-OP-12 (P3), F-OP-16 (P3) · Evidence: `02-operator-admin-lifecycle.md` findings.
> unassignDriver blocked only post-DEPARTURE (`trips.ts:1810-1815`) so ARRIVED/CANCELLED history is rewriteable; createDriver non-transactional with OR-match ambiguity (`drivers.ts:554-639`, `:516-521`); add-driver modal collects no documents (`add-driver-modal.tsx:201-351`) making operator self-verification a rubber stamp.
> **Status: ✅ CODE COMPLETE 2026-08-25** — D6 landed in the first session (server) and this session (client); D5/D7 executed this session. Gates green (schemas tsc · web tsc · turbo test 9/9, web 461/461). Staging legs: mid-failure recruitment leaves zero orphan rows; ambiguous email/phone shows the two-account dialog; document-less APPROVE refused on BOTH verify paths.

## Objective
Recruitment writes are atomic and unambiguous, completed runs are immutable, and operator-added drivers arrive verifiable.

## Tasks
- [x] `unassignDriver`: restrict allowed trip statuses to SCHEDULED/DELAYED/BOARDING (match assignDriver); system-driven removals go through Phase 06's convergence path instead.
      *(DEPARTED keeps its dedicated "cancel instead" message; ARRIVED/CANCELLED now refused too — assignment history immutable post-run.)*
- [x] Wrap `createDriver` in `$transaction`; make dedupe matching consistent (email AND phone checked separately; masked confirm payload reports BOTH matched identities when they differ).
      *(First session, server side complete: user+profile+affiliation in ONE tx; separate email/phone lookups; `AMBIGUOUS_BINDING::<maskedEmail>::<maskedPhone>` CONFLICT when they resolve to different users; rehire branch clears stale terminatedAt. This session: client dialog parses AMBIGUOUS_BINDING into an honest two-account panel — deliberately NO confirm path, because auto-resolving would silently pick one account; the operator corrects a field instead.)*
- [x] Surface document upload in `add-driver-modal` using the Phase 15 storage purposes (license front/back minimum) or block VERIFY until documents exist — pick per UX review, document.
      *(BOTH halves shipped. Modal uploads licence front/back through `storage.presignUpload` with the Phase 15 private purposes — SCOPING RULING: keys land under the uploading OPERATOR's user namespace since purposes are caller-scoped and the driver account doesn't exist yet; safe because dossier rendering presigns server-side reader-agnostic (same pattern as operator onboarding's `pending/<id>` keys). Server gate on BOTH verify paths: APPROVE with zero compliance docs → PRECONDITION_FAILED (REJECT/SUSPEND stay available so legacy document-less entries can be cleaned up); admin Approve button disabled with tooltip until docs exist. SCHEMA FIX surfaced by this work: createDriverSchema/updateDriverSchema demanded `.url()` while Phase 15 stores bare object keys (`documents/…`) — any key-based doc reference would have failed validation; new shared `driverDocReferenceSchema` accepts keys or https URLs and still rejects device-local file:// URIs.)*
- [ ] Tests: mid-failure leaves no orphan user; ambiguous match shows full picture in confirm dialog; verify blocked without docs under chosen policy.
      *(Procedure-level — staging probes per checklist; no tRPC harness exists in web tests, consistent with Phases 03/06/13 precedent. Schema-level validation covered by typecheck + the driverDocReferenceSchema contract.)*

## Acceptance criteria
Completed trips keep their assignment history; partial recruitment failures strand nothing; operator-added dossiers have images in the verification hubs.

## Dependencies
Phases 06 (removal semantics) + 15 (storage purposes exist).

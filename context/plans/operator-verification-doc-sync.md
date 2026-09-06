# Implementation Plan — Operator Verification ↔ Document Status Sync

Last updated: 2026-09-06

## What we are building

Close the split-brain between **company approval** (`Company.status = ACTIVE`) and **compliance document status** (`CompanyDocument.status` stuck at `PENDING`). When an admin approves an operator, current required documents are bulk-approved in the same transaction; operator Compliance / HealthScore / verification-drawer progress then complete. Existing ACTIVE/VERIFIED companies are backfilled.

## Language we agreed on

- **Approved operator**: `Company.status` is `ACTIVE` (or `VERIFIED`) — sidebar “Active”, dashboard “Verified operator”.
- **Document approved**: a `CompanyDocument` row with `status === "APPROVED"`.
- **Docs / registration progress**: HealthScore + verification-drawer checklist driven by required docs being `APPROVED`.
- **Admin checklist**: `CompanyVerification` flags — kept in sync on approve, not the sole source of truth for operator UI.

## Decisions made

- **On company approve**: bulk-approve all **current** (`isCurrent: true`, not superseded) **required** documents → `APPROVED` with `reviewedById` / `reviewedAt`.
- **Do not** require a new per-doc approve UI for v1.
- **Optional docs** (e.g. insurance): left as-is (usually `PENDING`) unless they are in the required set.

## Assumptions (defaults — override if wrong)

1. **Required doc set (unified to 3)** — matches `completeOnboarding`:
   - `BUSINESS_REGISTRATION_CERTIFICATE`
   - `TAX_CLEARANCE_CERTIFICATE`
   - `TRANSPORT_OPERATING_PERMIT`
2. **Backfill**: one-shot script for companies already `ACTIVE` or `VERIFIED` with pending required docs.
3. **Checklist sync**: on approve, upsert `CompanyVerification` with `documentsVerified` + `permitVerified` (+ `bankVerified`) true.
4. **`VERIFIED` vs `ACTIVE`**: leave approve writing `ACTIVE` (current behavior).
5. **Reject path**: unchanged — docs stay `PENDING` unless separately rejected later.
6. **Re-upload after approve**: new uploads still start as `PENDING` (expected; HealthScore may reopen until re-approved — acceptable for v1; company stays ACTIVE).

## How to build it

1. Export a shared `REQUIRED_OPERATOR_DOCUMENT_TYPES` constant (schemas or `company-status.ts`) and use it in:
   - `getDocumentsVerificationState` / `areRequiredDocumentsApproved`
   - `completeOnboarding` required-docs check
   - `verifyOperator` bulk-approve filter
   - HealthScore / verification drawer (via existing helpers)
2. In `admin.verifyOperator` transaction:
   - `companyDocument.updateMany` (current + required types + not already `APPROVED`/`REJECTED`? → approve `PENDING` and optionally leave `REJECTED` alone) → set `APPROVED`, `reviewedById`, `reviewedAt`
   - Upsert `CompanyVerification` flags
3. Add `apps/web/scripts/backfill-approved-operator-documents.ts` (or under packages/db scripts) to approve pending required docs for `ACTIVE`/`VERIFIED` companies.
4. Harden `verification-pipeline` legal-docs cell to use `getDocumentsVerificationState` instead of `some(APPROVED)`.
5. Unit/integration-style test covering verifyOperator document side-effect (or pure helper + router test if harness exists).
6. `graphify update .` after code changes.

## Out of scope (v1)

- Per-document approve/reject admin UI
- Auto-downgrade company from ACTIVE when docs deleted/replaced
- Changing notification payloads

## Acceptance criteria

- [x] Approve pending operator → company ACTIVE, bank verified, required current docs APPROVED
- [x] Operator Compliance badges for those docs show APPROVED (via document status sync)
- [x] HealthScore hides at 100% when profile + bank + required docs ok
- [x] Verification drawer docs + review steps complete for ACTIVE companies
- [x] Backfill script fixes existing ACTIVE companies with PENDING required docs
- [x] Typecheck green on touched packages
- [x] Unit tests for `getDocumentsVerificationState` + `approveRequiredOperatorDocuments`

## Follow-up for deploy

```bash
pnpm --filter web tsx scripts/backfill-approved-operator-documents.ts
```

Run once against each environment that already has ACTIVE/VERIFIED operators with PENDING required docs.

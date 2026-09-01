# Workflow Audit: Compliance Documents & Verification

## 1. Workflow Architecture & Approval Gates

Audits:
1. Operator Verification: `VerifyDriverDialog.tsx` $\rightarrow$ `drivers.verifyDriver`.
2. Admin Verification: `admin-driver-verifications-view.tsx` $\rightarrow$ `admin.verifyDriver`.
3. Nightly Expiration: `/api/cron/expire-driver-licenses`.

---

## 2. Identified Verification Defects

### 2.1 Rejection Outbox Notice Missing in Operator Verification
* **Location**: `apps/web/trpc/routers/drivers.ts#L1080-L1130`.
* **Problem**: While `admin.verifyDriver` correctly enqueues `driver-verification-outcome` notices on rejection via `enqueueDriverVerificationOutcome`, `drivers.verifyDriver` (the operator procedure) updates the database row but **does not enqueue an outbox notice**, leaving the driver unaware of the rejection until they manually open the app.
* **Fix**: Call `enqueueDriverVerificationOutcome` inside `drivers.verifyDriver` when `verificationStatus === "REJECTED"`.

### 2.2 Presigned Document URL Expiration on Open Modal
* **Location**: `apps/web/features/driver/components/driver-doc-preview.tsx`.
* **Problem**: Presigned download URLs are generated with a 15-minute TTL. If an operator leaves the verification dialog open for $>15$ minutes while cross-checking paper records, attempting to zoom in on a document image returns `403 Forbidden` from S3.
* **Fix**: Refresh presigned URLs on user interaction or generate with a 1-hour TTL for compliance review sessions.

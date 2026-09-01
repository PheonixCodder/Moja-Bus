# Workflow Audit: Driver Onboarding & Registration

## 1. Workflow Architecture & Steps

This workflow audits the two pathways for driver onboarding:
1. **Self-Registration (Mobile)**: `apps/driver-app/app/(auth)/register/*` $\rightarrow$ `drivers.registerDriver`.
2. **Operator Roster Onboarding (Web)**: `apps/web/features/operator/components/drivers/add-driver-modal.tsx` $\rightarrow$ `drivers.createDriver`.

---

## 2. Deep-Dive Findings & Edge Cases

### 2.1 Ambiguous Binding Error Parsing Fragility
* **Location**: `apps/web/features/operator/components/drivers/add-driver-modal.tsx#L153-L175`.
* **Issue**: When phone and email match two different accounts, the server throws `AMBIGUOUS_BINDING::{maskedEmail}::{maskedPhone}`. The client relies on string splitting (`message.split("::")`) rather than structured TRPC error data shapes. If an unexpected format occurs, the UI crashes or displays raw delimited strings.
* **Fix**: Use structured tRPC error extensions `{ code: "CONFLICT", data: { reason: "AMBIGUOUS_BINDING", maskedEmail, maskedPhone } }`.

### 2.2 S3 Presigned Upload Stalled Retries
* **Location**: `apps/driver-app/stores/driver-registration.ts`.
* **Issue**: If an upload of a 5MB license photo times out over slow 2G connections, the wizard draft retains the local `file://` URI and fails silently when submitting `drivers.registerDriver` because the expected `objectKey` is empty.
* **Fix**: Implement automatic exponential backoff retry on presigned PUT uploads and display an inline progress bar.

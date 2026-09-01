# Engineering Audit: API Contracts & Zod Validation

## 1. Zod Validation Contracts

Contracts reside in `packages/schemas/src/drivers.ts`.

---

## 2. API Contract Defects & Gaps

### 2.1 Missing National ID Format Validation
* **Location**: `packages/schemas/src/drivers.ts#L305`.
* **Contract**: `nationalIdNumber: z.string().optional()`.
* **Problem**: Does not enforce Côte d'Ivoire CNI format (e.g. `CI-XXXXXXXXXX` or 10-digit numeric). Malformed strings enter the database unflagged.
* **Fix**: Add regex refinement: `.regex(/^(CI-)?[0-9A-Z]{8,12}$/i, "Invalid National ID format")`.

### 2.2 Unused Schema Definition `driverLocationPingBatchSchema`
* **Location**: `packages/schemas/src/drivers.ts#L254-L260`.
* **Problem**: Schema is defined in shared package but not imported or used by `/api/v1/telemetry/ping`, which uses an ad-hoc inline schema.

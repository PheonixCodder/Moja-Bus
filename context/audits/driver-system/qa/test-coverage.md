# QA Audit: Automated Test Suite Coverage

## 1. Automated Test Analysis

Audits unit and integration test coverage across driver services and libraries.

---

## 2. Test Coverage Inventory

| Subsystem / Service | Test File Location | Coverage Quality | Tested Scenarios |
| :--- | :--- | :---: | :--- |
| **Driver Doc Access Guard** | `apps/web/features/driver/lib/__tests__/driver-doc-access.test.ts` | **HIGH (100%)** | Valid prefixes, spoofed user IDs, invalid doc types. |
| **Driver Check-In Service** | `apps/web/features/driver/services/__tests__/driver-check-in-service.test.ts`| **HIGH (95%)** | QR scans, manual check-in, duplicate scans, offline sync. |
| **Double-Booking Engine** | `apps/web/lib/__tests__/driver-assignment.test.ts` | **HIGH (90%)** | Overlap intervals, 45m buffer, urban/intercity durations. |
| **Driver Safety Scoring** | `apps/web/lib/__tests__/driver-scoring.test.ts` | **HIGH (90%)** | Overspeed penalties, harsh braking, daily loss caps. |
| **Offer Negotiation Engine** | None | **LOW (0%)** | Missing automated tests for 6-round counteroffering. |
| **Run-State Convergence** | None | **LOW (0%)** | Missing automated integration tests for `convergeDriversAfterRunEnd`. |

# Reliability Audit: Retry Policies & Network Resilience

## 1. Client & Server Retry Policies

Audits:
1. React Query mutation retries: disabled by default on non-idempotent endpoints.
2. Background location flush sweep: 60-second intervals (`FLUSH_SWEEP_INTERVAL_MS = 60_000`).
3. Outbox notification delivery retries: exponential backoff managed by Novu.

---

## 2. Identified Retry Defects

### 2.1 Double-Submission on Mobile Start Run Tap
* **Location**: `apps/driver-app/features/trips/screens/trips-view.tsx#L190-L210`.
* **Issue**: If a driver taps "Start Run" multiple times quickly under 2G latency, two concurrent mutations fire. While idempotent, the second throws a `BAD_REQUEST: "Trip is already departed"`, displaying an unnecessary error alert to the driver.
* **Fix**: Disable the button immediately on first tap using local pending state.

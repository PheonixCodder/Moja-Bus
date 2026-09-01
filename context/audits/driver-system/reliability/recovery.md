# Reliability Audit: Crash Recovery & Unstranding Mechanics

## 1. Crash Recovery & Resumption

Audits:
1. Mobile app crash recovery during active run.
2. In-flight trip re-mounting via `drivers.getMyProfile`.
3. Anti-strand convergence via `convergeDriversAfterRunEnd`.

---

## 2. Recovery Evaluation

* **Happy Path**: If the mobile driver app crashes mid-route, relaunching the app calls `getMyProfile`, finds `currentTripId`, and automatically re-mounts the live navigation HUD.
* **Telemetry Resumption**: The background location task `MOJA_DRIVER_LOCATION_TRACKING` persists across app restarts on Android unless manually force-stopped by the user.

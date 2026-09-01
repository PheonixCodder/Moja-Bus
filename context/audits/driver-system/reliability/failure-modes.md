# Reliability Audit: Failure Modes & Fault Tolerance

## 1. System Failure Analysis

This document audits system resilience against network drops, mobile app crashes, database timeouts, and background task termination.

---

## 2. Failure Scenarios & System Behaviors

| Failure Scenario | Immediate System Behavior | Recovery Mechanism | Resilience Rating |
| :--- | :--- | :--- | :---: |
| **Driver Phone Battery Dies Mid-Route** | GPS telemetry stops streaming; bus position on live map freezes at last ping. | Passengers see "Stale Position" badge (>5 min). Run convergence clears status when operator marks arrival. | **ACCEPTABLE** |
| **Complete Internet Outage at Rural Terminal** | QR scanner switches to offline queue in `AsyncStorage`. | Queued scans flush via `batchSyncCheckIns` when connection returns. | **HIGH** |
| **Database Lock Timeout during Telemetry Batch** | Worker retries batch; if lock fails repeatedly, pings drop. | P0-2 remediation decouples row locks. | **POOR (NEEDS P0 FIX)** |
| **Novu Outbox Notification Worker Crash** | Unsent messages remain in `OutboxMessage` table (`status = PENDING`). | Worker restarts and polls pending outbox messages with idempotency keys. | **HIGH** |

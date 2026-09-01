# Security Audit: Driver PII & Location Privacy

## 1. Driver Privacy & PII Controls

Audits:
1. PII masking on binding conflicts (`maskIdentifier`, `maskName`).
2. Continuous background GPS tracking disclosure.
3. Live location streaming boundaries.

---

## 2. Privacy Evaluation

* **Tracking Transparency**: The mobile app displays a persistent native foreground notification (`"Moja Driver — Live Telemetry Active"`) whenever location tracking is active.
* **Off-Duty Privacy**: Location tracking stops immediately when `drivers.completeTrip` finishes or when the driver goes off-duty (`toggleShift(onDuty: false)`). Coordinates are not streamed when idle.

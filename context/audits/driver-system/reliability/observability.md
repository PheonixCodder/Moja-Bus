# Reliability Audit: Observability, Metrics & Audit Trails

## 1. Observability Infrastructure

Audits:
1. `DriverOfferEvent`: Immutable append-only audit trail.
2. `AdminStaffActivityLog`: Platform verification decisions.
3. Telemetry Ingest Metrics: Real-time speed and anomaly flags.

---

## 2. Identified Observability Gaps

### 2.1 Missing Trip Crew Handover Log
* **Issue**: Because relief driver handovers are not modeled as runtime events, there is no audit log recording who was physically driving the vehicle at any given minute of a highway journey.
* **Fix**: Create `TripCrewEvent` table recording driver takeover and handover events with GPS coordinates.

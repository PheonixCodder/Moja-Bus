# Workflow Audit: Conductors & Gate Boarding

## 1. Conductor Permissions & Roles

Audits:
1. Conductor assignment: `TripDriverAssignment.role = "CONDUCTOR"`.
2. Driving license exemption in `trips.assignDriver`.
3. Manifest access and QR ticket validation.

---

## 2. Identified Conductor Defects

### 2.1 Conductor Pre-Trip Boarding Block (`P0-1`)
* **Location**: `apps/driver-app/features/trips/screens/trips-view.tsx#L180-L240`.
* **Defect**: The mobile driver app conditionally renders the "Open Scanner" and "Start Run" buttons based on `item.status === "DEPARTED"`. For conductors assigned to a trip departing in 30 minutes (`status === "SCHEDULED"`), the scanner is completely disabled.
* **Impact**: Conductors cannot board passengers at terminal departure gates.
* **Fix**: Allow assigned conductors and primary drivers to launch the scanner when `item.status === "SCHEDULED"` or `"BOARDING"`.

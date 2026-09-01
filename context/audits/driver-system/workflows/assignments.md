# Workflow Audit: Trip Assignments & Double-Booking

## 1. Assignment Engine & Verification Checks

Audits:
1. Operator assignment: `trips.assignDriver`.
2. Double-booking conflict engine: `getDriverTripConflict`.
3. 45-minute turnaround buffer and PostgreSQL `FOR UPDATE` lock order.

---

## 2. Identified Assignment Defects

### 2.1 Fixed Global Turnaround Buffer Underestimation
* **Location**: `apps/web/lib/driver-assignment.ts#L22`.
* **Issue**: The turnaround buffer is globally fixed at 45 minutes (`DRIVER_TURNAROUND_BUFFER_MINUTES = 45`). In congested corridors (e.g. Abidjan $\rightarrow$ Bassam on weekends), bus turnaround takes $>90$ minutes, leading to consecutive scheduling overlaps that cause downstream departures to be delayed.
* **Fix**: Add an optional `turnaroundBufferMinutes` override on `Route` and `Terminal`.

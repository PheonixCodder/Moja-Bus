# Product Audit: Missing Features

This document details critical capabilities that are logically required by commercial bus operations in West Africa but are completely absent from the current codebase.

---

## 1. Inventory of Missing Product Capabilities

### 1.1 Mid-Route Relief Driver Handover Protocol
* **Why Necessary**: West African intercity routes exceeding 500 km (e.g. Abidjan $\rightarrow$ Korhogo, San-Pédro $\rightarrow$ Man) legally mandate two drivers who alternate shifts.
* **Current Code State**: `TripDriverAssignment` allows assigning relief drivers, but the mobile app provides **no button or API** for the relief driver to take over the active run.
* **Impact**: Relief drivers remain passive passengers in the system; GPS tracking cannot switch devices.
* **Severity**: `P0 — Blocker`.

### 1.2 Dedicated Vehicle Breakdown & Emergency Dispatch Workflow
* **Why Necessary**: Vehicle breakdowns on highways require immediate incident reporting, roadside mechanic dispatch, and replacement bus assignment.
* **Current Code State**: Drivers can only report a generic "Delay" (`drivers.reportTripDelay`), which simply adjusts departure/arrival times without flagging an emergency or triggering passenger rebooking.
* **Impact**: Critical roadside breakdowns are treated as minor traffic delays.
* **Severity**: `P1 — Critical`.

### 1.3 Manifest Seat Swap & Reassignment Capability
* **Why Necessary**: Passengers frequently request seat adjustments at boarding (e.g. elderly passengers requesting front seats, families sitting together).
* **Current Code State**: Mobile manifest allows viewing seats and manual check-in, but cannot update `Booking.seatId`.
* **Impact**: Operators cannot resolve seating disputes at terminal gates.
* **Severity**: `P1 — Critical`.

### 1.4 Mandated Driver Rest Break Logging (`RESTING`)
* **Why Necessary**: Commercial safety regulations require a 30-minute rest break after 4 hours of continuous driving.
* **Current Code State**: `DriverStatus` defines `RESTING`, but no API endpoint or UI exists to transition into or out of this state.
* **Impact**: Inability to demonstrate labor law compliance during transport authority audits.
* **Severity**: `P1 — Critical`.

### 1.5 Driver Penalty & Review Dispute System
* **Why Necessary**: GPS multipath errors or harsh braking caused by sudden pedestrian hazards can unfairly penalize driver safety scores.
* **Current Code State**: Safety score deductions and passenger ratings are applied permanently without any appeal or review mechanism.
* **Impact**: Driver frustration and churn over erroneous automated penalties.
* **Severity**: `P2 — Major`.

### 1.6 Custom Turnaround Buffers per Route / Terminal
* **Why Necessary**: Busy urban terminals (e.g., Adjamé Gare) require 90-minute buffers, whereas quiet regional stops require only 20 minutes.
* **Current Code State**: Global hardcoded `DRIVER_TURNAROUND_BUFFER_MINUTES = 45`.
* **Impact**: Over-constrains dispatching on rapid urban corridors and under-protects congested intercity hubs.
* **Severity**: `P2 — Major`.

# Product Audit: Real-World Operational Gaps

This document examines real-world operational challenges encountered by commercial bus operators in Côte d'Ivoire that are unaddressed by the current system design.

---

## 1. Operational Reality vs. System Assumptions

```mermaid
graph LR
    subgraph System Assumption
        A1[Trip runs start-to-finish without issue]
        A2[Driver phone is always charged & online]
        A3[100% of passengers have clean QR screens]
        A4[Drivers never dispute automated deductions]
    end

    subgraph Operational Reality
        R1[Buses breakdown mid-corridor; passengers need rescue]
        R2[Phones run out of battery; conductors need manifest access]
        R3[Phone screens cracked/dead; manual name check-in needed]
        R4[Potholes/hazards cause harsh braking; score penalized]
    end

    A1 -.->|Gap| R1
    A2 -.->|Gap| R2
    A3 -.->|Partially Handled| R3
    A4 -.->|Gap| R4
```

---

## 2. Detailed Gap Analysis

### 2.1 Roadside Breakdown & Passenger Transfer
* **Scenario**: An intercity coach breaks down on the highway between Tiassalé and Yamoussoukro. The operator dispatches a rescue coach.
* **Product Gap**: The system has no concept of a "Rescue Trip" or "Passenger Transfer". Dispatchers cannot migrate the stranded manifest to a new bus without manually creating separate bookings for 50 passengers.

### 2.2 Shared Device / Dead Phone Workaround
* **Scenario**: The primary driver's phone battery dies mid-journey.
* **Product Gap**: The driver cannot transfer live navigation or GPS streaming to the conductor's phone without logging out and re-authenticating via SMS OTP on the second device.

### 2.3 Cash-on-Board / Walk-Up Passengers
* **Scenario**: Rural waypoints have walk-up passengers who pay cash directly to the conductor.
* **Product Gap**: Conductor cannot issue walk-up tickets or add unreserved passengers to the official manifest from the mobile app.

### 2.4 Multi-Language Regional Operational Realities
* **Scenario**: Many commercial drivers in West Africa are more fluent in spoken French / Dioula than formal written terms.
* **Product Gap**: No audio prompts or simplified large-icon modes for high-stress driving moments.

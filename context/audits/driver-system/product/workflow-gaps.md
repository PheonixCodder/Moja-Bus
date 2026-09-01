# Product Audit: Workflow Gaps & Dead-Ends

This document evaluates end-to-end user journeys across mobile and web interfaces, identifying dead-ends, broken loops, and missing transitions.

---

## 1. Identified Workflow Dead-Ends

### 1.1 Driver Rejection Resubmission Dead-End
* **Flow**: Driver applies $\rightarrow$ Admin rejects credentials $\rightarrow$ Driver sees rejection reason.
* **Dead-End**: In `apps/driver-app/app/(auth)/register/status.tsx`, when a driver's status is `REJECTED`, the screen displays the rejection reason but does not provide an "Edit Documents" button. The driver must clear app data or log out and in again to re-trigger the registration wizard.

### 1.2 Unverified Driver Shift Lockout Confusion
* **Flow**: Driver logs in before verification $\rightarrow$ Taps "On Duty" switch on Profile.
* **Problem**: The UI toggles the switch optimistically, but the mutation fails with a generic tRPC error alert (`"Your license verification is not approved yet"`). The switch reverts without an inline explanation of required verification steps.

### 1.3 Conductor Pre-Departure Gate Boarding Loop
* **Flow**: Conductor arrives at terminal 45 min before departure $\rightarrow$ Opens app $\rightarrow$ Taps upcoming trip.
* **Dead-End**: The trip card shows "SCHEDULED". The "Start Run" button is only visible to the primary driver. The scanner tab shows "No active trip". The conductor is completely blocked from checking in passengers until the bus rolls out and the primary driver starts the trip.

---

## 2. Transition Gaps in Operator Portal

### 2.1 Direct Re-Hiring from Archive
* **Flow**: Operator views terminated drivers $\rightarrow$ Desires to re-activate driver.
* **Gap**: Roster table only exposes "Remove". To re-hire, operator must navigate to Add Driver modal and re-enter phone/email to trigger the binding workflow.

### 2.2 Shift Duration Display During Active Shift
* **Flow**: Operator views active drivers on roster.
* **Gap**: Roster shows "ON_DUTY", but does not display elapsed shift hours or current driving time, making it hard to evaluate driver fatigue before dispatching.

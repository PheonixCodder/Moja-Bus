# QA Audit: Stress Scenarios & Edge Cases

## 1. Stress Scenarios & Behavioral Matrix

| Edge Case / Stress Condition | Expected Behavior | Actual Behavior in Code | Verdict |
| :--- | :--- | :--- | :---: |
| **Driver loses GPS signal inside tunnel / dense forest** | App holds last position and queues dead-zone time. | TaskManager receives null coords; skips ping until fix reacquired. | **PASS** |
| **50 passengers scan QR simultaneously at terminal** | Check-ins succeed concurrently without duplicate seats. | PostgreSQL atomic update on `Booking.boardedAt` prevents double-boarding. | **PASS** |
| **Driver phone clock skews 15 minutes slow** | Urgent dispatch modal functions based on server departure time. | Client-side `new Date()` evaluation suppresses urgent modal (**P0-3**). | **FAIL (P0)** |
| **Relief driver takes wheel mid-route** | App transfers active tracking and HUD to relief device. | No handover mutation exists; relief app stays inactive (**P0-4**). | **FAIL (P0)** |
| **Operator cancels trip while bus is on highway** | Bus is unstranded; driver status converges to AVAILABLE. | `convergeDriversAfterRunEnd` executes and resets status cleanly. | **PASS** |

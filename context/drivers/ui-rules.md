# Moja Bus Driver System — UI Rules

Interaction guidelines, layout behaviors, active states, and mobile accessibility rules for the Driver App and Operator Dashboard.

---

## 1. Driver Mobile App (`apps/driver-app`) Rules

### A. In-Vehicle Ergonomics & Distraction-Free Design
- **High-Contrast Telemetry HUD**: The active trip screen must feature high contrast (dark background with vivid emerald/cyan/white indicators) with large touch targets ($>52\text{px}$) for one-tap stop arrivals/departures.
- **Large Speedometer & Delay Badges**: Speed and delay minutes must be readable at an arm's length when the phone is mounted on the dashboard.
- **Audio & Haptic Confirmations**:
  - Valid QR Ticket: High chime + double short haptic pulse.
  - Invalid / Duplicate QR Ticket: Warning buzz + continuous long haptic vibration.
  - Stop Check-In: Single medium haptic thud.

### B. Dual-Mode Switcher Behavior
- **Intercity Layout**: Displays formal terminal gates, departure time countdown, full passenger manifest with seat numbers, and relief driver handover controls.
- **Urban Layout**: Displays route line badge (e.g. "Line 14 — Plateau $\leftrightarrow$ Cocody"), current loop progress, passenger count counter, and rapid tap validator.

---

## 2. Operator Web Dashboard (`apps/web`) Rules

### A. Driver Directory & Profile View
- **Status Filter Chips**: `All`, `Active/On Duty`, `On Trip`, `Resting`, `Pending Verification`, `Suspended`.
- **License Expiry Alert**: Highlight drivers with license expiring within 30 days with a yellow warning badge, and expired licenses in red with a disabled trip-assignment toggle.
- **Career Passport Tab**: Displays lifetime rating breakdown (stars), safety score gauge (0–100), total kilometers driven, and list of verified passenger reviews.

### B. Dispatch Board Integration
- When assigning a driver to a trip, show the driver's current status (`AVAILABLE` = Green, `RESTING` = Amber, `ON_TRIP` = Disabled).
- Prevent assigning drivers with expired licenses or unverified status, displaying a tooltip explaining the reason.

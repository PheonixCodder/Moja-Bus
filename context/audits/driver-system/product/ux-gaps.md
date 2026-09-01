# Product Audit: UX, Ergonomics & Clarity Gaps

This document evaluates the usability, clarity, and ergonomics of the Driver Mobile App and Operator Web ERP interfaces under operational conditions.

---

## 1. Mobile Driver App Ergonomics & UX Defects

### 1.1 Speedometer Gauge Needle Jitter
* **Location**: `apps/driver-app/features/live/components/speedometer-gauge.tsx`.
* **Problem**: Renders instantaneous GPS speed directly from Location updates. Minor GPS noise causes the needle and digital display to oscillate rapidly ($88 \rightarrow 94 \rightarrow 87$ km/h), inducing driver anxiety during highway driving.
* **Fix**: Apply a low-pass exponential moving average (EMA) filter:
  $$v_{\text{smooth}} = \alpha \cdot v_{\text{current}} + (1 - \alpha) \cdot v_{\text{prev}} \quad (\alpha = 0.3)$$

### 1.2 Missing Overspeed Audio/Tactile Cue
* **Location**: `apps/driver-app/features/live/screens/live-view.tsx`.
* **Problem**: When speed exceeds 110 km/h, the gauge turns red, but no audio beep or heavy haptic pulse fires. Commercial drivers cannot safely stare at their phone while driving at high speeds.
* **Fix**: Trigger `DriverFeedback.overspeedAlert()` on overspeed threshold crossing.

### 1.3 Offline Scan Queue Visual Feedback
* **Location**: `apps/driver-app/features/scanner/screens/scanner-view.tsx`.
* **Problem**: When scanning offline, the app displays a subtle amber text banner (`"Offline"`). It lacks a large prominent count badge and a manual "Force Sync Now" button.

### 1.4 Trip Manifest Phone Dialer Ergonomics
* **Location**: `apps/driver-app/features/trips/screens/manifest-view.tsx`.
* **Problem**: Phone numbers are rendered as static text. Conductor must memorize or copy-paste numbers instead of tapping a native one-touch phone dialer button (`Linking.openURL('tel:...')`).

---

## 2. Operator ERP Web Dashboard UX Defects

### 2.1 License Expiry Column Formatting
* **Location**: `apps/web/features/operator/views/operator-drivers-view.tsx`.
* **Problem**: Shows raw dates without a visual warning indicator for licenses expiring within 30 days. Operators miss approaching compliance deadlines until the driver is already locked out.

### 2.2 Live Fleet Map Bus Clustered Tooltips
* **Location**: `apps/web/app/[locale]/dashboard/operator/(dashboard)/drivers/map/page.tsx`.
* **Problem**: At dense urban terminals (e.g. Abidjan Treichville), overlapping bus markers cannot be distinguished without zooming to street level.

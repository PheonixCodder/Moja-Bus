# Engineering Audit: Mobile Driver Application

## 1. Mobile Client Technical Evaluation

The mobile driver application (`apps/driver-app`) uses Expo SDK 52, Expo Router v4, TanStack Query v5, Zustand, and React Native Reusables.

---

## 2. Mobile Architectural Defects

### 2.1 Polling Intervals & Battery Drain
* **Location**: `apps/driver-app/components/urgent-dispatch-gate.tsx#L42-L46`.
* **Problem**: `getMyUrgentDispatches` polls the server every 60 seconds (`refetchInterval: 60_000`) on foreground. Combined with high-rate GPS tracking (`Location.watchPositionAsync` every 5 seconds), battery drain on older Android devices is significant (exceeding 18% per hour).
* **Fix**: Rely on push notifications (via Novu / Expo Push) to wake the app for urgent departures instead of aggressive background polling.

### 2.2 Unsynchronized AsyncStorage Scans on Fast App Restart
* **Location**: `apps/driver-app/features/scanner/screens/scanner-view.tsx#L120-L150`.
* **Problem**: When a driver scans a ticket offline, the scan is pushed to an in-memory array and persisted asynchronously to `AsyncStorage`. If the OS terminates the app process immediately after a scan, the in-memory scan can be lost before the disk write completes.
* **Fix**: Await `AsyncStorage.setItem` synchronously before displaying the "Queued Offline" success feedback.

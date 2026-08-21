# Moja Bus Driver System — Library Docs

Project-specific usage patterns and constraints for third-party libraries used across the Driver ERP and Real-Time Telemetry subsystem.

---

## 1. `expo-location` & `expo-task-manager`
- **Purpose**: Background and foreground GPS telemetry capture on Android & iOS.
- **Rules**:
  - Register the background task at the root `index.ts` / `_layout.tsx` before app mounts.
  - Define task with `TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => { ... })`.
  - Always check permissions with `Location.requestForegroundPermissionsAsync()` and `Location.requestBackgroundPermissionsAsync()`.
  - Enforce battery-saving distance filter: `distanceInterval: 10` (meters) or `timeInterval: 5000` (ms).

---

## 2. `ws` (Node.js WebSocket Server)
- **Purpose**: High-throughput duplex socket connection for vehicle telemetry pings and live map subscriptions.
- **Rules**:
  - Bind to Next.js custom HTTP server or dedicated micro-gateway with upgrade handling on `/api/ws/telemetry`.
  - Validate auth token in query param or initial connection message (`{ type: "AUTH", token: "..." }`).
  - Route messages to Redis Pub/Sub channels (`trip:${tripId}:telemetry`) rather than iterating local in-memory sets when running in clustered environments.

---

## 3. `ioredis` / Redis Geo
- **Purpose**: Low-latency geospatial queries and pub/sub message bus.
- **Key Commands**:
  - `GEOADD moja:fleet:geo <longitude> <latitude> <memberKey>`: Updates real-time spatial index.
  - `GEORADIUS moja:fleet:geo <lng> <lat> <radius> km WITHDIST WITHCOORD`: Queries buses near a passenger terminal.
  - `HSET moja:trip:<tripId>:live <field> <value>`: Caches current speed, heading, driverId, and timestamp with 75s TTL.
  - `PUBLISH trip:<tripId>:telemetry <payload>`: Fan-out to connected travelers and operator map subscribers.

---

## 4. `expo-camera` / QR Code Scanner
- **Purpose**: High-speed offline-capable passenger boarding ticket scanner in Driver App.
- **Rules**:
  - Enable `barcodeScannerSettings: { barcodeTypes: ["qr"] }`.
  - Throttle barcode detection callback to prevent multiple scans of the same ticket within 2 seconds.
  - Provide immediate visual overlay feedback (Green box = Valid, Red box = Already Scanned / Invalid) + `Haptics.notificationAsync(NotificationFeedbackType.Success)`.

---

## 5. `@rn-primitives` & NativeWind
- **Purpose**: Cross-platform accessible UI primitives styled with Tailwind CSS utility classes in React Native.
- **Rules**:
  - Use `@rn-primitives/dialog`, `@rn-primitives/tabs`, `@rn-primitives/avatar`, and `@rn-primitives/progress`.
  - Keep styling consistent with `@moja/theme` tokens (colors, font families, radii).

# Moja Bus Driver System — Code Standards

## 1. Styling & Framework Conventions
- **Operator Web ERP (`apps/web`)**: Next.js 15 App Router, React 19, TypeScript strict mode, Tailwind CSS v4, `@moja/ui` component library based on shadcn/ui.
- **Driver Mobile App (`apps/driver-app`)**: React Native 0.86, Expo 57, Expo Router, NativeWind (Tailwind CSS for React Native), `@rn-primitives` unstyled accessible primitives, Lucide React Native icons.
- **Backend & tRPC**: tRPC v11 routers using Zod v4 schemas, Prisma ORM queries inside service objects, proper error codes with `TRPCError`.

---

## 2. Naming Conventions
- **React Components**: `PascalCase` (e.g. `OperatorDriversView.tsx`, `DriverPassportCard.tsx`, `LiveTripMap.tsx`).
- **Hooks**: `camelCase` prefixed with `use` (e.g. `useDriverLocation.ts`, `useTripTelemetry.ts`, `useDriverPermissions.ts`).
- **Services & Utilities**: `camelCase` for functions, `PascalCase` for service classes (e.g. `driverService.ts`, `TelemetryIngestionService.ts`).
- **Database Models & Tables**: `PascalCase` in Prisma, mapped to `snake_case` in PostgreSQL (e.g. `model DriverProfile` $\rightarrow$ `@@map("driver_profile")`).
- **tRPC Procedures**: `camelCase` grouped logically (e.g. `listDrivers`, `getDriver`, `streamTelemetry`, `submitReview`).
- **Files & Folders**: `kebab-case` for file and directory names (e.g. `driver-location-ping.ts`, `operator-drivers-view.tsx`).

---

## 3. Real-Time Telemetry & Geolocation Guidelines
- **Zero Raw Coordinates in State**: Always type coordinates as `{ latitude: number, longitude: number, heading?: number, speedKmh?: number, accuracyMeters?: number }`.
- **Never Block the Main UI Thread**: In the React Native app, background location tasks must run in `expo-task-manager` isolated background execution, communicating with Zustand stores via event dispatchers.
- **Graceful Degradation**: Always provide HTTP polling fallback when WebSockets drop due to mobile network cell handover on intercity highways.
- **Battery Optimization**: Use dynamic interval scaling:
  - Moving ($>10\text{ km/h}$): 5–10 second interval, high accuracy (`Accuracy.Highest`).
  - Stationary / Idling: 30–60 second interval, balanced accuracy (`Accuracy.Balanced`).

---

## 4. Error Handling & Logging
- **Web App**: Handle tRPC errors using standard `toast.error` from sonner or `@moja/ui`.
- **Driver App**: Use `react-native-toast-message` for non-intrusive feedback and haptic vibration (`expo-haptics`) for mission-critical actions like QR ticket validation.
- **Server**: All telemetry validation anomalies (impossible jumps, negative speeds) must be logged with structured metadata including `driverId`, `tripId`, `accuracy`, and `deltaSeconds`.

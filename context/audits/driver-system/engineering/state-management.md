# Engineering Audit: State Management & Data Flow

## 1. Client & Server State Synchronization

State is distributed across:
1. **Server Truth**: PostgreSQL database managed via Prisma.
2. **Real-Time Buffer**: Redis Pub/Sub channels.
3. **Mobile Client Cache**: TanStack React Query (`queryClient`).
4. **Mobile Device State**: Zustand stores persisted to `AsyncStorage`.

---

## 2. Synchronization Defects & Race Conditions

### 2.1 Cache Invalidation Gaps on Trip Arrival
* **Location**: `apps/driver-app/features/live/screens/live-view.tsx#L70-L76`.
* **Problem**: When a trip completes, `completeMutation` calls `queryClient.invalidateQueries()`, but the live navigation HUD uses local state `currentLocation` and `activeTrip` that does not immediately unmount if a child component retains a closure, occasionally rendering a blank map before redirecting.
* **Fix**: Force navigation reset to `router.replace("/(tabs)/trips")` inside `onSuccess`.

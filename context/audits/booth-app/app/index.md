# Audit: index.tsx

## 1. File
Exact source path: [`apps/booth-app/app/index.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/index.tsx)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Cold-boot authentication and workstation terminal routing gate, determining whether cashier is routed to `/(auth)/login`, `/terminal-select`, or `/(tabs)`.

## 4. Responsibilities
- Verify freshness of auth cookies via [`lib/auth-client.ts`](file:///C:/dev/moja-buss/apps/booth-app/lib/auth-client.ts) (`ensureAuthCookiesFresh`).
- Inspect Better Auth session (`authClient.getSession`).
- Fetch operator profile and assigned terminal via `trpc.booth.getMyProfile`.
- Lock session to assigned terminal if designated by management.
- Preserve cached profile and terminal in persistent store if offline (fail-open offline mandate).
- Hide native splash screen once routing decision is finalized.
- Redirect to appropriate route.

## 5. Dependencies
- `expo-router` (`Redirect`)
- `expo-splash-screen` (`SplashScreen`)
- `react` (`useEffect`, `useState`)
- `react-native` (`ActivityIndicator`, `View`)
- [`@/constants/ui-colors`](file:///C:/dev/moja-buss/apps/booth-app/constants/ui-colors.ts) (`IconColors`)
- [`@/lib/auth-client`](file:///C:/dev/moja-buss/apps/booth-app/lib/auth-client.ts) (`authClient`, `ensureAuthCookiesFresh`)
- [`@/lib/trpc`](file:///C:/dev/moja-buss/apps/booth-app/lib/trpc.tsx) (`getTrpcClient`)
- [`@/stores/session`](file:///C:/dev/moja-buss/apps/booth-app/stores/session.ts) (`useSessionStore`)

## 6. Consumers / Usage
- Expo Router initial entry point (`/`).

## 7. Current Implementation
- **File Length**: 116 lines.
- **Architectural Role**: Boot routing gatekeeper.
- **Transaction-Critical Area**: YES (P0 Gateway Area)
- **Key Exports**: Default export `BootGate`.

## 8. UI / UX Audit
- Renders full-screen activity spinner during auth/profile checks.
- Dismisses splash screen cleanly once destination is resolved.

## 9. Design-System Audit
- Minimal spinner presentation.

## 10. Theme Audit
- Background uses semantic `bg-background`.

## 11. Logic Audit
- **P0 Offline Lockout Bug (Lines 23-79)**:
  ```ts
  try {
    await ensureAuthCookiesFresh();
    const session = await authClient.getSession();
    ...
  } catch {
    if (isMounted) setAuthState("unauthenticated"); // BUG: Kicks offline cashiers to login!
  }
  ```
  If the POS terminal starts offline at a bus depot, `getSession()` throws a network failure. The outer catch block catches it and sets `authState = "unauthenticated"`, redirecting the cashier to `/(auth)/login`!
  Even if the cashier has a valid, unexpired session and cached terminal in `useSessionStore`, they are completely locked out!
  **Violation of Offline Mandate**: An offline POS terminal must inspect `useSessionStore.getState().profile` and allow offline cashier shifts to proceed!

## 12. State Management Audit
- Updates `useSessionStore` with profile and terminal.

## 13. Async / Side-Effect Audit
- Asynchronous session verification on mount.

## 14. Error Handling Audit
- Defective catch block fails to differentiate network offline errors from unauthenticated 401 errors.

## 15. Offline / Synchronization Audit
- CRITICAL DEFECT: Fails to honor offline mode during boot.

## 16. Performance Audit
- Line 82 has an artificial `setTimeout(..., 50)` delay that should be removed.

## 17. Accessibility Audit
- Spinner provides loading feedback.

## 18. Architecture Audit
- Boot gate pattern is sound; error branching logic requires overhaul.

## 19. Code Quality Audit
- Explicit `AuthState` union type.

## 20. Reference Comparison
- Industrial POS applications check local persisted store before remote validation.

## 21. Problems
1. [P0 OFFLINE BOOT LOCKOUT] Network failure during `getSession()` throws to outer catch block, redirecting offline cashiers to login and breaking offline functionality.
2. [ARBITRARY TIMEOUT] 50ms `setTimeout` creates unnecessary latency.

## 22. Severity
- **Classification**: `P0`
- **Rationale**: Blocks offline operations on cold boot.

## 23. Recommended Changes
1. Check `useSessionStore.getState().profile` first. If cached profile exists and device is offline, route directly to `/(tabs)` or `/terminal-select`.
2. Remove 50ms setTimeout.

## 24. Refactoring Plan
1. Refactor `checkAuth()` to support offline authenticated bypass when cached profile is present.

## 25. Test Strategy
1. Turn off WiFi/data, launch app with existing profile; verify app boots into `/(tabs)` without redirecting to login.

## 26. Verification Criteria
- [ ] Offline cold boot succeeds with cached session.
- [ ] Unauthenticated boot redirects to login.

## 27. Next Steps
- Fix during Phase 7.

## 28. Notes
None.

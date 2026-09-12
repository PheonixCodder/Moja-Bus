# Audit: _layout.tsx

## 1. File
Exact source path: [`apps/booth-app/app/_layout.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/_layout.tsx)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Root application layout configuring global runtime providers (`TRPCReactProvider`, `SafeAreaProvider`, `ThemeProvider`), global splash screen lifecycle, font loading, dark-mode lock to light mode, reconnection queue synchronization (`ReconnectHandler`), and top-level Stack navigation.

## 4. Responsibilities
- Prevent splash screen auto-hide until assets and boot checks complete.
- Load custom typography fonts via [`hooks/use-load-fonts.ts`](file:///C:/dev/moja-buss/apps/booth-app/hooks/use-load-fonts.ts).
- Enforce light-mode only theme by applying `className="light"` to root container.
- Mount `ReconnectHandler` to detect online transitions and trigger [`lib/offline-sync.ts`](file:///C:/dev/moja-buss/apps/booth-app/lib/offline-sync.ts).
- Mount global overlays: `Toast` (react-native-toast-message) and `PortalHost` (@rn-primitives/portal).
- Define root stack navigator routes (`index`, `terminal-select`, `reconcile`, `(auth)`, `(tabs)`, `sell`).

## 5. Dependencies
- `expo-router` (`Stack`, `ThemeProvider`)
- `expo-splash-screen` (`SplashScreen`)
- `expo-status-bar` (`StatusBar`)
- `react` (`useEffect`, `useRef`)
- `react-native` (`View`)
- `react-native-safe-area-context` (`SafeAreaProvider`)
- `react-native-toast-message` (`Toast`)
- `@rn-primitives/portal` (`PortalHost`)
- [`@/lib/theme`](file:///C:/dev/moja-buss/apps/booth-app/lib/theme.ts) (`NAV_THEME`)
- [`@/hooks/use-load-fonts`](file:///C:/dev/moja-buss/apps/booth-app/hooks/use-load-fonts.ts)
- [`@/hooks/use-network-status`](file:///C:/dev/moja-buss/apps/booth-app/hooks/use-network-status.ts)
- [`@/lib/offline-sync`](file:///C:/dev/moja-buss/apps/booth-app/lib/offline-sync.ts) (`flushOfflineQueue`)
- [`@/lib/trpc`](file:///C:/dev/moja-buss/apps/booth-app/lib/trpc.tsx) (`TRPCReactProvider`, `useTRPC`)
- [`@/stores/offline-queue`](file:///C:/dev/moja-buss/apps/booth-app/stores/offline-queue.ts)
- [`@/constants/theme`](file:///C:/dev/moja-buss/apps/booth-app/constants/theme.ts) (`colors`)

## 6. Consumers / Usage
- Expo Router root layout.

## 7. Current Implementation
- **File Length**: 122 lines.
- **Architectural Role**: Global application shell and provider root.
- **Transaction-Critical Area**: YES (Section 7 — Orchestrates reconnection synchronization)
- **Key Exports**: Default export `RootLayout`.

## 8. UI / UX Audit
- Controls transitions between splash screen and application.
- Status bar forced to dark text (`style="dark"`) matching light-mode background.

## 9. Design-System Audit
- Enforces light theme via `className="light"` on root `View` (line 97) and `style={{ backgroundColor: colors.neutral.background }}`.

## 10. Theme Audit
- Properly connects `NAV_THEME` to React Navigation's `ThemeProvider`.

## 11. Logic Audit
- **Contradictory Splash Screen Logic**:
  - Lines 21-24: Comment states: `SplashScreen.preventAutoHideAsync().catch(() => {});` and promises the splash is hidden in `index.tsx` once redirect target is known.
  - BUT lines 76-79:
    ```ts
    useEffect(() => {
      if (fontsLoaded || fontsError) {
        void SplashScreen.hideAsync();
      }
    }, [fontsLoaded, fontsError]);
    ```
    Hides the splash immediately upon font load! This causes a blank screen flash while `index.tsx` executes its async auth and profile checks!
- **Reconnection Flusher**:
  - Lines 38-67 in `ReconnectHandler`:
    Triggers `flushOfflineQueue` whenever `isOnline && wasOffline && queue.length > 0`.
    Lacks debouncing or mutex; if connectivity flutters (on/off/on in 2 seconds), multiple flushes may fire concurrently.

## 12. State Management Audit
- Subscribes to `useOfflineQueue()` for `queue.length`.

## 13. Async / Side-Effect Audit
- Font loading and reconnection queue flush run as asynchronous side effects.

## 14. Error Handling Audit
- Font loading errors fall back gracefully (`fontsError` allows app rendering).

## 15. Offline / Synchronization Audit
- Essential offline synchronization bridge.

## 16. Performance Audit
- ReconnectHandler creates mutations on every render. `useMutation` should be stable, but dependencies array is large.

## 17. Accessibility Audit
- SafeAreaProvider ensures screen contents respect notches and navigation bars.

## 18. Architecture Audit
- Clean root composition.

## 19. Code Quality Audit
- Well-structured TypeScript.

## 20. Reference Comparison
- Matches Expo Router provider tree architectures.

## 21. Problems
1. [CONTRADICTORY SPLASH LIFECYCLE] Hiding splash screen on font load causes white flash before `index.tsx` finishes auth check.
2. [CONCURRENT FLUSH RACE CONDITION] `ReconnectHandler` lacks debounce/mutex protection against rapid network flapping.
3. [HARDCODED FRENCH TOASTS] Lines 50 and 56 contain raw French strings.

## 22. Severity
- **Classification**: `P0`
- **Rationale**: Root application provider and offline synchronization coordinator.

## 23. Recommended Changes
1. Remove `SplashScreen.hideAsync()` from `RootLayout`; let `index.tsx` hide it once destination route is determined.
2. Add sync mutex/lock to `ReconnectHandler`.
3. Internationalize toast messages.

## 24. Refactoring Plan
1. Fix splash screen lifecycle coordination.
2. Add debounce to reconnection trigger.

## 25. Test Strategy
1. Test app boot on slow network; verify splash screen remains until redirect occurs.
2. Toggle airplane mode with queued sales and verify single flush execution.

## 26. Verification Criteria
- [ ] No white flicker during cold boot.
- [ ] No duplicate sync requests during reconnection.

## 27. Next Steps
- Implement during Phase 7.

## 28. Notes
None.

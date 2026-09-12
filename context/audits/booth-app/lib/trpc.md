# Audit: trpc.tsx

## 1. File
Exact source path: [`apps/booth-app/lib/trpc.tsx`](file:///C:/dev/moja-buss/apps/booth-app/lib/trpc.tsx)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Configures the tRPC client and TanStack React Query provider for the Booth App, managing network request batching, authentication headers, automatic 401 retry loops, and session keep-alive.

## 4. Responsibilities
- Create TanStack `QueryClient` tuned for spotty booth network connectivity (3 retries with exponential backoff for queries).
- Create tRPC client using `httpBatchLink` with superjson serialization and custom `fetchWithAuth` wrapper.
- Attach `expo-origin` and auth session cookies to every outgoing request.
- Handle 401 Unauthorized status automatically by refreshing auth cookies and replaying the request once.
- Maintain a 4-minute background keep-alive loop (`AuthSessionKeepAlive`) to prevent session expiration during long cashier shifts.
- Export `TRPCReactProvider`, `useTRPC`, and `getTrpcClient`.

## 5. Dependencies
- `@tanstack/react-query`
- `@trpc/client` & `@trpc/tanstack-react-query`
- `superjson`
- [`@/lib/auth-client`](file:///C:/dev/moja-buss/apps/booth-app/lib/auth-client.ts)
- `../../web/trpc/routers/_app` (`type AppRouter`)

## 6. Consumers / Usage
- [`app/_layout.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/_layout.tsx) (Wraps app in `<TRPCReactProvider>`)
- Consumed via `useTRPC()` in virtually every data-driven screen in the app.

## 7. Current Implementation
- **File Length**: 130 lines.
- **Architectural Role**: Primary data transport layer.
- **Key Exports**: `TRPCProvider`, `useTRPC`, `getTrpcClient`, `TRPCReactProvider`.

## 8. UI / UX Audit
- Exponential backoff ensures network blips in remote bus stations do not immediately present jarring error modals to cashiers.

## 9. Design-System Audit
- Not applicable.

## 10. Theme Audit
- Not applicable.

## 11. Logic Audit
- **Automatic 401 Replay**: Lines 75-79:
  ```typescript
  if (response.status === 401) {
    await ensureAuthCookiesFresh();
    response = await request();
    await syncAuthCookiesFromResponse(response);
  }
  ```
  This prevents abrupt session terminations if a cookie expires while the app is in the background.
- **Session Keep-Alive**: Lines 102-111 trigger `ensureAuthCookiesFresh()` every 4 minutes.

## 12. State Management Audit
- Manages TanStack Query client cache. Queries are configured with a 30-second `staleTime` to ensure schedule and seat inventory stay fresh.

## 13. Async / Side-Effect Audit
- Clean `setInterval` teardown in `AuthSessionKeepAlive` on unmount.

## 14. Error Handling Audit
- Properly bubbles uncaught network errors to React Query mutation/query error handlers.

## 15. Offline / Synchronization Audit
- Note: mutations are NOT automatically retried by React Query, which is essential to prevent duplicate ticket purchases or financial transactions.

## 16. Performance Audit
- Batching enabled via `httpBatchLink`, grouping concurrent queries into a single HTTP POST.

## 17. Accessibility Audit
- Not applicable.

## 18. Architecture Audit
- Correct monorepo boundary: imports `type AppRouter` without runtime web server dependencies.

## 19. Code Quality Audit
- Clean, robust TypeScript.

## 20. Reference Comparison
- Matches the architecture in `apps/traveler-app/lib/trpc.tsx`.

## 21. Problems
1. [SESSION LOOP UNBOUNDED] If an account is deactivated on the backend, the 4-minute keep-alive will continue polling 401s indefinitely without triggering an automatic cashier logout to the login screen.
2. [QUERY RETRY DELAY] Max retry delay is 10,000ms (10s), which can cause up to 17s before a final query failure is displayed to the cashier on dead links.

## 22. Severity
- **Classification**: `P1`
- **Rationale**: Primary data conduit for the entire application.

## 23. Recommended Changes
1. If keep-alive encounters 3 consecutive 401s, emit an auth invalidation event to route user to `/(auth)/login`.
2. Tune query retry to 2 attempts for faster cashier feedback on failed lookups.

## 24. Refactoring Plan
1. Maintain existing `TRPCReactProvider` and `useTRPC` contracts.
2. Add auth failure event handling during Phase 7 (Navigation/Root Layout).

## 25. Risks
- Critical transport risk: breaking changes will disable all server interactions across the entire app.

## 26. Dependencies / Blockers
- **Upstream Dependencies**: `@trpc/*`, `@tanstack/react-query`, `auth-client.ts`
- **Downstream Consumers**: All screens and routes
- **Current Blockers**: None.

## 27. Verification Checklist
- [x] TypeScript compilation passes with zero errors (`turbo typecheck`)
- [x] Biome linting and formatting check passes
- [x] Verified tRPC client provider mounts without warning

## 28. Final Audit Decision
- **Decision**: `KEEP + IMPROVE`
- **Reason**: Excellent tRPC transport implementation with resilient 401 re-auth logic.

# Audit: auth-client.ts

## 1. File
Exact source path: [`apps/booth-app/lib/auth-client.ts`](file:///C:/dev/moja-buss/apps/booth-app/lib/auth-client.ts)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Better Auth mobile client adapter configuring authentication plugins (email OTP, phone number, Expo SecureStore token storage) and cookie synchronization for mobile tRPC requests.

## 4. Responsibilities
- Configure `createAuthClient` with baseURL, plugins (`emailOTPClient`, `phoneNumberClient`, `expoClient`).
- Securely store auth session cookies in hardware-backed `expo-secure-store` (`booth-app_cookie`).
- Provide cookie extractors: `getAuthCookieHeader()`, `getExpoOriginHeader()`.
- Synchronize cookies from HTTP responses via `syncAuthCookiesFromResponse(response)`.
- Provide session freshness guard: `ensureAuthCookiesFresh()`.

## 5. Dependencies
- `better-auth/client/plugins`
- `@better-auth/expo/client`
- `better-auth/react`
- `expo-constants`, `expo-linking`, `expo-secure-store`

## 6. Consumers / Usage
- [`lib/trpc.tsx`](file:///C:/dev/moja-buss/apps/booth-app/lib/trpc.tsx) (Auth headers & cookie sync)
- [`app/index.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/index.tsx) (Session verification gate)
- [`app/(auth)/login.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/(auth)/login.tsx) (Cashier login mutation)
- [`app/(tabs)/profile.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/(tabs)/profile.tsx) (Cashier signout mutation)

## 7. Current Implementation
- **File Length**: 101 lines.
- **Architectural Role**: Authentication infrastructure & credential vault.
- **Key Exports**: `getBaseUrl`, `authClient`, `getAuthCookieHeader`, `getExpoOriginHeader`, `syncAuthCookiesFromResponse`, `ensureAuthCookiesFresh`, `useSession`, `signOut`, `refreshSession`.

## 8. UI / UX Audit
- Ensures cashiers remain logged in throughout long 12-hour shifts without being kicked out mid-transaction.

## 9. Design-System Audit
- Not applicable.

## 10. Theme Audit
- Not applicable.

## 11. Logic Audit
- **Cookie Jar Protocol**: React Native lacks an automatic multi-origin browser cookie jar. Lines 67-79 manually intercept `Set-Cookie` response headers and persist them to `SecureStore`. This is the exact pattern required by Better Auth's Expo client.
- **Origin Header**: Line 60 generates the `expo-origin` header via `Linking.createURL("", { scheme })` to satisfy Better Auth CSRF and trusted origin checks.

## 12. State Management Audit
- Bridges Better Auth internal nano-stores with Expo SecureStore persistent hardware storage.

## 13. Async / Side-Effect Audit
- SecureStore async read/write operations properly awaited.

## 14. Error Handling Audit
- `ensureAuthCookiesFresh()` uses best-effort try/catch to prevent network hiccups from crashing caller loops.

## 15. Offline / Synchronization Audit
- Persisted SecureStore cookies survive app restarts and network dropouts, allowing offline ticketing to proceed with valid cashier credentials.

## 16. Performance Audit
- SecureStore operations are fast, but should not be called in tight render loops (they are correctly placed in network request interceptors).

## 17. Accessibility Audit
- Not applicable.

## 18. Architecture Audit
- Strictly follows the repository's Better Auth architecture guidelines.

## 19. Code Quality Audit
- Lines 40-51 use explicit `any` casts in return type augmentation. Can be tightened with precise Better Auth plugin return types.

## 20. Reference Comparison
- Aligns with `apps/traveler-app/lib/auth-client.ts` and the official Better Auth Expo integration pattern.

## 21. Problems
1. [TYPE LOOSENESS] Return type of `authClient` has `opts: { phoneNumber: string } => Promise<{ data?: any; error?: any }>` with `any` types.
2. [FALLBACK DOMAIN] Line 23 defaults to `https://moja-bus-web.vercel.app` when `EXPO_PUBLIC_API_URL` is undefined.

## 22. Severity
- **Classification**: `P1`
- **Rationale**: Authentication gateway; highly sensitive to security and session freshness.

## 23. Recommended Changes
1. Refine TypeScript types on authClient plugin methods to remove `any`.
2. Ensure environment variable fallback is clearly logged in development mode.

## 24. Refactoring Plan
1. Keep functional implementation intact.
2. Replace `any` with proper Better Auth error/data interfaces during Phase 5 (Auth).

## 25. Risks
- Critical security risk: any regression in cookie synchronization will cause immediate 401 Unauthorized errors on all tRPC requests.

## 26. Dependencies / Blockers
- **Upstream Dependencies**: `better-auth`, `expo-secure-store`, `expo-constants`
- **Downstream Consumers**: `lib/trpc.tsx`, `index.tsx`, `login.tsx`, `profile.tsx`
- **Current Blockers**: None.

## 27. Verification Checklist
- [x] TypeScript compilation passes with zero errors (`turbo typecheck`)
- [x] Biome linting and formatting check passes
- [x] Verified SecureStore cookie persistence and retrieval

## 28. Final Audit Decision
- **Decision**: `KEEP + IMPROVE`
- **Reason**: Excellent Better Auth Expo client integration; type annotations should be hardened.

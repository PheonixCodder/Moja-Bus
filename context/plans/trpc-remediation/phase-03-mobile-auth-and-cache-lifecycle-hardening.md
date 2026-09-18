# Plan — Phase 3: Mobile Auth & Cache Lifecycle Hardening

> **Part of:** [tRPC Architecture Remediation Master Plan](./README.md)  
> **Target Workspaces:** `apps/traveler-app`, `apps/driver-app`, `apps/booth-app`  
> **Status:** Ready for Review & Execution  

---

## 1. What we are building

A secure, leak-free authentication and cache lifecycle for all React Native mobile applications. This plan addresses two critical security and performance vulnerabilities:
1. **Session Data Leakage on Shared Hardware:** Guaranteeing that when a driver signs out of a vehicle dashboard tablet or a booth cashier signs out of a terminal counter POS, the local TanStack Query memory cache (`QueryCache`) is unconditionally cleared (`queryClient.clear()`). This prevents sensitive financial ledgers, ticket sales records, and passenger manifests from persisting in memory.
2. **Cold-Boot Authentication Race Condition:** Gating initial tRPC query execution behind asynchronous `Better Auth` session token hydration from `expo-secure-store`, eliminating unnecessary unauthenticated `401 UNAUTHORIZED` requests and duplicate retry round-trips on cold application launch.

---

## 2. Vocabulary agreed

- **QueryCache Poisoning / Leakage:** When cached query data belonging to User A remains populated in the client application's memory after User A signs out, allowing User B (or an unauthorized party on the same device) to inspect or interact with User A's data without network re-authentication.
- **`queryClient.clear()`:** A TanStack Query method that resets the query cache entirely, removing all queries, subscriptions, and cached responses from memory.
- **Hardware SecureStore Hydration:** The asynchronous process on iOS (Keychain) and Android (EncryptedSharedPreferences / Keystore) where encrypted session tokens are decrypted and loaded into JavaScript memory at application startup.
- **Cold Boot Auth Gating:** Holding initial UI queries in a pending or splash-screen state until the local session status (authenticated vs unauthenticated) is definitively confirmed by the storage engine.

---

## 3. Decisions made

1. **Mandatory QueryCache Purge on Logout:**
   - **Decision:** Inject `queryClient.clear()` into the sign-out routines of `apps/driver-app` and `apps/booth-app`. Export a centralized `useSignOut()` or `handleSignOut()` helper that guarantees both `authClient.signOut()` and `queryClient.clear()` execute.
   - **Reasoning:** In transit operations, physical Android tablets are shared across shifts by multiple drivers and booth agents. Clearing the cache on sign out is a strict audit requirement for financial compliance.
2. **Auth Hydration Guard in Root Layout:**
   - **Decision:** In `apps/traveler-app/app/_layout.tsx`, `apps/driver-app/app/_layout.tsx`, and `apps/booth-app/app/_layout.tsx`, wrap child components in an auth session readiness check before mounting data-fetching screens.
   - **Reasoning:** Prevents the initial burst of tRPC queries from firing before `SecureStore` tokens are available to `getAuthCookieHeader()`, cutting application cold-launch network traffic in half.

---

## 4. Assumptions

- `queryClient` instance in `lib/trpc.tsx` can be exported or accessed via `useQueryClient()` in any component or screen within `TRPCReactProvider`.
- Better Auth's `authClient.useSession()` or `authClient.getSession()` exposes an `isPending` or loading state during initial storage hydration on React Native.

---

## 5. Implementation steps

### Step 1: Fix Driver App Logout Flow (`apps/driver-app`)

In [apps/driver-app/features/profile/components/profile-view.tsx](file:///C:/dev/moja-buss/apps/driver-app/features/profile/components/profile-view.tsx):

```diff
+import { useQueryClient } from "@tanstack/react-query";
 import { authClient } from "@/lib/auth-client";

 export function ProfileView() {
   const router = useRouter();
+  const queryClient = useQueryClient();
   const [isSigningOut, setIsSigningOut] = useState(false);

   const handleSignOut = async () => {
     setIsSigningOut(true);
     try {
       await authClient.signOut();
+      // Purge all cached driver shifts, revenue, and active manifests
+      queryClient.clear();
       router.replace("/(auth)/sign-in");
     } catch (error) {
       console.error("Sign out error:", error);
     } finally {
       setIsSigningOut(false);
     }
   };
```

---

### Step 2: Fix Booth App Logout Flow (`apps/booth-app`)

In [apps/booth-app/app/(tabs)/profile.tsx](file:///C:/dev/moja-buss/apps/booth-app/app/(tabs)/profile.tsx):

```diff
+import { useQueryClient } from "@tanstack/react-query";
 import { authClient } from "@/lib/auth-client";

 export default function ProfileScreen() {
   const router = useRouter();
+  const queryClient = useQueryClient();
   const [isLoggingOut, setIsLoggingOut] = useState(false);

   const handleLogout = async () => {
     setIsLoggingOut(true);
     try {
       await authClient.signOut();
+      // Purge cash drawer totals, ticket history, and booth session data
+      queryClient.clear();
       router.replace("/(auth)/sign-in");
     } catch (error) {
       console.error("Sign out error:", error);
     } finally {
       setIsLoggingOut(false);
     }
   };
```

---

### Step 3: Implement Cold-Boot Auth Readiness Gate

In each mobile app's `lib/trpc.tsx`, update `fetchWithAuth` to ensure asynchronous token readiness:

```typescript
// Enhanced token getter with initial storage synchronization
let isAuthHydrated = false;
let authHydrationPromise: Promise<void> | null = null;

export async function ensureAuthHydrated(): Promise<void> {
  if (isAuthHydrated) return;
  if (!authHydrationPromise) {
    authHydrationPromise = (async () => {
      try {
        // Force Better Auth client to resolve session from SecureStore
        await authClient.getSession();
      } catch {
        // Unauthenticated or network offline
      } finally {
        isAuthHydrated = true;
      }
    })();
  }
  return authHydrationPromise;
}
```

Update `fetchWithAuth`:
```diff
 const fetchWithAuth = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
+  // Ensure SecureStore has hydrated before first request
+  await ensureAuthHydrated();
   const cookieHeader = getAuthCookieHeader();
   const headers = new Headers(init?.headers);
...
```

---

## 6. Verification and Testing

### 1. Logout Purge Test (Driver App)
1. Sign into `driver-app` on a simulator or device.
2. Navigate to Shift HUD and verify that shift earnings and active trips are displayed.
3. Sign out via `handleSignOut()`.
4. Inspect the TanStack Query cache in React Native DevTools or console logger.
5. *Expected Outcome:* `queryClient.getQueryCache().getAll().length === 0`. No cached queries remain.
6. Sign in as Driver B; verify no stale data from Driver A flashes on screen.

### 2. Logout Purge Test (Booth App)
1. Sign into `booth-app` and record a test ticket sale.
2. Sign out.
3. *Expected Outcome:* Cash drawer figures and recent ticket sales are completely wiped from memory.

### 3. Cold-Boot Network Trace Test
1. Force kill the mobile app.
2. Launch the app with network request logging enabled.
3. *Expected Outcome:* The first outgoing tRPC request contains a populated `Cookie` or `Authorization` header. Zero `401 UNAUTHORIZED` responses occur on valid sessions.

# Phase 02 — Mobile Error Retry & Network Hygiene

> **Authority:** [`context/audits/trpc-audit/15-findings-and-recommendations.md`](file:///C:/dev/moja-buss/context/audits/trpc-audit/15-findings-and-recommendations.md) (`TRPC-RN-001`, `TRPC-RN-003`)  
> **Target Files:**
> - `apps/traveler-app/lib/trpc.tsx`
> - `apps/driver-app/lib/trpc.tsx`
> - `apps/booth-app/lib/trpc.tsx`

---

## 1. Objectives

1. Eliminate redundant cellular data consumption and latency by implementing a smart error retry predicate in TanStack Query across Traveler, Driver, and Booth applications.
2. Ensure client-side deterministic 4xx errors (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_REQUEST`) fail immediately without retry loops.
3. Pause the 4-minute auth session keepalive polling interval when the mobile application is in the background or inactive (`AppState !== 'active'`), resuming immediately upon foregrounding.

---

## 2. Implementation Steps

### Step 1: Implement Smart Error Retry Predicate in `getQueryClient()`

In each mobile app's `lib/trpc.tsx` (`apps/traveler-app/lib/trpc.tsx`, `apps/driver-app/lib/trpc.tsx`, and `apps/booth-app/lib/trpc.tsx`), configure the default query retry function to inspect tRPC error codes:

```typescript
// apps/{traveler-app,driver-app,booth-app}/lib/trpc.tsx

function getQueryClient() {
	if (!queryClient) {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					staleTime: 30 * 1000,
					retry: (failureCount, error: unknown) => {
						// Extract tRPC error code if present
						const trpcError = error as { data?: { code?: string } } | undefined;
						const code = trpcError?.data?.code;

						// Never retry deterministic client-side 4xx errors
						if (
							code === "UNAUTHORIZED" ||
							code === "FORBIDDEN" ||
							code === "NOT_FOUND" ||
							code === "BAD_REQUEST"
						) {
							return false;
						}

						// Retry transient transport/network failures up to 2 times (total 3 attempts)
						return failureCount < 2;
					},
				},
			},
		});
	}
	return queryClient;
}
```

#### Why This Works:
When an authenticated endpoint returns `UNAUTHORIZED` (e.g., expired session) or `FORBIDDEN` (insufficient role), retrying will yield the identical error every time. Retrying 3 times introduces up to 10 seconds of user-facing lag before the app can trigger logout or redirect to login. By inspecting `error.data.code`, deterministic errors fail on the very first attempt, while transient network drops (timeouts, 502/503/504 gateways) still retry gracefully.

---

### Step 2: Implement AppState-Aware Session Keepalive

In `apps/traveler-app/lib/trpc.tsx`, `apps/driver-app/lib/trpc.tsx`, and `apps/booth-app/lib/trpc.tsx`, import `AppState` and `AppStateStatus` from `"react-native"` and update `AuthSessionKeepAlive`:

```typescript
import { AppState, type AppStateStatus } from "react-native";

function AuthSessionKeepAlive() {
	useEffect(() => {
		let intervalId: ReturnType<typeof setInterval> | null = null;

		const startInterval = () => {
			if (!intervalId) {
				intervalId = setInterval(() => {
					void ensureAuthCookiesFresh();
				}, SESSION_KEEPALIVE_MS);
			}
		};

		const stopInterval = () => {
			if (intervalId) {
				clearInterval(intervalId);
				intervalId = null;
			}
		};

		const handleAppStateChange = (nextAppState: AppStateStatus) => {
			if (nextAppState === "active") {
				// Immediate refresh upon foregrounding to ensure tokens are valid
				void ensureAuthCookiesFresh();
				startInterval();
			} else {
				// Suspend periodic timer while backgrounded to conserve battery
				stopInterval();
			}
		};

		// Initial launch behavior
		void ensureAuthCookiesFresh();
		startInterval();

		const subscription = AppState.addEventListener("change", handleAppStateChange);

		return () => {
			stopInterval();
			subscription.remove();
		};
	}, []);

	return null;
}
```

#### Why This Works:
React Native applications in the background should not execute persistent `setInterval` timers attempting network calls. When the screen is turned off or the app is minimized, the OS suspends background execution. If unpaused, pending intervals can trigger battery warnings or wake-locks. The `AppState` listener suspends the timer when the app leaves `'active'` state and immediately requests fresh auth cookies upon return, guaranteeing fresh credentials before the user triggers their next query.

---

## 3. Risks & Mitigations

| Risk | Severity | Mitigation |
| :--- | :---: | :--- |
| Network glitch misclassified as client error | Low | The predicate checks explicit string enum codes (`"UNAUTHORIZED"`, etc.) on `error.data.code`. If the server returns a 500, network disconnect, or DNS error, `error.data?.code` is either `"INTERNAL_SERVER_ERROR"` or undefined, allowing standard retries to proceed. |
| Backgrounding causes stale session on resume | Low | The `handleAppStateChange` handler executes `void ensureAuthCookiesFresh()` synchronously when entering `"active"`, refreshing cookies before UI interaction resumes. |

---

## 4. Verification & Acceptance Criteria

1. **Compilation Proof**:
   ```bash
   pnpm --filter traveler-app typecheck
   pnpm --filter driver-app typecheck
   pnpm --filter booth-app typecheck
   ```
   All three commands must exit with code 0.

2. **Error Non-Retry Test**:
   - In `apps/traveler-app`, trigger a query requiring authentication while unauthenticated.
   - Inspect the network traffic in Flipper / React Native Debugger or console output.
   - Verify that exactly **one** HTTP request is sent (0 retries).

3. **Background Suspension Test**:
   - Run the mobile app in Expo Go or development build.
   - Minimize the app (send to background).
   - Verify in terminal logs that no session keepalive requests are dispatched after 4 minutes.
   - Reopen the app (foreground); verify fresh session sync executes immediately.

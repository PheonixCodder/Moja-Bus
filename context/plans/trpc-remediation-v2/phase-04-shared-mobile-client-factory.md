# Phase 04 — Shared Mobile Client Factory

> **Authority:** [`context/audits/trpc-audit/15-findings-and-recommendations.md`](file:///C:/dev/moja-buss/context/audits/trpc-audit/15-findings-and-recommendations.md) (`TRPC-RN-002`)  
> **Target Files:**
> - `packages/shared/package.json`
> - `packages/shared/src/trpc/create-mobile-trpc.tsx` (new)
> - `packages/shared/src/trpc/index.ts` (new)
> - `apps/traveler-app/lib/trpc.tsx`
> - `apps/driver-app/lib/trpc.tsx`
> - `apps/booth-app/lib/trpc.tsx`

---

## 1. Objectives

1. Eliminate ~400 lines of triplicate networking and authentication glue code across `traveler-app`, `driver-app`, and `booth-app`.
2. Consolidate mobile tRPC client lifecycle, TanStack Query client caching, SuperJSON transformation, cookie synchronization, 401 retry loops, and AppState-aware keepalive into a single, battle-tested factory in `@moja/shared`.
3. Provide a type-safe, generic interface `createMobileTRPC<TRouter>()` that preserves individual app identity, origin headers, and custom auth storage keys.

---

## 2. Implementation Steps

### Step 1: Configure `@moja/shared` Package Boundaries & Dependencies

Update `packages/shared/package.json` to declare peer dependencies and subpath exports for the mobile client helper:

```json
{
  "name": "@moja/shared",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "Pure shared utilities and mobile client factories for Moja Buss workspaces.",
  "exports": {
    ".": "./src/index.ts",
    "./mobile-client": "./src/trpc/index.ts"
  },
  "files": [
    "src",
    "tsconfig.json"
  ],
  "scripts": {
    "build": "echo \"No build configured for @moja/shared\"",
    "lint": "biome check package.json tsconfig.json src",
    "typecheck": "tsc --noEmit",
    "test": "echo \"No tests configured for @moja/shared\""
  },
  "peerDependencies": {
    "@tanstack/react-query": ">=5.0.0",
    "@trpc/client": "11.19.0",
    "@trpc/server": "11.19.0",
    "@trpc/tanstack-react-query": "11.19.0",
    "react": ">=18.0.0",
    "react-native": "*",
    "superjson": "^2.2.2"
  },
  "peerDependenciesMeta": {
    "@tanstack/react-query": { "optional": true },
    "@trpc/client": { "optional": true },
    "@trpc/server": { "optional": true },
    "@trpc/tanstack-react-query": { "optional": true },
    "react": { "optional": true },
    "react-native": { "optional": true },
    "superjson": { "optional": true }
  },
  "devDependencies": {
    "@moja/typescript": "workspace:*",
    "@tanstack/react-query": "^5.90.21",
    "@trpc/client": "11.19.0",
    "@trpc/server": "11.19.0",
    "@trpc/tanstack-react-query": "11.19.0",
    "@types/react": "^19.2.14",
    "react": "^19.2.4",
    "react-native": "0.86.0",
    "superjson": "^2.2.2"
  }
}
```

---

### Step 2: Create the Mobile Client Factory (`packages/shared/src/trpc/create-mobile-trpc.tsx`)

Implement the reusable client generator incorporating the Phase 2 error retry filter and `AppState` keepalive:

```typescript
// packages/shared/src/trpc/create-mobile-trpc.tsx

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, type TRPCClient } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { AnyRouter } from "@trpc/server";
import { useEffect, type ReactNode } from "react";
import { AppState, type AppStateStatus } from "react-native";
import superjson from "superjson";

export interface MobileTRPCAuthConfig {
	getBaseUrl: () => string;
	getExpoOriginHeader: () => string;
	getAuthCookieHeader: () => string | null | undefined;
	ensureAuthCookiesFresh: () => Promise<void>;
	syncAuthCookiesFromResponse: (res: Response) => Promise<void>;
	staleTimeMs?: number;
	sessionKeepaliveMs?: number;
}

export function createMobileTRPC<TRouter extends AnyRouter>(config: MobileTRPCAuthConfig) {
	const {
		getBaseUrl,
		getExpoOriginHeader,
		getAuthCookieHeader,
		ensureAuthCookiesFresh,
		syncAuthCookiesFromResponse,
		staleTimeMs = 30 * 1000,
		sessionKeepaliveMs = 4 * 60 * 1000,
	} = config;

	const { TRPCProvider, useTRPC } = createTRPCContext<TRouter>();

	let queryClient: QueryClient | undefined;

	function getQueryClient(): QueryClient {
		if (!queryClient) {
			queryClient = new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: staleTimeMs,
						retry: (failureCount, error: unknown) => {
							const trpcError = error as { data?: { code?: string } } | undefined;
							const code = trpcError?.data?.code;

							// Don't retry deterministic 4xx client errors
							if (
								code === "UNAUTHORIZED" ||
								code === "FORBIDDEN" ||
								code === "NOT_FOUND" ||
								code === "BAD_REQUEST"
							) {
								return false;
							}
							return failureCount < 2;
						},
					},
				},
			});
		}
		return queryClient;
	}

	function buildAuthHeaders(): Record<string, string> {
		const headers: Record<string, string> = {
			"expo-origin": getExpoOriginHeader(),
		};

		const cookie = getAuthCookieHeader();
		if (cookie) {
			headers["cookie"] = cookie;
		}

		return headers;
	}

	let isAuthHydrated = false;
	let authHydrationPromise: Promise<void> | null = null;

	async function ensureAuthHydrated(): Promise<void> {
		if (isAuthHydrated) return;
		if (!authHydrationPromise) {
			authHydrationPromise = (async () => {
				try {
					await ensureAuthCookiesFresh();
				} catch {
					// Unauthenticated or offline
				} finally {
					isAuthHydrated = true;
				}
			})();
		}
		return authHydrationPromise;
	}

	async function fetchWithAuth(url: URL | RequestInfo, options?: RequestInit): Promise<Response> {
		await ensureAuthHydrated();

		const request = async (extraHeaders?: Record<string, string>) => {
			const headers = new Headers(options?.headers);
			for (const [key, value] of Object.entries({
				...buildAuthHeaders(),
				...extraHeaders,
			})) {
				headers.set(key, value);
			}

			return fetch(url, {
				...options,
				credentials: "omit",
				headers,
			});
		};

		let response = await request();
		await syncAuthCookiesFromResponse(response);

		// Silent token rotation on 401
		if (response.status === 401) {
			await ensureAuthCookiesFresh();
			response = await request();
			await syncAuthCookiesFromResponse(response);
		}

		return response;
	}

	let trpcClient: TRPCClient<TRouter> | undefined;

	function getTrpcClient(): TRPCClient<TRouter> {
		if (!trpcClient) {
			trpcClient = createTRPCClient<TRouter>({
				links: [
					httpBatchLink({
						transformer: superjson,
						url: `${getBaseUrl()}/api/trpc`,
						headers: buildAuthHeaders,
						fetch: fetchWithAuth,
					}),
				],
			});
		}
		return trpcClient;
	}

	function AuthSessionKeepAlive() {
		useEffect(() => {
			let intervalId: ReturnType<typeof setInterval> | null = null;

			const startInterval = () => {
				if (!intervalId) {
					intervalId = setInterval(() => {
						void ensureAuthCookiesFresh();
					}, sessionKeepaliveMs);
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
					void ensureAuthCookiesFresh();
					startInterval();
				} else {
					stopInterval();
				}
			};

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

	function TRPCReactProvider({ children }: { children: ReactNode }) {
		return (
			<QueryClientProvider client={getQueryClient()}>
				<TRPCProvider trpcClient={getTrpcClient()} queryClient={getQueryClient()}>
					<AuthSessionKeepAlive />
					{children}
				</TRPCProvider>
			</QueryClientProvider>
		);
	}

	return {
		TRPCProvider,
		useTRPC,
		getTrpcClient,
		getQueryClient,
		ensureAuthHydrated,
		TRPCReactProvider,
	};
}
```

Create entry barrel `packages/shared/src/trpc/index.ts`:
```typescript
// packages/shared/src/trpc/index.ts
export { createMobileTRPC, type MobileTRPCAuthConfig } from "./create-mobile-trpc";
```

---

### Step 3: Refactor the Three Mobile Applications

Replace the ~140 lines of duplicate boilerplate in each mobile app with the one-liner factory instantiation:

#### Traveler App (`apps/traveler-app/lib/trpc.tsx`):
```typescript
import type { AppRouter } from "@moja/web/trpc/router";
import { createMobileTRPC } from "@moja/shared/mobile-client";
import {
	ensureAuthCookiesFresh,
	getAuthCookieHeader,
	getExpoOriginHeader,
	getBaseUrl,
	syncAuthCookiesFromResponse,
} from "@/lib/auth-client";

export const {
	TRPCProvider,
	useTRPC,
	getTrpcClient,
	getQueryClient,
	ensureAuthHydrated,
	TRPCReactProvider,
} = createMobileTRPC<AppRouter>({
	getBaseUrl,
	getExpoOriginHeader,
	getAuthCookieHeader,
	ensureAuthCookiesFresh,
	syncAuthCookiesFromResponse,
});
```

#### Driver App (`apps/driver-app/lib/trpc.tsx`):
```typescript
import type { AppRouter } from "@moja/web/trpc/router";
import { createMobileTRPC } from "@moja/shared/mobile-client";
import {
	ensureAuthCookiesFresh,
	getAuthCookieHeader,
	getExpoOriginHeader,
	getBaseUrl,
	syncAuthCookiesFromResponse,
} from "@/lib/auth-client";

export const {
	TRPCProvider,
	useTRPC,
	getTrpcClient,
	getQueryClient,
	ensureAuthHydrated,
	TRPCReactProvider,
} = createMobileTRPC<AppRouter>({
	getBaseUrl,
	getExpoOriginHeader,
	getAuthCookieHeader,
	ensureAuthCookiesFresh,
	syncAuthCookiesFromResponse,
});
```

#### Booth App (`apps/booth-app/lib/trpc.tsx`):
```typescript
import type { AppRouter } from "@moja/web/trpc/router";
import { createMobileTRPC } from "@moja/shared/mobile-client";
import {
	ensureAuthCookiesFresh,
	getAuthCookieHeader,
	getExpoOriginHeader,
	getBaseUrl,
	syncAuthCookiesFromResponse,
} from "@/lib/auth-client";

export const {
	TRPCProvider,
	useTRPC,
	getTrpcClient,
	getQueryClient,
	ensureAuthHydrated,
	TRPCReactProvider,
} = createMobileTRPC<AppRouter>({
	getBaseUrl,
	getExpoOriginHeader,
	getAuthCookieHeader,
	ensureAuthCookiesFresh,
	syncAuthCookiesFromResponse,
});
```

---

## 3. Risks & Mitigations

| Risk | Severity | Mitigation |
| :--- | :---: | :--- |
| Server code leakage into `@moja/shared` | Critical | `@moja/shared` only imports `@trpc/client`, `@trpc/server` (for `AnyRouter` type only), and `@trpc/tanstack-react-query`. No database or server implementation logic is present. |
| Breaking app-specific export signatures | High | The factory returns the exact same object shape (`TRPCProvider`, `useTRPC`, `getTrpcClient`, `getQueryClient`, `ensureAuthHydrated`, `TRPCReactProvider`) exported by the original files. Call sites throughout the apps require 0 changes. |
| React Native Metro bundling of `@moja/shared` | Low | Metro resolves workspace packages via standard tsconfig paths. Because the implementation uses pure TSX without Node built-ins, Metro compiles it seamlessly. |

---

## 4. Verification & Acceptance Criteria

1. **Turborepo Build & Typecheck**:
   ```bash
   pnpm turbo typecheck
   ```
   Must pass across all 12 monorepo packages with 0 errors.

2. **Bundle Inspection**:
   Run `npx expo export` in `apps/traveler-app` and verify zero server modules (`@moja/db`, `@trpc/server/adapters`, `prisma`) appear in the output JS bundle.

3. **Authentication Smoke Test**:
   - Log into traveler-app, driver-app, and booth-app.
   - Verify queries populate data (e.g. search trips, load driver profile, list booth tickets).
   - Verify cookie rotation headers sync on mutating operations.

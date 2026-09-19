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
	maxRetries?: number;
	retryDelay?: (attempt: number) => number;
}

export interface MobileTRPCInstance<TRouter extends AnyRouter> {
	TRPCProvider: ReturnType<typeof createTRPCContext<TRouter>>["TRPCProvider"];
	useTRPC: ReturnType<typeof createTRPCContext<TRouter>>["useTRPC"];
	getTrpcClient: () => TRPCClient<TRouter>;
	getQueryClient: () => QueryClient;
	ensureAuthHydrated: () => Promise<void>;
	TRPCReactProvider: (props: { children: ReactNode }) => React.JSX.Element;
}

export function createMobileTRPC<TRouter extends AnyRouter>(
	config: MobileTRPCAuthConfig,
): MobileTRPCInstance<TRouter> {
	const {
		getBaseUrl,
		getExpoOriginHeader,
		getAuthCookieHeader,
		ensureAuthCookiesFresh,
		syncAuthCookiesFromResponse,
		staleTimeMs = 30 * 1000,
		sessionKeepaliveMs = 4 * 60 * 1000,
		maxRetries = 2,
		retryDelay,
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
							return failureCount < maxRetries;
						},
						...(retryDelay ? { retryDelay } : {}),
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

	async function isUnauthorizedResponse(res: Response): Promise<boolean> {
		if (res.status === 401) return true;
		if (res.status === 207) {
			try {
				const cloned = res.clone();
				const body = await cloned.json();
				if (Array.isArray(body)) {
					return body.some(
						(item) =>
							item?.error?.data?.code === "UNAUTHORIZED" ||
							item?.error?.data?.httpStatus === 401,
					);
				}
			} catch {
				return false;
			}
		}
		return false;
	}

	async function fetchWithAuth(url: URL | RequestInfo, options?: any): Promise<Response> {
		await ensureAuthHydrated();

		const request = async (extraHeaders?: Record<string, string>) => {
			const headers = new Headers(options?.headers as any);
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

		// Silent token rotation on 401 or batched 207 Multi-Status with UNAUTHORIZED
		if (await isUnauthorizedResponse(response)) {
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
						// Generic TRouter's $types['transformer'] is unresolved at factory definition time;
						// cast to any satisfies TransformerOptions<TRoot> without imposing rigid router constraints.
						transformer: superjson as any,
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

			const refreshIfAuthed = () => {
				if (getAuthCookieHeader()) {
					void ensureAuthCookiesFresh();
				}
			};

			const startInterval = () => {
				if (!intervalId) {
					intervalId = setInterval(refreshIfAuthed, sessionKeepaliveMs);
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
					refreshIfAuthed();
					startInterval();
				} else {
					stopInterval();
				}
			};

			refreshIfAuthed();
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

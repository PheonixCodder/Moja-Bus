import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, type TRPCClient } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { useEffect } from "react";
import superjson from "superjson";
import {
	authClient,
	ensureAuthCookiesFresh,
	getAuthCookieHeader,
	getExpoOriginHeader,
	syncAuthCookiesFromResponse,
} from "@/lib/auth-client";

import type { AppRouter } from "../../web/trpc/routers/_app";

const baseURL =
	process.env["EXPO_PUBLIC_API_URL"] ?? "http://192.168.100.3:3000";

const SESSION_KEEPALIVE_MS = 4 * 60 * 1000;

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

let queryClient: QueryClient | undefined;

function getQueryClient() {
	if (!queryClient) {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					staleTime: 30 * 1000,
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

async function fetchWithAuth(url: URL | RequestInfo, options?: RequestInit) {
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

	if (response.status === 401) {
		await ensureAuthCookiesFresh();
		response = await request();
		await syncAuthCookiesFromResponse(response);
	}

	return response;
}

let trpcClient: TRPCClient<AppRouter> | undefined;

export function getTrpcClient() {
	if (!trpcClient) {
		trpcClient = createTRPCClient<AppRouter>({
			links: [
				httpBatchLink({
					transformer: superjson,
					url: `${baseURL}/api/trpc`,
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
		const refresh = () => {
			void ensureAuthCookiesFresh();
		};

		refresh();
		const intervalId = setInterval(refresh, SESSION_KEEPALIVE_MS);
		return () => clearInterval(intervalId);
	}, []);

	return null;
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={getQueryClient()}>
			<TRPCProvider trpcClient={getTrpcClient() as any} queryClient={getQueryClient()}>
				<AuthSessionKeepAlive />
				{children}
			</TRPCProvider>
		</QueryClientProvider>
	);
}

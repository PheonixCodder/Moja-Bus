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
	getBaseUrl,
	syncAuthCookiesFromResponse,
} from "@/lib/auth-client";

import type { AppRouter } from "../../web/trpc/routers/_app";

const baseURL = getBaseUrl();

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
			headers,
		});
	};

	let response = await request();

	if (response.status === 401) {
		await ensureAuthCookiesFresh();
		response = await request();
	}

	await syncAuthCookiesFromResponse(response);
	return response;
}

const trpcClient = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${baseURL}/api/trpc`,
			transformer: superjson,
			fetch: fetchWithAuth,
		}),
	],
});

export function TRPCReactProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const qc = getQueryClient();

	useEffect(() => {
		const interval = setInterval(() => {
			ensureAuthCookiesFresh().catch(() => {});
		}, SESSION_KEEPALIVE_MS);
		return () => clearInterval(interval);
	}, []);

	return (
		<QueryClientProvider client={qc}>
			<TRPCProvider trpcClient={trpcClient} queryClient={qc}>
				{children}
			</TRPCProvider>
		</QueryClientProvider>
	);
}

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, type TRPCClient } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import superjson from "superjson";
import { authClient } from "@/lib/auth-client";

import type { AppRouter } from "../../web/trpc/routers/_app";

const baseURL =
	process.env["EXPO_PUBLIC_API_URL"] ?? "http://192.168.100.3:3000";

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

let trpcClient: TRPCClient<AppRouter> | undefined;

export function getTrpcClient() {
	if (!trpcClient) {
		trpcClient = createTRPCClient<AppRouter>({
			links: [
				httpBatchLink({
					transformer: superjson,
					url: `${baseURL}/api/trpc`,
					async headers() {
						const cookie = (authClient as any).getCookie();
						if (cookie) {
							return { Cookie: cookie };
						}
						return {};
					},
				}),
			],
		});
	}
	return trpcClient;
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={getQueryClient()}>
			<TRPCProvider trpcClient={getTrpcClient() as any} queryClient={getQueryClient()}>
				{children}
			</TRPCProvider>
		</QueryClientProvider>
	);
}

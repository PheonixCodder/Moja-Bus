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

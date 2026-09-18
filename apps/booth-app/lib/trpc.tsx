import type { AppRouter } from "@moja/web/trpc/router";
import { createMobileTRPC } from "@moja/shared/mobile-client";
import {
  ensureAuthCookiesFresh,
  getAuthCookieHeader,
  getBaseUrl,
  getExpoOriginHeader,
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
  maxRetries: 3,
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 10_000),
});

"use client";

import {useState} from "react";
import {QueryClientProvider, type QueryClient} from "@tanstack/react-query";
import {createTRPCClient, httpBatchLink} from "@trpc/client";
import {createTRPCContext} from "@trpc/tanstack-react-query";
import superjson from "superjson";
import {makeQueryClient} from "./query-client";
import type {AppRouter} from "./routers/_app";
import type {inferRouterOutputs} from "@trpc/server";

export type RouterOutputs = inferRouterOutputs<AppRouter>;
export const {TRPCProvider, useTRPC} = createTRPCContext<AppRouter>();

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
    if (typeof window === "undefined") {
        return makeQueryClient();
    }
    browserQueryClient ??= makeQueryClient();
    return browserQueryClient;
}

function getBaseUrl() {
    if (typeof window !== "undefined") {
        return "";
    }
    if (process.env["APP_URL"]) {
        return process.env["APP_URL"];
    }
    return "http://localhost:3000";
}

export function TRPCReactProvider({children}: { children: React.ReactNode }) {
    const queryClient = getQueryClient();

    const [trpcClient] = useState(() =>
        createTRPCClient<AppRouter>({
            links: [
                httpBatchLink({
                    transformer: superjson,
                    url: `${getBaseUrl()}/api/trpc`,
                    fetch(url, options) {
                        return fetch(url, {
                            ...(options ?? {}),
                            credentials: "include",
                        } as RequestInit)
                    },
                    headers() {
                        return {
                            "x-trpc-source": typeof window === "undefined" ? "rsc" : "client",
                        };
                    },
                }),
            ],
        }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
                {children}
            </TRPCProvider>
        </QueryClientProvider>
    );
}

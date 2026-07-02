/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import {
  createTRPCOptionsProxy,
  TRPCQueryOptions,
} from "@trpc/tanstack-react-query";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { appRouter } from "./routers/_app";
import { makeQueryClient } from "./query-client";
import { createContextFromHeaders } from "./init";

export const getQueryClient = cache(makeQueryClient);

async function createServerContext() {
  return createContextFromHeaders(await headers());
}

export const trpc = createTRPCOptionsProxy({
  router: appRouter,
  ctx: createServerContext,
  queryClient: getQueryClient,
});

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}

export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T,
) {
  const queryClient = getQueryClient();

  if (queryOptions.queryKey[1]?.type === "infinite") {
    return queryClient.prefetchInfiniteQuery(queryOptions as any);
  } else {
    return queryClient.prefetchQuery(queryOptions);
  }
}

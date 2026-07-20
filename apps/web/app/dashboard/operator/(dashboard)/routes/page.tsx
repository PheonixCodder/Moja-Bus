

import { OperatorRoutesView } from "@/features/operator/views/operator-routes-view";

import { trpc, prefetch, HydrateClient } from "@/trpc/server";

export const metadata = {
  title: "Routes — Moja Ride Operator",
  description:
    "Create and manage intercity bus routes, stop sequences, and waypoint timing.",
};

export default async function RoutesPage() {
  await Promise.all([
    prefetch(trpc.routes.list.queryOptions()),
    prefetch(trpc.terminals.list.queryOptions({ bookableOnly: true })),
  ]);

  return (
    <HydrateClient>
      <OperatorRoutesView />
    </HydrateClient>
  );
}

import { OperatorTerminalsView } from "@/features/operator/views/operator-terminals-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

export const metadata = {
  title: "Terminal Management - Moja Ride Operator Dashboard",
  description:
    "Manage depots and bookable passenger terminals for intercity routes.",
};

export default async function OperatorTerminalsPage() {
  await Promise.all([
    prefetch(trpc.terminals.list.queryOptions()),
    prefetch(trpc.routes.getCities.queryOptions()),
  ]);

  return (
    <HydrateClient>
      <OperatorTerminalsView />
    </HydrateClient>
  );
}

import { OperatorSchedulesView } from "@/features/operator/views/operator-schedules-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

export const metadata = {
  title: "Schedules — Moja Ride Operator",
  description:
    "Create recurring schedules for your routes, set fares, and auto-generate trips.",
};

export default async function SchedulesPage() {
  await prefetch(trpc.schedules.list.queryOptions({}));

  return (
    <HydrateClient>
      <OperatorSchedulesView />
    </HydrateClient>
  );
}

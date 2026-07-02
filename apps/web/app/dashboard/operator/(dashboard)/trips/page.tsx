import { SidebarTrigger } from "@moja/ui/components/ui/sidebar";
import { Separator } from "@moja/ui/components/ui/separator";
import { OperatorTripsView } from "@/features/operator/views/operator-trips-view";
import { OperatorQuickActions } from "@/features/operator/components/operator-quick-actions";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

export const metadata = {
  title: "Dispatch Board — Moja Ride Operator",
  description:
    "Assign buses and drivers to trips, manage departures, and track live operations.",
};

export default async function TripsPage() {
  await prefetch(trpc.trips.list.queryOptions());
  await prefetch(trpc.fleet.getBuses.queryOptions());

  return (
    <HydrateClient>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-bg-base px-4">
        <SidebarTrigger className="text-text-muted hover:text-text-primary" />
        <Separator orientation="vertical" className="h-4 bg-border" />
        <nav className="flex items-center gap-1 text-xs text-text-muted">
          <span>Operations</span>
          <span className="mx-1 text-text-muted/40">/</span>
          <span className="text-text-primary font-medium">Dispatch Board</span>
        </nav>
        <OperatorQuickActions />
      </header>
      <OperatorTripsView />
    </HydrateClient>
  );
}

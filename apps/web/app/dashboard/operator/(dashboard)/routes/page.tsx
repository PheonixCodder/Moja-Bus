import { SidebarTrigger } from "@moja/ui/components/ui/sidebar";
import { Separator } from "@moja/ui/components/ui/separator";
import { OperatorRoutesView } from "@/features/operator/views/operator-routes-view";
import { OperatorQuickActions } from "@/features/operator/components/operator-quick-actions";
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
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-bg-base px-4">
        <SidebarTrigger className="text-text-muted hover:text-text-primary" />
        <Separator orientation="vertical" className="h-4 bg-border" />
        <nav className="flex items-center gap-1 text-xs text-text-muted">
          <span>Planning</span>
          <span className="mx-1 text-text-muted/40">/</span>
          <span className="text-text-primary font-medium">Routes</span>
        </nav>
        <OperatorQuickActions />
      </header>
      <OperatorRoutesView />
    </HydrateClient>
  );
}

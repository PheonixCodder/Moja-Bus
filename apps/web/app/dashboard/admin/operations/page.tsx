import { SidebarTrigger } from "@moja/ui/components/ui/sidebar";
import { Separator } from "@moja/ui/components/ui/separator";
import { AdminOperationsView } from "@/features/admin/views/admin-operations-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

export const metadata = {
  title: "Operations Oversight — Moja Ride Admin",
  description:
    "Monitor active and upcoming passenger bus trips, live occupancy rates, and delays across the entire market.",
};

export default async function AdminOperationsPage() {
  await prefetch(trpc.public.listOperators.queryOptions());
  await prefetch(
    trpc.admin.listOperations.queryOptions({
      limit: 20,
      offset: 0,
    })
  );

  return (
    <HydrateClient>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-bg-base px-4">
        <SidebarTrigger className="text-text-muted hover:text-text-primary" />
        <Separator orientation="vertical" className="h-4 bg-border" />
        <nav className="flex items-center gap-1 text-xs text-text-muted">
          <span>Admin</span>
          <span className="mx-1 text-text-muted/40">/</span>
          <span className="text-text-primary font-medium">Operations Oversight</span>
        </nav>
      </header>
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900">
              Operations Oversight
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
              Monitor active and upcoming passenger bus trips, live occupancy rates, and delays across the entire market.
            </p>
          </div>
          <AdminOperationsView />
        </div>
      </div>
    </HydrateClient>
  );
}

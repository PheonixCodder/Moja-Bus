import { SidebarTrigger } from "@moja/ui/components/ui/sidebar";
import { Separator } from "@moja/ui/components/ui/separator";
import { AdminDashboardView } from "@/features/admin/views/admin-dashboard-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { dashboardSearchParamsCache } from "@/features/admin/lib/search-params";
import type { SearchParams } from "nuqs/server";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Portal Overview — Moja Ride",
  description:
    "Monitor and manage operators, passengers, financials, and real-time operations across Moja Ride.",
};

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const { from, to } = dashboardSearchParamsCache.parse(await searchParams);

  await Promise.all([
    prefetch(trpc.admin.getDashboardStats.queryOptions({ from, to })),
    prefetch(trpc.admin.getRecentActivity.queryOptions()),
  ]);

  return (
    <HydrateClient>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-bg-base px-4">
        <SidebarTrigger className="text-text-muted hover:text-text-primary" />
        <Separator orientation="vertical" className="h-4 bg-border" />
        <nav className="flex items-center gap-1 text-xs text-text-muted">
          <span>Admin</span>
          <span className="mx-1 text-text-muted/40">/</span>
          <span className="text-text-primary font-medium">Overview</span>
        </nav>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900">
              System Overview
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
              Monitor operators, travelers, financials, and real-time operations across Moja Ride.
            </p>
          </div>
          <AdminDashboardView />
        </div>
      </div>
    </HydrateClient>
  );
}

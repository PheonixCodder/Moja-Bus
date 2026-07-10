import { redirect } from "next/navigation";
import { SidebarTrigger } from "@moja/ui/components/ui/sidebar";
import { Separator } from "@moja/ui/components/ui/separator";
import { OperatorDashboardView } from "@/features/operator/views/operator-dashboard-view";
import { OperatorQuickActions } from "@/features/operator/components/operator-quick-actions";

import { trpc, HydrateClient, prefetch, getQueryClient } from "@/trpc/server";

export const metadata = {
  title: "Overview — Moja Ride Operator",
};

export default async function OperatorDashboardPage() {
  await Promise.all([
    prefetch(trpc.operator.getOnboardingStatus.queryOptions()),
    prefetch(trpc.operator.getDashboardMetrics.queryOptions()),
  ]);
  const data = await getQueryClient().fetchQuery(
    trpc.operator.getOnboardingStatus.queryOptions(),
  );

  if (!data || data.onboardingStatus !== "COMPLETED") {
    redirect("/dashboard/operator/onboarding");
  }

  return (
    <HydrateClient>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-bg-base px-4">
        <SidebarTrigger className="text-text-muted hover:text-text-primary" />
        <Separator orientation="vertical" className="h-4 bg-border" />
        <nav className="flex items-center gap-1 text-xs text-text-muted">
          <span className="text-text-primary font-medium">Overview</span>
        </nav>
        <OperatorQuickActions />
      </header>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <OperatorDashboardView />
      </div>
    </HydrateClient>
  );
}

import { redirect } from "next/navigation";


import { OperatorDashboardView } from "@/features/operator/views/operator-dashboard-view";


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
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <OperatorDashboardView />
      </div>
    </HydrateClient>
  );
}

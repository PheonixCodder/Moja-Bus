import { redirect } from "next/navigation";
import { OperatorOnboardingView } from "@/features/operator/views/operator-onboarding-view";
import { trpc, getQueryClient, prefetch, HydrateClient } from "@/trpc/server";

export default async function OperatorOnboardingPage() {
  prefetch(trpc.operator.getOnboardingStatus.queryOptions());
  prefetch(trpc.routes.getCities.queryOptions());
  const data = await getQueryClient().fetchQuery(
    trpc.operator.getOnboardingStatus.queryOptions(),
  );

  if (data && data.onboardingStatus === "COMPLETED") {
    redirect("/dashboard/operator");
  }

  return (
    <HydrateClient>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 font-display">
                Moja Ride Partner
              </h1>
              <p className="text-xs text-slate-500">
                Business Onboarding Setup
              </p>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-md border border-border p-8 shadow-sm">
            <OperatorOnboardingView />
          </div>
        </main>
      </div>
    </HydrateClient>
  );
}

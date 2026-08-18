import { Suspense } from "react";
import { Skeleton } from "@moja/ui/components/ui/skeleton";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { OperatorPromotionsView } from "@/features/operator/views/operator-promotions-view";

export const metadata = {
  title: "Promotions — Operator",
  description: "Create and manage operator-funded discount codes.",
};

export default async function OperatorPromotionsPage() {
  await prefetch(
    trpc.discountsOperator.listCampaigns.queryOptions({
      limit: 50,
      offset: 0,
    }),
  );
  await prefetch(trpc.discountsOperator.promotionsSummary.queryOptions());
  await prefetch(trpc.discountsOperator.listPlatformOptIns.queryOptions());

  return (
    <HydrateClient>
      <NuqsAdapter>
        <div className="flex min-h-0 flex-1 flex-col">
          <Suspense
            fallback={
              <div className="space-y-4 px-6 py-5">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            }
          >
            <OperatorPromotionsView />
          </Suspense>
        </div>
      </NuqsAdapter>
    </HydrateClient>
  );
}

import { OperatorRevenueView } from "@/features/operator/views/operator-revenue-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { Suspense } from "react";
import { Skeleton } from "@moja/ui/components/ui/skeleton";
import { revenueSearchParamsCache } from "@/features/operator/lib/revenue-search-params";

export const metadata = {
  title: "Revenue Analytics - Moja Ride Operator Dashboard",
};

export default async function OperatorRevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { from, to, tab, page, txType } = revenueSearchParamsCache.parse(await searchParams);

  // Prefetch main KPIs and balances
  await Promise.all([
    prefetch(trpc.operator.getRevenueAnalytics.queryOptions({ 
      from: from.toISOString(), 
      to: to.toISOString() 
    })),
    prefetch(trpc.operator.getAccountSnapshot.queryOptions({ period: "DAILY" })),
  ]);

  // If we are on the ledger tab, prefetch the ledger
  if (tab === "ledger") {
    await prefetch(trpc.operator.getLedgerEntries.queryOptions({
      from: from.toISOString(),
      to: to.toISOString(),
      type: txType,
      page,
      limit: 10,
    }));
  }

  return (
    <HydrateClient>
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <Suspense
          fallback={
            <div className="mx-auto max-w-6xl space-y-6">
              <div className="space-y-1">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          }
        >
          <OperatorRevenueView />
        </Suspense>
      </div>
    </HydrateClient>
  );
}

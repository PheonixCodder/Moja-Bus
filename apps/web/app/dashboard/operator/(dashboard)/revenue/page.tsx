import { SidebarTrigger } from "@moja/ui/components/ui/sidebar";
import { Separator } from "@moja/ui/components/ui/separator";
import { OperatorRevenueView } from "@/features/operator/views/operator-revenue-view";
import { OperatorQuickActions } from "@/features/operator/components/operator-quick-actions";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { Suspense } from "react";
import { Skeleton } from "@moja/ui/components/ui/skeleton";
import { createSearchParamsCache } from "nuqs/server";
import { revenueParamsSchema } from "@/features/operator/lib/revenue-params";

export const metadata = {
  title: "Revenue Analytics - Moja Ride Operator Dashboard",
};

const searchParamsCache = createSearchParamsCache(revenueParamsSchema);

export default async function OperatorRevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { from, to } = searchParamsCache.parse(await searchParams);

  await prefetch(
    trpc.operator.getRevenueAnalytics.queryOptions({ from, to }),
  );

  return (
    <HydrateClient>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-bg-base px-4">
        <SidebarTrigger className="text-text-muted hover:text-text-primary" />
        <Separator orientation="vertical" className="h-4 bg-border" />
        <nav className="flex items-center gap-1 text-xs text-text-muted">
          <span>Financials</span>
          <span className="mx-1 text-text-muted/40">/</span>
          <span className="text-text-primary font-medium">Revenue</span>
        </nav>
        <OperatorQuickActions />
      </header>
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <Suspense
          fallback={
            <div className="mx-auto max-w-6xl space-y-6">
              <div className="space-y-1">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
          }
        >
          <OperatorRevenueView />
        </Suspense>
      </div>
    </HydrateClient>
  );
}

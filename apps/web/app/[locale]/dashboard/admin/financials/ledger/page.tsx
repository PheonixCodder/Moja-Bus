import { Suspense } from "react";
import { Skeleton } from "@moja/ui/components/ui/skeleton";
import { HydrateClient, trpc, prefetch } from "@/trpc/server";
import { ledgerSearchParamsCache } from "@/features/admin/lib/search-params";
import { AdminLedgerView } from "@/features/admin/views/admin-ledger-view";
import { DashboardHeader } from "@/features/admin/components/dashboard-header";
import { SearchParams } from "nuqs";

interface LedgerPageProps {
  searchParams: Promise<SearchParams>;
}

export const metadata = {
  title: "Double-Entry Ledger Sheet — Moja Ride Admin",
  description: "Monitor transaction journals, ledger account entry sheets, and balance validations.",
};

export default async function LedgerPage({ searchParams }: LedgerPageProps) {
  const parsedParams = await ledgerSearchParamsCache.parse(searchParams);

  const currentPageIndex = parsedParams.page - 1; // 0-indexed offset

  // Prefetch ledger entries query on the server side using the prefetch helper
  await prefetch(
    trpc.admin.listLedgerEntries.queryOptions({
      search: parsedParams.q || undefined,
      side: parsedParams.side === "ALL" ? undefined : (parsedParams.side as any),
      type: parsedParams.type === "ALL" ? undefined : parsedParams.type,
      limit: parsedParams.pageSize,
      offset: currentPageIndex * parsedParams.pageSize,
    })
  );

  return (
    <HydrateClient>
      <DashboardHeader
        breadcrumbs={[
          { label: "Admin" },
          { label: "Financials" },
          { label: "Ledger" },
        ]}
      />
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900">
              Double-Entry Ledger Sheet
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
              Monitor transaction journals, ledger account entry sheets, and balance validations.
            </p>
          </div>
          <Suspense
            fallback={
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            }
          >
            <AdminLedgerView />
          </Suspense>
        </div>
      </div>
    </HydrateClient>
  );
}

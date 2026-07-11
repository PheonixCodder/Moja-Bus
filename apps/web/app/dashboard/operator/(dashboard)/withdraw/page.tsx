import { SidebarTrigger } from "@moja/ui/components/ui/sidebar";
import { Separator } from "@moja/ui/components/ui/separator";
import { OperatorWithdrawView } from "@/features/operator/views/operator-withdraw-view";
import { OperatorQuickActions } from "@/features/operator/components/operator-quick-actions";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { Suspense } from "react";
import { Skeleton } from "@moja/ui/components/ui/skeleton";

export const metadata = {
  title: "Withdrawals - Moja Ride Operator Dashboard",
};

export default async function OperatorWithdrawPage() {
  await prefetch(
    trpc.operator.getAccountSnapshot.queryOptions({ period: "DAILY" })
  );
  await prefetch(
    trpc.operator.listWithdrawals.queryOptions({ limit: 10, offset: 0 })
  );

  return (
    <HydrateClient>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-bg-base px-4">
        <SidebarTrigger className="text-text-muted hover:text-text-primary" />
        <Separator orientation="vertical" className="h-4 bg-border" />
        <nav className="flex items-center gap-1 text-xs text-text-muted">
          <span>Financials</span>
          <span className="mx-1 text-text-muted/40">/</span>
          <span className="text-text-primary font-medium">Withdrawals</span>
        </nav>
        <OperatorQuickActions />
      </header>
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <Suspense
          fallback={
            <div className="mx-auto max-w-4xl space-y-6">
              <div className="space-y-1">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
              <Skeleton className="h-96 w-full max-w-md" />
            </div>
          }
        >
          <OperatorWithdrawView />
        </Suspense>
      </div>
    </HydrateClient>
  );
}

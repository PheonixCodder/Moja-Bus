import { SidebarTrigger } from "@moja/ui/components/ui/sidebar";
import { Separator } from "@moja/ui/components/ui/separator";
import { AdminWithdrawalsView } from "@/features/admin/views/admin-withdrawals-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { Suspense } from "react";
import { Skeleton } from "@moja/ui/components/ui/skeleton";

export const metadata = {
  title: "Withdrawal Queue — Moja Ride Admin",
  description: "Monitor and manually resolve transport company bank withdrawal requests.",
};

export default async function AdminWithdrawalsPage() {
  // Prefetch first page of withdrawals queue
  await prefetch(
    trpc.admin.listAllWithdrawals.queryOptions({ limit: 15, offset: 0 })
  );

  return (
    <HydrateClient>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-bg-base px-4">
        <SidebarTrigger className="text-text-muted hover:text-text-primary" />
        <Separator orientation="vertical" className="h-4 bg-border" />
        <nav className="flex items-center gap-1 text-xs text-text-muted">
          <span>Admin</span>
          <span className="mx-1 text-text-muted/40">/</span>
          <span className="text-text-primary font-medium">Withdrawal Queue</span>
        </nav>
      </header>
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900">
              Withdrawal Queue
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
              Audit, trace, and manually resolve transport company bank payout requests.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
                <Skeleton className="h-96 w-full" />
              </div>
            }
          >
            <AdminWithdrawalsView />
          </Suspense>
        </div>
      </div>
    </HydrateClient>
  );
}

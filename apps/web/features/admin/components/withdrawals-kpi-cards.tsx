"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { useTRPC } from "@/trpc/client";
import { withdrawalsSearchParams } from "../lib/search-params";
import { formatXOF } from "@/features/operator/lib/currency";
import { Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";

export function WithdrawalsKpiCards() {
  const trpc = useTRPC();
  const [{ from, to }] = useQueryStates(withdrawalsSearchParams);

  const { data: stats } = useSuspenseQuery(
    trpc.admin.getWithdrawalStats.queryOptions({ from, to })
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-border rounded-xl bg-bg-base/50 p-1">
      <div className="flex flex-col gap-1 p-5 border border-border/50 rounded-lg bg-bg-base shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Clock className={cn("size-5", stats.pendingCount > 0 ? "text-amber-500 animate-pulse" : "text-muted-foreground")} />
          <h3 className="font-medium text-sm text-text-muted">Pending Queue</h3>
        </div>
        <p className="text-2xl font-bold text-text-primary tracking-tight">
          {stats.pendingCount} <span className="text-sm font-normal text-text-muted">requests</span>
        </p>
        <p className="text-sm font-medium text-amber-600 dark:text-amber-500">
          {formatXOF(stats.pendingVolumeXOF)}
        </p>
      </div>

      <div className="flex flex-col gap-1 p-5 border border-border/50 rounded-lg bg-bg-base shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="size-5 text-emerald-500" />
          <h3 className="font-medium text-sm text-text-muted">Total Settled</h3>
        </div>
        <p className="text-2xl font-bold text-text-primary tracking-tight">
          {stats.settledCount} <span className="text-sm font-normal text-text-muted">payouts</span>
        </p>
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-500">
          {formatXOF(stats.settledVolumeXOF)}
        </p>
      </div>

      <div className="flex flex-col gap-1 p-5 border border-border/50 rounded-lg bg-bg-base shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <XCircle className="size-5 text-rose-500" />
          <h3 className="font-medium text-sm text-text-muted">Failed / Reversed</h3>
        </div>
        <p className="text-2xl font-bold text-text-primary tracking-tight">
          {stats.failedCount} <span className="text-sm font-normal text-text-muted">reversed</span>
        </p>
        <p className="text-sm font-medium text-rose-600 dark:text-rose-500">
          {formatXOF(stats.failedVolumeXOF)}
        </p>
      </div>

      <div className="col-span-1 sm:col-span-3 px-4 py-2 mt-1 flex items-center justify-between text-xs text-text-muted">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="size-3.5" />
          <span>Showing data based on current date range. Total transactions: <span className="font-semibold text-text-primary">{stats.totalCount}</span></span>
        </div>
      </div>
    </div>
  );
}

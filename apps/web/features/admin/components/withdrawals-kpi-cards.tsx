"use client";

import { cn } from "@moja/ui/lib/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";
import { formatXOF } from "@/features/operator/lib/currency";
import { useTRPC } from "@/trpc/client";
import { withdrawalsSearchParams } from "../lib/search-params";

export function WithdrawalsKpiCards() {
  const trpc = useTRPC();
  const t = useTranslations("adminDashboard.withdrawalsKpiCards");
  const [{ from, to }] = useQueryStates(withdrawalsSearchParams);

  const { data: stats } = useSuspenseQuery(
    trpc.admin.getWithdrawalStats.queryOptions({ from, to }),
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-border rounded-xl bg-bg-base/50 p-1">
      <div className="flex flex-col gap-1 p-5 border border-border/50 rounded-lg bg-bg-base shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Clock
            className={cn(
              "size-5",
              stats.pendingCount > 0
                ? "text-amber-500 animate-pulse"
                : "text-muted-foreground",
            )}
          />
          <h3 className="font-medium text-sm text-text-muted">
            {t("pendingQueue")}
          </h3>
        </div>
        <p className="text-2xl font-bold text-text-primary tracking-tight">
          {stats.pendingCount}{" "}
          <span className="text-sm font-normal text-text-muted">
            {t("requests")}
          </span>
        </p>
        <p className="text-sm font-medium text-amber-600 dark:text-amber-500">
          {formatXOF(stats.pendingVolumeXOF)}
        </p>
      </div>

      <div className="flex flex-col gap-1 p-5 border border-border/50 rounded-lg bg-bg-base shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="size-5 text-emerald-500" />
          <h3 className="font-medium text-sm text-text-muted">
            {t("totalSettled")}
          </h3>
        </div>
        <p className="text-2xl font-bold text-text-primary tracking-tight">
          {stats.settledCount}{" "}
          <span className="text-sm font-normal text-text-muted">
            {t("payouts")}
          </span>
        </p>
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-500">
          {formatXOF(stats.settledVolumeXOF)}
        </p>
      </div>

      <div className="flex flex-col gap-1 p-5 border border-border/50 rounded-lg bg-bg-base shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <XCircle className="size-5 text-rose-500" />
          <h3 className="font-medium text-sm text-text-muted">
            {t("failedReversed")}
          </h3>
        </div>
        <p className="text-2xl font-bold text-text-primary tracking-tight">
          {stats.failedCount}{" "}
          <span className="text-sm font-normal text-text-muted">
            {t("reversed")}
          </span>
        </p>
        <p className="text-sm font-medium text-rose-600 dark:text-rose-500">
          {formatXOF(stats.failedVolumeXOF)}
        </p>
      </div>

      <div className="col-span-1 sm:col-span-3 px-4 py-2 mt-1 flex items-center justify-between text-xs text-text-muted">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="size-3.5" />
          <span>
            {t("showingData")}{" "}
            <span className="font-semibold text-text-primary">
              {stats.totalCount}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

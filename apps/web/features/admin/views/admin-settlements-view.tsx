"use client";

import { Skeleton } from "@moja/ui/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { SettlementsClearingCard } from "../components/settlements-clearing-card";
import { SettlementsHistoryTable } from "../components/settlements-history-table";
import { SettlementsPayoutPanel } from "../components/settlements-payout-panel";

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="p-6 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export function AdminSettlementsView() {
  const t = useTranslations("adminDashboard.adminSettlementsView");
  return (
    <div className="space-y-8">
      {/* Section 1 — Treasury Clearing Balance */}
      <section>
        <Suspense fallback={<SectionSkeleton rows={4} />}>
          <SettlementsClearingCard />
        </Suspense>
      </section>

      {/* Section 2 — Manual Offline Settlement */}
      <section>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-foreground tracking-tight">
            {t("manualOfflineSettlement")}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("recordDisbursement")}
          </p>
        </div>
        <Suspense fallback={<SectionSkeleton rows={5} />}>
          <SettlementsPayoutPanel />
        </Suspense>
      </section>

      {/* Section 3 — Settlement History */}
      <section>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-foreground tracking-tight">
            {t("settlementHistory")}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("payoutLog")}
          </p>
        </div>
        <Suspense fallback={<SectionSkeleton rows={6} />}>
          <SettlementsHistoryTable />
        </Suspense>
      </section>
    </div>
  );
}

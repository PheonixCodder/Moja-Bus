"use client";

import { Suspense } from "react";
import { Skeleton } from "@moja/ui/components/ui/skeleton";
import { SettlementsClearingCard } from "../components/settlements-clearing-card";
import { SettlementsPayoutPanel } from "../components/settlements-payout-panel";
import { SettlementsHistoryTable } from "../components/settlements-history-table";

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
            Manual Offline Settlement
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Record a disbursement made outside the Paystack transfer system (e.g. cash, bank wire).
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
            Settlement History
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Chronological log of all manually recorded operator payouts.
          </p>
        </div>
        <Suspense fallback={<SectionSkeleton rows={6} />}>
          <SettlementsHistoryTable />
        </Suspense>
      </section>
    </div>
  );
}

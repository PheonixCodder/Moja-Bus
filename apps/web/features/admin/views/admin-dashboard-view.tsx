"use client";

import { Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useQueryStates } from "nuqs";
import { dashboardSearchParams } from "../lib/search-params";
import { DashboardKpiCards } from "../components/dashboard/dashboard-kpi-cards";
import { DashboardRevenueChart } from "../components/dashboard/dashboard-revenue-chart";
import { DashboardActivityFeed } from "../components/dashboard/dashboard-activity-feed";
import { DashboardPlatformHealth } from "../components/dashboard/dashboard-platform-health";
import { DashboardTreasuryCards } from "../components/dashboard/dashboard-treasury-cards";
import { Skeleton } from "@moja/ui/components/ui/skeleton";

function StatsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <Skeleton className="h-80 w-full" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

function DashboardContent() {
  const trpc = useTRPC();
  const [{ from, to }] = useQueryStates(dashboardSearchParams);

  const { data: stats } = useSuspenseQuery(
    trpc.admin.getDashboardStats.queryOptions({ from, to })
  );

  const { data: activity } = useSuspenseQuery(
    trpc.admin.getRecentActivity.queryOptions()
  );

  return (
    <div className="space-y-6">
      <DashboardKpiCards
        gmv={stats.gmv}
        gmvDeltaPct={stats.gmvDeltaPct}
        commission={stats.commission}
        bookingsCurrent={stats.bookingsCurrent}
        bookingDeltaPct={stats.bookingDeltaPct}
        pendingOperatorsCount={stats.pendingOperatorsCount}
        travelersCount={stats.travelersCount}
        operatorsCount={stats.operatorsCount}
      />

      <DashboardTreasuryCards
        systemLiquidity={stats.systemLiquidity}
        operatorPayables={stats.operatorPayables}
        passengerWallets={stats.passengerWallets}
      />

      <DashboardRevenueChart
        revenueTrend={stats.revenueTrend}
        totalGmv={stats.gmv}
        bookingsCurrent={stats.bookingsCurrent}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardActivityFeed
            recentCompanies={activity.recentCompanies}
            recentBookings={activity.recentBookings}
          />
        </div>
        <div className="lg:col-span-1">
          <DashboardPlatformHealth
            pendingOperatorsCount={stats.pendingOperatorsCount}
            activeTripsCount={stats.activeTripsCount}
          />
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardView() {
  return (
    <Suspense fallback={<StatsSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

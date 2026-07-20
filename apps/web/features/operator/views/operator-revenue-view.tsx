"use client";

import { useQueryStates } from "nuqs";
import { revenueParsers } from "../lib/revenue-search-params";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

import { RevenueHeader } from "../components/revenue/revenue-header";
import { ArrearsAlertBanner } from "../components/revenue/arrears-alert-banner";
import { BalanceOverviewCards } from "../components/revenue/balance-overview-cards";
import { OperationalMetricsGrid } from "../components/revenue/operational-metrics-grid";
import { RevenueAnalyticsChart } from "../components/revenue/revenue-analytics-chart";
import { RoutePerformanceTable } from "../components/revenue/route-performance-table";
import { TransactionLedgerTable } from "../components/revenue/transaction-ledger-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@moja/ui/components/ui/tabs";

export function OperatorRevenueView() {
  const trpc = useTRPC();
  const [{ from, to, tab }, setParams] = useQueryStates(revenueParsers, {
    shallow: false,
  });

  const { data: analytics } = useSuspenseQuery(
    trpc.operator.getRevenueAnalytics.queryOptions({ 
      from: from.toISOString(), 
      to: to.toISOString() 
    })
  );

  const { data: balances } = useSuspenseQuery(
    trpc.operator.getAccountSnapshot.queryOptions({ period: "DAILY" })
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <RevenueHeader />

      <ArrearsAlertBanner availableBalance={balances.liveAvailableBalance} />

      <BalanceOverviewCards 
        availableBalance={balances.liveAvailableBalance}
        reservedBalance={balances.liveReservedBalance}
        netEarnings={analytics.kpis.netRevenueXOF}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <RevenueAnalyticsChart 
            timeSeries={analytics.timeSeries} 
            totalNet={analytics.kpis.netRevenueXOF}
          />
        </div>
        <div className="lg:col-span-1">
          <OperationalMetricsGrid kpis={analytics.kpis} />
        </div>
      </div>

      <Tabs 
        value={tab} 
        onValueChange={(val) => setParams({ tab: val, page: 1 })} 
        className="space-y-6 flex flex-col"
      >
        <div className="flex items-center justify-between border-b pb-2">
          <TabsList className="bg-transparent space-x-4 p-0">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2"
            >
              Route Performance
            </TabsTrigger>
            <TabsTrigger 
              value="ledger" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2"
            >
              Transaction Ledger
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-0 outline-none">
          <RoutePerformanceTable topRoutes={analytics.topRoutes} />
        </TabsContent>

        <TabsContent value="ledger" className="mt-0 outline-none">
          <TransactionLedgerTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}


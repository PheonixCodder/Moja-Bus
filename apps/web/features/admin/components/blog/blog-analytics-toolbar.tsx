"use client";

import { useQueryState } from "nuqs";
import { Tabs, TabsList, TabsTrigger } from "@moja/ui/components/ui/tabs";

export function BlogAnalyticsToolbar() {
  const [period, setPeriod] = useQueryState("period", {
    defaultValue: "30d",
    shallow: false,
  });

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Overview</h2>
      <Tabs value={period} onValueChange={(v) => setPeriod(v)}>
        <TabsList>
          <TabsTrigger value="7d">Last 7 days</TabsTrigger>
          <TabsTrigger value="30d">Last 30 days</TabsTrigger>
          <TabsTrigger value="90d">Last 90 days</TabsTrigger>
          <TabsTrigger value="all">All time</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

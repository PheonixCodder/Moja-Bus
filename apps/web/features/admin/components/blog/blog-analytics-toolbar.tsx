"use client";

import { Tabs, TabsList, TabsTrigger } from "@moja/ui/components/ui/tabs";
import { useTranslations } from "next-intl";
import { useQueryState } from "nuqs";

export function BlogAnalyticsToolbar() {
  const t = useTranslations("adminDashboard.blogAnalytics");
  const [period, setPeriod] = useQueryState("period", {
    defaultValue: "30d",
    shallow: false,
  });

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
        {t("overview")}
      </h2>
      <Tabs value={period} onValueChange={(v) => setPeriod(v)}>
        <TabsList>
          <TabsTrigger value="7d">{t("last7Days")}</TabsTrigger>
          <TabsTrigger value="30d">{t("last30Days")}</TabsTrigger>
          <TabsTrigger value="90d">{t("last90Days")}</TabsTrigger>
          <TabsTrigger value="all">{t("allTime")}</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

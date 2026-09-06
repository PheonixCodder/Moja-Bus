"use client";

import { type ChartConfig, ChartContainer } from "@moja/ui/components/ui/chart";
import { Skeleton } from "@moja/ui/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Gauge, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTRPC } from "@/trpc/client";

type Analytics = {
  summary: {
    averageRating: number;
    totalReviews: number;
    safetyScore: number;
    totalTripsCompleted: number;
    totalDistanceKm: number;
    recentOverspeed: number;
    recentHarshBraking: number;
  };
  ratingTrend: Array<{ month: string; averageRating: number; reviews: number }>;
  distribution: Array<{ star: number; count: number }>;
  recentAnomalies: Array<{
    reason: string;
    speedKmh: number | null;
    recordedAt: Date;
  }>;
};

const CARD_CLS = "rounded-xl border bg-card p-4 flex flex-col gap-2";

const ratingTrendConfig = {
  averageRating: {
    label: "Rating",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

const safetyGaugeConfig = {
  value: {
    label: "Safety",
    color: "var(--success)",
  },
} satisfies ChartConfig;

const distributionConfig = {
  count: {
    label: "Reviews",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

function ChartCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Gauge;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={CARD_CLS}>
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" />
        {title}
      </div>
      {children}
    </div>
  );
}

export function DriverAnalyticsCharts({
  driverProfileId,
}: {
  driverProfileId: string;
}) {
  const t = useTranslations("operatorDashboard.drivers");
  const trpc = useTRPC();

  const { data, isLoading } = useQuery({
    ...trpc.drivers.getDriverAnalytics.queryOptions({ driverProfileId }),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    );
  }
  if (!data) return null;

  const analytics = data as Analytics;
  const gaugeData = [
    {
      name: "score",
      value: analytics.summary.safetyScore,
      fill: "var(--color-value)",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Rating trend — 12 months */}
      <ChartCard icon={TrendingUp} title={t("analytics.ratingTrend")}>
        {analytics.ratingTrend.length === 0 ? (
          <p className="py-10 text-center text-xs italic text-muted-foreground">
            {t("analytics.noData")}
          </p>
        ) : (
          <ChartContainer config={ratingTrendConfig} className="h-40 w-full">
            <LineChart data={analytics.ratingTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 9 }}
                tickFormatter={(m: string) => m.slice(2)}
              />
              <YAxis domain={[1, 5]} tick={{ fontSize: 9 }} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
                formatter={((v: any) => [Number(v).toFixed(2), "★"]) as any}
              />
              <Line
                type="monotone"
                dataKey="averageRating"
                stroke="var(--color-averageRating)"
                strokeWidth={2}
                dot={{ r: 2.5 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </ChartCard>

      {/* Safety gauge */}
      <ChartCard icon={Gauge} title={t("analytics.safetyGauge")}>
        <div className="flex items-center justify-center gap-6 py-2">
          <div className="relative h-36 w-36">
            <ChartContainer
              config={safetyGaugeConfig}
              className="h-full w-full aspect-square"
            >
              <RadialBarChart
                innerRadius="72%"
                outerRadius="100%"
                data={gaugeData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={12} />
              </RadialBarChart>
            </ChartContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-success">
                {analytics.summary.safetyScore}
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground">
                / 100
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-destructive" />
              <span className="text-muted-foreground">
                {t("analytics.overspeed")}
              </span>
              <span className="font-bold">
                {analytics.summary.recentOverspeed}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-warning" />
              <span className="text-muted-foreground">
                {t("analytics.harshBraking")}
              </span>
              <span className="font-bold">
                {analytics.summary.recentHarshBraking}
              </span>
            </div>
          </div>
        </div>
      </ChartCard>

      {/* Rating distribution */}
      <ChartCard icon={BarChart3} title={t("analytics.distribution")}>
        <ChartContainer config={distributionConfig} className="h-40 w-full">
          <BarChart data={analytics.distribution}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
            <XAxis
              dataKey="star"
              tick={{ fontSize: 9 }}
              tickFormatter={(s: number) => `${s}★`}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 9 }} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8 }}
              formatter={((v: any) => [v, t("analytics.reviewsLabel")]) as any}
            />
            <Bar
              dataKey="count"
              radius={[4, 4, 0, 0]}
              fill="var(--color-count)"
            />
          </BarChart>
        </ChartContainer>
      </ChartCard>
    </div>
  );
}

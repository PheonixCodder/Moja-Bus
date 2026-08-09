"use client";

import type { TravelInsightsBucket, TravelInsightsPoint } from "@moja/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@moja/ui/components/ui/chart";
import { useLocale, useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { DashboardDateRangePicker } from "@/features/dashboard/components/dashboard-date-range-picker";
import { formatXOF } from "@/lib/money";

interface TravelInsightsChartProps {
  bucket: TravelInsightsBucket;
  items: TravelInsightsPoint[];
}

const MONTH_KEYS = /^(\d{4})-(\d{2})$/;
const DAY_KEYS = /^(\d{4})-(\d{2})-(\d{2})$/;

function labelForKey(
  locale: string,
  bucket: TravelInsightsBucket,
  key: string,
): string {
  if (bucket === "MONTHLY") {
    const match = MONTH_KEYS.exec(key);
    if (match) {
      const [, year, month] = match;
      return new Intl.DateTimeFormat(locale, {
        month: "short",
        year: "2-digit",
      }).format(new Date(Date.UTC(Number(year), Number(month) - 1, 1)));
    }
  } else {
    const match = DAY_KEYS.exec(key);
    if (match) {
      const [, year, month, day] = match;
      return new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
      }).format(
        new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))),
      );
    }
  }
  return key;
}

export function TravelInsightsChart({
  bucket,
  items,
}: TravelInsightsChartProps) {
  const t = useTranslations("passengerDashboard.tickets");
  const locale = useLocale();

  const chartConfig = {
    trips: {
      label: t("chartTripsLabel"),
      color: "#ee237c",
    },
    spentXOF: {
      label: t("chartSpentLabel"),
      color: "var(--color-muted-foreground)",
    },
  } satisfies ChartConfig;

  const chartData = items.map((item) => ({
    label: labelForKey(locale, bucket, item.key),
    trips: item.trips,
    spentXOF: item.spentXOF,
  }));

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-bold text-foreground">
            {t("chartTitle")}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {t("chartDescription")}
          </CardDescription>
        </div>
        <DashboardDateRangePicker />
      </CardHeader>
      <CardContent className="pt-2">
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-muted-foreground">
            {t("chartEmpty")}
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-60 w-full">
            <AreaChart
              data={chartData}
              margin={{ left: 0, right: 10, top: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ee237c" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ee237c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                className="stroke-muted/40"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                tickFormatter={(v) => `${v}`}
                width={25}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="bg-popover text-popover-foreground border border-border"
                    formatter={(value, name) => (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs leading-none">
                          {name === "spentXOF"
                            ? formatXOF(Number(value))
                            : t("chartTooltipTrips", { value: String(value) })}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="trips"
                stroke="#ee237c"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTrips)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

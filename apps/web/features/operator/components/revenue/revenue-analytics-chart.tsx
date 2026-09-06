"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@moja/ui/components/ui/chart";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from "recharts";
import { formatXOF } from "../../lib/currency";

const chartConfig = {
  netXOF: {
    label: "Net",
    color: "var(--success)",
  },
} satisfies ChartConfig;

export function RevenueAnalyticsChart({
  timeSeries,
}: {
  timeSeries: any[];
  totalNet: number;
}) {
  const t = useTranslations("operatorDashboard.revenue.chart");
  const data = useMemo(() => {
    return timeSeries.map((d) => ({
      ...d,
      displayDate: format(parseISO(d.date), "dd MMM", { locale: fr }),
    }));
  }, [timeSeries]);

  return (
    <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground">{t("title")}</h3>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <div className="h-[300px] w-full">
        {data.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground bg-muted/50 rounded-lg border border-dashed">
            {t("noData")}
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-netXOF)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-netXOF)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="displayDate"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickFormatter={(value: number | bigint) =>
                  new Intl.NumberFormat("en-US", {
                    notation: "compact",
                    compactDisplay: "short",
                  }).format(value)
                }
                dx={-10}
              />
              <ChartTooltip
                content={({ active, payload, label }: TooltipContentProps) => {
                  if (active && payload?.length) {
                    return (
                      <div className="bg-popover text-popover-foreground border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium text-foreground mb-2">
                          {label}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-success" />
                          <span className="text-sm text-muted-foreground">
                            {t("tooltipLabel")}
                          </span>
                          <span className="text-sm font-semibold text-success">
                            {formatXOF(payload[0]?.value as number)}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="netXOF"
                stroke="var(--color-netXOF)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorNet)"
                activeDot={{
                  r: 4,
                  strokeWidth: 0,
                  fill: "var(--color-netXOF)",
                }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </div>
    </div>
  );
}

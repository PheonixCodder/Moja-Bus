"use client";

import { Bar, BarChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@moja/ui/components/ui/chart";
import { type RouterOutputs } from "@/trpc/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type TimeSeriesEntry = RouterOutputs["operator"]["getRevenueAnalytics"]["timeSeries"][number];

const chartConfig = {
  gross: {
    label: "Gross Revenue",
    color: "var(--color-indigo-500)",
  },
  net: {
    label: "Net Revenue",
    color: "var(--color-emerald-500)",
  },
};

export function RevenueChart({ timeSeries }: { timeSeries: TimeSeriesEntry[] }) {
  // Format the dates for display
  const chartData = timeSeries.map((entry) => ({
    ...entry,
    displayDate: format(new Date(entry.date), "dd MMM", { locale: fr }),
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold font-display tracking-tight text-slate-900">Daily Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[350px] items-center justify-center text-muted-foreground text-sm">
            No data available for the selected period
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold font-display tracking-tight text-slate-900">Daily Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-slate-200" />
              <XAxis
                dataKey="displayDate"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs fill-muted-foreground"
              />
              <Tooltip
                cursor={{ fill: "var(--color-slate-100)" }}
                content={<ChartTooltipContent />}
              />
              <Bar
                dataKey="grossXOF"
                fill="var(--color-indigo-200)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="netXOF"
                fill="var(--color-emerald-500)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-indigo-200" />
            <span>Gross Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span>Net Revenue</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

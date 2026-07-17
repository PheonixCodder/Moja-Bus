"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@moja/ui/components/ui/chart";

interface TravelStatsChartProps {
  data: Array<{
    month: string;
    trips: number;
    spent: number;
  }>;
}

const chartConfig = {
  trips: {
    label: "Trips Taken",
    color: "#ee237c",
  },
  spent: {
    label: "Amount Spent (XOF)",
    color: "var(--color-muted-foreground)",
  },
} satisfies ChartConfig;

export function TravelStatsChart({ data }: TravelStatsChartProps) {
  // If no trips, show a beautiful visual baseline
  const hasData = data.some((item) => item.trips > 0);
  const chartData = hasData
    ? data
    : data.map((item, idx) => ({
        ...item,
        // Mock a subtle baseline curve so the dashboard doesn't look empty for new signups
        trips: [2, 1, 3, 2, 4, 3][idx] || 0,
        spent: ([2, 1, 3, 2, 4, 3][idx] || 0) * 7500,
      }));

  const formatCurrency = (val: number) => {
    return `${val.toLocaleString("fr-FR")} XOF`;
  };

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-bold text-foreground">Travel Insights</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Monthly summary of your journeys and spending.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <ChartContainer config={chartConfig} className="h-60 w-full">
          <AreaChart data={chartData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ee237c" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ee237c" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/40" />
            <XAxis
              dataKey="month"
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
                        {name === "spent" ? formatCurrency(Number(value)) : `${value} Trips`}
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
      </CardContent>
    </Card>
  );
}

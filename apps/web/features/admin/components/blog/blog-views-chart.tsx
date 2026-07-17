"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@moja/ui/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@moja/ui/components/ui/chart";

interface BlogViewsChartProps {
  data: Array<{ date: string; views: number }>;
}

const chartConfig = {
  views: {
    label: "Views",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function BlogViewsChart({ data }: BlogViewsChartProps) {
  // Add missing dates with 0 views if needed, or just format
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      label: format(parseISO(item.date), "MMM d"),
    }));
  }, [data]);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle>Daily Views</CardTitle>
          <CardDescription>Views across all published posts</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="h-[280px] w-full"
        >
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-views)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-views)" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.5} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(val) => format(parseISO(val), "MMM d")}
              minTickGap={32}
              style={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value}`}
              style={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0];
                if (!p) return null;
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {format(parseISO(p.payload.date), "MMM d, yyyy")}
                        </span>
                        <span className="font-bold text-muted-foreground">
                          {p.value} views
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="var(--color-views)"
              fill="url(#fillViews)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

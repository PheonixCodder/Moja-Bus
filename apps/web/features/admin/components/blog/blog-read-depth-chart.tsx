"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
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
  ChartTooltipContent,
} from "@moja/ui/components/ui/chart";

interface BlogReadDepthChartProps {
  data: Array<{ stage: string; count: number }>;
}

const chartConfig = {
  count: {
    label: "Readers",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function BlogReadDepthChart({ data }: BlogReadDepthChartProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle>Read Depth Funnel</CardTitle>
        <CardDescription>How far down readers are scrolling</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <ChartContainer config={chartConfig} className="h-full min-h-[260px] w-full">
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{ right: 30, left: 0, top: 10, bottom: 0 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.5} />
            <XAxis type="number" hide />
            <YAxis
              dataKey="stage"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              hide
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={4}
              fillOpacity={0.8}
            >
              <LabelList
                dataKey="stage"
                position="insideLeft"
                offset={8}
                className="fill-white font-medium"
                fontSize={12}
              />
              <LabelList
                dataKey="count"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
                formatter={(value: any) => (typeof value === "number" ? value.toLocaleString() : value)}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

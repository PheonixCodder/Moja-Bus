"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { DashboardDatePicker } from "./dashboard-date-picker";

interface RevenueTrendPoint {
  date: string;
  gmv: number;
}

interface DashboardRevenueChartProps {
  revenueTrend: RevenueTrendPoint[];
  totalGmv: number;
  bookingsCurrent: number;
}

function CustomTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string }>;
  label?: string | number;
  t?: (key: string) => string;
  currency?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-md text-sm">
      <p className="font-medium text-foreground mb-1">
        {format(new Date(String(label)), "d MMM yyyy")}
      </p>
      <p className="text-muted-foreground">
        GMV:{" "}
        <span className="font-semibold text-foreground tabular-nums">
          {Number(payload[0]?.value ?? 0).toLocaleString()} {currency}
        </span>
      </p>
    </div>
  );
}

export function DashboardRevenueChart({
  revenueTrend,
  totalGmv,
  bookingsCurrent,
}: DashboardRevenueChartProps) {
  const t = useTranslations("adminDashboard.overview.revenueChart");
  const currency = useTranslations("adminDashboard.overview.kpiCards")(
    "currency",
  );
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <CardTitle>{t("title")}</CardTitle>
        <DashboardDatePicker />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Bar Chart */}
          <div className="lg:col-span-8">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={revenueTrend}
                margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
                barSize={revenueTrend.length > 30 ? 8 : 20}
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="0"
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickFormatter={(value: string | number) =>
                    format(
                      new Date(String(value)),
                      revenueTrend.length > 14 ? "d MMM" : "d MMM",
                    )
                  }
                  interval={
                    revenueTrend.length > 30
                      ? 6
                      : revenueTrend.length > 14
                        ? 2
                        : 0
                  }
                />
                <Tooltip
                  content={<CustomTooltip t={t} currency={currency} />}
                  cursor={{ fill: "var(--muted)", radius: 4 }}
                />
                <Bar
                  dataKey="gmv"
                  fill="var(--primary)"
                  fillOpacity={0.85}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Panel */}
          <div className="flex flex-col gap-5 rounded-lg border border-border/60 bg-muted/30 p-5 lg:col-span-4">
            <div className="flex flex-col gap-1">
              <div className="font-semibold text-4xl tabular-nums leading-none">
                {totalGmv.toLocaleString()}{" "}
                <span className="font-normal text-lg text-muted-foreground">
                  {currency}
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                {t("totalRevenue")}
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background p-3">
              <div className="text-[11px] text-muted-foreground uppercase tracking-widest">
                {t("confirmedBookings")}
              </div>
              <div className="font-semibold text-2xl tabular-nums leading-none">
                {bookingsCurrent.toLocaleString()}{" "}
                <span className="font-normal text-muted-foreground text-sm">
                  {t("tickets")}
                </span>
              </div>
              <p className="text-muted-foreground text-sm">{t("inWindow")}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

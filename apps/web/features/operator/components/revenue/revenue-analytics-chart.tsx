"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { formatXOF } from "../../lib/currency";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function RevenueAnalyticsChart({ timeSeries, totalNet }: { timeSeries: any[]; totalNet: number }) {
  const data = useMemo(() => {
    return timeSeries.map((d) => ({
      ...d,
      displayDate: format(parseISO(d.date), "dd MMM", { locale: fr }),
    }));
  }, [timeSeries]);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-900">Net Earnings Trend</h3>
        <p className="text-sm text-slate-500">
          Showing daily net earnings for the selected period.
        </p>
      </div>

      <div className="h-[300px] w-full">
        {data.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-sm text-slate-500 bg-slate-50/50 rounded-lg border border-dashed">
            No data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="displayDate"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickFormatter={(value) =>
                  new Intl.NumberFormat("en-US", {
                    notation: "compact",
                    compactDisplay: "short",
                  }).format(value)
                }
                dx={-10}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium text-slate-900 mb-2">{label}</p>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-sm text-slate-500">Net Earnings:</span>
                          <span className="text-sm font-semibold text-emerald-600">
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
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorNet)"
                activeDot={{ r: 4, strokeWidth: 0, fill: "#10b981" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

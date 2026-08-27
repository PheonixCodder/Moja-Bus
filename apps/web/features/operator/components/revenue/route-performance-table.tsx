"use client";

import { useTranslations } from "next-intl";
import { formatXOF } from "../../lib/currency";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import { Badge } from "@moja/ui/components/ui/badge";

export function RoutePerformanceTable({ topRoutes }: { topRoutes: any[] }) {
  const t = useTranslations("operatorDashboard.revenue.routeTable");
  if (!topRoutes || topRoutes.length === 0) {
    return (
      <div className="bg-white border rounded-xl p-8 text-center text-slate-500">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow>
            <TableHead className="w-[300px]">{t("columns.route")}</TableHead>
            <TableHead className="text-right">{t("columns.trips")}</TableHead>
            <TableHead className="text-right">
              {t("columns.seatsSold")}
            </TableHead>
            <TableHead className="text-right">{t("columns.avgFare")}</TableHead>
            <TableHead className="text-right">
              {t("columns.netRevenue")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topRoutes.map((route, i) => (
            <TableRow key={i} className="hover:bg-slate-50/50">
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                    {i + 1}
                  </div>
                  <span className="text-slate-900">{route.routeLabel}</span>
                </div>
              </TableCell>
              <TableCell className="text-right text-slate-600">
                {route.tripsCount}
              </TableCell>
              <TableCell className="text-right text-slate-600">
                {route.bookingsCount}
              </TableCell>
              <TableCell className="text-right text-slate-600">
                {formatXOF(route.avgFareXOF)}
              </TableCell>
              <TableCell className="text-right font-semibold text-emerald-600">
                {formatXOF(route.totalNetXOF)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

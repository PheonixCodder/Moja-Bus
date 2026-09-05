"use client";

import { useTranslations } from "next-intl";
import { formatXOF } from "../../lib/currency";
import { Ticket, Bus, ArrowLeftRight, CreditCard } from "lucide-react";

export function OperationalMetricsGrid({ kpis }: { kpis: any }) {
  const t = useTranslations("operatorDashboard.revenue.metrics");
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6 h-full">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        {t("title")}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1 p-3 bg-muted/40 rounded-lg border border-border">
          <div className="flex items-center text-muted-foreground mb-1">
            <Ticket className="h-4 w-4 mr-1.5" />
            <span className="text-xs font-medium">{t("ticketSales")}</span>
          </div>
          <div className="text-lg font-semibold text-foreground">
            {formatXOF(kpis.grossRevenueXOF)}
          </div>
        </div>

        <div className="space-y-1 p-3 bg-muted/40 rounded-lg border border-border">
          <div className="flex items-center text-muted-foreground mb-1">
            <Bus className="h-4 w-4 mr-1.5" />
            <span className="text-xs font-medium">{t("tripsRun")}</span>
          </div>
          <div className="text-lg font-semibold text-foreground">
            {kpis.totalTripsRun}
          </div>
        </div>

        <div className="space-y-1 p-3 bg-muted/40 rounded-lg border border-border">
          <div className="flex items-center text-muted-foreground mb-1">
            <ArrowLeftRight className="h-4 w-4 mr-1.5" />
            <span className="text-xs font-medium">{t("refunds")}</span>
          </div>
          <div className="text-lg font-semibold text-foreground">
            {formatXOF(kpis.refundsIssuedXOF)}
          </div>
          <div className="text-[10px] text-muted-foreground/70">
            {t("refundsCount", { count: kpis.refundsCount })}
          </div>
        </div>

        <div className="space-y-1 p-3 bg-muted/40 rounded-lg border border-border">
          <div className="flex items-center text-muted-foreground mb-1">
            <CreditCard className="h-4 w-4 mr-1.5" />
            <span className="text-xs font-medium">{t("bookings")}</span>
          </div>
          <div className="text-lg font-semibold text-foreground">
            {kpis.totalConfirmedBookings}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { formatPriceXOF } from "@/features/search/lib/format";

interface BalanceAllocationProps {
  availableBalance: number;
  reservedBalance: number;
}

export function BalanceAllocation({ availableBalance, reservedBalance }: BalanceAllocationProps) {
  const t = useTranslations("passengerDashboard.wallet");

  return (
    <Card className="border-border bg-bg-surface overflow-hidden shadow-sm">
      <CardHeader className="py-4">
        <CardTitle className="text-xs font-bold text-text-muted uppercase tracking-widest">
          {t("allocationTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-3.5 w-full bg-slate-100 dark:bg-bg-elevated rounded-full overflow-hidden flex">
          <div 
            className="bg-gradient-to-r from-primary to-pink-500 w-full"
          />
        </div>

        <div className="text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-primary" />
              <span className="font-semibold text-text-primary">{t("balance")}</span>
            </div>
            <p className="text-[10px] text-text-secondary pl-4">
              {formatPriceXOF(availableBalance)} ({t("availableForBookings")})
            </p>
          </div>
        </div>

        {reservedBalance > 0 && (
          <div className="text-[10px] text-text-secondary flex items-start gap-1.5 bg-slate-50 dark:bg-bg-elevated p-2.5 rounded-xl border border-slate-100 dark:border-border/30 mt-2">
            <AlertCircle className="size-3.5 text-indigo-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {t("reservedDesc")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

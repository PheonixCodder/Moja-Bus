"use client";

import { useTranslations } from "next-intl";
import { Card } from "@moja/ui/components/ui/card";
import { CheckCircle2, Coins, Megaphone } from "lucide-react";

interface OperatorPromotionsKpiCardsProps {
  activePromos: number;
  confirmedRedemptions: number;
  operatorFundedXOF: number;
  isLoading?: boolean;
}

export function OperatorPromotionsKpiCards({
  activePromos,
  confirmedRedemptions,
  operatorFundedXOF,
  isLoading = false,
}: OperatorPromotionsKpiCardsProps) {
  const t = useTranslations("operatorDashboard.promotions.kpi");

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card className="flex items-center gap-4 p-5 shadow-xs border-slate-200/80 bg-white">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-500/10">
          <Megaphone className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500">
            {t("activePromos")}
          </p>
          <p className="mt-0.5 font-display text-2xl font-bold tracking-tight tabular-nums text-slate-900">
            {isLoading ? "—" : activePromos}
          </p>
        </div>
      </Card>

      <Card className="flex items-center gap-4 p-5 shadow-xs border-slate-200/80 bg-white">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/10">
          <CheckCircle2 className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500">
            {t("confirmedRedemptions")}
          </p>
          <p className="mt-0.5 font-display text-2xl font-bold tracking-tight tabular-nums text-slate-900">
            {isLoading ? "—" : confirmedRedemptions.toLocaleString()}
          </p>
        </div>
      </Card>

      <Card className="flex items-center gap-4 p-5 shadow-xs border-slate-200/80 bg-white">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-500/10">
          <Coins className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500">
            {t("operatorFunded")}
          </p>
          <p className="mt-0.5 font-display text-2xl font-bold tracking-tight tabular-nums text-slate-900">
            {isLoading ? (
              "—"
            ) : (
              <>
                {operatorFundedXOF.toLocaleString()}{" "}
                <span className="text-xs font-medium text-slate-400">XOF</span>
              </>
            )}
          </p>
        </div>
      </Card>
    </div>
  );
}

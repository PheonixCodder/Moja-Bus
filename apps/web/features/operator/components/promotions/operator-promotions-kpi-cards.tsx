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
      <Card className="flex items-center gap-4 p-5 shadow-xs border-border bg-card">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning ring-1 ring-warning/20">
          <Megaphone className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">
            {t("activePromos")}
          </p>
          <p className="mt-0.5 font-display text-2xl font-bold tracking-tight tabular-nums text-foreground">
            {isLoading ? "—" : activePromos}
          </p>
        </div>
      </Card>

      <Card className="flex items-center gap-4 p-5 shadow-xs border-border bg-card">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success ring-1 ring-success/20">
          <CheckCircle2 className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">
            {t("confirmedRedemptions")}
          </p>
          <p className="mt-0.5 font-display text-2xl font-bold tracking-tight tabular-nums text-foreground">
            {isLoading ? "—" : confirmedRedemptions.toLocaleString()}
          </p>
        </div>
      </Card>

      <Card className="flex items-center gap-4 p-5 shadow-xs border-border bg-card">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
          <Coins className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">
            {t("operatorFunded")}
          </p>
          <p className="mt-0.5 font-display text-2xl font-bold tracking-tight tabular-nums text-foreground">
            {isLoading ? (
              "—"
            ) : (
              <>
                {operatorFundedXOF.toLocaleString()}{" "}
                <span className="text-xs font-medium text-muted-foreground/70">XOF</span>
              </>
            )}
          </p>
        </div>
      </Card>
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, Coins, Megaphone } from "lucide-react";
import { KpiCard, KpiGrid } from "@/features/operator/components/kpi";

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
    <KpiGrid cols={3}>
      <KpiCard
        label={t("activePromos")}
        value={activePromos}
        icon={Megaphone}
        isLoading={isLoading}
        iconContainerClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
      />

      <KpiCard
        label={t("confirmedRedemptions")}
        value={confirmedRedemptions.toLocaleString()}
        icon={CheckCircle2}
        isLoading={isLoading}
        iconContainerClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      />

      <KpiCard
        label={t("operatorFunded")}
        value={
          <>
            {operatorFundedXOF.toLocaleString()}{" "}
            <span className="text-xs font-medium text-muted-foreground/70">XOF</span>
          </>
        }
        icon={Coins}
        isLoading={isLoading}
        iconContainerClassName="bg-primary/10 text-primary"
      />
    </KpiGrid>
  );
}

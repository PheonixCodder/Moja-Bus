"use client";

import { useTranslations } from "next-intl";
import { formatXOF } from "../../lib/currency";
import { toSafeDisplayNumber } from "@/lib/money";
import { ArrowRight, Wallet, Clock, TrendingUp } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";
import Link from "next/link";
import { KpiCard, KpiGrid } from "@/features/operator/components/kpi";

export function BalanceOverviewCards({
  availableBalance,
  reservedBalance,
  netEarnings,
}: {
  availableBalance: string | number;
  reservedBalance: string | number;
  netEarnings: number;
}) {
  const t = useTranslations("operatorDashboard.revenue.cards");
  const available = toSafeDisplayNumber(availableBalance);
  const reserved = toSafeDisplayNumber(reservedBalance);

  return (
    <KpiGrid cols={3}>
      {/* Net Earnings (Period) */}
      <KpiCard
        label={t("netEarnings")}
        value={formatXOF(netEarnings)}
        subtext={t("netEarningsDesc")}
        icon={TrendingUp}
      />

      {/* Escrow/Pending Balance (Live) */}
      <KpiCard
        label={t("inEscrow")}
        value={formatXOF(reserved)}
        subtext={t("inEscrowDesc")}
        icon={Clock}
        iconContainerClassName="bg-muted text-muted-foreground"
      />

      {/* Available Balance (Live) */}
      <KpiCard
        label={t("availableToWithdraw")}
        value={formatXOF(available)}
        subtext={t("availableDesc")}
        icon={Wallet}
        statusColor="primary"
        className="border-primary/20 bg-primary/5 dark:bg-primary/10"
        action={
          available > 0 ? (
            <Button
              render={<Link href="/dashboard/operator/withdraw" />}
              nativeButton={false}
              className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {t("requestWithdrawal")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              disabled
              className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {t("requestWithdrawal")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )
        }
      />
    </KpiGrid>
  );
}

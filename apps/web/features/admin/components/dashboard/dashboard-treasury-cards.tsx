"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import { Building2, Landmark, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";

interface DashboardTreasuryCardsProps {
  systemLiquidity: number;
  operatorPayables: number;
  passengerWallets: number;
}

export function DashboardTreasuryCards({
  systemLiquidity,
  operatorPayables,
  passengerWallets,
}: DashboardTreasuryCardsProps) {
  const t = useTranslations("adminDashboard.overview.treasuryCards");
  const currency = t("currency");
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* System Liquidity */}
      <Card className="bg-success/5 border-success/20">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Landmark className="size-4 text-success" />
            <CardTitle className="text-sm font-medium text-success">
              {t("systemLiquidity")}
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            {t("systemLiquidityDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {systemLiquidity.toLocaleString()}
            </span>
            <span className="text-sm font-medium text-success">
              {currency}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Operator Payables */}
      <Card className="bg-warning/5 border-warning/20">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-warning" />
            <CardTitle className="text-sm font-medium text-warning">
              {t("operatorPayables")}
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            {t("operatorPayablesDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {operatorPayables.toLocaleString()}
            </span>
            <span className="text-sm font-medium text-warning">
              {currency}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Passenger Wallets */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Wallet className="size-4 text-primary" />
            <CardTitle className="text-sm font-medium text-primary">
              {t("passengerWallets")}
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            {t("passengerWalletsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {passengerWallets.toLocaleString()}
            </span>
            <span className="text-sm font-medium text-primary">
              {currency}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

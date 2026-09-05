"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import { Coins, Scale, ShieldAlert, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { toSafeDisplayNumber } from "@/lib/money";

interface LedgerKpiCardsProps {
  totalDebitVolume: bigint;
  totalCreditVolume: bigint;
  isBalanced: boolean;
  totalEntries: number;
}

export function LedgerKpiCards({
  totalDebitVolume,
  totalCreditVolume,
  isBalanced,
  totalEntries,
}: LedgerKpiCardsProps) {
  const t = useTranslations("adminDashboard.ledgerKpiCards");
  const formatCurrency = (val: bigint) => {
    return (
      new Intl.NumberFormat("en-US").format(toSafeDisplayNumber(val)) +
      " " +
      t("xof")
    );
  };

  return (
    <div className="overflow-hidden rounded-xl bg-card border border-border shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 lg:divide-x divide-border">
        {/* KPI 1: Debit Volume */}
        <Card className="rounded-none border-0 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="size-3.5 text-destructive" />
              {t("totalDebitVolume")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-destructive leading-none">
              {formatCurrency(totalDebitVolume)}
            </div>
            <p className="text-muted-foreground text-[10px] font-medium mt-1">
              {t("debitDesc")}
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Credit Volume */}
        <Card className="rounded-none border-0 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="size-3.5 text-success" />
              {t("totalCreditVolume")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-success leading-none">
              {formatCurrency(totalCreditVolume)}
            </div>
            <p className="text-muted-foreground text-[10px] font-medium mt-1">
              {t("creditDesc")}
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Transactions Count */}
        <Card className="rounded-none border-0 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="size-3.5 text-primary" />
              {t("totalLedgerRecords")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground leading-none">
              {totalEntries}
            </div>
            <p className="text-muted-foreground text-[10px] font-medium mt-1">
              {t("ledgerDesc")}
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Ledger Integrity Check */}
        <Card className="rounded-none border-0 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              {isBalanced ? (
                <ShieldCheck className="size-3.5 text-success" />
              ) : (
                <ShieldAlert className="size-3.5 text-destructive" />
              )}
              {t("ledgerIntegrity")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-start justify-between">
            <div>
              <div
                className={`text-sm font-bold ${isBalanced ? "text-success" : "text-destructive"}`}
              >
                {isBalanced ? t("systemBalanced") : t("balanceMismatch")}
              </div>
              <p className="text-muted-foreground text-[10px] font-medium mt-1">
                {isBalanced ? t("balancedDesc") : t("mismatchDesc")}
              </p>
            </div>
            <Badge
              className={`font-semibold ${
                isBalanced
                  ? "bg-success/10 text-success border border-success/20 hover:bg-success/15"
                  : "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/15"
              }`}
            >
              {isBalanced ? t("healthy") : t("critical")}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

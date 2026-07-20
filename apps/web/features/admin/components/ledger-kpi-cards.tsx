"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { Badge } from "@moja/ui/components/ui/badge";
import { ShieldCheck, ShieldAlert, Coins, Scale } from "lucide-react";
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
  const formatCurrency = (val: bigint) => {
    return new Intl.NumberFormat("en-US").format(toSafeDisplayNumber(val)) + " XOF";
  };

  return (
    <div className="overflow-hidden rounded-xl bg-white border border-border shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 lg:divide-x divide-border">
        {/* KPI 1: Debit Volume */}
        <Card className="rounded-none border-0 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="size-3.5 text-rose-500" />
              Total Debit Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-rose-600 leading-none">
              {formatCurrency(totalDebitVolume)}
            </div>
            <p className="text-slate-400 text-[10px] font-medium mt-1">
              Sum of active debit transactions
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Credit Volume */}
        <Card className="rounded-none border-0 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="size-3.5 text-emerald-500" />
              Total Credit Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600 leading-none">
              {formatCurrency(totalCreditVolume)}
            </div>
            <p className="text-slate-400 text-[10px] font-medium mt-1">
              Sum of active credit transactions
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Transactions Count */}
        <Card className="rounded-none border-0 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="size-3.5 text-blue-500" />
              Total Ledger Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-slate-800 leading-none">
              {totalEntries}
            </div>
            <p className="text-slate-400 text-[10px] font-medium mt-1">
              Double-entry line item counts
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Ledger Integrity Check */}
        <Card className="rounded-none border-0 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              {isBalanced ? (
                <ShieldCheck className="size-3.5 text-emerald-500" />
              ) : (
                <ShieldAlert className="size-3.5 text-rose-500" />
              )}
              Ledger Integrity
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-start justify-between">
            <div>
              <div className={`text-sm font-bold ${isBalanced ? "text-emerald-700" : "text-rose-700"}`}>
                {isBalanced ? "System Balanced" : "Balance Mismatch"}
              </div>
              <p className="text-slate-400 text-[10px] font-medium mt-1">
                {isBalanced ? "Σ Debit balances Σ Credit" : "Warning: Discrepancy detected"}
              </p>
            </div>
            <Badge
              className={`font-semibold border-0 ${
                isBalanced
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-50"
                  : "bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-50"
              }`}
            >
              {isBalanced ? "Healthy" : "Critical"}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

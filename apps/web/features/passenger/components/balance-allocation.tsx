"use client";

import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { formatPriceXOF } from "@/features/search/lib/format";

interface BalanceAllocationProps {
  availableBalance: number;
  reservedBalance: number;
}

export function BalanceAllocation({ availableBalance, reservedBalance }: BalanceAllocationProps) {
  const totalFunds = availableBalance + reservedBalance;
  const availablePercentage = totalFunds > 0 ? (availableBalance / totalFunds) * 100 : 100;
  const reservedPercentage = totalFunds > 0 ? (reservedBalance / totalFunds) * 100 : 0;

  return (
    <Card className="border-border bg-bg-surface overflow-hidden shadow-sm">
      <CardHeader className="py-4">
        <CardTitle className="text-xs font-bold text-text-muted uppercase tracking-widest">
          Balance Allocation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="h-3.5 w-full bg-slate-100 dark:bg-bg-elevated rounded-full overflow-hidden flex">
          <div 
            className="bg-gradient-to-r from-primary to-pink-500 w-full"
          />
        </div>

        {/* Allocation Legends */}
        <div className="text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-primary" />
              <span className="font-semibold text-text-primary">Available Balance</span>
            </div>
            <p className="text-[10px] text-text-secondary pl-4">
              {formatPriceXOF(availableBalance)} (Instantly available for bookings)
            </p>
          </div>
        </div>

        {reservedBalance > 0 && (
          <div className="text-[10px] text-text-secondary flex items-start gap-1.5 bg-slate-50 dark:bg-bg-elevated p-2.5 rounded-xl border border-slate-100 dark:border-border/30 mt-2">
            <AlertCircle className="size-3.5 text-indigo-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Reserved funds are securely held for pending checkouts and will clear automatically if the 10-minute booking session expires or fails.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { formatXOF } from "../../lib/currency";
import { toSafeDisplayNumber } from "@/lib/money";
import { ArrowRight, Wallet, Clock, TrendingUp } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";
import Link from "next/link";

export function BalanceOverviewCards({
  availableBalance,
  reservedBalance,
  netEarnings,
}: {
  availableBalance: string | number;
  reservedBalance: string | number;
  netEarnings: number;
}) {
  const available = toSafeDisplayNumber(availableBalance);
  const reserved = toSafeDisplayNumber(reservedBalance);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Net Earnings (Period) */}
      <div className="bg-white rounded-xl border p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center text-sm font-medium text-slate-500 mb-2">
            <TrendingUp className="h-4 w-4 mr-2" />
            Net Earnings
          </div>
          <div className="text-3xl font-display font-bold text-slate-900">
            {formatXOF(netEarnings)}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Total net revenue for the selected period
          </p>
        </div>
      </div>

      {/* Escrow/Pending Balance (Live) */}
      <div className="bg-slate-50 rounded-xl border p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center text-sm font-medium text-slate-500 mb-2">
            <Clock className="h-4 w-4 mr-2" />
            In Escrow (Pending)
          </div>
          <div className="text-3xl font-display font-bold text-slate-900">
            {formatXOF(reserved)}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Funds locked until trips are completed
          </p>
        </div>
      </div>

      {/* Available Balance (Live) */}
      <div className="bg-primary/5 rounded-xl border border-primary/20 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Wallet className="h-16 w-16 text-primary" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center text-sm font-medium text-primary/80 mb-2">
            <Wallet className="h-4 w-4 mr-2" />
            Available to Withdraw
          </div>
          <div className="text-3xl font-display font-bold text-primary">
            {formatXOF(available)}
          </div>
          <p className="text-xs text-primary/60 mt-2">
            Ready for payout to your bank account
          </p>
        </div>
        
        {available > 0 ? (
          <Button 
            render={<Link href="/dashboard/operator/withdraw" />}
            nativeButton={false}
            className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground relative z-10"
          >
            Request Withdrawal
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button 
            disabled
            className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground relative z-10"
          >
            Request Withdrawal
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

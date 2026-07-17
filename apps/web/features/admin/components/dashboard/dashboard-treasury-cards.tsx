"use client";

import { Building2, Wallet, Landmark } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";

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
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* System Liquidity */}
      <Card className="bg-emerald-50/30 border-emerald-200/50 dark:bg-emerald-950/10 dark:border-emerald-900/30">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Landmark className="size-4 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              System Liquidity (Asset)
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Total funds held in Moja Treasury
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-900 dark:text-emerald-100">
              {systemLiquidity.toLocaleString()}
            </span>
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              XOF
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Operator Payables */}
      <Card className="bg-amber-50/30 border-amber-200/50 dark:bg-amber-950/10 dark:border-amber-900/30">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-amber-600 dark:text-amber-400" />
            <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Operator Payables (Liability)
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Total funds owed to bus operators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-amber-900 dark:text-amber-100">
              {operatorPayables.toLocaleString()}
            </span>
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              XOF
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Passenger Wallets */}
      <Card className="bg-blue-50/30 border-blue-200/50 dark:bg-blue-950/10 dark:border-blue-900/30">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Wallet className="size-4 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Passenger Wallets (Liability)
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Total funds in passenger top-ups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-blue-900 dark:text-blue-100">
              {passengerWallets.toLocaleString()}
            </span>
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
              XOF
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

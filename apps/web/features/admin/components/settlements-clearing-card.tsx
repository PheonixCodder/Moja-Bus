"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import {
  Landmark,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Lock,
  ArrowDownLeft,
} from "lucide-react";
import { Card, CardContent } from "@moja/ui/components/ui/card";
import { Badge } from "@moja/ui/components/ui/badge";

function formatXOF(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SettlementsClearingCard() {
  const trpc = useTRPC();

  const { data: treasury } = useSuspenseQuery(
    trpc.payments.getTreasuryOverview.queryOptions()
  );

  // getTreasuryOverview returns clearingBalance (posted) and revenueBalance
  // We treat clearingBalance as our source of truth for PAYSTACK_CLEARING
  const posted = treasury.clearingBalance ?? 0;

  // We don't have a live Paystack API call — showing DB balance is the recommended approach
  const isHealthy = posted >= 0;

  return (
    <Card className="border-border bg-card shadow-sm overflow-hidden">
      {/* Accent stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-sidebar-primary via-sidebar-primary/70 to-transparent" />
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* Left — icon + title */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary/10">
              <Landmark className="size-6 text-sidebar-primary" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Paystack Clearing Account
              </p>
              <h2 className="mt-0.5 text-3xl font-bold tracking-tight text-foreground">
                {formatXOF(posted)}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed max-w-sm">
                Represents all funds collected by Paystack on Moja&apos;s behalf
                and not yet disbursed to operators.
              </p>
            </div>
          </div>

          {/* Right — health badge */}
          <div className="shrink-0">
            {isHealthy ? (
              <Badge className="gap-1.5 border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
                <ShieldCheck className="size-3.5" />
                Ledger Healthy
              </Badge>
            ) : (
              <Badge className="gap-1.5 border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50">
                <AlertTriangle className="size-3.5" />
                Review Required
              </Badge>
            )}
          </div>
        </div>

        {/* Balance breakdown */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/10">
              <TrendingUp className="size-4 text-sidebar-primary" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Posted Balance
              </p>
              <p className="text-sm font-bold text-foreground">
                {formatXOF(posted)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <ArrowDownLeft className="size-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Platform Revenue
              </p>
              <p className="text-sm font-bold text-foreground">
                {formatXOF(treasury.revenueBalance ?? 0)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
              <Lock className="size-4 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Operator Payables
              </p>
              <p className="text-sm font-bold text-foreground">
                {formatXOF(Math.max(0, posted - (treasury.revenueBalance ?? 0)))}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

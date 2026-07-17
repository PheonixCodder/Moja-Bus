"use client";

import Link from "next/link";
import { ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@moja/ui/components/ui/card";
import { Badge } from "@moja/ui/components/ui/badge";

interface DashboardKpiCardsProps {
  gmv: number;
  gmvDeltaPct: number | null;
  commission: number;
  bookingsCurrent: number;
  bookingDeltaPct: number | null;
  pendingOperatorsCount: number;
  travelersCount: number;
  operatorsCount: number;
}

function DeltaBadge({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const isPositive = pct >= 0;
  return (
    <Badge
      variant="outline"
      className={
        isPositive
          ? "border-green-200 bg-green-500/10 text-green-700 dark:border-green-900/40 dark:bg-green-500/15 dark:text-green-300"
          : "border-destructive/20 bg-destructive/10 text-destructive"
      }
    >
      {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {isPositive ? "+" : ""}{pct}%
    </Badge>
  );
}

export function DashboardKpiCards({
  gmv,
  gmvDeltaPct,
  commission,
  bookingsCurrent,
  bookingDeltaPct,
  pendingOperatorsCount,
  travelersCount,
  operatorsCount,
}: DashboardKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* GMV */}
      <Card>
        <CardHeader>
          <CardDescription>Platform GMV</CardDescription>
          <Link
            href="/dashboard/admin/financials/ledger"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowUpRight className="size-4" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none tracking-tight font-semibold tabular-nums">
              {gmv.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">XOF</span>
            <DeltaBadge pct={gmvDeltaPct} />
          </div>
          <p className="text-sm text-muted-foreground">
            Total passenger payments in window
          </p>
        </CardContent>
      </Card>

      {/* Commission */}
      <Card>
        <CardHeader>
          <CardDescription>Commission Earned</CardDescription>
          <Link
            href="/dashboard/admin/financials/settlements"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowUpRight className="size-4" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none tracking-tight font-semibold tabular-nums">
              {commission.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">XOF</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Platform fees + commission share
          </p>
        </CardContent>
      </Card>

      {/* Bookings */}
      <Card>
        <CardHeader>
          <CardDescription>Confirmed Bookings</CardDescription>
          <Link
            href="/dashboard/admin/operations/trips"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowUpRight className="size-4" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none tracking-tight font-semibold tabular-nums">
              {bookingsCurrent.toLocaleString()}
            </span>
            <DeltaBadge pct={bookingDeltaPct} />
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{travelersCount.toLocaleString()}</span>{" "}
            total registered travelers
          </p>
        </CardContent>
      </Card>

      {/* Pending Verifications */}
      <Card className={pendingOperatorsCount > 0 ? "border-amber-200 bg-amber-50/40 dark:bg-amber-950/10 dark:border-amber-900/30" : ""}>
        <CardHeader>
          <CardDescription>Pending Verifications</CardDescription>
          <Link
            href="/dashboard/admin/verifications"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowUpRight className="size-4" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none tracking-tight font-semibold tabular-nums">
              {pendingOperatorsCount}
            </span>
            {pendingOperatorsCount > 0 && (
              <Badge variant="outline" className="border-amber-300 bg-amber-500/10 text-amber-700">
                Action needed
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{operatorsCount}</span>{" "}
            total operators registered
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

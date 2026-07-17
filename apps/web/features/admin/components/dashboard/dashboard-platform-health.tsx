"use client";

import Link from "next/link";
import {
  ShieldAlert,
  Activity,
  Scale,
  Users,
  Webhook,
  MapPin,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import { Button } from "@moja/ui/components/ui/button";
import { Badge } from "@moja/ui/components/ui/badge";

interface DashboardPlatformHealthProps {
  pendingOperatorsCount: number;
  activeTripsCount: number;
}

const quickLinks = [
  { label: "Ledger", href: "/dashboard/admin/financials/ledger", icon: Scale },
  { label: "Dispatch", href: "/dashboard/admin/operations/dispatch", icon: Activity },
  { label: "Travelers", href: "/dashboard/admin/users/travelers", icon: Users },
  { label: "Webhooks", href: "/dashboard/admin/audit-logs/webhooks", icon: Webhook },
  { label: "Routes", href: "/dashboard/admin/operations/routes", icon: MapPin },
];

export function DashboardPlatformHealth({
  pendingOperatorsCount,
  activeTripsCount,
}: DashboardPlatformHealthProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Platform Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-900/30 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="size-4 text-amber-600 shrink-0" />
              <span className="text-sm">
                <span className="font-semibold">{pendingOperatorsCount}</span>{" "}
                {pendingOperatorsCount === 1 ? "operator" : "operators"} pending verification
              </span>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2"
              nativeButton={false}
              render={<Link href="/dashboard/admin/verifications" />}
            >
              Review
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50/60 dark:bg-green-950/20 dark:border-green-900/30 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <Activity className="size-4 text-green-600 shrink-0" />
              <span className="text-sm">
                <span className="font-semibold">{activeTripsCount}</span>{" "}
                {activeTripsCount === 1 ? "trip" : "trips"} live right now
              </span>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2"
              nativeButton={false}
              render={<Link href="/dashboard/admin/operations/dispatch" />}
            >
              Monitor
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <span className="text-sm text-muted-foreground">Cron jobs</span>
            <Badge variant="outline" className="border-green-200 bg-green-500/10 text-green-700 text-[10px]">
              Active
            </Badge>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
            Quick Navigation
          </p>
          <div className="flex flex-wrap gap-2">
            {quickLinks.map((link) => (
              <Button
                key={link.href}
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                nativeButton={false}
                render={<Link href={link.href} />}
              >
                <link.icon className="size-3.5" />
                {link.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import {
  Activity,
  MapPin,
  Scale,
  ShieldAlert,
  Users,
  Webhook,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface DashboardPlatformHealthProps {
  pendingOperatorsCount: number;
  activeTripsCount: number;
}

export function DashboardPlatformHealth({
  pendingOperatorsCount,
  activeTripsCount,
}: DashboardPlatformHealthProps) {
  const t = useTranslations("adminDashboard.overview.platformHealth");
  const quickLinksT = useTranslations(
    "adminDashboard.overview.platformHealth.quickLinks",
  );
  const quickLinks = [
    {
      label: quickLinksT("ledger"),
      href: "/dashboard/admin/financials/ledger",
      icon: Scale,
    },
    {
      label: quickLinksT("dispatch"),
      href: "/dashboard/admin/operations/dispatch",
      icon: Activity,
    },
    {
      label: quickLinksT("travelers"),
      href: "/dashboard/admin/users/travelers",
      icon: Users,
    },
    {
      label: quickLinksT("webhooks"),
      href: "/dashboard/admin/audit-logs/webhooks",
      icon: Webhook,
    },
    {
      label: quickLinksT("routes"),
      href: "/dashboard/admin/operations/routes",
      icon: MapPin,
    },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-warning/20 bg-warning/10 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="size-4 text-warning shrink-0" />
              <span className="text-sm">
                <span className="font-semibold">{pendingOperatorsCount}</span>{" "}
                {pendingOperatorsCount === 1
                  ? t("pendingOperators", { count: pendingOperatorsCount })
                  : t("pendingOperatorsPlural", {
                      count: pendingOperatorsCount,
                    })}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2"
              nativeButton={false}
              render={<Link href="/dashboard/admin/verifications" />}
            >
              {t("review")}
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-success/20 bg-success/10 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <Activity className="size-4 text-success shrink-0" />
              <span className="text-sm">
                <span className="font-semibold">{activeTripsCount}</span>{" "}
                {activeTripsCount === 1
                  ? t("activeTrips", { count: activeTripsCount })
                  : t("activeTripsPlural", { count: activeTripsCount })}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2"
              nativeButton={false}
              render={<Link href="/dashboard/admin/operations/dispatch" />}
            >
              {t("monitor")}
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <span className="text-sm text-muted-foreground">
              {t("cronJobs")}
            </span>
            <Badge
              variant="outline"
              className="border-success/20 bg-success/10 text-success text-[10px]"
            >
              {t("cronActive")}
            </Badge>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
            {t("quickNavigation")}
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

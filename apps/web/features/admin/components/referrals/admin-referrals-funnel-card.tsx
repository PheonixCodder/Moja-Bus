"use client";

import { Card } from "@moja/ui/components/ui/card";
import {
  ArrowRight,
  CheckCircle2,
  Gift,
  ShieldAlert,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { InfoTooltip } from "@/features/discounts/components/info-tooltip";

import { useTranslations } from "next-intl";

interface AdminReferralsFunnelCardProps {
  funnel: Record<string, number>;
  isLoading?: boolean;
}

export function AdminReferralsFunnelCard({
  funnel,
  isLoading = false,
}: AdminReferralsFunnelCardProps) {
  const t = useTranslations("adminDashboard.referrals.funnel");
  const attributed = funnel["ATTRIBUTED"] ?? 0;
  const qualified = funnel["QUALIFIED"] ?? 0;
  const rewarded = funnel["REWARDED"] ?? 0;
  const fraud = funnel["REJECTED_FRAUD"] ?? 0;
  const total = attributed + qualified + rewarded + fraud;

  const qualRate =
    attributed > 0 ? Math.round((qualified / attributed) * 100) : 0;
  const rewardRate =
    qualified > 0 ? Math.round((rewarded / qualified) * 100) : 0;

  return (
    <Card className="p-6 border-border shadow-xs bg-card space-y-6">
      {/* Visual Pipeline Steps */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserPlus className="size-4" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">
              {t("step1")}
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              {t("attributedTitle")}
            </p>
            <p className="mt-0.5 font-display text-2xl font-bold tracking-tight tabular-nums text-foreground">
              {isLoading ? "—" : attributed.toLocaleString()}
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground">{t("attributedDesc")}</p>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex size-9 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <CheckCircle2 className="size-4" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">
              {t("qualRate", { pct: qualRate })}
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              {t("qualifiedTitle")}
            </p>
            <p className="mt-0.5 font-display text-2xl font-bold tracking-tight tabular-nums text-foreground">
              {isLoading ? "—" : qualified.toLocaleString()}
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground">{t("qualifiedDesc")}</p>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex size-9 items-center justify-center rounded-lg bg-success/10 text-success">
              <Gift className="size-4" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">
              {t("rewardRate", { pct: rewardRate })}
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              {t("rewardedTitle")}
            </p>
            <p className="mt-0.5 font-display text-2xl font-bold tracking-tight tabular-nums text-foreground">
              {isLoading ? "—" : rewarded.toLocaleString()}
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground">{t("rewardedDesc")}</p>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <ShieldAlert className="size-4" />
            </div>
            <span className="text-[11px] font-medium text-destructive">
              {t("blockedTag")}
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              {t("fraudTitle")}
            </p>
            <p className="mt-0.5 font-display text-2xl font-bold tracking-tight tabular-nums text-foreground">
              {isLoading ? "—" : fraud.toLocaleString()}
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground">{t("fraudDesc")}</p>
        </div>
      </div>
    </Card>
  );
}

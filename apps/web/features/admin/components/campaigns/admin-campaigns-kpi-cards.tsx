"use client";

import { Card } from "@moja/ui/components/ui/card";
import { CheckCircle2, Coins, Megaphone, Tag } from "lucide-react";

import { useTranslations } from "next-intl";

interface AdminCampaignsKpiCardsProps {
  activeCampaigns: number;
  confirmedRedemptions: number;
  ticketDiscountXOF: number;
  platformExpenseXOF: number;
  isLoading?: boolean;
}

export function AdminCampaignsKpiCards({
  activeCampaigns,
  confirmedRedemptions,
  ticketDiscountXOF,
  platformExpenseXOF,
  isLoading = false,
}: AdminCampaignsKpiCardsProps) {
  const t = useTranslations("adminDashboard.campaigns.kpi");
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="flex items-center gap-4 p-5 shadow-xs border-border bg-card">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning ring-1 ring-warning/20">
          <Megaphone className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">
            {t("activeCampaigns")}
          </p>
          <p className="mt-0.5 font-display text-2xl font-bold tracking-tight tabular-nums text-foreground">
            {isLoading ? "—" : activeCampaigns}
          </p>
        </div>
      </Card>

      <Card className="flex items-center gap-4 p-5 shadow-xs border-border bg-card">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success ring-1 ring-success/20">
          <CheckCircle2 className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">
            {t("confirmedRedemptions")}
          </p>
          <p className="mt-0.5 font-display text-2xl font-bold tracking-tight tabular-nums text-foreground">
            {isLoading ? "—" : confirmedRedemptions.toLocaleString()}
          </p>
        </div>
      </Card>

      <Card className="flex items-center gap-4 p-5 shadow-xs border-border bg-card">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
          <Tag className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">
            {t("ticketDiscounts")}
          </p>
          <p className="mt-0.5 font-display text-2xl font-bold tracking-tight tabular-nums text-foreground">
            {isLoading ? (
              "—"
            ) : (
              <>
                {ticketDiscountXOF.toLocaleString()}{" "}
                <span className="text-xs font-medium text-muted-foreground">XOF</span>
              </>
            )}
          </p>
        </div>
      </Card>

      <Card className="flex items-center gap-4 p-5 shadow-xs border-border bg-card">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
          <Coins className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">
            {t("platformExpense")}
          </p>
          <p className="mt-0.5 font-display text-2xl font-bold tracking-tight tabular-nums text-foreground">
            {isLoading ? (
              "—"
            ) : (
              <>
                {platformExpenseXOF.toLocaleString()}{" "}
                <span className="text-xs font-medium text-muted-foreground">XOF</span>
              </>
            )}
          </p>
        </div>
      </Card>
    </div>
  );
}

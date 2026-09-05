"use client";

import {
  CampaignRedemptionsTable,
  type RedemptionRow,
} from "@/features/discounts/components/campaign-redemptions-table";
import { Button } from "@moja/ui/components/ui/button";
import { Download } from "lucide-react";

import { useTranslations } from "next-intl";

interface AdminCampaignDrawerRedemptionsProps {
  redemptions: RedemptionRow[];
  isLoading: boolean;
  selectedCouponId: string | null;
  onClearCouponFilter: () => void;
  onExportCsv: () => void;
  isExporting: boolean;
}

export function AdminCampaignDrawerRedemptions({
  redemptions,
  isLoading,
  selectedCouponId,
  onClearCouponFilter,
  onExportCsv,
  isExporting,
}: AdminCampaignDrawerRedemptionsProps) {
  const t = useTranslations("adminDashboard.campaigns.drawer.redemptionsView");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("title")}
          </p>
          {selectedCouponId && (
            <div className="flex items-center gap-1.5 rounded-md bg-warning/10 px-2 py-0.5 text-xs text-warning border border-warning/20">
              <span>{t("filteredByCode")}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearCouponFilter}
                className="h-auto p-0 font-bold hover:text-warning hover:bg-transparent cursor-pointer ml-1 text-xs"
              >
                ×
              </Button>
            </div>
          )}
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isExporting || redemptions.length === 0}
          onClick={onExportCsv}
          className="gap-1.5 text-xs font-medium"
        >
          <Download className="size-3.5" />
          {isExporting ? t("exporting") : t("exportCsv")}
        </Button>
      </div>

      <CampaignRedemptionsTable items={redemptions} isLoading={isLoading} />
    </div>
  );
}

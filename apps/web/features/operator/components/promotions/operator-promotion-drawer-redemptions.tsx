"use client";

import { useTranslations } from "next-intl";
import { Button } from "@moja/ui/components/ui/button";
import { CampaignRedemptionsTable } from "@/features/discounts/components/campaign-redemptions-table";

interface OperatorPromotionDrawerRedemptionsProps {
  redemptions: any[];
  isLoading: boolean;
  total: number;
  selectedCouponId: string | null;
  onClearCouponFilter: () => void;
}

export function OperatorPromotionDrawerRedemptions({
  redemptions,
  isLoading,
  total,
  selectedCouponId,
  onClearCouponFilter,
}: OperatorPromotionDrawerRedemptionsProps) {
  const t = useTranslations("operatorDashboard.promotions.drawer");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {selectedCouponId ? t("filteredUsers") : t("recentRedemptions")}
          </p>
          <div className="mt-0.5 text-xs text-muted-foreground flex items-center">
            <span>{t("totalRedemptions", { total })}</span>
            {selectedCouponId && (
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={onClearCouponFilter}
                className="ml-2 h-auto p-0 text-primary underline-offset-2 hover:underline font-normal"
              >
                {t("clearFilter")}
              </Button>
            )}
          </div>
        </div>
      </div>
      <CampaignRedemptionsTable items={redemptions} isLoading={isLoading} />
    </div>
  );
}

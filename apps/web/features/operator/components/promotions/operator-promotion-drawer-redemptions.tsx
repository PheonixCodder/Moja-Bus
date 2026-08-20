"use client";

import { useTranslations } from "next-intl";
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
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {selectedCouponId ? t("filteredUsers") : t("recentRedemptions")}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {t("totalRedemptions", { total })}
            {selectedCouponId && (
              <button
                type="button"
                onClick={onClearCouponFilter}
                className="ml-2 text-[#ee237c] underline-offset-2 hover:underline"
              >
                {t("clearFilter")}
              </button>
            )}
          </p>
        </div>
      </div>
      <CampaignRedemptionsTable items={redemptions} isLoading={isLoading} />
    </div>
  );
}

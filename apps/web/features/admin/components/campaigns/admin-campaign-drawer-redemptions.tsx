"use client";

import {
  CampaignRedemptionsTable,
  type RedemptionRow,
} from "@/features/discounts/components/campaign-redemptions-table";
import { Button } from "@moja/ui/components/ui/button";
import { Download } from "lucide-react";

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
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Redemptions Ledger
          </p>
          {selectedCouponId && (
            <div className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-0.5 text-xs text-amber-800 border border-amber-200/60">
              <span>Filtered by selected code</span>
              <button
                type="button"
                onClick={onClearCouponFilter}
                className="font-bold hover:text-amber-900 cursor-pointer ml-1"
              >
                ×
              </button>
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
          {isExporting ? "Exporting..." : "Export CSV"}
        </Button>
      </div>

      <CampaignRedemptionsTable
        items={redemptions}
        isLoading={isLoading}
      />
    </div>
  );
}

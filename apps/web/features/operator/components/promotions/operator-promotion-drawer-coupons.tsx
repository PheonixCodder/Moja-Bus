"use client";

import { CampaignCouponsPanel, type CouponRow } from "@/features/discounts/components/campaign-coupons-panel";

interface OperatorPromotionDrawerCouponsProps {
  coupons: CouponRow[];
  isLoading?: boolean;
  selectedCouponId: string | null;
  onSelectCoupon: (id: string | null) => void;
  onCreateCoupon: (code: string) => void;
  onBulkCreate?: (input: { prefix: string; count: number }) => void;
  onDeactivateCoupon: (id: string) => void;
  createPending?: boolean;
  bulkPending?: boolean;
  deactivatePending?: boolean;
}

export function OperatorPromotionDrawerCoupons({
  coupons,
  isLoading,
  selectedCouponId,
  onSelectCoupon,
  onCreateCoupon,
  onBulkCreate,
  onDeactivateCoupon,
  createPending,
  bulkPending,
  deactivatePending,
}: OperatorPromotionDrawerCouponsProps) {
  return (
    <CampaignCouponsPanel
      coupons={coupons}
      isLoading={isLoading ?? false}
      selectedCouponId={selectedCouponId}
      onSelectCoupon={onSelectCoupon}
      onCreate={onCreateCoupon}
      onBulkCreate={onBulkCreate ?? (() => {})}
      onDeactivate={onDeactivateCoupon}
      onClose={() => onSelectCoupon(null)}
      createPending={createPending ?? false}
      bulkPending={bulkPending ?? false}
      deactivatePending={deactivatePending ?? false}
    />
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { AdminReferralsFunnelCard } from "../components/referrals/admin-referrals-funnel-card";
import { AdminReferralProgramCard } from "../components/admin-referral-program-card";
import { AdminPromoCreditsCard } from "../components/admin-promo-credits-card";

export function AdminReferralsView() {
  const trpc = useTRPC();
  const summaryQuery = useQuery(
    trpc.discountsAdmin.marketingSummary.queryOptions(),
  );
  const funnel = summaryQuery.data?.referralFunnel ?? {};

  return (
    <div className="space-y-6">
      {/* Referral Conversion Funnel */}
      <AdminReferralsFunnelCard
        funnel={funnel}
        isLoading={summaryQuery.isLoading}
      />

      {/* Referral Program Configuration & Rules */}
      <AdminReferralProgramCard />

      {/* Manual User Promo Credits Grant Ledger */}
      <AdminPromoCreditsCard />
    </div>
  );
}

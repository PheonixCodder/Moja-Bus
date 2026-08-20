"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { toast } from "sonner";
import { Button } from "@moja/ui/components/ui/button";
import { Plus } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { OperatorPromotionsKpiCards } from "../components/promotions/operator-promotions-kpi-cards";
import { OperatorPromotionsTable } from "../components/promotions/operator-promotions-table";
import {
  OperatorPromotionCreateDialog,
  type CreatePromoData,
} from "../components/promotions/operator-promotion-create-dialog";
import { OperatorPromotionDrawer, type PromoDrawerTab } from "../components/promotions/operator-promotion-drawer";
import { OperatorPromotionOptInsCard } from "../components/promotions/operator-promotion-opt-ins-card";
import { OperatorPageHeader } from "../components/operator-page-header";
import { useTranslations } from "next-intl";

export function OperatorPromotionsView() {
  const t = useTranslations("operatorDashboard.promotions");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // URL state
  const [selectedPromoId, setSelectedPromoId] = useQueryState(
    "promoId",
    parseAsString.withOptions({ history: "push" }),
  );
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringEnum<PromoDrawerTab>(["codes", "settings", "redemptions"])
      .withDefault("codes")
      .withOptions({ history: "replace" }),
  );

  // Local state
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [scopeRouteIds, setScopeRouteIds] = useState<string[]>([]);
  const [scopeScheduleIds, setScopeScheduleIds] = useState<string[]>([]);

  // Queries
  const listQuery = useQuery(
    trpc.discountsOperator.listCampaigns.queryOptions({ limit: 50, offset: 0 }),
  );
  const summaryQuery = useQuery(trpc.discountsOperator.promotionsSummary.queryOptions());
  const summary = summaryQuery.data;

  const campaignDetailQuery = useQuery({
    ...trpc.discountsOperator.getCampaign.queryOptions({ id: selectedPromoId ?? "" }),
    enabled: Boolean(selectedPromoId),
  });

  useEffect(() => {
    const detail = campaignDetailQuery.data;
    if (!detail) return;
    setScopeRouteIds(detail.routeScopes.map((s: any) => s.routeId));
    setScopeScheduleIds(detail.scheduleScopes.map((s: any) => s.scheduleId));
  }, [campaignDetailQuery.data]);

  const redemptionsQuery = useQuery({
    ...trpc.discountsOperator.listRedemptions.queryOptions({
      ...(selectedCouponId
        ? { couponCodeId: selectedCouponId }
        : { campaignId: selectedPromoId ?? undefined }),
      limit: 50,
      offset: 0,
    }),
    enabled: Boolean(selectedPromoId),
  });

  const routesQuery = useQuery(trpc.routes.list.queryOptions());
  const schedulesQuery = useQuery({
    ...trpc.discountsOperator.listScopeSchedules.queryOptions({ routeIds: scopeRouteIds, limit: 100 }),
    enabled: Boolean(selectedPromoId),
  });
  const tripsQuery = useQuery({
    ...trpc.discountsOperator.listScopeTrips.queryOptions({
      scheduleIds: scopeScheduleIds,
      routeIds: scopeRouteIds,
      daysAhead: 60,
      limit: 100,
    }),
    enabled: Boolean(selectedPromoId) && (scopeScheduleIds.length > 0 || scopeRouteIds.length > 0),
  });
  const optInsQuery = useQuery(trpc.discountsOperator.listPlatformOptIns.queryOptions());

  // Mutations
  const createMutation = useMutation(
    trpc.discountsOperator.createCampaign.mutationOptions({
      onSuccess: async (campaign) => {
        toast.success("Promotion created — add codes, then Activate");
        setCreateOpen(false);
        await setSelectedPromoId(campaign.id);
        await queryClient.invalidateQueries(trpc.discountsOperator.listCampaigns.pathFilter());
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const statusMutation = useMutation(
    trpc.discountsOperator.setCampaignStatus.mutationOptions({
      onSuccess: async () => {
        toast.success("Status updated");
        await queryClient.invalidateQueries(trpc.discountsOperator.listCampaigns.pathFilter());
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const couponMutation = useMutation(
    trpc.discountsOperator.createCoupon.mutationOptions({
      onSuccess: async () => {
        toast.success("Coupon created");
        await Promise.all([
          queryClient.invalidateQueries(trpc.discountsOperator.listCampaigns.pathFilter()),
          selectedPromoId
            ? queryClient.invalidateQueries(trpc.discountsOperator.getCampaign.queryFilter({ id: selectedPromoId }))
            : Promise.resolve(),
        ]);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const deactivateCouponMutation = useMutation(
    trpc.discountsOperator.deactivateCoupon.mutationOptions({
      onSuccess: async () => {
        toast.success("Coupon deactivated");
        await Promise.all([
          queryClient.invalidateQueries(trpc.discountsOperator.listCampaigns.pathFilter()),
          selectedPromoId
            ? queryClient.invalidateQueries(trpc.discountsOperator.getCampaign.queryFilter({ id: selectedPromoId }))
            : Promise.resolve(),
        ]);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const bulkCouponMutation = useMutation(
    trpc.discountsOperator.bulkCreateCoupons.mutationOptions({
      onSuccess: async (result) => {
        toast.success(`Created ${result.codes.length} codes`);
        await Promise.all([
          queryClient.invalidateQueries(trpc.discountsOperator.listCampaigns.pathFilter()),
          selectedPromoId
            ? queryClient.invalidateQueries(trpc.discountsOperator.getCampaign.queryFilter({ id: selectedPromoId }))
            : Promise.resolve(),
        ]);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const updateMutation = useMutation(
    trpc.discountsOperator.updateCampaign.mutationOptions({
      onSuccess: async () => {
        toast.success("Promo settings saved");
        await Promise.all([
          queryClient.invalidateQueries(trpc.discountsOperator.listCampaigns.pathFilter()),
          selectedPromoId
            ? queryClient.invalidateQueries(trpc.discountsOperator.getCampaign.queryFilter({ id: selectedPromoId }))
            : Promise.resolve(),
        ]);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const optInMutation = useMutation(
    trpc.discountsOperator.setPlatformOptIn.mutationOptions({
      onSuccess: async () => {
        toast.success("Opt-in updated");
        await queryClient.invalidateQueries(trpc.discountsOperator.listPlatformOptIns.pathFilter());
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const items = listQuery.data?.items ?? [];

  const routes = (routesQuery.data ?? []).map((r: any) => ({ id: r.id, name: r.name }));
  const schedules = (schedulesQuery.data ?? []).map((s: any) => ({ id: s.id, name: s.name, routeId: s.routeId }));
  const trips = (tripsQuery.data ?? []).map((t: any) => ({ id: t.id, name: t.name }));

  function handleCreate(data: CreatePromoData) {
    createMutation.mutate({
      name: data.name.trim(),
      fundingType: "OPERATOR",
      benefitType: data.benefitType,
      percentBps: data.percentBps,
      amountXOF: data.amountXOF,
      platformShareBps: 0,
      operatorShareBps: 10_000,
      status: "DRAFT",
    });
  }

  return (
    <>
      <OperatorPageHeader
        title={t("pageTitle")}
        description={t("pageDescription")}
        actions={
          <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            {t("newPromo")}
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* KPI Summary */}
        <OperatorPromotionsKpiCards
          activePromos={summary?.activeCampaigns ?? 0}
          confirmedRedemptions={summary?.confirmedRedemptions ?? 0}
          operatorFundedXOF={summary?.operatorFundedXOF ?? 0}
          isLoading={summaryQuery.isLoading}
        />

        {/* Promotions count + create */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            {items.length > 0
              ? t("promotionsCount", { count: items.length })
              : t("noPromotions")}
          </p>
          <Button type="button" size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            {t("newPromo")}
          </Button>
        </div>

        {/* Table */}
        <OperatorPromotionsTable
          items={items}
          isLoading={listQuery.isLoading}
          selectedPromoId={selectedPromoId}
          onSelectPromo={(id) => {
            void setSelectedPromoId(id);
            setSelectedCouponId(null);
          }}
          onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
          isStatusPending={statusMutation.isPending}
          onCreatePromo={() => setCreateOpen(true)}
        />

        {/* Platform opt-in campaigns */}
        <OperatorPromotionOptInsCard
          campaigns={optInsQuery.data ?? []}
          onOptIn={(campaignId, status) => optInMutation.mutate({ campaignId, status })}
          isPending={optInMutation.isPending}
        />
      </div>

      {/* Create dialog */}
      <OperatorPromotionCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreate}
        isPending={createMutation.isPending}
      />

      {/* Management drawer */}
      <OperatorPromotionDrawer
        promoId={selectedPromoId}
        onClose={() => {
          void setSelectedPromoId(null);
          setSelectedCouponId(null);
        }}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        campaignDetail={campaignDetailQuery.data}
        isDetailLoading={campaignDetailQuery.isLoading}
        redemptions={redemptionsQuery.data?.items ?? []}
        redemptionsTotal={redemptionsQuery.data?.total ?? 0}
        isRedemptionsLoading={redemptionsQuery.isLoading}
        selectedCouponId={selectedCouponId}
        onSelectCouponId={setSelectedCouponId}
        routes={routes}
        schedules={schedules}
        trips={trips}
        onScopeChange={({ routeIds, scheduleIds }) => {
          setScopeRouteIds(routeIds);
          setScopeScheduleIds(scheduleIds.length ? scheduleIds : []);
        }}
        onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
        isStatusPending={statusMutation.isPending}
        onCreateCoupon={(code) => {
          if (selectedPromoId) couponMutation.mutate({ campaignId: selectedPromoId, code });
        }}
        onBulkCreate={({ prefix, count }) => {
          if (selectedPromoId) bulkCouponMutation.mutate({ campaignId: selectedPromoId, prefix, count });
        }}
        onDeactivateCoupon={(id) => deactivateCouponMutation.mutate({ id })}
        createCouponPending={couponMutation.isPending}
        bulkCouponPending={bulkCouponMutation.isPending}
        deactivateCouponPending={deactivateCouponMutation.isPending}
        onSaveSettings={(input) => {
          if (selectedPromoId) updateMutation.mutate({ id: selectedPromoId, ...input });
        }}
        isSavingSettings={updateMutation.isPending}
      />
    </>
  );
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { AdminCampaignsKpiCards } from "../components/campaigns/admin-campaigns-kpi-cards";
import { AdminCampaignsFilterBar } from "../components/campaigns/admin-campaigns-filter-bar";
import {
  AdminCampaignCreateDialog,
  type CreateCampaignData,
} from "../components/campaigns/admin-campaign-create-dialog";
import {
  AdminCampaignsTable,
  type CampaignListItem,
} from "../components/campaigns/admin-campaigns-table";
import {
  AdminCampaignDrawer,
  type CampaignDrawerTab,
} from "../components/campaigns/admin-campaign-drawer";

export function AdminCampaignsView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // URL Query State with nuqs
  const [search, setSearch] = useQueryState("search", parseAsString.withDefault(""));
  const [statusFilter, setStatusFilter] = useQueryState("status", parseAsString.withDefault("ALL"));
  const [selectedCampaignId, setSelectedCampaignId] = useQueryState(
    "campaignId",
    parseAsString.withOptions({ history: "push" }),
  );
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringEnum<CampaignDrawerTab>(["performance", "codes", "settings", "redemptions"])
      .withDefault("performance")
      .withOptions({ history: "replace" }),
  );

  // Local state
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [scopeRouteIds, setScopeRouteIds] = useState<string[]>([]);
  const [scopeScheduleIds, setScopeScheduleIds] = useState<string[]>([]);

  // Main list & summary queries
  const listQuery = useQuery(
    trpc.discountsAdmin.listCampaigns.queryOptions({
      search: search || undefined,
      status: statusFilter !== "ALL" ? (statusFilter as any) : undefined,
      limit: 50,
      offset: 0,
    }),
  );

  const summaryQuery = useQuery(trpc.discountsAdmin.marketingSummary.queryOptions());
  const summary = summaryQuery.data;

  // Selected campaign queries (only active when campaignId is present)
  const campaignDetailQuery = useQuery({
    ...trpc.discountsAdmin.getCampaign.queryOptions({ id: selectedCampaignId ?? "" }),
    enabled: Boolean(selectedCampaignId),
  });

  useEffect(() => {
    const detail = campaignDetailQuery.data;
    if (!detail) return;
    setScopeRouteIds(detail.routeScopes.map((s: any) => s.routeId));
    setScopeScheduleIds(detail.scheduleScopes.map((s: any) => s.scheduleId));
  }, [campaignDetailQuery.data]);

  const performanceQuery = useQuery({
    ...trpc.discountsAdmin.campaignPerformance.queryOptions({ campaignId: selectedCampaignId ?? "" }),
    enabled: Boolean(selectedCampaignId),
  });

  const redemptionsQuery = useQuery({
    ...trpc.discountsAdmin.listRedemptions.queryOptions({
      ...(selectedCouponId
        ? { couponCodeId: selectedCouponId }
        : { campaignId: selectedCampaignId ?? undefined }),
      limit: 50,
      offset: 0,
    }),
    enabled: Boolean(selectedCampaignId),
  });

  // Scope queries for settings editor
  const routesQuery = useQuery(trpc.admin.listRoutes.queryOptions({ page: 1, pageSize: 100 }));
  const schedulesQuery = useQuery({
    ...trpc.discountsAdmin.listScopeSchedules.queryOptions({ routeIds: scopeRouteIds, limit: 100 }),
    enabled: Boolean(selectedCampaignId),
  });
  const tripsQuery = useQuery({
    ...trpc.discountsAdmin.listScopeTrips.queryOptions({
      scheduleIds: scopeScheduleIds,
      routeIds: scopeRouteIds,
      daysAhead: 60,
      limit: 100,
    }),
    enabled: Boolean(selectedCampaignId) && (scopeScheduleIds.length > 0 || scopeRouteIds.length > 0),
  });

  // Mutations
  const createMutation = useMutation(
    trpc.discountsAdmin.createCampaign.mutationOptions({
      onSuccess: async (campaign) => {
        toast.success("Campaign created — add coupon codes, then activate!");
        setCreateOpen(false);
        await queryClient.invalidateQueries(trpc.discountsAdmin.listCampaigns.pathFilter());
        setSelectedCampaignId(campaign.id);
        setActiveTab("codes");
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const statusMutation = useMutation(
    trpc.discountsAdmin.setCampaignStatus.mutationOptions({
      onSuccess: async () => {
        toast.success("Campaign status updated");
        await Promise.all([
          queryClient.invalidateQueries(trpc.discountsAdmin.listCampaigns.pathFilter()),
          selectedCampaignId
            ? queryClient.invalidateQueries(trpc.discountsAdmin.getCampaign.queryFilter({ id: selectedCampaignId }))
            : Promise.resolve(),
        ]);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const couponMutation = useMutation(
    trpc.discountsAdmin.createCoupon.mutationOptions({
      onSuccess: async () => {
        toast.success("Coupon created successfully");
        await Promise.all([
          queryClient.invalidateQueries(trpc.discountsAdmin.listCampaigns.pathFilter()),
          selectedCampaignId
            ? queryClient.invalidateQueries(trpc.discountsAdmin.getCampaign.queryFilter({ id: selectedCampaignId }))
            : Promise.resolve(),
        ]);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const bulkCouponMutation = useMutation(
    trpc.discountsAdmin.bulkCreateCoupons.mutationOptions({
      onSuccess: async (result) => {
        toast.success(`Created ${result.codes.length} coupon codes`);
        await Promise.all([
          queryClient.invalidateQueries(trpc.discountsAdmin.listCampaigns.pathFilter()),
          selectedCampaignId
            ? queryClient.invalidateQueries(trpc.discountsAdmin.getCampaign.queryFilter({ id: selectedCampaignId }))
            : Promise.resolve(),
        ]);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const deactivateCouponMutation = useMutation(
    trpc.discountsAdmin.deactivateCoupon.mutationOptions({
      onSuccess: async () => {
        toast.success("Coupon code deactivated");
        await Promise.all([
          queryClient.invalidateQueries(trpc.discountsAdmin.listCampaigns.pathFilter()),
          selectedCampaignId
            ? queryClient.invalidateQueries(trpc.discountsAdmin.getCampaign.queryFilter({ id: selectedCampaignId }))
            : Promise.resolve(),
        ]);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const updateCampaignMutation = useMutation(
    trpc.discountsAdmin.updateCampaign.mutationOptions({
      onSuccess: async () => {
        toast.success("Campaign settings saved");
        await Promise.all([
          queryClient.invalidateQueries(trpc.discountsAdmin.listCampaigns.pathFilter()),
          selectedCampaignId
            ? queryClient.invalidateQueries(trpc.discountsAdmin.getCampaign.queryFilter({ id: selectedCampaignId }))
            : Promise.resolve(),
        ]);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const notifyMutation = useMutation(
    trpc.discountsAdmin.notifyOptedInCampaign.mutationOptions({
      onSuccess: (data) =>
        toast.success(`Notified ${data.attempted} passengers (${data.skippedNoNovu} skipped without Novu)`),
      onError: (err) => toast.error(err.message),
    }),
  );

  const exportMutation = useMutation({
    mutationFn: async (input: { campaignId?: string }) => {
      return queryClient.fetchQuery(
        trpc.discountsAdmin.exportRedemptionsCsv.queryOptions({ campaignId: input.campaignId, limit: 1000 }),
      );
    },
    onSuccess: (data) => {
      const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${data.rowCount} redemptions to CSV`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const routes = (routesQuery.data?.items ?? []).map((r) => ({
    id: r.id,
    name: r.name,
  }));

  const schedules = (schedulesQuery.data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    routeId: s.routeId,
  }));

  const trips = (tripsQuery.data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
  }));

  return (
    <div className="space-y-6">
      {/* High-level KPI Cards */}
      <AdminCampaignsKpiCards
        activeCampaigns={summary?.activeCampaigns ?? 0}
        confirmedRedemptions={summary?.confirmedRedemptions ?? 0}
        ticketDiscountXOF={summary?.ticketDiscountXOF ?? 0}
        platformExpenseXOF={summary?.platformExpenseXOF ?? 0}
        isLoading={summaryQuery.isLoading}
      />

      {/* Filter and Action Header */}
      <AdminCampaignsFilterBar
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        onOpenCreate={() => setCreateOpen(true)}
      />

      {/* Campaigns Table */}
      <AdminCampaignsTable
        items={(listQuery.data?.items ?? []) as CampaignListItem[]}
        isLoading={listQuery.isLoading}
        selectedCampaignId={selectedCampaignId}
        onSelectCampaign={(id) => {
          setSelectedCampaignId(id);
          setSelectedCouponId(null);
        }}
        onStatusChange={(id, status, pauseReason) => {
          statusMutation.mutate({ id, status, pauseReason });
        }}
        onNotifyPassengers={(id) => {
          notifyMutation.mutate({ campaignId: id });
        }}
        statusPending={statusMutation.isPending}
        notifyPending={notifyMutation.isPending}
      />

      {/* Create Dialog */}
      <AdminCampaignCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={async (data: CreateCampaignData) => {
          await createMutation.mutateAsync(data as any);
        }}
        isPending={createMutation.isPending}
      />

      {/* Bottom Drawer for Detailed Campaign Management */}
      <AdminCampaignDrawer
        campaignId={selectedCampaignId}
        onClose={() => {
          setSelectedCampaignId(null);
          setSelectedCouponId(null);
        }}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        campaignDetail={campaignDetailQuery.data}
        isDetailLoading={campaignDetailQuery.isLoading}
        performance={performanceQuery.data}
        isPerformanceLoading={performanceQuery.isLoading}
        redemptions={redemptionsQuery.data?.items ?? []}
        isRedemptionsLoading={redemptionsQuery.isLoading}
        selectedCouponId={selectedCouponId}
        onSelectCouponId={setSelectedCouponId}
        routes={routes}
        schedules={schedules}
        trips={trips}
        onScopeChange={({ routeIds, scheduleIds }) => {
          setScopeRouteIds(routeIds);
          setScopeScheduleIds(scheduleIds);
        }}
        onStatusChange={(id, status, pauseReason) => {
          statusMutation.mutate({ id, status, pauseReason });
        }}
        isStatusPending={statusMutation.isPending}
        onNotifyPassengers={(id) => {
          notifyMutation.mutate({ campaignId: id });
        }}
        isNotifyPending={notifyMutation.isPending}
        onCreateCoupon={async (code) => {
          if (!selectedCampaignId) return;
          await couponMutation.mutateAsync({ campaignId: selectedCampaignId, code });
        }}
        onBulkCreateCoupons={async (params) => {
          if (!selectedCampaignId) return;
          await bulkCouponMutation.mutateAsync({
            campaignId: selectedCampaignId,
            prefix: params.prefix,
            count: params.count,
            maxRedemptions: params.maxRedemptions,
          });
        }}
        onDeactivateCoupon={async (id) => {
          await deactivateCouponMutation.mutateAsync({ id });
        }}
        onSaveSettings={async (data) => {
          await updateCampaignMutation.mutateAsync(data);
        }}
        isSavingSettings={updateCampaignMutation.isPending}
        onExportCsv={() => {
          exportMutation.mutate(
            selectedCampaignId ? { campaignId: selectedCampaignId } : {},
          );
        }}
        isExportingCsv={exportMutation.isPending}
      />
    </div>
  );
}

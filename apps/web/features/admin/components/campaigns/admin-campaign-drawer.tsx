"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@moja/ui/components/ui/drawer";
import {
  BarChart3,
  Bell,
  Code2,
  FileSpreadsheet,
  Pause,
  Play,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { AdminCampaignDrawerPerformance } from "./admin-campaign-drawer-performance";
import { AdminCampaignDrawerCoupons } from "./admin-campaign-drawer-coupons";
import { AdminCampaignDrawerSettings } from "./admin-campaign-drawer-settings";
import { AdminCampaignDrawerRedemptions } from "./admin-campaign-drawer-redemptions";

export type CampaignDrawerTab = "performance" | "codes" | "settings" | "redemptions";

interface AdminCampaignDrawerProps {
  campaignId: string | null;
  onClose: () => void;
  activeTab: CampaignDrawerTab;
  onTabChange: (tab: CampaignDrawerTab) => void;

  // Detail query data
  campaignDetail: any;
  isDetailLoading: boolean;

  // Performance data
  performance: any;
  isPerformanceLoading: boolean;

  // Redemptions data
  redemptions: any[];
  isRedemptionsLoading: boolean;
  selectedCouponId: string | null;
  onSelectCouponId: (id: string | null) => void;

  // Scopes data
  routes: Array<{ id: string; name: string }>;
  schedules: Array<{ id: string; name: string; routeId: string }>;
  trips: Array<{ id: string; name: string }>;
  onScopeChange: (scope: { routeIds: string[]; scheduleIds: string[] }) => void;

  // Action mutations
  onStatusChange: (id: string, status: "ACTIVE" | "PAUSED", pauseReason?: string) => void;
  isStatusPending: boolean;
  onNotifyPassengers: (id: string) => void;
  isNotifyPending: boolean;

  // Coupon mutations
  onCreateCoupon: (code: string) => Promise<void>;
  onBulkCreateCoupons: (params: { prefix: string; count: number; maxRedemptions?: number }) => Promise<void>;
  onDeactivateCoupon: (id: string) => Promise<void>;

  // Settings mutation
  onSaveSettings: (data: any) => Promise<void>;
  isSavingSettings: boolean;

  // CSV export
  onExportCsv: () => void;
  isExportingCsv: boolean;
}

function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "ACTIVE") return "default";
  if (status === "PAUSED") return "secondary";
  if (status === "EXHAUSTED" || status === "EXPIRED") return "destructive";
  return "outline";
}

export function AdminCampaignDrawer({
  campaignId,
  onClose,
  activeTab,
  onTabChange,
  campaignDetail,
  isDetailLoading,
  performance,
  isPerformanceLoading,
  redemptions,
  isRedemptionsLoading,
  selectedCouponId,
  onSelectCouponId,
  routes,
  schedules,
  trips,
  onScopeChange,
  onStatusChange,
  isStatusPending,
  onNotifyPassengers,
  isNotifyPending,
  onCreateCoupon,
  onBulkCreateCoupons,
  onDeactivateCoupon,
  onSaveSettings,
  isSavingSettings,
  onExportCsv,
  isExportingCsv,
}: AdminCampaignDrawerProps) {
  const isOpen = Boolean(campaignId);
  const campaign = campaignDetail;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[88vh] flex flex-col bg-white border-t border-slate-200">
        <div className="mx-auto w-full max-w-6xl flex-1 flex flex-col min-h-0">
          <DrawerHeader className="px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <DrawerTitle className="text-xl font-bold tracking-tight text-slate-900">
                    {isDetailLoading ? "Loading campaign..." : campaign?.name || "Campaign Management"}
                  </DrawerTitle>
                  {campaign && (
                    <Badge variant={statusVariant(campaign.status)} className="capitalize">
                      {campaign.status.toLowerCase()}
                    </Badge>
                  )}
                </div>
                <DrawerDescription className="text-xs text-slate-500">
                  {campaign
                    ? `Platform campaign · ID: ${campaign.id} · Stacking group: ${campaign.stackGroup || "PROMO"}`
                    : "Configure campaign parameters, coupon codes, and review redemption activity."}
                </DrawerDescription>
              </div>

              <div className="flex items-center gap-2">
                {campaign && campaign.status === "ACTIVE" && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isNotifyPending}
                      onClick={() => onNotifyPassengers(campaign.id)}
                      className="gap-1.5 text-xs font-medium text-slate-700"
                    >
                      <Bell className="size-3.5 text-slate-500" />
                      Notify Passengers
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isStatusPending}
                      onClick={() => onStatusChange(campaign.id, "PAUSED", "Paused from campaign drawer")}
                      className="gap-1.5 text-xs font-medium text-amber-700 border-amber-200 hover:bg-amber-50"
                    >
                      <Pause className="size-3.5" />
                      Pause
                    </Button>
                  </>
                )}

                {campaign && campaign.status !== "ACTIVE" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isStatusPending}
                    onClick={() => onStatusChange(campaign.id, "ACTIVE")}
                    className="gap-1.5 text-xs font-medium text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  >
                    <Play className="size-3.5" />
                    Activate
                  </Button>
                )}

                <DrawerClose asChild>
                  <Button type="button" size="sm" variant="ghost" className="size-8 p-0 text-slate-500">
                    <X className="size-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </DrawerClose>
              </div>
            </div>

            {/* Sub-tab Navigation */}
            <div className="mt-4 flex items-center gap-2 border-b border-slate-200/80 -mb-4">
              <button
                type="button"
                onClick={() => onTabChange("performance")}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === "performance"
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <BarChart3 className="size-3.5" />
                Performance & Spend
              </button>

              <button
                type="button"
                onClick={() => onTabChange("codes")}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === "codes"
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Code2 className="size-3.5" />
                Coupon Codes ({campaign?.coupons?.length ?? 0})
              </button>

              <button
                type="button"
                onClick={() => onTabChange("settings")}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === "settings"
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <SlidersHorizontal className="size-3.5" />
                Scopes & Rules
              </button>

              <button
                type="button"
                onClick={() => onTabChange("redemptions")}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === "redemptions"
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <FileSpreadsheet className="size-3.5" />
                Redemptions ({redemptions.length})
              </button>
            </div>
          </DrawerHeader>

          {/* Drawer Body Scroll Container */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "performance" && (
              <AdminCampaignDrawerPerformance
                performance={performance}
                isLoading={isPerformanceLoading}
              />
            )}

            {activeTab === "codes" && campaign && (
              <AdminCampaignDrawerCoupons
                coupons={campaign.coupons || []}
                selectedCouponId={selectedCouponId}
                onSelectCoupon={(id) => {
                  onSelectCouponId(id);
                  if (id) {
                    onTabChange("redemptions");
                  }
                }}
                onCreateCoupon={onCreateCoupon}
                onBulkCreate={onBulkCreateCoupons}
                onDeactivateCoupon={onDeactivateCoupon}
              />
            )}

            {activeTab === "settings" && campaign && (
              <AdminCampaignDrawerSettings
                campaign={campaign}
                routeOptions={routes}
                scheduleOptions={schedules}
                tripOptions={trips}
                showHybrid
                onRouteIdsChange={(routeIds) => onScopeChange({ routeIds, scheduleIds: [] })}
                onScheduleIdsChange={(scheduleIds) => onScopeChange({ routeIds: [], scheduleIds })}
                onSave={onSaveSettings}
                isSaving={isSavingSettings}
              />
            )}

            {activeTab === "redemptions" && (
              <AdminCampaignDrawerRedemptions
                redemptions={redemptions}
                isLoading={isRedemptionsLoading}
                selectedCouponId={selectedCouponId}
                onClearCouponFilter={() => onSelectCouponId(null)}
                onExportCsv={onExportCsv}
                isExporting={isExportingCsv}
              />
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

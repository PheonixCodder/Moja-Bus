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

export type CampaignDrawerTab =
  | "performance"
  | "codes"
  | "settings"
  | "redemptions";

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
  onStatusChange: (
    id: string,
    status: "ACTIVE" | "PAUSED",
    pauseReason?: string,
  ) => void;
  isStatusPending: boolean;
  onNotifyPassengers: (id: string) => void;
  isNotifyPending: boolean;

  // Coupon mutations
  onCreateCoupon: (code: string) => Promise<void>;
  onBulkCreateCoupons: (params: {
    prefix: string;
    count: number;
    maxRedemptions?: number;
  }) => Promise<void>;
  onDeactivateCoupon: (id: string) => Promise<void>;

  // Settings mutation
  onSaveSettings: (data: any) => Promise<void>;
  isSavingSettings: boolean;

  // CSV export
  onExportCsv: () => void;
  isExportingCsv: boolean;
}

function statusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "ACTIVE") return "default";
  if (status === "PAUSED") return "secondary";
  if (status === "EXHAUSTED" || status === "EXPIRED") return "destructive";
  return "outline";
}

import { useTranslations } from "next-intl";

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
  const t = useTranslations("adminDashboard.campaigns.drawer");
  const isOpen = Boolean(campaignId);
  const campaign = campaignDetail;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85vh] flex flex-col bg-card border-t border-border">
        <div className="mx-auto w-full max-w-6xl flex-1 flex flex-col min-h-0">
          <DrawerHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <DrawerTitle className="text-xl font-bold tracking-tight text-foreground">
                    {isDetailLoading
                      ? t("loading")
                      : campaign?.name || t("defaultTitle")}
                  </DrawerTitle>
                  {campaign && (
                    <Badge
                      variant={statusVariant(campaign.status)}
                      className="capitalize"
                    >
                      {campaign.status.toLowerCase()}
                    </Badge>
                  )}
                </div>
                <DrawerDescription className="text-xs text-muted-foreground">
                  {campaign
                    ? t("description", {
                        id: campaign.id,
                        group: campaign.stackGroup || "PROMO",
                      })
                    : t("defaultDescription")}
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
                      className="gap-1.5 text-xs font-medium text-foreground"
                    >
                      <Bell className="size-3.5 text-muted-foreground" />
                      {t("notifyPassengers")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isStatusPending}
                      onClick={() =>
                        onStatusChange(
                          campaign.id,
                          "PAUSED",
                          "Paused from campaign drawer",
                        )
                      }
                      className="gap-1.5 text-xs font-medium text-warning border-warning/20 hover:bg-warning/10"
                    >
                      <Pause className="size-3.5" />
                      {t("pause")}
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
                    className="gap-1.5 text-xs font-medium text-success border-success/20 hover:bg-success/10"
                  >
                    <Play className="size-3.5" />
                    {t("activate")}
                  </Button>
                )}

                <DrawerClose
              render={
                <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="size-8 p-0 text-muted-foreground" />
              }
            >
                    <X className="size-4" />
                    <span className="sr-only">{t("close")}</span>
                  </DrawerClose>
              </div>
            </div>

            {/* Sub-tab Navigation */}
            <div className="mt-4 flex items-center gap-2 border-b border-border -mb-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onTabChange("performance")}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 rounded-none transition-colors cursor-pointer h-auto ${
                  activeTab === "performance"
                    ? "border-primary text-foreground hover:bg-transparent"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-transparent"
                }`}
              >
                <BarChart3 className="size-3.5" />
                {t("tabs.performance")}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => onTabChange("codes")}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 rounded-none transition-colors cursor-pointer h-auto ${
                  activeTab === "codes"
                    ? "border-primary text-foreground hover:bg-transparent"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-transparent"
                }`}
              >
                <Code2 className="size-3.5" />
                {t("tabs.codes", { count: campaign?.coupons?.length ?? 0 })}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => onTabChange("settings")}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 rounded-none transition-colors cursor-pointer h-auto ${
                  activeTab === "settings"
                    ? "border-primary text-foreground hover:bg-transparent"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-transparent"
                }`}
              >
                <SlidersHorizontal className="size-3.5" />
                {t("tabs.settings")}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => onTabChange("redemptions")}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 rounded-none transition-colors cursor-pointer h-auto ${
                  activeTab === "redemptions"
                    ? "border-primary text-foreground hover:bg-transparent"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-transparent"
                }`}
              >
                <FileSpreadsheet className="size-3.5" />
                {t("tabs.redemptions", { count: redemptions.length })}
              </Button>
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
                onRouteIdsChange={(routeIds) =>
                  onScopeChange({ routeIds, scheduleIds: [] })
                }
                onScheduleIdsChange={(scheduleIds) =>
                  onScopeChange({ routeIds: [], scheduleIds })
                }
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

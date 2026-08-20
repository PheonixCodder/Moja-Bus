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
import { Code2, FileSpreadsheet, Pause, Play, SlidersHorizontal, X } from "lucide-react";
import { OperatorPromotionDrawerCoupons } from "./operator-promotion-drawer-coupons";
import { OperatorPromotionDrawerSettings } from "./operator-promotion-drawer-settings";
import { OperatorPromotionDrawerRedemptions } from "./operator-promotion-drawer-redemptions";
import type { CouponRow } from "@/features/discounts/components/campaign-coupons-panel";
import type { RouteOption, ScopeOption } from "@/features/discounts/components/campaign-settings-editor";
import { useTranslations } from "next-intl";

export type PromoDrawerTab = "codes" | "settings" | "redemptions";

interface OperatorPromotionDrawerProps {
  promoId: string | null;
  onClose: () => void;
  activeTab: PromoDrawerTab;
  onTabChange: (tab: PromoDrawerTab) => void;

  // Campaign detail
  campaignDetail: any;
  isDetailLoading: boolean;

  // Redemptions
  redemptions: any[];
  redemptionsTotal: number;
  isRedemptionsLoading: boolean;
  selectedCouponId: string | null;
  onSelectCouponId: (id: string | null) => void;

  // Scopes
  routes: RouteOption[];
  schedules: ScopeOption[];
  trips: ScopeOption[];
  onScopeChange: (scope: { routeIds: string[]; scheduleIds: string[] }) => void;

  // Status
  onStatusChange: (id: string, status: "ACTIVE" | "PAUSED") => void;
  isStatusPending: boolean;

  // Coupon mutations
  onCreateCoupon: (code: string) => void;
  onBulkCreate: (input: { prefix: string; count: number }) => void;
  onDeactivateCoupon: (id: string) => void;
  createCouponPending: boolean;
  bulkCouponPending: boolean;
  deactivateCouponPending: boolean;

  // Settings
  onSaveSettings: (data: any) => void;
  isSavingSettings: boolean;
}

function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "ACTIVE") return "default";
  if (status === "PAUSED") return "secondary";
  return "outline";
}

export function OperatorPromotionDrawer({
  promoId,
  onClose,
  activeTab,
  onTabChange,
  campaignDetail,
  isDetailLoading,
  redemptions,
  redemptionsTotal,
  isRedemptionsLoading,
  selectedCouponId,
  onSelectCouponId,
  routes,
  schedules,
  trips,
  onScopeChange,
  onStatusChange,
  isStatusPending,
  onCreateCoupon,
  onBulkCreate,
  onDeactivateCoupon,
  createCouponPending,
  bulkCouponPending,
  deactivateCouponPending,
  onSaveSettings,
  isSavingSettings,
}: OperatorPromotionDrawerProps) {
  const t = useTranslations("operatorDashboard.promotions.drawer");
  const tc = useTranslations("common");
  const isOpen = Boolean(promoId);
  const campaign = campaignDetail;
  const coupons: CouponRow[] = campaign?.coupons ?? [];

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[88vh] flex flex-col bg-white border-t border-slate-200">
        <div className="mx-auto w-full max-w-5xl flex-1 flex flex-col min-h-0">
          <DrawerHeader className="px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <DrawerTitle className="text-xl font-bold tracking-tight text-slate-900">
                    {isDetailLoading ? t("loading") : campaign?.name ?? t("promotion")}
                  </DrawerTitle>
                  {campaign && (
                    <Badge variant={statusVariant(campaign.status)} className="capitalize">
                      {campaign.status.toLowerCase()}
                    </Badge>
                  )}
                </div>
                <DrawerDescription className="text-xs text-slate-500">
                  {campaign
                    ? t("descWithCounts", { codes: campaign._count?.coupons ?? 0, redemptions: campaign._count?.redemptions ?? 0 })
                    : t("descDefault")}
                </DrawerDescription>
              </div>

              <div className="flex items-center gap-2">
                {campaign?.status === "ACTIVE" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isStatusPending}
                    onClick={() => onStatusChange(campaign.id, "PAUSED")}
                    className="gap-1.5 text-xs font-medium text-amber-700 border-amber-200 hover:bg-amber-50"
                  >
                    <Pause className="size-3.5" />
                    {t("pause")}
                  </Button>
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
                    {t("activate")}
                  </Button>
                )}
                <DrawerClose asChild>
                  <Button type="button" size="sm" variant="ghost" className="size-8 p-0 text-slate-500">
                    <X className="size-4" />
                    <span className="sr-only">{tc("close")}</span>
                  </Button>
                </DrawerClose>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mt-4 flex items-center gap-1 border-b border-slate-200/80 -mb-4">
              {(
                [
                  { id: "codes" as const, label: t("tabCodes", { count: coupons.length }), icon: Code2 },
                  { id: "settings" as const, label: t("tabSettings"), icon: SlidersHorizontal },
                  { id: "redemptions" as const, label: t("tabRedemptions", { count: redemptionsTotal }), icon: FileSpreadsheet },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onTabChange(id)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                    activeTab === id
                      ? "border-slate-900 text-slate-900"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </DrawerHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "codes" && (
              <OperatorPromotionDrawerCoupons
                coupons={coupons}
                isLoading={isDetailLoading}
                selectedCouponId={selectedCouponId}
                onSelectCoupon={(id) => {
                  onSelectCouponId(id);
                  if (id) onTabChange("redemptions");
                }}
                onCreateCoupon={onCreateCoupon}
                onBulkCreate={onBulkCreate}
                onDeactivateCoupon={onDeactivateCoupon}
                createPending={createCouponPending}
                bulkPending={bulkCouponPending}
                deactivatePending={deactivateCouponPending}
              />
            )}

            {activeTab === "settings" && campaign && (
              <OperatorPromotionDrawerSettings
                campaign={campaign}
                routeOptions={routes}
                scheduleOptions={schedules}
                tripOptions={trips}
                onRouteIdsChange={(routeIds) => onScopeChange({ routeIds, scheduleIds: [] })}
                onScheduleIdsChange={(scheduleIds) => onScopeChange({ routeIds: [], scheduleIds })}
                onSave={onSaveSettings}
                isSaving={isSavingSettings}
              />
            )}

            {activeTab === "redemptions" && (
              <OperatorPromotionDrawerRedemptions
                redemptions={redemptions}
                isLoading={isRedemptionsLoading}
                total={redemptionsTotal}
                selectedCouponId={selectedCouponId}
                onClearCouponFilter={() => onSelectCouponId(null)}
              />
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

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
  Code2,
  FileSpreadsheet,
  Pause,
  Play,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { OperatorPromotionDrawerCoupons } from "./operator-promotion-drawer-coupons";
import { OperatorPromotionDrawerSettings } from "./operator-promotion-drawer-settings";
import { OperatorPromotionDrawerRedemptions } from "./operator-promotion-drawer-redemptions";
import type { CouponRow } from "@/features/discounts/components/campaign-coupons-panel";
import type {
  RouteOption,
  ScopeOption,
} from "@/features/discounts/components/campaign-settings-editor";
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

function statusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
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
      <DrawerContent className="max-h-[88vh] flex flex-col bg-card border-t border-border">
        <div className="mx-auto w-full max-w-5xl flex-1 flex flex-col min-h-0">
          <DrawerHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <DrawerTitle className="text-xl font-bold tracking-tight text-foreground">
                    {isDetailLoading
                      ? t("loading")
                      : (campaign?.name ?? t("promotion"))}
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
                    ? t("descWithCounts", {
                        codes: campaign._count?.coupons ?? 0,
                        redemptions: campaign._count?.redemptions ?? 0,
                      })
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
                    className="gap-1.5 text-xs font-medium text-warning border-warning/30 hover:bg-warning/10"
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
                    className="gap-1.5 text-xs font-medium text-success border-success/30 hover:bg-success/10"
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
                    <span className="sr-only">{tc("close")}</span>
                  </DrawerClose>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mt-4 flex items-center gap-1 border-b border-border -mb-4">
              {(
                [
                  {
                    id: "codes" as const,
                    label: t("tabCodes", { count: coupons.length }),
                    icon: Code2,
                  },
                  {
                    id: "settings" as const,
                    label: t("tabSettings"),
                    icon: SlidersHorizontal,
                  },
                  {
                    id: "redemptions" as const,
                    label: t("tabRedemptions", { count: redemptionsTotal }),
                    icon: FileSpreadsheet,
                  },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  type="button"
                  variant="ghost"
                  onClick={() => onTabChange(id)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 rounded-none transition-colors h-auto ${
                    activeTab === id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {label}
                </Button>
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

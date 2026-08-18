"use client";

import {
  CampaignSettingsEditor,
  type CampaignSettingsValues,
  type RouteOption,
  type ScopeOption,
} from "@/features/discounts/components/campaign-settings-editor";

interface OperatorPromotionDrawerSettingsProps {
  campaign: CampaignSettingsValues & { name: string };
  routeOptions: RouteOption[];
  scheduleOptions?: ScopeOption[];
  tripOptions?: ScopeOption[];
  onRouteIdsChange?: (routeIds: string[]) => void;
  onScheduleIdsChange?: (scheduleIds: string[]) => void;
  onSave: (input: {
    description: string | null;
    startsAt: Date | null;
    endsAt: Date | null;
    budgetXOF: number | null;
    maxRedemptionsGlobal: number | null;
    maxRedemptionsPerUser: number | null;
    maxRedemptionsPerPhone: number | null;
    maxDiscountPerBookingXOF: number | null;
    minSubtotalXOF: number | null;
    firstBookingOnly: boolean;
    newUserOnly: boolean;
    isAutoApply: boolean;
    allowCombineWithCredit: boolean;
    scopes: { routeIds: string[]; scheduleIds: string[]; tripIds: string[] };
  }) => void;
  isSaving?: boolean;
}

export function OperatorPromotionDrawerSettings({
  campaign,
  routeOptions,
  scheduleOptions,
  tripOptions,
  onRouteIdsChange,
  onScheduleIdsChange,
  onSave,
  isSaving,
}: OperatorPromotionDrawerSettingsProps) {
  return (
    <CampaignSettingsEditor
      campaign={campaign}
      routeOptions={routeOptions}
      scheduleOptions={scheduleOptions ?? []}
      tripOptions={tripOptions ?? []}
      showHybrid={false}
      showRequireOptIn={false}
      pending={isSaving ?? false}
      onRouteIdsChange={onRouteIdsChange ?? (() => {})}
      onScheduleIdsChange={onScheduleIdsChange ?? (() => {})}
      onSave={onSave}
    />
  );
}

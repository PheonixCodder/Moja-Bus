"use client";

import {
  CampaignSettingsEditor,
  type CampaignSettingsValues,
  type RouteOption,
  type ScopeOption,
} from "@/features/discounts/components/campaign-settings-editor";

interface AdminCampaignDrawerSettingsProps {
  campaign: CampaignSettingsValues & { name: string };
  routeOptions: RouteOption[];
  scheduleOptions?: ScopeOption[];
  tripOptions?: ScopeOption[];
  showHybrid?: boolean;
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
    requireOperatorOptIn?: boolean;
    fundingType?: "PLATFORM" | "HYBRID";
    platformShareBps?: number;
    operatorShareBps?: number;
    scopes: {
      routeIds: string[];
      scheduleIds: string[];
      tripIds: string[];
    };
  }) => void;
  isSaving?: boolean;
}

export function AdminCampaignDrawerSettings({
  campaign,
  routeOptions,
  scheduleOptions,
  tripOptions,
  showHybrid = true,
  onRouteIdsChange,
  onScheduleIdsChange,
  onSave,
  isSaving,
}: AdminCampaignDrawerSettingsProps) {
  return (
    <CampaignSettingsEditor
      campaign={campaign}
      routeOptions={routeOptions}
      scheduleOptions={scheduleOptions ?? []}
      tripOptions={tripOptions ?? []}
      showHybrid={showHybrid}
      showRequireOptIn
      pending={isSaving ?? false}
      onRouteIdsChange={onRouteIdsChange ?? (() => {})}
      onScheduleIdsChange={onScheduleIdsChange ?? (() => {})}
      onSave={onSave}
    />
  );
}

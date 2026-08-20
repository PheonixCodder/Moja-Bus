"use client";

import { Button } from "@moja/ui/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@moja/ui/components/ui/collapsible";
import { DateTimePicker } from "@moja/ui/components/ui/date-time-picker";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { Switch } from "@moja/ui/components/ui/switch";
import { ChevronDown, Settings2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { InfoTooltip } from "@/features/discounts/components/info-tooltip";
import { useTranslations } from "next-intl";

export type CampaignSettingsValues = {
  description: string | null;
  startsAt: Date | string | null;
  endsAt: Date | string | null;
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
  requireOperatorOptIn: boolean;
  fundingType: "PLATFORM" | "OPERATOR" | "HYBRID";
  platformShareBps: number;
  operatorShareBps: number;
  routeScopes?: Array<{ routeId: string }> | undefined;
  scheduleScopes?: Array<{ scheduleId: string }> | undefined;
  tripScopes?: Array<{ tripId: string }> | undefined;
};

export type RouteOption = { id: string; name: string };
export type ScopeOption = { id: string; name: string; routeId?: string };

type Props = {
  campaign: CampaignSettingsValues & { name: string };
  routeOptions: RouteOption[];
  scheduleOptions?: ScopeOption[];
  tripOptions?: ScopeOption[];
  showHybrid?: boolean;
  showRequireOptIn?: boolean;
  pending?: boolean;
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
};

const MAX_SCHEDULES = 50;
const MAX_TRIPS = 100;

function toDate(value: Date | string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

function parseOptionalInt(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

export function CampaignSettingsEditor({
  campaign,
  routeOptions,
  scheduleOptions = [],
  tripOptions = [],
  showHybrid = false,
  showRequireOptIn = false,
  pending,
  onRouteIdsChange,
  onScheduleIdsChange,
  onSave,
}: Props) {
  const t = useTranslations("discounts.campaignSettings");
  const [description, setDescription] = useState(campaign.description ?? "");
  const [startsAt, setStartsAt] = useState<Date | undefined>(toDate(campaign.startsAt));
  const [endsAt, setEndsAt] = useState<Date | undefined>(toDate(campaign.endsAt));
  const [budgetXOF, setBudgetXOF] = useState(campaign.budgetXOF?.toString() ?? "");
  const [maxGlobal, setMaxGlobal] = useState(campaign.maxRedemptionsGlobal?.toString() ?? "");
  const [maxUser, setMaxUser] = useState(campaign.maxRedemptionsPerUser?.toString() ?? "");
  const [maxPhone, setMaxPhone] = useState(campaign.maxRedemptionsPerPhone?.toString() ?? "");
  const [maxDiscount, setMaxDiscount] = useState(campaign.maxDiscountPerBookingXOF?.toString() ?? "");
  const [minSpend, setMinSpend] = useState(campaign.minSubtotalXOF?.toString() ?? "");
  const [firstBookingOnly, setFirstBookingOnly] = useState(campaign.firstBookingOnly);
  const [newUserOnly, setNewUserOnly] = useState(campaign.newUserOnly);
  const [isAutoApply, setIsAutoApply] = useState(campaign.isAutoApply);
  const [allowCombineWithCredit, setAllowCombineWithCredit] = useState(campaign.allowCombineWithCredit);
  const [requireOperatorOptIn, setRequireOperatorOptIn] = useState(campaign.requireOperatorOptIn);
  const [hybrid, setHybrid] = useState(campaign.fundingType === "HYBRID");
  const [platformSharePct, setPlatformSharePct] = useState(
    String(Math.round((campaign.platformShareBps ?? 0) / 100)),
  );
  const [routeIds, setRouteIds] = useState<string[]>(
    campaign.routeScopes?.map((s) => s.routeId) ?? [],
  );
  const [scheduleIds, setScheduleIds] = useState<string[]>(
    campaign.scheduleScopes?.map((s) => s.scheduleId) ?? [],
  );
  const [tripIds, setTripIds] = useState<string[]>(
    campaign.tripScopes?.map((s) => s.tripId) ?? [],
  );
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    setDescription(campaign.description ?? "");
    setStartsAt(toDate(campaign.startsAt));
    setEndsAt(toDate(campaign.endsAt));
    setBudgetXOF(campaign.budgetXOF?.toString() ?? "");
    setMaxGlobal(campaign.maxRedemptionsGlobal?.toString() ?? "");
    setMaxUser(campaign.maxRedemptionsPerUser?.toString() ?? "");
    setMaxPhone(campaign.maxRedemptionsPerPhone?.toString() ?? "");
    setMaxDiscount(campaign.maxDiscountPerBookingXOF?.toString() ?? "");
    setMinSpend(campaign.minSubtotalXOF?.toString() ?? "");
    setFirstBookingOnly(campaign.firstBookingOnly);
    setNewUserOnly(campaign.newUserOnly);
    setIsAutoApply(campaign.isAutoApply);
    setAllowCombineWithCredit(campaign.allowCombineWithCredit);
    setRequireOperatorOptIn(campaign.requireOperatorOptIn);
    setHybrid(campaign.fundingType === "HYBRID");
    setPlatformSharePct(String(Math.round((campaign.platformShareBps ?? 0) / 100)));
    setRouteIds(campaign.routeScopes?.map((s) => s.routeId) ?? []);
    setScheduleIds(campaign.scheduleScopes?.map((s) => s.scheduleId) ?? []);
    setTripIds(campaign.tripScopes?.map((s) => s.tripId) ?? []);
  }, [campaign]);

  const scheduleCapWarn = scheduleIds.length > MAX_SCHEDULES;
  const tripCapWarn = tripIds.length > MAX_TRIPS;

  const filteredScheduleOptions = useMemo(() => {
    if (routeIds.length === 0) return scheduleOptions;
    const set = new Set(routeIds);
    return scheduleOptions.filter((s) => !s.routeId || set.has(s.routeId));
  }, [scheduleOptions, routeIds]);

  function updateRouteIds(next: string[]) {
    setRouteIds(next);
    onRouteIdsChange?.(next);
  }

  function updateScheduleIds(next: string[]) {
    const capped = next.slice(0, MAX_SCHEDULES);
    setScheduleIds(capped);
    onScheduleIdsChange?.(capped);
  }

  function toggleRoute(id: string) {
    updateRouteIds(routeIds.includes(id) ? routeIds.filter((x) => x !== id) : [...routeIds, id]);
  }

  function toggleSchedule(id: string) {
    updateScheduleIds(
      scheduleIds.includes(id) ? scheduleIds.filter((x) => x !== id) : [...scheduleIds, id],
    );
  }

  function toggleTrip(id: string) {
    setTripIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_TRIPS) return prev;
      return [...prev, id];
    });
  }

  return (
    <div className="space-y-5">
      {/* Description */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Label htmlFor="camp-desc" className="text-sm font-medium text-slate-700">
            {t("description")}{" "}
            <span className="font-normal text-slate-400">{t("internal")}</span>
          </Label>
          <InfoTooltip content="Internal notes and campaign purpose. Only visible to operators and administrators." />
        </div>
        <Input
          id="camp-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Back-to-school flash sale for Dakar routes"
        />
      </div>

      {/* Date range — calendar popovers */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm font-medium text-slate-700">{t("starts")}</Label>
            <InfoTooltip content="The exact date and time when passengers can start applying this promotion at checkout." />
          </div>
          <DateTimePicker
            value={startsAt}
            onChange={setStartsAt}
            placeholder={t("pickStartDatePlaceholder")}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm font-medium text-slate-700">{t("ends")}</Label>
            <InfoTooltip content="Optional expiration cutoff. After this time, codes will be rejected at checkout." />
          </div>
          <DateTimePicker
            value={endsAt}
            onChange={setEndsAt}
            placeholder={t("pickEndDatePlaceholder")}
          />
        </div>
      </div>

      {/* Behaviour toggles */}
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
          <span className="flex items-center gap-1.5">
            {t("firstBookingOnly")}
            <InfoTooltip content="Restricts redemption strictly to travelers making their very first ticket purchase on Moja Ride." />
          </span>
          <Switch checked={firstBookingOnly} onCheckedChange={setFirstBookingOnly} />
        </label>

        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
          <span className="flex items-center gap-1.5">
            {t("newUsersOnly")}
            <InfoTooltip content="Restricts redemption to newly registered accounts created within the introductory onboarding window." />
          </span>
          <Switch checked={newUserOnly} onCheckedChange={setNewUserOnly} />
        </label>

        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
          <span className="flex items-center gap-1.5">
            {t("autoApplyCheckout")}
            <InfoTooltip content="Automatically applies the best matching discount to the passenger's cart without requiring them to enter a coupon code." />
          </span>
          <Switch checked={isAutoApply} onCheckedChange={setIsAutoApply} />
        </label>

        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
          <span className="flex items-center gap-1.5">
            {t("stackWithPromoCredits")}
            <InfoTooltip content="When enabled, passengers can use both this discount code and their earned referral promo credits on the same booking." />
          </span>
          <Switch checked={allowCombineWithCredit} onCheckedChange={setAllowCombineWithCredit} />
        </label>
      </div>

      {/* Advanced settings — collapsed by default */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger
          className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
        >
          <Settings2 className="size-4 text-slate-400" />
          {t("advancedLimitsFunding")}
          <ChevronDown
            className={`ml-auto size-4 text-slate-400 transition-transform duration-200 ${
              advancedOpen ? "rotate-180" : ""
            }`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 space-y-4 rounded-lg border border-slate-200 bg-white p-4">
            {/* Caps grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label
                    htmlFor="camp-budget"
                    className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {t("budgetXOF")}
                  </Label>
                  <InfoTooltip content="Total maximum monetary discount value permitted across this entire campaign. Once reached, no further redemptions are allowed." />
                </div>
                <Input
                  id="camp-budget"
                  inputMode="numeric"
                  value={budgetXOF}
                  onChange={(e) => setBudgetXOF(e.target.value)}
                  placeholder={t("unlimitedPlaceholder")}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label
                    htmlFor="camp-max-global"
                    className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {t("maxRedemptions")}
                  </Label>
                  <InfoTooltip content="The total overall number of successful ticket bookings that can use this campaign across all passengers." />
                </div>
                <Input
                  id="camp-max-global"
                  inputMode="numeric"
                  value={maxGlobal}
                  onChange={(e) => setMaxGlobal(e.target.value)}
                  placeholder={t("unlimitedPlaceholder")}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label
                    htmlFor="camp-max-user"
                    className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {t("maxPerUser")}
                  </Label>
                  <InfoTooltip content="The maximum number of times any single authenticated traveler account can redeem this promotion." />
                </div>
                <Input
                  id="camp-max-user"
                  inputMode="numeric"
                  value={maxUser}
                  onChange={(e) => setMaxUser(e.target.value)}
                  placeholder={t("unlimitedPlaceholder")}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label
                    htmlFor="camp-max-phone"
                    className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {t("maxPerPhone")}
                  </Label>
                  <InfoTooltip content="The maximum number of redemptions tied to the same passenger telephone number, preventing multi-account circumvention." />
                </div>
                <Input
                  id="camp-max-phone"
                  inputMode="numeric"
                  value={maxPhone}
                  onChange={(e) => setMaxPhone(e.target.value)}
                  placeholder={t("unlimitedPlaceholder")}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label
                    htmlFor="camp-max-disc"
                    className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {t("maxDiscountPerBooking")}
                  </Label>
                  <InfoTooltip content="Upper monetary ceiling in XOF applied to any single booking, especially useful for percentage-off discounts on large family orders." />
                </div>
                <Input
                  id="camp-max-disc"
                  inputMode="numeric"
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value)}
                  placeholder={t("unlimitedPlaceholder")}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label
                    htmlFor="camp-min-spend"
                    className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {t("minSpendXOF")}
                  </Label>
                  <InfoTooltip content="Minimum cart subtotal before this promotion is eligible to be applied." />
                </div>
                <Input
                  id="camp-min-spend"
                  inputMode="numeric"
                  value={minSpend}
                  onChange={(e) => setMinSpend(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Require operator opt-in */}
            {showRequireOptIn && (
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p>{t("requireOperatorOptIn")}</p>
                    <InfoTooltip content="Forces bus operators to explicitly accept this platform promotion before it becomes active on their routes and schedules." />
                  </div>
                  <p className="text-xs font-normal text-slate-400">
                    {t("requireOperatorOptInDesc")}
                  </p>
                </div>
                <Switch checked={requireOperatorOptIn} onCheckedChange={setRequireOperatorOptIn} />
              </label>
            )}

            {/* Hybrid funding */}
            {showHybrid && (
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p>{t("splitCostOperator")}</p>
                      <InfoTooltip content="Shared co-marketing promo where the platform absorbs a percentage of the discount and the operator covers the remainder." />
                    </div>
                    <p className="text-xs font-normal text-slate-400">
                      {t("splitCostOperatorDesc")}
                    </p>
                  </div>
                  <Switch checked={hybrid} onCheckedChange={setHybrid} />
                </label>
                {hybrid && (
                  <div className="space-y-1.5 pl-1">
                    <div className="flex items-center gap-1.5">
                      <Label
                        htmlFor="camp-plat-share"
                        className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {t("platformSharePercent")}
                      </Label>
                      <InfoTooltip content="The exact percentage of the discount amount subsidized directly by the platform." />
                    </div>
                    <Input
                      id="camp-plat-share"
                      inputMode="numeric"
                      value={platformSharePct}
                      onChange={(e) => setPlatformSharePct(e.target.value)}
                    />
                    <p className="text-xs text-slate-500">
                      {t("operatorCoversRemaining")}{" "}
                      {100 - (Number(platformSharePct) || 0)}%
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Targeting scope */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-slate-100" />
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t("targetingScope")}
            </p>
            <InfoTooltip content="Narrow which routes, recurring schedules, or specific upcoming departures this promotion applies to. Leave empty to apply everywhere." />
          </div>
          <div className="h-px flex-1 bg-slate-100" />
        </div>
        <p className="text-xs text-slate-500">
          {t("targetingScopeDesc")}
        </p>

        {/* Routes */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("routes")}{" "}
              {routeIds.length > 0 && (
                <span className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                  {routeIds.length}
                </span>
              )}
            </Label>
            <InfoTooltip content="Restrict discount eligibility only to tickets booked on the selected corridors/routes." />
          </div>
          {routeOptions.length === 0 ? (
            <p className="text-xs text-slate-500">{t("noRoutesAvailable")}</p>
          ) : (
            <div className="max-h-36 space-y-0.5 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
              {routeOptions.map((route) => (
                <label
                  key={route.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    className="rounded border-slate-300"
                    checked={routeIds.includes(route.id)}
                    onChange={() => toggleRoute(route.id)}
                  />
                  <span className="truncate">{route.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Schedules */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("schedules")}{" "}
              {scheduleIds.length > 0 && (
                <span className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                  {scheduleIds.length}
                </span>
              )}
            </Label>
            <InfoTooltip content="Restrict discount eligibility to recurring timetable schedules (e.g. only 08:00 morning departures)." />
          </div>
          {filteredScheduleOptions.length === 0 ? (
            <p className="text-xs text-slate-500">
              {routeIds.length > 0
                ? "No schedules for selected routes."
                : "Select routes to load schedules, or leave empty for no restriction."}
            </p>
          ) : (
            <div className="max-h-36 space-y-0.5 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
              {filteredScheduleOptions.map((schedule) => (
                <label
                  key={schedule.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    className="rounded border-slate-300"
                    checked={scheduleIds.includes(schedule.id)}
                    onChange={() => toggleSchedule(schedule.id)}
                  />
                  <span className="truncate">{schedule.name}</span>
                </label>
              ))}
            </div>
          )}
          {scheduleCapWarn && (
            <p className="text-xs text-amber-700">
              {t("maxCapped", { count: MAX_SCHEDULES })}
            </p>
          )}
        </div>

        {/* Trips */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("specificTrips")}{" "}
              {tripIds.length > 0 && (
                <span className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                  {tripIds.length}
                </span>
              )}
            </Label>
            <InfoTooltip content="Target individual specific calendar departure instances, e.g. a specific holiday weekend departure." />
          </div>
          {tripOptions.length === 0 ? (
            <p className="text-xs text-slate-500">
              {scheduleIds.length > 0 || routeIds.length > 0
                ? "No upcoming trips for the current filters."
                : "Select schedules or routes to load upcoming trips."}
            </p>
          ) : (
            <div className="max-h-36 space-y-0.5 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
              {tripOptions.map((trip) => (
                <label
                  key={trip.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    className="rounded border-slate-300"
                    checked={tripIds.includes(trip.id)}
                    onChange={() => toggleTrip(trip.id)}
                  />
                  <span className="truncate">{trip.name}</span>
                </label>
              ))}
            </div>
          )}
          {tripCapWarn && (
            <p className="text-xs text-amber-700">
              {t("maxTripsCapped", { count: MAX_TRIPS })}
            </p>
          )}
        </div>
      </div>

      <Button
        type="button"
        disabled={pending}
        className="w-full"
        onClick={() => {
          const platformBps = Math.min(
            10_000,
            Math.max(0, Math.round((Number(platformSharePct) || 0) * 100)),
          );
          onSave({
            description: description.trim() || null,
            startsAt: startsAt ?? null,
            endsAt: endsAt ?? null,
            budgetXOF: parseOptionalInt(budgetXOF),
            maxRedemptionsGlobal: parseOptionalInt(maxGlobal),
            maxRedemptionsPerUser: parseOptionalInt(maxUser),
            maxRedemptionsPerPhone: parseOptionalInt(maxPhone),
            maxDiscountPerBookingXOF: parseOptionalInt(maxDiscount),
            minSubtotalXOF: parseOptionalInt(minSpend),
            firstBookingOnly,
            newUserOnly,
            isAutoApply,
            allowCombineWithCredit,
            ...(showRequireOptIn ? { requireOperatorOptIn } : {}),
            ...(showHybrid
              ? {
                  fundingType: hybrid ? "HYBRID" : "PLATFORM",
                  platformShareBps: hybrid ? platformBps : 10_000,
                  operatorShareBps: hybrid ? 10_000 - platformBps : 0,
                }
              : {}),
            scopes: {
              routeIds,
              scheduleIds: scheduleIds.slice(0, MAX_SCHEDULES),
              tripIds: tripIds.slice(0, MAX_TRIPS),
            },
          });
        }}
      >
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}

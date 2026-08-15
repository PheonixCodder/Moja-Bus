"use client";

import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { Switch } from "@moja/ui/components/ui/switch";
import { useEffect, useState } from "react";

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
};

export type RouteOption = { id: string; name: string };

type Props = {
  campaign: CampaignSettingsValues & { name: string };
  routeOptions: RouteOption[];
  showHybrid?: boolean;
  showRequireOptIn?: boolean;
  pending?: boolean;
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
    scopes: { routeIds: string[] };
  }) => void;
};

function toLocalInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
  showHybrid = false,
  showRequireOptIn = false,
  pending,
  onSave,
}: Props) {
  const [description, setDescription] = useState(campaign.description ?? "");
  const [startsAt, setStartsAt] = useState(toLocalInput(campaign.startsAt));
  const [endsAt, setEndsAt] = useState(toLocalInput(campaign.endsAt));
  const [budgetXOF, setBudgetXOF] = useState(
    campaign.budgetXOF?.toString() ?? "",
  );
  const [maxGlobal, setMaxGlobal] = useState(
    campaign.maxRedemptionsGlobal?.toString() ?? "",
  );
  const [maxUser, setMaxUser] = useState(
    campaign.maxRedemptionsPerUser?.toString() ?? "",
  );
  const [maxPhone, setMaxPhone] = useState(
    campaign.maxRedemptionsPerPhone?.toString() ?? "",
  );
  const [maxDiscount, setMaxDiscount] = useState(
    campaign.maxDiscountPerBookingXOF?.toString() ?? "",
  );
  const [minSpend, setMinSpend] = useState(
    campaign.minSubtotalXOF?.toString() ?? "",
  );
  const [firstBookingOnly, setFirstBookingOnly] = useState(
    campaign.firstBookingOnly,
  );
  const [newUserOnly, setNewUserOnly] = useState(campaign.newUserOnly);
  const [isAutoApply, setIsAutoApply] = useState(campaign.isAutoApply);
  const [allowCombineWithCredit, setAllowCombineWithCredit] = useState(
    campaign.allowCombineWithCredit,
  );
  const [requireOperatorOptIn, setRequireOperatorOptIn] = useState(
    campaign.requireOperatorOptIn,
  );
  const [hybrid, setHybrid] = useState(campaign.fundingType === "HYBRID");
  const [platformSharePct, setPlatformSharePct] = useState(
    String(Math.round((campaign.platformShareBps ?? 0) / 100)),
  );
  const [routeIds, setRouteIds] = useState<string[]>(
    campaign.routeScopes?.map((s) => s.routeId) ?? [],
  );

  useEffect(() => {
    setDescription(campaign.description ?? "");
    setStartsAt(toLocalInput(campaign.startsAt));
    setEndsAt(toLocalInput(campaign.endsAt));
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
    setPlatformSharePct(
      String(Math.round((campaign.platformShareBps ?? 0) / 100)),
    );
    setRouteIds(campaign.routeScopes?.map((s) => s.routeId) ?? []);
  }, [campaign]);

  function toggleRoute(id: string) {
    setRouteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">
          Campaign settings
        </h3>
        <p className="text-xs text-slate-500">
          Dates, caps, budget, auto-apply, and route scopes for{" "}
          <span className="font-medium text-slate-700">{campaign.name}</span>.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="camp-desc">Description</Label>
        <Input
          id="camp-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Shown internally for ops"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="camp-starts">Starts</Label>
          <Input
            id="camp-starts"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="camp-ends">Ends</Label>
          <Input
            id="camp-ends"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="camp-budget">Budget (XOF)</Label>
          <Input
            id="camp-budget"
            inputMode="numeric"
            value={budgetXOF}
            onChange={(e) => setBudgetXOF(e.target.value)}
            placeholder="Unlimited"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="camp-max-global">Max redemptions (global)</Label>
          <Input
            id="camp-max-global"
            inputMode="numeric"
            value={maxGlobal}
            onChange={(e) => setMaxGlobal(e.target.value)}
            placeholder="Unlimited"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="camp-max-user">Max per user</Label>
          <Input
            id="camp-max-user"
            inputMode="numeric"
            value={maxUser}
            onChange={(e) => setMaxUser(e.target.value)}
            placeholder="Unlimited"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="camp-max-phone">Max per phone</Label>
          <Input
            id="camp-max-phone"
            inputMode="numeric"
            value={maxPhone}
            onChange={(e) => setMaxPhone(e.target.value)}
            placeholder="Unlimited"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="camp-max-disc">Max discount / booking (XOF)</Label>
          <Input
            id="camp-max-disc"
            inputMode="numeric"
            value={maxDiscount}
            onChange={(e) => setMaxDiscount(e.target.value)}
            placeholder="Unlimited"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="camp-min-spend">Min spend (XOF)</Label>
          <Input
            id="camp-min-spend"
            inputMode="numeric"
            value={minSpend}
            onChange={(e) => setMinSpend(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
          First booking only
          <Switch
            checked={firstBookingOnly}
            onCheckedChange={setFirstBookingOnly}
          />
        </label>
        <label className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
          New users only
          <Switch checked={newUserOnly} onCheckedChange={setNewUserOnly} />
        </label>
        <label className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
          Auto-apply at checkout
          <Switch checked={isAutoApply} onCheckedChange={setIsAutoApply} />
        </label>
        <label className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
          Combine with credits
          <Switch
            checked={allowCombineWithCredit}
            onCheckedChange={setAllowCombineWithCredit}
          />
        </label>
        {showRequireOptIn ? (
          <label className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm sm:col-span-2">
            Require operator opt-in
            <Switch
              checked={requireOperatorOptIn}
              onCheckedChange={setRequireOperatorOptIn}
            />
          </label>
        ) : null}
      </div>

      {showHybrid ? (
        <div className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
          <label className="flex items-center justify-between gap-3 text-sm">
            Hybrid funding (split platform / operator)
            <Switch checked={hybrid} onCheckedChange={setHybrid} />
          </label>
          {hybrid ? (
            <div className="space-y-1.5">
              <Label htmlFor="camp-plat-share">Platform share (%)</Label>
              <Input
                id="camp-plat-share"
                inputMode="numeric"
                value={platformSharePct}
                onChange={(e) => setPlatformSharePct(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                Operator share = {100 - (Number(platformSharePct) || 0)}%
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label>Route scopes (empty = all routes)</Label>
        {routeOptions.length === 0 ? (
          <p className="text-xs text-slate-500">No routes available to pick.</p>
        ) : (
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-slate-200 bg-white p-2">
            {routeOptions.map((route) => {
              const checked = routeIds.includes(route.id);
              return (
                <label
                  key={route.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleRoute(route.id)}
                  />
                  <span className="truncate">{route.name}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <Button
        type="button"
        disabled={pending}
        onClick={() => {
          const platformBps = Math.min(
            10_000,
            Math.max(0, Math.round((Number(platformSharePct) || 0) * 100)),
          );
          onSave({
            description: description.trim() || null,
            startsAt: startsAt ? new Date(startsAt) : null,
            endsAt: endsAt ? new Date(endsAt) : null,
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
            scopes: { routeIds },
          });
        }}
      >
        Save settings
      </Button>
    </div>
  );
}

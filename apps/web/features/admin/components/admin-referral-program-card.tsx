"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import { Card } from "@moja/ui/components/ui/card";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { Switch } from "@moja/ui/components/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { InfoTooltip } from "@/features/discounts/components/info-tooltip";
import { useTRPC } from "@/trpc/client";

const NONE = "__none__";

export function AdminReferralProgramCard() {
  const t = useTranslations("adminDashboard.referrals.program");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const programQuery = useQuery(
    trpc.discountsAdmin.getReferralProgram.queryOptions(),
  );
  const campaignsQuery = useQuery(
    trpc.discountsAdmin.listCampaigns.queryOptions({
      status: "ACTIVE",
      limit: 100,
      offset: 0,
    }),
  );

  const [isActive, setIsActive] = useState(false);
  const [referrerCredit, setReferrerCredit] = useState("0");
  const [recurringCredit, setRecurringCredit] = useState("0");
  const [recurringMax, setRecurringMax] = useState("3");
  const [windowDays, setWindowDays] = useState("180");
  const [delayHours, setDelayHours] = useState("48");
  const [welcomeCampaignId, setWelcomeCampaignId] = useState<string>(NONE);

  // Fraud controls are always enabled — fetched from DB but never toggled in UI
  const selfReferralBlock = true;
  const samePhoneBlock = true;
  const sameDeviceBlock = true;
  const requirePaid = true;

  useEffect(() => {
    const p = programQuery.data;
    if (!p) return;
    setIsActive(p.isActive);
    setReferrerCredit(String(p.referrerCreditAmountXOF));
    setRecurringCredit(String(p.recurringCreditAmountXOF));
    setRecurringMax(String(p.recurringMaxBookings));
    setWindowDays(String(p.recurringWindowDays));
    setDelayHours(String(p.rewardDelayHours));
    setWelcomeCampaignId(p.refereeCouponCampaignId ?? NONE);
  }, [programQuery.data]);

  const saveMutation = useMutation(
    trpc.discountsAdmin.updateReferralProgram.mutationOptions({
      onSuccess: async () => {
        toast.success(t("toastSaved"));
        await queryClient.invalidateQueries(
          trpc.discountsAdmin.getReferralProgram.pathFilter(),
        );
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  return (
    <Card className="space-y-5 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-semibold text-slate-900">
              {t("title")}
            </h2>
            <InfoTooltip content={t("tooltip")} />
          </div>
          <p className="max-w-sm text-xs text-slate-500">{t("description")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-slate-500">
            {isActive ? t("active") : t("paused")}
          </span>
          <Switch
            id="ref-active"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>
      </div>

      {/* Credit reward fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label
              htmlFor="ref-initial"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              {t("initialRewardLabel")}
            </Label>
            <InfoTooltip content={t("initialRewardTooltip")} />
          </div>
          <Input
            id="ref-initial"
            type="number"
            value={referrerCredit}
            onChange={(e) => setReferrerCredit(e.target.value)}
            placeholder="e.g. 1000"
          />
          <p className="text-[11px] text-slate-400">{t("initialRewardSub")}</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label
              htmlFor="ref-recurring"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              {t("recurringRewardLabel")}
            </Label>
            <InfoTooltip content={t("recurringRewardTooltip")} />
          </div>
          <Input
            id="ref-recurring"
            type="number"
            value={recurringCredit}
            onChange={(e) => setRecurringCredit(e.target.value)}
            placeholder="e.g. 250"
          />
          <p className="text-[11px] text-slate-400">
            {t("recurringRewardSub")}
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label
              htmlFor="ref-max"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              {t("maxTripsLabel")}
            </Label>
            <InfoTooltip content={t("maxTripsTooltip")} />
          </div>
          <Input
            id="ref-max"
            type="number"
            value={recurringMax}
            onChange={(e) => setRecurringMax(e.target.value)}
          />
          <p className="text-[11px] text-slate-400">{t("maxTripsSub")}</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label
              htmlFor="ref-window"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              {t("windowLabel")}
            </Label>
            <InfoTooltip content={t("windowTooltip")} />
          </div>
          <Input
            id="ref-window"
            type="number"
            value={windowDays}
            onChange={(e) => setWindowDays(e.target.value)}
          />
          <p className="text-[11px] text-slate-400">{t("windowSub")}</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label
              htmlFor="ref-delay"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              {t("delayLabel")}
            </Label>
            <InfoTooltip content={t("delayTooltip")} />
          </div>
          <Input
            id="ref-delay"
            type="number"
            value={delayHours}
            onChange={(e) => setDelayHours(e.target.value)}
          />
          <p className="text-[11px] text-slate-400">{t("delaySub")}</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("welcomeCampaignLabel")}
            </Label>
            <InfoTooltip content={t("welcomeCampaignTooltip")} />
          </div>
          <Select
            value={welcomeCampaignId}
            onValueChange={(value: string | null) => setWelcomeCampaignId(value ?? NONE)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("welcomeCampaignNone")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>
                {t("welcomeCampaignNoneOption")}
              </SelectItem>
              {(campaignsQuery.data?.items ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-slate-400">
            {t("welcomeCampaignSub")}
          </p>
        </div>
      </div>

      {/* Fraud protection summary — always-on, no toggles */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3.5">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-800">
              {t("fraudTitle")}
            </p>
          </div>
          <InfoTooltip
            content={t("fraudTooltip")}
            iconClassName="text-emerald-600 hover:text-emerald-800"
          />
        </div>
        <ul className="mt-2.5 space-y-1 pl-6">
          {(t.raw("fraudItems") as string[]).map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 text-xs text-emerald-700"
            >
              <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-2 pl-0 text-[11px] text-emerald-600/70">
          {t("fraudFooter")}
        </p>
      </div>

      <Button
        type="button"
        className="w-full"
        disabled={saveMutation.isPending || programQuery.isLoading}
        onClick={() =>
          saveMutation.mutate({
            isActive,
            referrerCreditAmountXOF: Number(referrerCredit) || 0,
            recurringCreditAmountXOF: Number(recurringCredit) || 0,
            recurringMaxBookings: Number(recurringMax) || 0,
            recurringWindowDays: Number(windowDays) || 1,
            rewardDelayHours: Number(delayHours) || 0,
            refereeCouponCampaignId:
              welcomeCampaignId === NONE ? null : welcomeCampaignId,
            selfReferralBlock,
            samePhoneBlock,
            sameDeviceBlock,
            requirePaidConfirmedBooking: requirePaid,
          })
        }
      >
        {saveMutation.isPending ? t("saving") : t("saveBtn")}
      </Button>
    </Card>
  );
}

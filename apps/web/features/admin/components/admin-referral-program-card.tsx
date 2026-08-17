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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { InfoTooltip } from "@/features/discounts/components/info-tooltip";
import { useTRPC } from "@/trpc/client";

const NONE = "__none__";

export function AdminReferralProgramCard() {
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
        toast.success("Referral program saved");
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
            <h2 className="text-sm font-semibold text-slate-900">Referral program</h2>
            <InfoTooltip content="Reward existing travelers with promo credits when their friends complete paid bookings on Moja Ride." />
          </div>
          <p className="max-w-sm text-xs text-slate-500">
            Reward referrers with promo credits when their referred friend completes a paid trip.
            A personal welcome coupon can be minted for the new traveler from any active campaign.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-slate-500">{isActive ? "Active" : "Paused"}</span>
          <Switch id="ref-active" checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </div>

      {/* Credit reward fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="ref-initial" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Referrer initial reward (XOF)
            </Label>
            <InfoTooltip content="One-time promo credit granted to the referrer after the referred friend boards and completes their first eligible paid trip." />
          </div>
          <Input
            id="ref-initial"
            type="number"
            value={referrerCredit}
            onChange={(e) => setReferrerCredit(e.target.value)}
            placeholder="e.g. 1000"
          />
          <p className="text-[11px] text-slate-400">One-time credit after the friend's first confirmed trip</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="ref-recurring" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Recurring bonus per trip (XOF)
            </Label>
            <InfoTooltip content="Smaller bonus promo credit given to the referrer every time the friend takes subsequent trips, up to the maximum trips cap." />
          </div>
          <Input
            id="ref-recurring"
            type="number"
            value={recurringCredit}
            onChange={(e) => setRecurringCredit(e.target.value)}
            placeholder="e.g. 250"
          />
          <p className="text-[11px] text-slate-400">Smaller bonus for each repeat trip the friend takes (up to the cap)</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="ref-max" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Max recurring trips cap
            </Label>
            <InfoTooltip content="The maximum number of repeat trips that will earn recurring credits for the referrer. Prevents infinite credit drain." />
          </div>
          <Input
            id="ref-max"
            type="number"
            value={recurringMax}
            onChange={(e) => setRecurringMax(e.target.value)}
          />
          <p className="text-[11px] text-slate-400">Stop issuing recurring bonuses after this many trips</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="ref-window" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Recurring window (days)
            </Label>
            <InfoTooltip content="Only trips completed within this number of days from the initial referral date qualify for the recurring bonus." />
          </div>
          <Input
            id="ref-window"
            type="number"
            value={windowDays}
            onChange={(e) => setWindowDays(e.target.value)}
          />
          <p className="text-[11px] text-slate-400">Only count trips within this many days of the original referral</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="ref-delay" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Reward maturation delay (hours)
            </Label>
            <InfoTooltip content="Grace period after the friend's trip departure before the referrer's promo credits unlock for spending, allowing for cancellations or disputes." />
          </div>
          <Input
            id="ref-delay"
            type="number"
            value={delayHours}
            onChange={(e) => setDelayHours(e.target.value)}
          />
          <p className="text-[11px] text-slate-400">Hours after the referred friend's trip departure before credits unlock</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Welcome coupon campaign
            </Label>
            <InfoTooltip content="When linked to an active campaign, new travelers who register through a referral link automatically receive a personal welcome discount code." />
          </div>
          <Select
            value={welcomeCampaignId}
            onValueChange={(value) => setWelcomeCampaignId(value ?? NONE)}
          >
            <SelectTrigger>
              <SelectValue placeholder="None — no welcome coupon" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>None</SelectItem>
              {(campaignsQuery.data?.items ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-slate-400">
            When set, new travelers who register via a referral link receive a personal coupon code from this campaign
          </p>
        </div>
      </div>

      {/* Fraud protection summary — always-on, no toggles */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3.5">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-800">Built-in fraud protection active</p>
          </div>
          <InfoTooltip
            content="These automated security guards protect promo credit balances against abuse, bot attacks, and collusion."
            iconClassName="text-emerald-600 hover:text-emerald-800"
          />
        </div>
        <ul className="mt-2.5 space-y-1 pl-6">
          {[
            "Self-referral prevention",
            "Same phone number detection",
            "Same-device fingerprint detection",
            "Requires a confirmed, paid trip before reward matures",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-xs text-emerald-700">
              <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-2 pl-0 text-[11px] text-emerald-600/70">
          These controls are permanently enabled and cannot be disabled to protect platform integrity.
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
            refereeCouponCampaignId: welcomeCampaignId === NONE ? null : welcomeCampaignId,
            selfReferralBlock,
            samePhoneBlock,
            sameDeviceBlock,
            requirePaidConfirmedBooking: requirePaid,
          })
        }
      >
        {saveMutation.isPending ? "Saving…" : "Save referral settings"}
      </Button>
    </Card>
  );
}

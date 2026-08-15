"use client";

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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

const NONE = "__none__";

export function AdminReferralProgramCard() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const programQuery = useQuery(trpc.discountsAdmin.getReferralProgram.queryOptions());
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
    <Card className="space-y-4 p-4">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-slate-900">Referral program</h2>
        <p className="text-xs text-slate-500">
          Recurring promo credits for referrers after paid confirms. Optionally
          mint a personal welcome coupon for the friend from an Active platform
          campaign.
        </p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="ref-active">Program active</Label>
        <Switch
          id="ref-active"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ref-initial">Initial credit (XOF)</Label>
          <Input
            id="ref-initial"
            type="number"
            value={referrerCredit}
            onChange={(e) => setReferrerCredit(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ref-recurring">Recurring credit (XOF)</Label>
          <Input
            id="ref-recurring"
            type="number"
            value={recurringCredit}
            onChange={(e) => setRecurringCredit(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ref-max">Max recurring bookings</Label>
          <Input
            id="ref-max"
            type="number"
            value={recurringMax}
            onChange={(e) => setRecurringMax(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ref-window">Window (days)</Label>
          <Input
            id="ref-window"
            type="number"
            value={windowDays}
            onChange={(e) => setWindowDays(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ref-delay">Reward delay (hours)</Label>
          <Input
            id="ref-delay"
            type="number"
            value={delayHours}
            onChange={(e) => setDelayHours(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Welcome coupon campaign</Label>
          <Select
            value={welcomeCampaignId}
            onValueChange={setWelcomeCampaignId}
          >
            <SelectTrigger>
              <SelectValue placeholder="None" />
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
        </div>
      </div>
      <Button
        type="button"
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
            selfReferralBlock: true,
            samePhoneBlock: true,
            sameDeviceBlock: true,
          })
        }
      >
        Save referral settings
      </Button>
    </Card>
  );
}

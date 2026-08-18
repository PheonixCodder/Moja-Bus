"use client";

import { Card } from "@moja/ui/components/ui/card";
import { ArrowRight, CheckCircle2, Gift, ShieldAlert, Sparkles, UserPlus, Users } from "lucide-react";
import { InfoTooltip } from "@/features/discounts/components/info-tooltip";

interface AdminReferralsFunnelCardProps {
  funnel: Record<string, number>;
  isLoading?: boolean;
}

export function AdminReferralsFunnelCard({
  funnel,
  isLoading = false,
}: AdminReferralsFunnelCardProps) {
  const attributed = funnel["ATTRIBUTED"] ?? 0;
  const qualified = funnel["QUALIFIED"] ?? 0;
  const rewarded = funnel["REWARDED"] ?? 0;
  const fraud = funnel["REJECTED_FRAUD"] ?? 0;
  const total = attributed + qualified + rewarded + fraud;

  const qualRate = attributed > 0 ? Math.round((qualified / attributed) * 100) : 0;
  const rewardRate = qualified > 0 ? Math.round((rewarded / qualified) * 100) : 0;

  return (
    <Card className="p-6 border-slate-200/80 shadow-xs bg-white space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold tracking-tight text-slate-900">
              Referral Conversion Funnel
            </h2>
            <InfoTooltip content="Progression of invited referees through attribution, paid booking qualification, fraud inspection, and reward payout." />
          </div>
          <p className="text-xs text-slate-500">
            Real-time viral growth pipeline across all registered passenger referral links.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-2.5 py-1 text-xs font-semibold text-pink-700 ring-1 ring-inset ring-pink-700/10">
            <Sparkles className="size-3.5" />
            {total.toLocaleString()} Total Invites
          </span>
        </div>
      </div>

      {/* Visual Pipeline Steps */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <UserPlus className="size-4" />
            </div>
            <span className="text-[11px] font-medium text-slate-400">Step 1</span>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Attributed Signups</p>
            <p className="mt-0.5 font-display text-2xl font-bold tracking-tight tabular-nums text-slate-900">
              {isLoading ? "—" : attributed.toLocaleString()}
            </p>
          </div>
          <p className="text-[11px] text-slate-400">Claimed referral link</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <CheckCircle2 className="size-4" />
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              {qualRate}% conversion
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Qualified Bookings</p>
            <p className="mt-0.5 font-display text-2xl font-bold tracking-tight tabular-nums text-slate-900">
              {isLoading ? "—" : qualified.toLocaleString()}
            </p>
          </div>
          <p className="text-[11px] text-slate-400">Completed 1st paid ride</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Gift className="size-4" />
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              {rewardRate}% paid out
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Rewarded Referrers</p>
            <p className="mt-0.5 font-display text-2xl font-bold tracking-tight tabular-nums text-slate-900">
              {isLoading ? "—" : rewarded.toLocaleString()}
            </p>
          </div>
          <p className="text-[11px] text-slate-400">Credit lot unlocked</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex size-9 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
              <ShieldAlert className="size-4" />
            </div>
            <span className="text-[11px] font-medium text-rose-500">Blocked</span>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Fraud Flags Blocked</p>
            <p className="mt-0.5 font-display text-2xl font-bold tracking-tight tabular-nums text-slate-900">
              {isLoading ? "—" : fraud.toLocaleString()}
            </p>
          </div>
          <p className="text-[11px] text-slate-400">Self/Device/Phone abuse</p>
        </div>
      </div>
    </Card>
  );
}

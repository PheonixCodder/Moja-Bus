"use client";

import { Card } from "@moja/ui/components/ui/card";
import { CheckCircle2, Coins, Megaphone, Tag } from "lucide-react";

interface AdminCampaignsKpiCardsProps {
  activeCampaigns: number;
  confirmedRedemptions: number;
  ticketDiscountXOF: number;
  platformExpenseXOF: number;
  isLoading?: boolean;
}

export function AdminCampaignsKpiCards({
  activeCampaigns,
  confirmedRedemptions,
  ticketDiscountXOF,
  platformExpenseXOF,
  isLoading = false,
}: AdminCampaignsKpiCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="flex items-center gap-4 p-5 shadow-xs border-slate-200/80 bg-white">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-500/10">
          <Megaphone className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500">Active campaigns</p>
          <p className="mt-0.5 font-display text-2xl font-bold tracking-tight tabular-nums text-slate-900">
            {isLoading ? "—" : activeCampaigns}
          </p>
        </div>
      </Card>

      <Card className="flex items-center gap-4 p-5 shadow-xs border-slate-200/80 bg-white">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/10">
          <CheckCircle2 className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500">Confirmed redemptions</p>
          <p className="mt-0.5 font-display text-2xl font-bold tracking-tight tabular-nums text-slate-900">
            {isLoading ? "—" : confirmedRedemptions.toLocaleString()}
          </p>
        </div>
      </Card>

      <Card className="flex items-center gap-4 p-5 shadow-xs border-slate-200/80 bg-white">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-500/10">
          <Tag className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500">Ticket discounts</p>
          <p className="mt-0.5 font-display text-2xl font-bold tracking-tight tabular-nums text-slate-900">
            {isLoading ? "—" : (
              <>
                {ticketDiscountXOF.toLocaleString()}{" "}
                <span className="text-xs font-medium text-slate-400">XOF</span>
              </>
            )}
          </p>
        </div>
      </Card>

      <Card className="flex items-center gap-4 p-5 shadow-xs border-slate-200/80 bg-white">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-500/10">
          <Coins className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500">Platform expense</p>
          <p className="mt-0.5 font-display text-2xl font-bold tracking-tight tabular-nums text-slate-900">
            {isLoading ? "—" : (
              <>
                {platformExpenseXOF.toLocaleString()}{" "}
                <span className="text-xs font-medium text-slate-400">XOF</span>
              </>
            )}
          </p>
        </div>
      </Card>
    </div>
  );
}

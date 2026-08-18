"use client";

import { Card } from "@moja/ui/components/ui/card";
import { InfoTooltip } from "@/features/discounts/components/info-tooltip";

interface CampaignPerformanceData {
  campaign: {
    id: string;
    name: string;
    status: string;
    budgetXOF?: number | null;
    budgetConsumedXOF: number;
    budgetReservedXOF: number;
    fundingType: string;
  };
  confirmedRedemptions: number;
  ticketDiscountXOF: number;
  platformFundedXOF: number;
  operatorFundedXOF: number;
  creditAppliedXOF: number;
  byStatus: Record<string, number>;
  byCompany: Array<{ companyId: string; redemptions: number; ticketDiscountXOF: number }>;
}

interface AdminCampaignDrawerPerformanceProps {
  performance: CampaignPerformanceData | undefined;
  isLoading: boolean;
}

export function AdminCampaignDrawerPerformance({
  performance,
  isLoading,
}: AdminCampaignDrawerPerformanceProps) {
  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        Loading campaign performance metrics...
      </div>
    );
  }

  if (!performance) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        No performance metrics available for this campaign yet.
      </div>
    );
  }

  const budget = performance.campaign.budgetXOF;
  const consumed = performance.campaign.budgetConsumedXOF;
  const reserved = performance.campaign.budgetReservedXOF;
  const totalSpend = consumed + reserved;
  const hasBudget = budget != null && budget > 0;
  const pct = hasBudget ? Math.min(100, Math.round((totalSpend / budget!) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Real-time Financials
          </p>
          <InfoTooltip content="Real-time financial performance, ticket discounts, and funding splits for this specific campaign." />
        </div>

        <div className="mt-3 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4 bg-slate-50/70 border-slate-200/80 shadow-none">
            <p className="text-xs font-medium text-slate-500">Confirmed redemptions</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-slate-900">
              {performance.confirmedRedemptions.toLocaleString()}
            </p>
          </Card>

          <Card className="p-4 bg-slate-50/70 border-slate-200/80 shadow-none">
            <p className="text-xs font-medium text-slate-500">Ticket discount total</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-slate-900">
              {performance.ticketDiscountXOF.toLocaleString()}{" "}
              <span className="text-xs font-medium text-slate-400">XOF</span>
            </p>
          </Card>

          <Card className="p-4 bg-slate-50/70 border-slate-200/80 shadow-none">
            <p className="text-xs font-medium text-slate-500">Platform funded</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-slate-900">
              {performance.platformFundedXOF.toLocaleString()}{" "}
              <span className="text-xs font-medium text-slate-400">XOF</span>
            </p>
          </Card>

          <Card className="p-4 bg-slate-50/70 border-slate-200/80 shadow-none">
            <p className="text-xs font-medium text-slate-500">Operator funded</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-slate-900">
              {performance.operatorFundedXOF.toLocaleString()}{" "}
              <span className="text-xs font-medium text-slate-400">XOF</span>
            </p>
          </Card>
        </div>
      </div>

      {hasBudget && (
        <Card className="p-4 border-slate-200/80 bg-white">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-800">Budget utilization</span>
            <span className="text-xs font-medium text-slate-500">
              {totalSpend.toLocaleString()} / {budget.toLocaleString()} XOF ({pct}%)
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full transition-all ${
                pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 flex gap-4 text-xs text-slate-500">
            <span>Consumed: {consumed.toLocaleString()} XOF</span>
            <span>Reserved (in checkout): {reserved.toLocaleString()} XOF</span>
          </div>
        </Card>
      )}

      {performance.byCompany.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Top Participating Operators
          </p>
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
            {performance.byCompany.map((c) => (
              <div key={c.companyId} className="flex items-center justify-between p-3 text-sm">
                <span className="font-mono text-xs text-slate-700">{c.companyId}</span>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-500">{c.redemptions} redemptions</span>
                  <span className="font-semibold text-slate-900">{c.ticketDiscountXOF.toLocaleString()} XOF</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

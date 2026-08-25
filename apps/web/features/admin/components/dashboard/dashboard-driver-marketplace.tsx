"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Users, UserCheck, Building2, Clock } from "lucide-react";

interface StatCard {
  label: string;
  value: number | string;
  subLabel?: string;
  color: "emerald" | "sky" | "amber" | "rose";
  icon: React.ReactNode;
}

function StatChip({ label, value, subLabel, color, icon }: StatCard) {
  const colorMap = {
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    sky: "text-sky-600 bg-sky-50 border-sky-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    rose: "text-rose-600 bg-rose-50 border-rose-100",
  };
  const numColorMap = {
    emerald: "text-emerald-700",
    sky: "text-sky-700",
    amber: "text-amber-700",
    rose: "text-rose-700",
  };

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70 truncate">{label}</p>
        <p className={`text-2xl font-bold font-mono mt-0.5 ${numColorMap[color]}`}>{value}</p>
        {subLabel && (
          <p className="text-xs opacity-60 mt-0.5 truncate">{subLabel}</p>
        )}
      </div>
    </div>
  );
}

export function AdminDriverMarketplaceWidget() {
  const trpc = useTRPC();
  const { data: stats } = useSuspenseQuery(
    trpc.admin.getDriverMarketplaceStats.queryOptions()
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Driver Marketplace</h3>
          <p className="text-xs text-slate-500 mt-0.5">Supply-side health — verified driver pool</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1">
          <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-700">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatChip
          label="Verified Drivers"
          value={stats.totalVerified}
          subLabel="Platform-wide"
          color="sky"
          icon={<UserCheck size={18} className="text-sky-600" />}
        />
        <StatChip
          label="Available for Hire"
          value={stats.availableForHire}
          subLabel="In marketplace"
          color="emerald"
          icon={<Users size={18} className="text-emerald-600" />}
        />
        <StatChip
          label="Employed"
          value={stats.employed}
          subLabel="Active affiliation"
          color="amber"
          icon={<Building2 size={18} className="text-amber-600" />}
        />
        <StatChip
          label="Pending Verification"
          value={stats.pendingVerification}
          subLabel="Awaiting review"
          color="rose"
          icon={<Clock size={18} className="text-rose-600" />}
        />
      </div>
    </div>
  );
}

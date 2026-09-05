"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Users, UserCheck, Building2, Clock } from "lucide-react";

interface StatCard {
  label: string;
  value: number | string;
  subLabel?: string;
  color: "success" | "primary" | "warning" | "destructive";
  icon: React.ReactNode;
}

function StatChip({ label, value, subLabel, color, icon }: StatCard) {
  const colorMap = {
    success: "text-success bg-success/10 border-success/20",
    primary: "text-primary bg-primary/10 border-primary/20",
    warning: "text-warning bg-warning/10 border-warning/20",
    destructive: "text-destructive bg-destructive/10 border-destructive/20",
  };
  const numColorMap = {
    success: "text-success",
    primary: "text-primary",
    warning: "text-warning",
    destructive: "text-destructive",
  };

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 ${colorMap[color]}`}
    >
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70 truncate">
          {label}
        </p>
        <p
          className={`text-2xl font-bold font-mono mt-0.5 ${numColorMap[color]}`}
        >
          {value}
        </p>
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
    trpc.admin.getDriverMarketplaceStats.queryOptions(),
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            Driver Marketplace
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Supply-side health — verified driver pool
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-success/10 border border-success/20 px-2.5 py-1">
          <div className="size-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-semibold text-success">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatChip
          label="Verified Drivers"
          value={stats.totalVerified}
          subLabel="Platform-wide"
          color="primary"
          icon={<UserCheck size={18} className="text-primary" />}
        />
        <StatChip
          label="Available for Hire"
          value={stats.availableForHire}
          subLabel="In marketplace"
          color="success"
          icon={<Users size={18} className="text-success" />}
        />
        <StatChip
          label="Employed"
          value={stats.employed}
          subLabel="Active affiliation"
          color="warning"
          icon={<Building2 size={18} className="text-warning" />}
        />
        <StatChip
          label="Pending Verification"
          value={stats.pendingVerification}
          subLabel="Awaiting review"
          color="destructive"
          icon={<Clock size={18} className="text-destructive" />}
        />
      </div>
    </div>
  );
}

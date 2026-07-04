"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import {
  Building2,
  ShieldCheck,
  ShieldAlert,
  Bus,
  MapPin,
  Users,
  Ticket,
  Clock,
} from "lucide-react";
import { getCompanyStatusPresentation } from "@/features/operator/lib/company-status";
import { cn } from "@moja/ui/lib/utils";

export function OperatorDashboardView() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.operator.getOnboardingStatus.queryOptions(),
  );

  const operatorData = data?.operator;
  const company = operatorData?.company;
  const statusPresentation = getCompanyStatusPresentation(company?.status);
  const StatusIcon =
    company?.status === "SUSPENDED" || company?.status === "REJECTED"
      ? ShieldAlert
      : statusPresentation.isFullyVerified
        ? ShieldCheck
        : Clock;

  return (
    <div className="space-y-6">
      {/* Top Welcome Section */}
      <div className="bg-slate-900 text-white rounded-md p-6 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-y-6 translate-x-6 text-white/5 pointer-events-none">
          <Bus className="w-64 h-64" />
        </div>
        <div className="relative z-10 space-y-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded border",
              statusPresentation.isFullyVerified
                ? "text-primary bg-primary/10 border-primary/20"
                : company?.status === "SUSPENDED"
                  ? "text-orange-300 bg-orange-500/10 border-orange-500/30"
                  : company?.status === "REJECTED"
                    ? "text-red-300 bg-red-500/10 border-red-500/30"
                    : "text-amber-300 bg-amber-500/10 border-amber-500/30",
            )}
          >
            <StatusIcon className="w-3.5 h-3.5" /> {statusPresentation.label}
          </span>
          <h1 className="text-2xl font-bold font-display tracking-tight">
            Welcome to Moja Ride, {company?.name || "Partner"}
          </h1>
          <p className="text-slate-400 text-xs max-w-md leading-relaxed">
            {statusPresentation.description}
          </p>
          {company?.rejectionReason ? (
            <p className="text-red-300 text-xs max-w-md leading-relaxed">
              Rejection reason: {company.rejectionReason}
            </p>
          ) : null}
        </div>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 border border-border rounded-md bg-white space-y-3">
          <div className="w-8 h-8 bg-primary/10 text-primary rounded flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Company Profile
            </h4>
            <p className="text-sm font-bold text-foreground mt-1 truncate">
              {company?.name || "Not Configured"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {company?.businessType || "N/A"}
            </p>
          </div>
        </div>

        <div className="p-5 border border-border rounded-md bg-white space-y-3">
          <div className="w-8 h-8 bg-primary/10 text-primary rounded flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Terminals / Stations
            </h4>
            <p className="text-sm font-bold text-foreground mt-1">
              {company?.locations?.length || 0} Registered
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Primary:{" "}
              {company?.locations?.find((l: any) => l.isPrimary)?.city ||
                "None"}
            </p>
          </div>
        </div>

        <div className="p-5 border border-border rounded-md bg-white space-y-3">
          <div className="w-8 h-8 bg-primary/10 text-primary rounded flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Estimated Staff
            </h4>
            <p className="text-sm font-bold text-foreground mt-1">
              {company?.estimatedStaffSize || "N/A"} Employees
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Status: {statusPresentation.shortLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Booking and fleet placeholder */}
      <div className="p-8 border border-dashed border-border rounded-md text-center bg-slate-50/50 space-y-4">
        <div className="w-12 h-12 bg-slate-100 text-slate-400 mx-auto rounded-full flex items-center justify-center">
          <Ticket className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground">
            Buses and Route Scheduling
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {statusPresentation.isFullyVerified
              ? "Add vehicles, create intercity route plans, and sell digital tickets from the planning and fleet sections."
              : "Complete verification to unlock full ticket sales. You can still configure terminals, routes, and schedules in the meantime."}
          </p>
        </div>
      </div>
    </div>
  );
}

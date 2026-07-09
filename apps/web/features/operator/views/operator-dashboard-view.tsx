"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import {
  Building2,
  ShieldCheck,
  ShieldAlert,
  Bus,
  Users,
  Ticket,
  Clock,
  CheckCircle2,
  Circle,
  ArrowRight,
} from "lucide-react";
import { getCompanyStatusPresentation } from "@/features/operator/lib/company-status";
import { cn } from "@moja/ui/lib/utils";
import Link from "next/link";

export function OperatorDashboardView() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.operator.getOnboardingStatus.queryOptions(),
  );

  const operatorData = data?.operator;
  const company = operatorData?.company;
  const businessReadiness = data?.businessReadiness;
  const statusPresentation = getCompanyStatusPresentation(company?.status);
  const StatusIcon =
    company?.status === "SUSPENDED" || company?.status === "REJECTED"
      ? ShieldAlert
      : statusPresentation.isFullyVerified
        ? ShieldCheck
        : Clock;

  const readinessCompleted =
    businessReadiness?.filter((r: any) => r.completed).length ?? 0;
  const readinessTotal = businessReadiness?.length ?? 5;

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
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Verification
            </h4>
            <p className="text-sm font-bold text-foreground mt-1">
              {statusPresentation.shortLabel}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {statusPresentation.isFullyVerified
                ? "Fully verified"
                : "Under review"}
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
          </div>
        </div>
      </div>

      {/* Business Operations Readiness — backend-driven */}
      {businessReadiness && businessReadiness.length > 0 && (
        <div className="border border-border rounded-md bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Business Operations
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Complete these steps to start selling tickets.
              </p>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded">
              {readinessCompleted}/{readinessTotal} Complete
            </span>
          </div>
          <div className="divide-y divide-border">
            {businessReadiness.map((item: any) => (
              <Link
                key={item.id}
                href={item.completed ? "#" : item.href}
                className={cn(
                  "flex items-center justify-between px-5 py-3.5 transition-colors",
                  item.completed
                    ? "cursor-default"
                    : "hover:bg-slate-50 cursor-pointer",
                )}
              >
                <div className="flex items-center gap-3">
                  {item.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  )}
                  <span
                    className={cn(
                      "text-sm font-medium",
                      item.completed
                        ? "text-muted-foreground line-through"
                        : "text-foreground",
                    )}
                  >
                    {item.title}
                  </span>
                </div>
                {!item.completed && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Booking placeholder */}
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

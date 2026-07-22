"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { format } from "date-fns";
import {
  Building2, Monitor, CheckCircle2, XCircle,
  Briefcase, User, Clock, AlertCircle,
} from "lucide-react";

import { Badge } from "@moja/ui/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { UserProfileHeader } from "../components/user-profile-header";
import { cn } from "@moja/ui/lib/utils";
import Link from "next/link";

const companyStatusMeta: Record<string, { label: string; className: string; icon: any }> = {
  ACTIVE:               { label: "Active",              icon: CheckCircle2, className: "bg-emerald-100/60 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  PENDING_VERIFICATION: { label: "Pending Verification", icon: AlertCircle, className: "bg-amber-100/60 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  DRAFT:                { label: "Draft",               icon: Clock,        className: "bg-zinc-100/60 text-zinc-500 dark:bg-zinc-800/40 dark:text-zinc-400" },
  SUSPENDED:            { label: "Suspended",           icon: XCircle,      className: "bg-red-100/60 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  REJECTED:             { label: "Rejected",            icon: XCircle,      className: "bg-red-100/60 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  VERIFIED:             { label: "Verified",            icon: CheckCircle2, className: "bg-blue-100/60 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
};

const onboardingStepLabels = ["Company", "Documents", "Bank", "Profile", "Terms"];

export function AdminOperatorProfileView({ userId }: { userId: string }) {
  const trpc = useTRPC();
  const { data: user } = useSuspenseQuery(trpc.admin.getUserProfile.queryOptions({ userId }));

  const primaryOperator = user.operatorProfiles[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <UserProfileHeader
        id={user.id}
        fullName={user.fullName}
        email={user.email}
        phone={user.phoneNumber}
        role={user.role as "OPERATOR"}
        emailVerified={user.emailVerified}
        createdAt={user.createdAt}
        backHref="/dashboard/admin/users/operators"
        backLabel="Back to Operators"
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Companies", value: user.operatorProfiles.length, icon: Building2 },
          { label: "Active Sessions", value: user.sessions.length, icon: Monitor },
          { label: "Staff Role", value: primaryOperator?.role ?? "—", icon: Briefcase },
          {
            label: "Onboarding",
            value: primaryOperator?.onboardingProgress
              ? `${primaryOperator.onboardingProgress.completedStepCount}/${primaryOperator.onboardingProgress.totalSteps}`
              : "—",
            icon: CheckCircle2,
          },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border shadow-sm">
            <CardContent className="p-4 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-2xl font-bold">{value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Cards */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Associated Companies
          </h2>
          {user.operatorProfiles.length === 0 ? (
            <Card className="border shadow-sm">
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                No associated companies found.
              </CardContent>
            </Card>
          ) : (
            user.operatorProfiles.map((op) => {
              const company = op.company;
              const statusMeta = companyStatusMeta[company.status] ?? companyStatusMeta["DRAFT"]!;
              const StatusIcon = statusMeta.icon;
              const progress = op.onboardingProgress;
              const progressPct = progress
                ? Math.round((progress.completedStepCount / progress.totalSteps) * 100)
                : 0;

              return (
                <Card key={op.id} className="border shadow-sm overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold">{company.name}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Reg: {company.registrationNumber} · {company.businessType.replace(/_/g, " ")}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={cn("border-0 text-xs shrink-0", statusMeta.className)}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusMeta.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    {/* Staff role */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">Staff Role</span>
                        <span className="font-medium">{op.role}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">Operator Status</span>
                        <span className="font-medium">{op.status}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">Identity Verified</span>
                        <span className="font-medium">{op.isVerified ? "Yes" : "No"}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">Joined</span>
                        <span className="font-medium">{format(op.joinedAt, "MMM d, yyyy")}</span>
                      </div>
                    </div>

                    {/* Onboarding Progress */}
                    {progress && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Onboarding Progress</span>
                          <span className="font-medium">{progress.completedStepCount}/{progress.totalSteps} steps</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <div className="flex justify-between">
                          {onboardingStepLabels.map((step, i) => (
                            <span
                              key={step}
                              className={cn(
                                "text-[10px]",
                                i < progress.completedStepCount
                                  ? "text-primary font-medium"
                                  : "text-muted-foreground"
                              )}
                            >
                              {step}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Link to verification */}
                    <div className="pt-1">
                      <Link
                        href={`/dashboard/admin/verifications/${company.id}`}
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        View Verification Details →
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Personal Details (from primary operator profile) */}
          {primaryOperator && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Personal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  { label: "Job Title", value: primaryOperator.jobTitle || "—" },
                  { label: "Personal Phone", value: primaryOperator.personalPhone || "—" },
                  { label: "Date of Birth", value: primaryOperator.dateOfBirth ? format(primaryOperator.dateOfBirth, "PPP") : "—" },
                  { label: "ID Type", value: primaryOperator.nationalIdType || "—" },
                  { label: "National ID", value: primaryOperator.nationalIdNumber ? "••••••" + primaryOperator.nationalIdNumber.slice(-4) : "—" },
                  { label: "Emergency Contact", value: primaryOperator.emergencyContactName || "—" },
                  { label: "Emergency Phone", value: primaryOperator.emergencyContactPhone || "—" },
                  { label: "Work Email", value: user.workEmail || "—" },
                  { label: "Work Phone", value: user.workPhone || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-muted-foreground shrink-0">{label}</span>
                    <span className="font-medium text-right truncate">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Sessions */}
          {user.sessions.length > 0 && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  Recent Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {user.sessions.map((s) => (
                    <div key={s.id} className="px-6 py-3 flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs font-medium truncate w-full" title={s.userAgent || "Unknown device"}>
                        {s.userAgent || "Unknown device"}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 overflow-hidden">
                        <Monitor className="h-3 w-3 shrink-0" />
                        <span className="truncate">{s.ipAddress || "Unknown IP"}</span>
                        <span className="opacity-40 shrink-0">·</span>
                        <span className="shrink-0">{format(s.createdAt, "MMM d, HH:mm")}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import { Button, buttonVariants } from "@moja/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import { Progress } from "@moja/ui/components/ui/progress";
import { cn } from "@moja/ui/lib/utils";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  Bus,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  CreditCard,
  MapPin,
  Plus,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { TicketScanner } from "@/features/operator/components/ticket-scanner";
import { useStaffPermissions } from "@/features/operator/hooks/use-staff-permissions";
import { getCompanyStatusPresentation } from "@/features/operator/lib/company-status";
import { formatDateWithWeekday } from "@/lib/format-date";
import { useTRPC } from "@/trpc/client";

export function OperatorDashboardView() {
  const t = useTranslations("operatorDashboard.overview");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { canAny } = useStaffPermissions();
  const canCheckIn = canAny(["bookings:update", "bookings:checkin"]);

  // State for Check-in dialog
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);

  // Fetch status and live metrics
  const { data: onboardingData } = useSuspenseQuery(
    trpc.operator.getOnboardingStatus.queryOptions(),
  );

  const { data: metrics } = useSuspenseQuery(
    trpc.operator.getDashboardMetrics.queryOptions(),
  );

  const operatorData = onboardingData?.operator;
  const company = operatorData?.company;
  const businessReadiness = onboardingData?.businessReadiness;
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
  const isOnboardingDone = onboardingData?.onboardingStatus === "COMPLETED";

  // Check-in mutation
  const checkInMutation = useMutation({
    ...trpc.operator.checkInBooking.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(
        trpc.operator.getDashboardMetrics.queryFilter(),
      );
    },
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const stats = metrics?.stats;
  const departures = metrics?.departures ?? [];
  const activities = metrics?.activities ?? [];

  const statusLabel = t(`status.${company?.status ?? "DRAFT"}.label`);
  const statusDesc = t(`status.${company?.status ?? "DRAFT"}.description`);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      {/* Top Banner and Quick Status */}
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-6 text-card-foreground shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border",
                statusPresentation.isFullyVerified
                  ? "text-success bg-success/10 border-success/20"
                  : company?.status === "SUSPENDED"
                    ? "text-warning bg-warning/10 border-warning/30"
                    : company?.status === "REJECTED"
                      ? "text-destructive bg-destructive/10 border-destructive/30"
                      : "text-warning bg-warning/10 border-warning/30",
              )}
            >
              <StatusIcon className="w-3.5 h-3.5" /> {statusLabel}
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold font-display tracking-tight text-foreground">
              {company?.name || t("portalFallback")}
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm max-w-2xl leading-relaxed">
              {statusDesc}
            </p>
            {company?.rejectionReason && (
              <p className="text-destructive text-xs font-semibold">
                {t("rejectionReason", { reason: company.rejectionReason })}
              </p>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-2 bg-muted border border-border rounded-xl px-4 py-3 backdrop-blur-xs">
            <Sparkles className="w-5 h-5 text-primary" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("quickPortal")}
              </p>
              <p className="text-xs font-semibold text-foreground">
                {t("systemOnline")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Today's Revenue */}
        <Card className="border-border bg-surface hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("revenueTitle")}
            </CardTitle>
            <div className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {formatCurrency(stats?.revenueTodayXOF ?? 0)}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {t("revenueDesc")}
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Today's Bookings */}
        <Card className="border-border bg-surface hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("bookingsTitle")}
            </CardTitle>
            <div className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {stats?.totalBookingsToday ?? 0}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {t("bookingsDesc")}
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Occupancy Rate */}
        <Card className="border-border bg-surface hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("occupancyTitle")}
            </CardTitle>
            <div className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {stats?.occupancyRateToday ?? 0}%
              </div>
              <span className="text-[9px] font-semibold text-muted-foreground">
                {t("occupancyTarget")}
              </span>
            </div>
            <Progress
              value={stats?.occupancyRateToday ?? 0}
              className="h-1.5 bg-border"
            />
          </CardContent>
        </Card>

        {/* KPI 4: Active Fleet */}
        {stats?.totalBuses != null && (
          <Card className="border-border bg-surface hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("fleetTitle")}
              </CardTitle>
              <div className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                <Bus className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {stats.activeBuses}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  / {stats.totalBuses}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {t("fleetDesc")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Today's Departures (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border bg-surface">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    {t("dispatchTitle")}
                  </CardTitle>
                  <CardDescription>{t("dispatchDesc")}</CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="border-border text-muted-foreground font-semibold font-mono"
                >
                  {t("tripCount", { count: departures.length })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {departures.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-muted-foreground space-y-4">
                  <div className="w-12 h-12 bg-muted text-muted-foreground rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <p className="font-bold text-foreground">
                      {t("noTripsTitle")}
                    </p>
                    <p className="text-xs">{t("noTripsDesc")}</p>
                  </div>
                  <Link
                    href="/dashboard/operator/schedules"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "mt-2 border-border text-foreground hover:bg-card-elevated",
                    )}
                  >
                    {t("manageSchedules")}
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {departures.map((trip) => {
                    const departureDate = new Date(trip.departureTime);
                    const formattedTime = departureDate.toLocaleTimeString(
                      "en-US",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Africa/Abidjan",
                      },
                    );

                    const occupancyPercent =
                      trip.totalSeats > 0
                        ? Math.round((trip.bookedSeats / trip.totalSeats) * 100)
                        : 0;

                    const isBoarding = trip.status === "BOARDING";
                    const isDeparted = trip.status === "DEPARTED";
                    const isDelayed = trip.status === "DELAYED";
                    const isCancelled = trip.status === "CANCELLED";

                    return (
                      <div
                        key={trip.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border/80 rounded-xl hover:bg-muted/50 transition-colors gap-4"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground font-mono bg-card-elevated px-2 py-0.5 rounded border border-border/60">
                              {formattedTime}
                            </span>
                            <span className="text-[10px] font-semibold text-muted-foreground font-mono">
                              {formatDateWithWeekday(trip.departureTime)}
                            </span>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[9px] font-bold uppercase tracking-wider",
                                isBoarding &&
                                  "bg-primary/10 text-primary border border-primary/20",
                                isDeparted &&
                                  "bg-success/10 text-success border border-success/20",
                                isDelayed &&
                                  "bg-warning/10 text-warning border border-warning/20",
                                isCancelled &&
                                  "bg-destructive/10 text-destructive border border-destructive/20",
                              )}
                            >
                              {trip.status}
                            </Badge>
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-foreground flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                              {trip.routeLabel}
                            </h4>
                            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                              {t("busLabel", { label: trip.busLabel })}
                            </p>
                          </div>

                          <div className="w-full max-w-xs space-y-1">
                            <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                              <span>
                                {t("seatsSold", {
                                  booked: trip.bookedSeats,
                                  total: trip.totalSeats,
                                })}
                              </span>
                              <span>{occupancyPercent}%</span>
                            </div>
                            <Progress
                              value={occupancyPercent}
                              className="h-1 bg-muted"
                            />
                          </div>
                        </div>

                        <div className="flex items-center sm:self-center shrink-0">
                          <Link
                            href={`/dashboard/operator/trips`}
                            className={cn(
                              buttonVariants({
                                variant: "outline",
                                size: "sm",
                              }),
                              "border-border text-foreground hover:bg-card-elevated h-8 text-xs font-bold gap-1 flex items-center justify-center",
                            )}
                          >
                            {t("goToDispatch")}{" "}
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Quick Actions & Recent Activity (1/3 width) */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <Card className="border-border bg-surface">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-bold text-foreground">
                {t("quickActionsTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {canCheckIn && (
                <Button
                  onClick={() => setIsCheckInOpen(true)}
                  className="w-full bg-primary hover:bg-primary/95 text-white font-semibold flex items-center justify-center gap-2 h-10 shadow-sm"
                >
                  <QrCode className="w-4 h-4" />
                  {t("scanCheckIn")}
                </Button>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/dashboard/operator/routes"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "border-border text-foreground hover:bg-card-elevated text-xs font-bold flex items-center justify-center gap-1.5 h-9",
                  )}
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t("newRoute")}
                </Link>
                <Link
                  href="/dashboard/operator/fleet"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "border-border text-foreground hover:bg-card-elevated text-xs font-bold flex items-center justify-center gap-1.5 h-9",
                  )}
                >
                  <Bus className="w-3.5 h-3.5" />
                  {t("manageFleet")}
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Live Activity Stream */}
          <Card className="border-border bg-surface">
            <CardHeader className="border-b border-border/60 pb-3">
              <CardTitle className="text-sm font-bold text-foreground">
                {t("activityTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {activities.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  {t("noActivity")}
                </p>
              ) : (
                <div className="space-y-4">
                  {activities.map((act) => {
                    const timeDiff = Math.max(
                      0,
                      Date.now() - new Date(act.timestamp).getTime(),
                    );
                    const minutesAgo = Math.floor(timeDiff / 60000);
                    let timeLabel: string;
                    if (minutesAgo < 1) {
                      timeLabel = t("justNow");
                    } else if (minutesAgo < 60) {
                      timeLabel = t("minutesAgo", { n: minutesAgo });
                    } else if (minutesAgo < 1440) {
                      timeLabel = t("hoursAgo", {
                        n: Math.floor(minutesAgo / 60),
                      });
                    } else {
                      timeLabel = t("daysAgo", {
                        n: Math.floor(minutesAgo / 1440),
                      });
                    }

                    const isCheckIn = act.action === "Checked in";

                    return (
                      <div
                        key={act.id}
                        className="flex gap-3 text-xs border-b border-border/40 pb-3 last:border-0 last:pb-0"
                      >
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full mt-1.5 shrink-0 animate-pulse",
                            isCheckIn ? "bg-success" : "bg-primary",
                          )}
                        />
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {act.passengerName}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {t("activityAction", {
                              action: act.action,
                              routeLabel: act.routeLabel,
                            })}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5 font-medium">
                            <span className="font-mono">
                              {act.bookingReference}
                            </span>
                            <span>{timeLabel}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Business Operations Readiness — backend-driven */}
      {businessReadiness && businessReadiness.length > 0 && (
        <div className="border border-border rounded-md bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {t("readinessTitle")}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("readinessDesc")}
              </p>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded">
              {t("readinessProgress", {
                completed: readinessCompleted,
                total: readinessTotal,
              })}
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
                    : "hover:bg-muted/50 cursor-pointer",
                )}
              >
                <div className="flex items-center gap-3">
                  {item.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
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

      {/* Upgraded Camera Scanner & Manual Input dialog */}
      <TicketScanner
        open={isCheckInOpen}
        onOpenChange={setIsCheckInOpen}
        onScan={async (rawValue) => {
          const result = await checkInMutation.mutateAsync({
            ticketToken: rawValue,
          });
          return {
            passengerName: result.passengerName,
            seatLabel: result.seatLabel,
            bookingReference: result.bookingReference,
            alreadyCheckedIn: result.alreadyCheckedIn || false,
          };
        }}
      />
    </div>
  );
}

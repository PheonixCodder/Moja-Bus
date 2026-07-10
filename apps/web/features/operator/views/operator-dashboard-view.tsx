"use client";

import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useState } from "react";
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
  Plus,
  CreditCard,
  QrCode,
  MapPin,
  Calendar,
  Sparkles,
  Search,
  ScanLine,
} from "lucide-react";
import { getCompanyStatusPresentation } from "@/features/operator/lib/company-status";
import { cn } from "@moja/ui/lib/utils";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { Button, buttonVariants } from "@moja/ui/components/ui/button";
import { Badge } from "@moja/ui/components/ui/badge";
import { Progress } from "@moja/ui/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@moja/ui/components/ui/dialog";
import { Input } from "@moja/ui/components/ui/input";
import { toast } from "sonner";

export function OperatorDashboardView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  // State for Check-in dialog
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [ticketTokenInput, setTicketTokenInput] = useState("");
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);

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
    onSuccess: (result) => {
      if (result.alreadyCheckedIn) {
        toast.info(`${result.passengerName} was already checked in`);
      } else {
        toast.success(`Successfully checked in ${result.passengerName} (Seat ${result.seatLabel})`);
      }
      setIsCheckInOpen(false);
      setTicketTokenInput("");
      // Invalidate queries to refresh stats
      queryClient.invalidateQueries(trpc.operator.getDashboardMetrics.queryFilter());
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to check in passenger. Please verify the ticket code.");
    },
  });

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTokenInput.trim()) {
      toast.error("Please enter a valid ticket reference or token");
      return;
    }

    setIsSubmittingCheckIn(true);
    try {
      await checkInMutation.mutateAsync({
        ticketToken: ticketTokenInput.trim(),
      });
    } catch (err) {
      // Handled by onError in the mutation
    } finally {
      setIsSubmittingCheckIn(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("fr-CI", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const stats = metrics?.stats;
  const departures = metrics?.departures ?? [];
  const activities = metrics?.activities ?? [];

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-10">
      
      {/* Top Banner and Quick Status */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-6 text-white shadow-lg">
        <div className="absolute right-0 bottom-0 translate-y-8 translate-x-8 text-white/5 pointer-events-none">
          <Bus className="w-80 h-80" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border",
                statusPresentation.isFullyVerified
                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                  : company?.status === "SUSPENDED"
                    ? "text-orange-400 bg-orange-500/10 border-orange-500/30"
                    : company?.status === "REJECTED"
                      ? "text-red-400 bg-red-500/10 border-red-500/30"
                      : "text-amber-400 bg-amber-500/10 border-amber-500/30",
              )}
            >
              <StatusIcon className="w-3.5 h-3.5" /> {statusPresentation.label}
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold font-display tracking-tight text-white">
              {company?.name || "Moja Ride Operator Portal"}
            </h1>
            <p className="text-slate-400 text-xs md:text-sm max-w-2xl leading-relaxed">
              {statusPresentation.description}
            </p>
            {company?.rejectionReason && (
              <p className="text-red-400 text-xs font-semibold">
                Reason: {company.rejectionReason}
              </p>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-2 bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-3 backdrop-blur-xs">
            <Sparkles className="w-5 h-5 text-primary" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Portal</p>
              <p className="text-xs font-semibold text-slate-200">System Online & Synced</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: Today's Revenue */}
        <Card className="border-border bg-bg-surface hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Today's Revenue</CardTitle>
            <div className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold font-mono tracking-tight text-text-primary">
              {formatCurrency(stats?.revenueTodayXOF ?? 0)}
            </div>
            <p className="text-[10px] text-text-secondary">Confirmed operator settlements today</p>
          </CardContent>
        </Card>

        {/* KPI 2: Today's Bookings */}
        <Card className="border-border bg-bg-surface hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Today's Bookings</CardTitle>
            <div className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold font-mono tracking-tight text-text-primary">
              {stats?.totalBookingsToday ?? 0}
            </div>
            <p className="text-[10px] text-text-secondary">Seats sold across today's departures</p>
          </CardContent>
        </Card>

        {/* KPI 3: Occupancy Rate */}
        <Card className="border-border bg-bg-surface hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Occupancy Rate</CardTitle>
            <div className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold font-mono tracking-tight text-text-primary">
                {stats?.occupancyRateToday ?? 0}%
              </div>
              <span className="text-[9px] font-semibold text-text-muted">Target: 70%+</span>
            </div>
            <Progress value={stats?.occupancyRateToday ?? 0} className="h-1.5 bg-border" />
          </CardContent>
        </Card>

        {/* KPI 4: Active Fleet */}
        <Card className="border-border bg-bg-surface hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Active Fleet</CardTitle>
            <div className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
              <Bus className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold font-mono tracking-tight text-text-primary">
              {stats?.activeBuses ?? 0} <span className="text-sm font-normal text-text-muted">/ {stats?.totalBuses ?? 0}</span>
            </div>
            <p className="text-[10px] text-text-secondary">Active vehicles currently configured</p>
          </CardContent>
        </Card>

      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Today's Departures (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border bg-bg-surface">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-text-primary">Today's Dispatch Board</CardTitle>
                  <CardDescription>Scheduled routes and occupancy statuses for today's departures.</CardDescription>
                </div>
                <Badge variant="outline" className="border-border text-text-secondary font-semibold font-mono">
                  {departures.length} Trip{departures.length === 1 ? "" : "s"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {departures.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-text-secondary space-y-4">
                  <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <p className="font-bold text-text-primary">No Departures Scheduled Today</p>
                    <p className="text-xs">Configure schedules or create extra routes to start dispatching trips.</p>
                  </div>
                  <Link
                    href="/dashboard/operator/schedules"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "mt-2 border-border text-text-primary hover:bg-bg-elevated"
                    )}
                  >
                    Manage Schedules
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {departures.map((trip) => {
                    const departureDate = new Date(trip.departureTime);
                    const formattedTime = departureDate.toLocaleTimeString("fr-CI", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    
                    const occupancyPercent = trip.totalSeats > 0 
                      ? Math.round((trip.bookedSeats / trip.totalSeats) * 100)
                      : 0;

                    const isBoarding = trip.status === "BOARDING";
                    const isDeparted = trip.status === "DEPARTED";
                    const isDelayed = trip.status === "DELAYED";
                    const isCancelled = trip.status === "CANCELLED";

                    return (
                      <div 
                        key={trip.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border/80 rounded-xl hover:bg-slate-50/50 transition-colors gap-4"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-text-primary font-mono bg-bg-elevated px-2 py-0.5 rounded border border-border/60">
                              {formattedTime}
                            </span>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[9px] font-bold uppercase tracking-wider",
                                isBoarding && "bg-blue-500/10 text-blue-600 border border-blue-500/20",
                                isDeparted && "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
                                isDelayed && "bg-amber-500/10 text-amber-600 border border-amber-500/20",
                                isCancelled && "bg-red-500/10 text-red-600 border border-red-500/20"
                              )}
                            >
                              {trip.status}
                            </Badge>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-bold text-text-primary flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-text-muted" />
                              {trip.routeLabel}
                            </h4>
                            <p className="text-[11px] text-text-muted mt-0.5 font-medium">
                              Bus: {trip.busLabel}
                            </p>
                          </div>

                          <div className="w-full max-w-xs space-y-1">
                            <div className="flex justify-between text-[10px] font-semibold text-text-secondary">
                              <span>{trip.bookedSeats} / {trip.totalSeats} Seats Sold</span>
                              <span>{occupancyPercent}%</span>
                            </div>
                            <Progress value={occupancyPercent} className="h-1 bg-slate-100" />
                          </div>
                        </div>

                        <div className="flex items-center sm:self-center shrink-0">
                          <Link
                            href={`/dashboard/operator/trips`}
                            className={cn(
                              buttonVariants({ variant: "outline", size: "sm" }),
                              "border-border text-text-primary hover:bg-bg-elevated h-8 text-xs font-bold gap-1 flex items-center justify-center"
                            )}
                          >
                            Go to Dispatch <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
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
          <Card className="border-border bg-bg-surface">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-bold text-text-primary">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <Button
                onClick={() => setIsCheckInOpen(true)}
                className="w-full bg-primary hover:bg-primary/95 text-white font-semibold flex items-center justify-center gap-2 h-10 shadow-sm"
              >
                <QrCode className="w-4 h-4" />
                Scan & Check-In Ticket
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/dashboard/operator/routes"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "border-border text-text-primary hover:bg-bg-elevated text-xs font-bold flex items-center justify-center gap-1.5 h-9"
                  )}
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Route
                </Link>
                <Link
                  href="/dashboard/operator/fleet"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "border-border text-text-primary hover:bg-bg-elevated text-xs font-bold flex items-center justify-center gap-1.5 h-9"
                  )}
                >
                  <Bus className="w-3.5 h-3.5" />
                  Manage Fleet
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Live Activity Stream */}
          <Card className="border-border bg-bg-surface">
            <CardHeader className="border-b border-border/60 pb-3">
              <CardTitle className="text-sm font-bold text-text-primary">Recent Booking Activity</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {activities.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-6">No recent activity detected.</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((act) => {
                    const timeDiff = Math.max(0, Date.now() - new Date(act.timestamp).getTime());
                    const minutesAgo = Math.floor(timeDiff / 60000);
                    let timeLabel = "Just now";
                    if (minutesAgo > 0 && minutesAgo < 60) {
                      timeLabel = `${minutesAgo}m ago`;
                    } else if (minutesAgo >= 60 && minutesAgo < 1440) {
                      timeLabel = `${Math.floor(minutesAgo / 60)}h ago`;
                    } else if (minutesAgo >= 1440) {
                      timeLabel = `${Math.floor(minutesAgo / 1440)}d ago`;
                    }

                    const isCheckIn = act.action === "Checked in";

                    return (
                      <div key={act.id} className="flex gap-3 text-xs border-b border-border/40 pb-3 last:border-0 last:pb-0">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-1.5 shrink-0 animate-pulse",
                          isCheckIn ? "bg-emerald-500" : "bg-primary"
                        )} />
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <p className="font-semibold text-text-primary truncate">
                            {act.passengerName}
                          </p>
                          <p className="text-[11px] text-text-secondary">
                            <span className="font-medium">{act.action}</span> for <span className="font-medium">{act.routeLabel}</span>
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-text-muted pt-0.5 font-medium">
                            <span className="font-mono">{act.bookingReference}</span>
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

      {/* Interactive Scan & Check-in Dialog */}
      <Dialog open={isCheckInOpen} onOpenChange={setIsCheckInOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-border rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-text-primary flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-primary" />
              Ticket Verification & Check-In
            </DialogTitle>
            <DialogDescription className="text-xs text-text-muted">
              Verify a passenger's ticket by scanning the QR code or entering the ticket code/reference below.
            </DialogDescription>
          </DialogHeader>

          {/* Simulated Scanner Visualizer */}
          <div className="relative aspect-video rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col items-center justify-center text-center text-slate-400 p-6 space-y-3">
            <div className="absolute inset-0 bg-linear-to-b from-primary/10 to-transparent pointer-events-none animate-pulse" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-24 border-2 border-dashed border-primary/40 rounded flex items-center justify-center">
              <div className="w-full h-0.5 bg-primary/80 absolute top-0 left-0 right-0 animate-bounce" />
            </div>
            <QrCode className="w-10 h-10 text-slate-500 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-slate-200">Interactive Camera Ready</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Point boarding pass QR code at the scanner</p>
            </div>
          </div>

          <form onSubmit={handleCheckInSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="ticket-token" className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                Ticket Token or Reference Number
              </label>
              <div className="relative">
                <Input
                  id="ticket-token"
                  placeholder="Enter code (e.g. MOB-ABCD1 or Token)"
                  value={ticketTokenInput}
                  onChange={(e) => setTicketTokenInput(e.target.value)}
                  disabled={isSubmittingCheckIn}
                  className="pr-10 h-10 border-border text-sm shadow-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                  <Search className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCheckInOpen(false);
                  setTicketTokenInput("");
                }}
                disabled={isSubmittingCheckIn}
                className="border-border text-text-primary hover:bg-bg-elevated h-9 text-xs font-semibold px-4 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingCheckIn || !ticketTokenInput.trim()}
                className="bg-primary hover:bg-primary/95 text-white h-9 text-xs font-bold px-4 rounded-lg shadow-sm"
              >
                {isSubmittingCheckIn ? "Checking in..." : "Confirm Boarding"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Radio,
  ArrowRight,
  Bus,
  Clock,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Search,
  RefreshCw,
  ScanLine,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@moja/ui/lib/utils";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Spinner } from "@moja/ui/components/ui/spinner";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@moja/ui/components/ui/combobox";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@moja/ui/components/ui/drawer";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@moja/ui/components/ui/empty";

import { useTRPC } from "@/trpc/client";
import {
  TicketScanner,
  type TicketScanResult,
} from "@/features/operator/components/ticket-scanner";
import {
  useSuspenseQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { RouterOutputs } from "@/trpc/client";
import {
  buildConsecutiveSegments,
  countSegmentOccupancy,
  getSegmentSeatStatus,
  type TripSegment,
} from "@/features/booking/lib/trip-segments";

type Trip = RouterOutputs["trips"]["list"][number];
type TripDetail = RouterOutputs["trips"]["get"];
type TripStatus = Trip["status"];
type BusType = RouterOutputs["fleet"]["getBuses"]["buses"][number];

// ──────────────────────────────────────────────
// Status config
// ──────────────────────────────────────────────

const STATUS_CONFIG: Record<
  TripStatus,
  { label: string; icon: React.ElementType; color: string; dot: string }
> = {
  SCHEDULED: {
    label: "Scheduled",
    icon: Clock,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    dot: "bg-blue-500",
  },
  BOARDING: {
    label: "Boarding",
    icon: CheckCircle2,
    color: "text-green-600 bg-green-50 border-green-200",
    dot: "bg-green-500",
  },
  DEPARTED: {
    label: "Departed",
    icon: ArrowRight,
    color: "text-slate-600 bg-slate-50 border-slate-200",
    dot: "bg-slate-400",
  },
  DELAYED: {
    label: "Delayed",
    icon: AlertTriangle,
    color: "text-amber-600 bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-red-600 bg-red-50 border-red-200",
    dot: "bg-red-500",
  },
  ARRIVED: {
    label: "Arrived",
    icon: CheckCircle2,
    color: "text-slate-500 bg-slate-50 border-slate-200",
    dot: "bg-slate-300",
  },
};

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h ?? "0");
  const ampm = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatHeaderDate(dateStr: string) {
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  if (year === undefined || month === undefined || day === undefined) return dateStr;
  
  // Construct Date object in the browser's local timezone
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function groupTripsByDate(trips: Trip[]): [string, Trip[]][] {
  const map = new Map<string, Trip[]>();
  for (const trip of trips) {
    const d = new Date(trip.departureDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(trip);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

// ──────────────────────────────────────────────
// Status Badge
// ──────────────────────────────────────────────

function TripStatusBadge({ status }: { status: TripStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-bold",
        cfg.color,
      )}
    >
      <Icon className="size-3" />
      {cfg.label}
    </span>
  );
}

// ──────────────────────────────────────────────
// Seat Fill Bar
// ──────────────────────────────────────────────

function SeatFillBar({ booked, total }: { booked: number; total: number }) {
  const pct = total > 0 ? Math.min((booked / total) * 100, 100) : 0;
  const color =
    pct >= 90 ? "bg-red-500" : pct >= 60 ? "bg-amber-500" : "bg-primary";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {booked} / {total} seats
        </span>
        <span className="text-[11px] font-semibold text-foreground">
          {Math.round(pct)}%
        </span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            color,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Segment Seat Grid (per consecutive stop pair)
// ──────────────────────────────────────────────

function SegmentSeatGrid({
  trip,
  segment,
}: {
  trip: TripDetail;
  segment: TripSegment;
}) {
  const seats = trip.seats ?? [];
  const bookings = trip.bookings ?? [];

  if (seats.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">
        No seat map available for this trip.
      </p>
    );
  }

  const maxRow = Math.max(...seats.map((s) => s.seat.row));
  const maxCol = Math.max(...seats.map((s) => s.seat.col));

  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        <div className="flex gap-1 mb-1 pl-8">
          {Array.from({ length: maxCol }, (_, i) => (
            <div
              key={i}
              className="w-7 text-center text-[10px] font-bold text-muted-foreground"
            >
              {i + 1}
            </div>
          ))}
        </div>

        {Array.from({ length: maxRow }, (_, row) => (
          <div key={row} className="flex items-center gap-1 mb-1">
            <div className="w-7 text-[10px] font-bold text-muted-foreground text-right pr-1">
              {String.fromCharCode(65 + row)}
            </div>
            {Array.from({ length: maxCol }, (_, col) => {
              const seat = seats.find(
                (s) => s.seat.row === row + 1 && s.seat.col === col + 1,
              );
              if (!seat || seat.seat.seatType === "EMPTY_SPACE") {
                return <div key={col} className="w-7 h-7" />;
              }
              if (seat.seat.seatType === "DRIVER_AREA") {
                return (
                  <div
                    key={col}
                    className="w-7 h-7 rounded bg-slate-200 flex items-center justify-center"
                  >
                    <User className="size-3 text-slate-500" />
                  </div>
                );
              }

              const isBlocked = !seat.isActive || !seat.seat.isActive;
              const seatStatus = getSegmentSeatStatus(
                seat.seatId,
                bookings,
                segment,
                isBlocked,
              );
              const statusLabel =
                seatStatus === "booked"
                  ? "Booked"
                  : seatStatus === "held"
                    ? "Held"
                    : seatStatus === "blocked"
                      ? "Blocked"
                      : "Available";

              return (
                <div
                  key={col}
                  title={`Seat ${seat.seat.label} — ${statusLabel}`}
                  className={cn(
                    "w-7 h-7 rounded border text-[9px] font-bold flex items-center justify-center transition-colors",
                    seatStatus === "booked" &&
                      "bg-primary text-white border-primary",
                    seatStatus === "held" &&
                      "bg-amber-400 text-amber-950 border-amber-500",
                    seatStatus === "blocked" &&
                      "bg-slate-200 text-slate-400 border-slate-300",
                    seatStatus === "available" &&
                      "bg-background border-border text-muted-foreground hover:border-primary/30",
                  )}
                >
                  {seat.seat.label}
                </div>
              );
            })}
          </div>
        ))}

        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-primary border-primary border" />
            <span className="text-[11px] text-muted-foreground">Booked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-amber-400 border border-amber-500" />
            <span className="text-[11px] text-muted-foreground">Held</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-background border border-border" />
            <span className="text-[11px] text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-slate-200 border border-slate-300" />
            <span className="text-[11px] text-muted-foreground">Blocked</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SegmentOccupancySection({ trip }: { trip: TripDetail }) {
  const segments = buildConsecutiveSegments(trip.tripStops ?? []);
  const bookings = trip.bookings ?? [];

  if (segments.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No route segments available for this trip.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {segments.map((segment) => {
        const counts = countSegmentOccupancy(bookings, segment);
        const segmentKey = `${segment.originOrder}-${segment.destinationOrder}`;

        return (
          <div
            key={segmentKey}
            className="space-y-2 rounded-md border border-border p-3 bg-slate-50/30"
          >
            <div className="flex items-center justify-between gap-2">
              <h5 className="text-xs font-bold text-foreground">
                {segment.originLabel}
                <ArrowRight className="inline size-3 mx-1 text-muted-foreground/50" />
                {segment.destinationLabel}
              </h5>
              {counts.held > 0 ? (
                <span className="text-[10px] text-muted-foreground">
                  {counts.confirmed} confirmed · {counts.held} held
                </span>
              ) : null}
            </div>
            <SeatFillBar
              booked={counts.occupied}
              total={trip.totalSeats}
            />
            {(trip.seats?.length ?? 0) > 0 ? (
              <SegmentSeatGrid trip={trip} segment={segment} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// Manifest Drawer
// ──────────────────────────────────────────────

function ManifestDrawer({
  tripId,
  open,
  onClose,
  buses,
}: {
  tripId: string | null;
  open: boolean;
  onClose: () => void;
  buses: BusType[];
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [delayMinutes, setDelayMinutes] = useState("15");
  const [cancelReason, setCancelReason] = useState("");
  const [showDelayForm, setShowDelayForm] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  const {
    data: trip,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    ...trpc.trips.get.queryOptions({ id: tripId ?? "" }),
    enabled: !!tripId && open,
  });

  const invalidateTripData = useCallback(() => {
    queryClient.invalidateQueries(trpc.trips.list.pathFilter());
    if (tripId) {
      queryClient.invalidateQueries(
        trpc.trips.get.queryFilter({ id: tripId }),
      );
    }
  }, [queryClient, trpc, tripId]);

  const checkInMutation = useMutation({
    ...trpc.operator.checkInBooking.mutationOptions(),
    onSuccess: (result) => {
      invalidateTripData();
      if (result.alreadyCheckedIn) {
        toast.info(`${result.passengerName} was already checked in`);
      } else {
        toast.success(
          `Checked in ${result.passengerName} (seat ${result.seatLabel})`,
        );
      }
    },
    onError: (err: any) =>
      toast.error(err.message || "Check-in failed"),
  });

  const assignBusMutation = useMutation({
    ...trpc.trips.assignBusDriver.mutationOptions(),
    onMutate: async (newAssignment) => {
      await queryClient.cancelQueries(trpc.trips.list.pathFilter());
      const previousTrips = queryClient.getQueriesData(
        trpc.trips.list.pathFilter(),
      );
      queryClient.setQueriesData(trpc.trips.list.queryFilter(), (old: any) => {
        if (!old) return old;
        return old.map((t: any) => {
          if (t.id === newAssignment.id) {
            return {
              ...t,
              busId: newAssignment.data.busId,
              bus:
                buses.find((b) => b.id === newAssignment.data.busId) ||
                t.bus,
            };
          }
          return t;
        });
      });
      return { previousTrips };
    },
    onError: (err: any, newAssignment, context: any) => {
      if (context?.previousTrips) {
        for (const [queryKey, data] of context.previousTrips) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      toast.error(err.message || "Failed to assign bus");
    },
    onSettled: () => {
      invalidateTripData();
    },
    onSuccess: () => {
      toast.success("Bus assigned");
    },
  });

  const updateStatusMutation = useMutation({
    ...trpc.trips.updateStatus.mutationOptions(),
    onSuccess: () => {
      invalidateTripData();
    },
    onError: (err: any) =>
      toast.error(err.message || "Failed to update status"),
  });

  const delayMutation = useMutation({
    ...trpc.trips.delay.mutationOptions(),
    onSuccess: () => {
      invalidateTripData();
      toast.success("Delay logged");
      setShowDelayForm(false);
    },
    onError: (err: any) =>
      toast.error(err.message || "Failed to log delay"),
  });

  const cancelMutation = useMutation({
    ...trpc.trips.cancel.mutationOptions(),
    onSuccess: () => {
      invalidateTripData();
      toast.success("Trip cancelled");
      setShowCancelForm(false);
    },
    onError: (err: any) =>
      toast.error(err.message || "Failed to cancel trip"),
  });

  const actionLoading =
    assignBusMutation.isPending ||
    updateStatusMutation.isPending ||
    delayMutation.isPending ||
    cancelMutation.isPending ||
    checkInMutation.isPending;

  const confirmedBookings =
    trip?.bookings?.filter((b) => b.status === "CONFIRMED") ?? [];
  const checkedInCount = confirmedBookings.filter((b) => b.checkedInAt).length;

  async function handleManualCheckIn(bookingId: string) {
    if (!trip) return;
    setCheckingInId(bookingId);
    try {
      await checkInMutation.mutateAsync({ bookingId, tripId: trip.id });
    } finally {
      setCheckingInId(null);
    }
  }

  const handleScanCheckIn = useCallback(
    async (raw: string): Promise<TicketScanResult> => {
      if (!tripId) {
        throw new Error("Trip not loaded");
      }
      return checkInMutation.mutateAsync({
        ticketToken: raw,
        tripId,
      });
    },
    [checkInMutation, tripId],
  );

  function bookingSegmentLabel(booking: {
    originTripStop?: {
      terminal?: { name?: string; cityRelation?: { name?: string } | null };
    };
    destinationTripStop?: {
      terminal?: { name?: string; cityRelation?: { name?: string } | null };
    };
  }): string {
    const origin =
      booking.originTripStop?.terminal?.cityRelation?.name ??
      booking.originTripStop?.terminal?.name ??
      "";
    const dest =
      booking.destinationTripStop?.terminal?.cityRelation?.name ??
      booking.destinationTripStop?.terminal?.name ??
      "";
    return origin && dest ? `${origin} → ${dest}` : "";
  }

  function handleAssignBus(busId: string) {
    if (!trip) return;
    assignBusMutation.mutate({ id: trip.id, data: { busId } });
  }

  function handleStartBoarding() {
    if (!trip) return;
    updateStatusMutation.mutate(
      { id: trip.id, status: "BOARDING" },
      { onSuccess: () => toast.success("Boarding started") },
    );
  }

  function handleLogDelay() {
    if (!trip) return;
    const mins = parseInt(delayMinutes, 10);
    if (isNaN(mins) || mins <= 0) {
      toast.error("Enter a valid delay in minutes");
      return;
    }
    delayMutation.mutate({ id: trip.id, data: { delayMinutes: mins } });
  }

  function handleCancel() {
    if (!trip || !cancelReason.trim()) {
      toast.error("Cancellation reason is required");
      return;
    }
    cancelMutation.mutate({
      id: trip.id,
      data: { cancelReason: cancelReason.trim() },
    });
  }

  const isCancellable =
    trip && !["CANCELLED", "ARRIVED", "DEPARTED"].includes(trip.status);
  const canBoard = trip?.status === "SCHEDULED";
  const canDelay = trip && !["CANCELLED", "ARRIVED"].includes(trip.status);

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()} direction="right">
      <DrawerContent className="!inset-y-0 !right-0 !left-auto !w-full !max-w-lg flex flex-col">
        <DrawerHeader className="border-b border-border px-5 py-4 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <DrawerTitle className="text-base font-bold">
                Trip Manifest
              </DrawerTitle>
              <DrawerDescription className="text-xs text-muted-foreground">
                {trip
                  ? `${
                      trip.schedule?.route?.originTerminal?.cityRelation?.name ??
                      trip.schedule?.route?.originTerminal?.city ??
                      trip.schedule?.route?.originTerminal?.name ??
                      "Origin"
                    } → ${
                      trip.schedule?.route?.destTerminal?.cityRelation?.name ??
                      trip.schedule?.route?.destTerminal?.city ??
                      trip.schedule?.route?.destTerminal?.name ??
                      "Dest"
                    } · ${formatDate(trip.departureDate)}`
                  : "Loading…"}
              </DrawerDescription>
            </div>
            {isFetching && !isLoading ? (
              <RefreshCw className="size-3.5 text-muted-foreground animate-spin shrink-0 mt-1" />
            ) : null}
          </div>
        </DrawerHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner className="size-6 text-primary" />
          </div>
        ) : isError ? (
          <div className="flex-1 flex items-center justify-center px-5">
            <p className="text-sm text-destructive">Failed to load trip details</p>
          </div>
        ) : trip ? (
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between">
              <TripStatusBadge status={trip.status} />
              {(trip.delayMinutes ?? 0) > 0 && (
                <span className="text-xs font-semibold text-amber-600">
                  +{trip.delayMinutes}m delay
                </span>
              )}
            </div>

            {/* Trip Summary */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Trip Summary
              </h4>
              <div className="border border-border rounded-md p-3 space-y-2 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  <span className="text-xs text-foreground">
                    {formatDate(trip.departureDate)}
                  </span>
                  <Clock className="size-3.5 text-muted-foreground ml-2" />
                  <span className="text-xs text-foreground">
                    {formatTime(trip.schedule?.departureTime ?? "")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold">
                    {trip.schedule?.route?.originTerminal?.cityRelation?.name ??
                      trip.schedule?.route?.originTerminal?.city ??
                      trip.schedule?.route?.originTerminal?.name ??
                      "Origin"}
                  </span>
                  <ArrowRight className="size-3 text-muted-foreground/50" />
                  <span className="text-xs font-semibold">
                    {trip.schedule?.route?.destTerminal?.cityRelation?.name ??
                      trip.schedule?.route?.destTerminal?.city ??
                      trip.schedule?.route?.destTerminal?.name ??
                      "Destination"}
                  </span>
                </div>
              </div>
            </div>

            {/* Bus */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Bus
              </h4>
              <div className="w-full">
                <Combobox
                  items={buses
                    .filter((b) => b.status === "ACTIVE")
                    .map((b) => ({
                      value: b.id,
                      label: `${b.registrationPlate}${b.internalName ? ` — ${b.internalName}` : ""} (${b.layoutTemplate?.totalSeats ?? "?"} seats)`,
                    }))}
                  value={trip.busId ?? ""}
                  onValueChange={(val) => {
                    if (val) handleAssignBus(val);
                  }}
                  disabled={actionLoading}
                >
                  <ComboboxInput
                    placeholder="Assign a bus…"
                    className="w-full text-sm"
                    value={
                      trip.busId
                        ? (() => {
                            const b = buses.find((x) => x.id === trip.busId);
                            return b
                              ? `${b.registrationPlate}${b.internalName ? ` — ${b.internalName}` : ""} (${b.layoutTemplate?.totalSeats ?? "?"} seats)`
                              : "";
                          })()
                        : ""
                    }
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No active bus found.</ComboboxEmpty>
                    <ComboboxList>
                      {buses
                        .filter((b) => b.status === "ACTIVE")
                        .map((b) => (
                          <ComboboxItem key={b.id} value={b.id}>
                            {b.registrationPlate}
                            {b.internalName ? ` — ${b.internalName}` : ""} (
                            {b.layoutTemplate?.totalSeats ?? "?"} seats)
                          </ComboboxItem>
                        ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
            </div>

            {/* Segment occupancy */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Segments
              </h4>
              <SegmentOccupancySection trip={trip} />
            </div>

            {/* Passenger list */}
            {(trip.bookings?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Passengers ({trip.bookings!.length})
                  </h4>
                  {confirmedBookings.length > 0 ? (
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {checkedInCount} / {confirmedBookings.length} checked in
                    </span>
                  ) : null}
                </div>
                <div className="border border-border rounded-md overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 bg-slate-50 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span>Name</span>
                    <span>Seat</span>
                    <span>Status</span>
                    <span className="text-right">Action</span>
                  </div>
                  {trip.bookings!.map((b) => (
                    <div
                      key={b.id}
                      className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2.5 border-b border-border last:border-b-0 items-center"
                    >
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          {b.passengerName}
                        </p>
                        {b.passengerPhone ? (
                          <p className="text-[11px] text-muted-foreground">
                            {b.passengerPhone}
                          </p>
                        ) : null}
                        {bookingSegmentLabel(b) ? (
                          <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                            {bookingSegmentLabel(b)}
                          </p>
                        ) : null}
                      </div>
                      <span className="font-mono text-xs font-bold text-foreground">
                        {b.seat?.label ?? "—"}
                      </span>
                      <span
                        className={cn(
                          "text-[11px] font-bold whitespace-nowrap",
                          b.checkedInAt
                            ? "text-green-600"
                            : "text-muted-foreground",
                        )}
                      >
                        {b.checkedInAt ? "Checked in" : b.status === "CONFIRMED" ? "Pending" : b.status}
                      </span>
                      {b.status === "CONFIRMED" && !b.checkedInAt ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] px-2"
                          disabled={checkingInId === b.id || checkInMutation.isPending}
                          onClick={() => void handleManualCheckIn(b.id)}
                        >
                          {checkingInId === b.id ? (
                            <Spinner className="size-3" />
                          ) : (
                            "Check in"
                          )}
                        </Button>
                      ) : b.checkedInAt ? (
                        <span className="text-green-600 text-xs font-bold text-right">
                          ✓
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Actions
              </h4>
              <div className="flex flex-col gap-2">
                {confirmedBookings.length > 0 ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setScannerOpen(true)}
                    disabled={actionLoading}
                    className="w-full"
                  >
                    <ScanLine className="size-4 mr-2" />
                    Scan ticket
                  </Button>
                ) : null}
                {canBoard && (
                  <Button
                    size="sm"
                    onClick={handleStartBoarding}
                    disabled={actionLoading || !trip.busId}
                    className="w-full"
                  >
                    {actionLoading ? (
                      <Spinner className="size-4 mr-2" />
                    ) : (
                      <CheckCircle2 className="size-4 mr-2" />
                    )}
                    Start Boarding
                  </Button>
                )}
                {canDelay && (
                  <div>
                    {showDelayForm ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          placeholder="Minutes"
                          value={delayMinutes}
                          onChange={(e) => setDelayMinutes(e.target.value)}
                          className="h-8 text-sm"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleLogDelay}
                          disabled={actionLoading}
                          className="shrink-0"
                        >
                          Log
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowDelayForm(false)}
                          className="shrink-0"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowDelayForm(true)}
                        className="w-full text-amber-600 border-amber-200 hover:bg-amber-50"
                      >
                        <AlertTriangle className="size-4 mr-2" />
                        Log Delay
                      </Button>
                    )}
                  </div>
                )}
                {isCancellable && (
                  <div>
                    {showCancelForm ? (
                      <div className="space-y-2">
                        <Input
                          placeholder="Cancellation reason…"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleCancel}
                            disabled={actionLoading || !cancelReason.trim()}
                            className="flex-1"
                          >
                            Confirm Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowCancelForm(false)}
                          >
                            Back
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowCancelForm(true)}
                        className="w-full text-destructive border-destructive/20 hover:bg-destructive/5"
                      >
                        <XCircle className="size-4 mr-2" />
                        Cancel Trip
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </DrawerContent>
      <TicketScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleScanCheckIn}
        disabled={!trip}
        description="Scan passenger tickets for this departure. Only tickets for this trip will be accepted."
      />
    </Drawer>
  );
}

// ──────────────────────────────────────────────
// Trip Card
// ──────────────────────────────────────────────

function TripCard({
  trip,
  buses,
  onViewManifest,
}: {
  trip: Trip;
  buses: BusType[];
  onViewManifest: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const assignBusMutation = useMutation({
    ...trpc.trips.assignBusDriver.mutationOptions(),
    onMutate: async (newAssignment) => {
      await queryClient.cancelQueries(trpc.trips.list.pathFilter());
      const previousTrips = queryClient.getQueriesData(
        trpc.trips.list.pathFilter(),
      );
      queryClient.setQueriesData(trpc.trips.list.queryFilter(), (old: any) => {
        if (!old) return old;
        return old.map((t: any) => {
          if (t.id === newAssignment.id) {
            return {
              ...t,
              busId: newAssignment.data.busId,
              bus: buses.find((b) => b.id === newAssignment.data.busId) || t.bus,
            };
          }
          return t;
        });
      });
      return { previousTrips };
    },
    onError: (err: any, newAssignment, context: any) => {
      if (context?.previousTrips) {
        for (const [queryKey, data] of context.previousTrips) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      toast.error(err.message || "Failed to assign bus");
    },
    onSettled: () => {
      queryClient.invalidateQueries(trpc.trips.list.pathFilter());
    },
    onSuccess: () => {
      toast.success("Bus assigned");
    },
  });

  const route = trip.schedule?.route;
  const origin =
    route?.originTerminal?.cityRelation?.name ??
    route?.originTerminal?.city ??
    route?.originTerminal?.name ??
    "—";
  const dest =
    route?.destTerminal?.cityRelation?.name ??
    route?.destTerminal?.city ??
    route?.destTerminal?.name ??
    "—";

  function handleAssignBus(busId: string) {
    assignBusMutation.mutate({ id: trip.id, data: { busId } });
  }

  const passengerCount = trip._count?.bookings ?? 0;

  return (
    <div className="border border-border rounded-md bg-card hover:border-primary/20 transition-all duration-200 overflow-hidden">
      {/* Card header */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        {/* Status dot */}
        <div
          className={cn(
            "size-2 rounded-full mt-1.5 shrink-0",
            STATUS_CONFIG[trip.status].dot,
          )}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  {origin}
                </span>
                <ArrowRight className="size-3 text-muted-foreground/50" />
                <span className="text-sm font-bold text-foreground">
                  {dest}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="size-3" />
                  {formatDate(trip.departureDate)}
                </span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" />
                  {formatTime(trip.schedule?.departureTime ?? "")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <TripStatusBadge status={trip.status} />
              {expanded ? (
                <ChevronUp className="size-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-3.5 text-muted-foreground" />
              )}
            </div>
          </div>

          {passengerCount > 0 ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              {passengerCount} passenger{passengerCount !== 1 ? "s" : ""}
            </p>
          ) : null}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3 bg-slate-50/30">
          {/* Bus assign */}
          <div className="flex items-center gap-2">
            <Bus className="size-4 text-muted-foreground shrink-0" />
            <div className="w-full flex-1">
              <Combobox
                items={buses
                  .filter((b) => b.status === "ACTIVE")
                  .map((b) => ({
                    value: b.id,
                    label: `${b.registrationPlate}${b.internalName ? ` — ${b.internalName}` : ""} (${b.layoutTemplate?.totalSeats ?? "?"} seats)`,
                  }))}
                value={trip.busId ?? ""}
                onValueChange={(val) => {
                  if (val) handleAssignBus(val);
                }}
                disabled={
                  assignBusMutation.isPending ||
                  ["CANCELLED", "ARRIVED"].includes(trip.status)
                }
              >
                <ComboboxInput
                  placeholder={
                    assignBusMutation.isPending ? "Assigning..." : "Assign bus…"
                  }
                  className="w-full text-xs h-8"
                  value={
                    trip.busId
                      ? (() => {
                          const b = buses.find((x) => x.id === trip.busId);
                          return b
                            ? `${b.registrationPlate}${b.internalName ? ` — ${b.internalName}` : ""} (${b.layoutTemplate?.totalSeats ?? "?"} seats)`
                            : "";
                        })()
                      : ""
                  }
                />
                <ComboboxContent>
                  <ComboboxEmpty>No active bus found.</ComboboxEmpty>
                  <ComboboxList>
                    {buses
                      .filter((b) => b.status === "ACTIVE")
                      .map((b) => (
                        <ComboboxItem
                          key={b.id}
                          value={b.id}
                          className="text-xs"
                        >
                          {b.registrationPlate}
                          {b.internalName ? ` — ${b.internalName}` : ""} (
                          {b.layoutTemplate?.totalSeats ?? "?"} seats)
                        </ComboboxItem>
                      ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => onViewManifest(trip.id)}
            >
              View Manifest
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main View
// ──────────────────────────────────────────────

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "BOARDING", label: "Boarding" },
  { value: "DELAYED", label: "Delayed" },
  { value: "DEPARTED", label: "Departed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "COMPLETED", label: "Completed" },
];

export function OperatorTripsView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [manifestTripId, setManifestTripId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const manifest = searchParams.get("manifest");
    if (manifest) {
      setManifestTripId(manifest);
    }
  }, [searchParams]);

  const { data: trips = [] } = useSuspenseQuery(trpc.trips.list.queryOptions());
  const { data: busesData } = useSuspenseQuery(
    trpc.fleet.getBuses.queryOptions(),
  );
  const buses = busesData?.buses ?? [];

  function handleRefresh() {
    setRefreshing(true);
    queryClient
      .invalidateQueries(trpc.trips.list.pathFilter())
      .finally(() => setRefreshing(false));
  }

  const filteredTrips = trips.filter((t) => {
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchSearch =
      !search ||
      t.schedule?.route?.originTerminal?.cityRelation?.name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      t.schedule?.route?.originTerminal?.city
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      t.schedule?.route?.originTerminal?.name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      t.schedule?.route?.destTerminal?.cityRelation?.name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      t.schedule?.route?.destTerminal?.city
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      t.schedule?.route?.destTerminal?.name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      t.bus?.registrationPlate?.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const grouped = groupTripsByDate(filteredTrips);

  // Quick stats
  const scheduled = trips.filter((t) => t.status === "SCHEDULED").length;
  const boarding = trips.filter((t) => t.status === "BOARDING").length;
  const delayed = trips.filter((t) => t.status === "DELAYED").length;

  return (
    <div className="flex flex-col h-full">
      {/* Quick stats */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-border bg-slate-50/50 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-blue-500" />
          <span className="text-xs text-muted-foreground">
            {scheduled} scheduled
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-green-500" />
          <span className="text-xs text-muted-foreground">
            {boarding} boarding
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-amber-500" />
          <span className="text-xs text-muted-foreground">
            {delayed} delayed
          </span>
        </div>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => handleRefresh()}
            disabled={refreshing}
          >
            <RefreshCw className={cn("size-3", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search route, bus, trip ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm pl-8"
          />
        </div>
        <Combobox
          items={STATUS_FILTERS}
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val || "ALL")}
        >
          <ComboboxInput
            placeholder="Filter by status…"
            className="h-8 text-xs w-40"
            value={
              statusFilter
                ? STATUS_FILTERS.find((f) => f.value === statusFilter)?.label ||
                  ""
                : ""
            }
          />
          <ComboboxContent>
            <ComboboxEmpty>No status found.</ComboboxEmpty>
            <ComboboxList>
              {STATUS_FILTERS.map((f) => (
                <ComboboxItem key={f.value} value={f.value} className="text-xs">
                  {f.label}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>

      {/* Trip list */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {filteredTrips.length === 0 ? (
          <Empty className="py-16">
            <EmptyMedia>
              <Radio className="size-10 text-muted-foreground/30" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>
                {trips.length === 0 ? "No trips yet" : "No trips match"}
              </EmptyTitle>
              <EmptyDescription>
                {trips.length === 0
                  ? "Create a schedule to auto-generate trips. They will appear here."
                  : "Try a different status filter or search term."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-6">
            {grouped.map(([date, dayTrips]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {formatHeaderDate(date)}
                  </h3>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[11px] text-muted-foreground">
                    {dayTrips.length} trip{dayTrips.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-3">
                  {dayTrips.map((trip) => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      buses={buses}
                      onViewManifest={setManifestTripId}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manifest drawer */}
      <ManifestDrawer
        tripId={manifestTripId}
        open={!!manifestTripId}
        onClose={() => setManifestTripId(null)}
        buses={buses}
      />
    </div>
  );
}

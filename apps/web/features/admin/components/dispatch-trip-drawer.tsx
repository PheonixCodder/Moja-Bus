"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { cn } from "@moja/ui/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@moja/ui/components/ui/drawer";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { ArrowRight, User, Phone, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import type { RouterOutputs } from "@/trpc/client";
import { format } from "date-fns";
import {
  buildConsecutiveSegments,
  countSegmentOccupancy,
  getSegmentSeatStatus,
  type TripSegment,
} from "@/features/booking/lib/trip-segments";

type TripDetail = RouterOutputs["admin"]["getDispatchTrip"];

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
            color
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

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

  const maxRow = Math.max(...seats.map((s: any) => s.seat.row));
  const maxCol = Math.max(...seats.map((s: any) => s.seat.col));

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
                (s: any) => s.seat.row === row + 1 && s.seat.col === col + 1
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
                isBlocked
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
                      "bg-background border-border text-muted-foreground hover:border-primary/30"
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

function PassengerManifestList({ trip }: { trip: TripDetail }) {
  const bookings = trip.bookings ?? [];
  const confirmed = bookings.filter((b: any) => b.status === "CONFIRMED");

  if (confirmed.length === 0) {
    return (
      <div className="text-center py-6">
        <User className="size-8 text-muted-foreground/30 mx-auto mb-2" />
        <h4 className="text-sm font-medium text-foreground">
          No confirmed passengers
        </h4>
        <p className="text-xs text-muted-foreground">
          No one has fully booked this trip yet.
        </p>
      </div>
    );
  }

  confirmed.sort((a: any, b: any) => {
    if (!a.seat?.label) return 1;
    if (!b.seat?.label) return -1;
    return a.seat.label.localeCompare(b.seat.label);
  });

  return (
    <div className="space-y-3">
      {confirmed.map((booking: any) => (
        <div
          key={booking.id}
          className="flex items-center justify-between p-3 border border-border rounded-lg bg-card"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-700">
              {booking.seat?.label ?? "?"}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {booking.passengerName}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                {booking.passengerPhone && (
                  <span className="flex items-center gap-1">
                    <Phone className="size-3" />
                    {booking.passengerPhone}
                  </span>
                )}
                <span className="mx-1">•</span>
                <span className="text-[10px] uppercase">
                  {booking.originTripStop?.terminal.cityRelation?.name ?? "..."} →{" "}
                  {booking.destinationTripStop?.terminal.cityRelation?.name ?? "..."}
                </span>
              </div>
            </div>
          </div>
          {booking.checkedInAt ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
              <CheckCircle2 className="size-3" />
              Checked In
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
              <AlertTriangle className="size-3" />
              Pending
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export function DispatchTripDrawer({
  tripId,
  open,
  onClose,
}: {
  tripId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const trpc = useTRPC();
  const { data: trip, isLoading } = useQuery({
    ...trpc.admin.getDispatchTrip.queryOptions({ id: tripId ?? "" }),
    enabled: !!tripId && open,
  });

  return (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      direction="right"
    >
      <DrawerContent className="h-screen top-0 right-0 left-auto mt-0 w-full sm:w-[450px] rounded-none">
        {isLoading || !trip ? (
          <div className="flex h-full flex-col items-center justify-center space-y-4">
            <Spinner className="size-8" />
            <p className="text-sm text-muted-foreground animate-pulse">
              Loading trip details...
            </p>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <DrawerHeader className="border-b border-border bg-slate-50/50 pb-4 text-left">
              <DrawerTitle className="text-base font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {trip.schedule.route.originTerminal.cityRelation?.name}
                  <ArrowRight className="size-4 text-muted-foreground" />
                  {trip.schedule.route.destTerminal.cityRelation?.name}
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full font-semibold tracking-wider">
                  {trip.company.name}
                </span>
              </DrawerTitle>
              <div className="text-xs text-muted-foreground mt-2">
                {format(new Date(trip.departureDate), "EEEE, MMM d, yyyy 'at' h:mm a")}
              </div>
            </DrawerHeader>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-6">
                {/* Trip Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-bg-base border rounded-md">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                      Status
                    </p>
                    <p className="text-sm font-semibold">{trip.status}</p>
                    {trip.delayMinutes && trip.delayMinutes > 0 && (
                      <p className="text-xs text-amber-600 font-medium mt-1">
                        {trip.delayMinutes} min delay
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-bg-base border rounded-md">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                      Bus Details
                    </p>
                    <p className="text-sm font-semibold">
                      {trip.bus ? trip.bus.registrationPlate : "Unassigned"}
                    </p>
                    {trip.bus && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {trip.totalSeats} seats total
                      </p>
                    )}
                  </div>
                </div>
                
                {trip.status === 'CANCELLED' && trip.cancelReason && (
                   <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-xs font-bold text-red-700 flex items-center gap-1.5 mb-1">
                      <AlertCircle className="size-3.5" />
                      Trip Cancelled
                    </p>
                    <p className="text-sm text-red-900">{trip.cancelReason}</p>
                   </div>
                )}

                {/* Segments Map */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold border-b pb-1">
                    Route Occupancy Map
                  </h4>
                  <SegmentOccupancySection trip={trip} />
                </div>

                {/* Passengers */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold border-b pb-1">
                    Confirmed Passengers
                  </h4>
                  <PassengerManifestList trip={trip} />
                </div>
              </div>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

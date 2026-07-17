"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { ArrowRight, User } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import {
  buildConsecutiveSegments,
  countSegmentOccupancy,
  getSegmentSeatStatus,
  type TripSegment,
} from "@/features/booking/lib/trip-segments";
import type { RouterOutputs } from "@/trpc/client";

type TripAudit = RouterOutputs["admin"]["getTripAudit"];

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
          className={cn("h-full rounded-full transition-all duration-500", color)}
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
  trip: TripAudit;
  segment: TripSegment;
}) {
  const seats = trip.seats ?? [];
  const bookings = trip.bookings ?? [];

  if (seats.length === 0) return null;

  const maxRow = Math.max(...seats.map((s) => s.seat.row));
  const maxCol = Math.max(...seats.map((s) => s.seat.col));

  return (
    <div className="overflow-x-auto mt-3">
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
                (s) => s.seat.row === row + 1 && s.seat.col === col + 1
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
                    seatStatus === "booked" && "bg-primary text-white border-primary",
                    seatStatus === "held" && "bg-amber-400 text-amber-950 border-amber-500",
                    seatStatus === "blocked" && "bg-slate-200 text-slate-400 border-slate-300",
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
          {[
            { color: "bg-primary border-primary", label: "Booked" },
            { color: "bg-amber-400 border-amber-500", label: "Held" },
            { color: "bg-background border-border", label: "Available" },
            { color: "bg-slate-200 border-slate-300", label: "Blocked" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={cn("w-4 h-4 rounded border", color)} />
              <span className="text-[11px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TripAuditOccupancy({ tripId }: { tripId: string }) {
  const trpc = useTRPC();
  const { data: trip } = useSuspenseQuery(
    trpc.admin.getTripAudit.queryOptions({ id: tripId })
  );

  const segments = buildConsecutiveSegments(trip.tripStops ?? []);
  const bookings = trip.bookings ?? [];

  if (segments.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">
          No route segments available for this trip.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {segments.map((segment) => {
        const counts = countSegmentOccupancy(bookings, segment);
        const segmentKey = `${segment.originOrder}-${segment.destinationOrder}`;

        return (
          <div
            key={segmentKey}
            className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-1">
                {segment.originLabel}
                <ArrowRight className="size-3.5 text-muted-foreground/60" />
                {segment.destinationLabel}
              </h4>
              {counts.held > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  {counts.confirmed} confirmed · {counts.held} held
                </span>
              )}
            </div>

            <SeatFillBar booked={counts.occupied} total={trip.totalSeats} />
            <SegmentSeatGrid trip={trip} segment={segment} />
          </div>
        );
      })}
    </div>
  );
}

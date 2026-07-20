"use client";

import { ArrowRight, User } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import type { RouterOutputs } from "@/trpc/client";
import {
  buildConsecutiveSegments,
  countSegmentOccupancy,
  getSegmentSeatStatus,
  type TripSegment,
} from "@/features/booking/lib/trip-segments";

// L1: the manifest drawer passes the lighter getManifest payload (no seat
// map) plus a lazily-loaded seat list from getSeatMap.
type ManifestTrip = RouterOutputs["trips"]["getManifest"];
type TripSeatItem = RouterOutputs["trips"]["getSeatMap"]["seats"][number];

function SeatFillBar({ booked, total }: { booked: number; total: number }) {
  const activeTotal = Math.max(total, 1);
  const pct = Math.min((booked / activeTotal) * 100, 100);
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
  seats,
  bookings,
  segment,
}: {
  seats: TripSeatItem[];
  bookings: ManifestTrip["bookings"];
  segment: TripSegment;
}) {
  const seatList = seats ?? [];

  if (seatList.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">
        No seat map available for this trip.
      </p>
    );
  }

  const maxRow = Math.max(...seatList.map((s) => s.seat.row));
  const maxCol = Math.max(...seatList.map((s) => s.seat.col));

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
              const seat = seatList.find(
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
                    "w-7 h-7 rounded border text-[9px] font-bold flex items-center justify-center",
                    seatStatus === "booked" &&
                      "bg-primary text-white border-primary",
                    seatStatus === "held" &&
                      "bg-amber-400 text-amber-950 border-amber-500",
                    seatStatus === "blocked" &&
                      "bg-slate-200 text-slate-400 border-slate-300",
                    seatStatus === "available" &&
                      "bg-background border-border text-muted-foreground",
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
            <div className="w-4 h-4 rounded bg-primary border border-primary" />
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

export function SegmentOccupancySection({
  trip,
  seats,
}: {
  trip: ManifestTrip;
  seats?: TripSeatItem[];
}) {
  const segments = buildConsecutiveSegments(trip.tripStops ?? []);
  const bookings = trip.bookings ?? [];
  const seatList = seats ?? [];
  const sellableSeats =
    seatList.filter(
      (s) =>
        s.isActive &&
        s.seat.isActive &&
        s.seat.seatType !== "EMPTY_SPACE" &&
        s.seat.seatType !== "DRIVER_AREA",
    ).length || trip.totalSeats;

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
            <SeatFillBar booked={counts.occupied} total={sellableSeats} />
            {seatList.length > 0 ? (
              <SegmentSeatGrid
                seats={seatList}
                bookings={bookings}
                segment={segment}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

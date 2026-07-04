"use client";

import { Gauge } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import type { PassengerSeatStatus, SeatAvailabilityItem } from "@moja/types";
import { buildSeatGrid, getColumnHeaders } from "../lib/seat-grid";

interface PassengerSeatMapProps {
  rows: number;
  columns: number;
  seats: SeatAvailabilityItem[];
  selectedSeatIds: string[];
  onToggleSeat: (seatId: string) => void;
  maxSelection?: number;
}

const STATUS_STYLES: Record<
  PassengerSeatStatus,
  { className: string; clickable: boolean }
> = {
  AVAILABLE: {
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100",
    clickable: true,
  },
  HELD: {
    className: "border-amber-200 bg-amber-50 text-amber-700 cursor-not-allowed",
    clickable: false,
  },
  SOLD: {
    className: "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed",
    clickable: false,
  },
  BLOCKED: {
    className: "border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed",
    clickable: false,
  },
  DRIVER: {
    className:
      "border-slate-300 bg-slate-800 text-white cursor-not-allowed",
    clickable: false,
  },
  EMPTY: {
    className: "border-transparent bg-transparent cursor-default",
    clickable: false,
  },
};

function isPassengerSeat(seatType: string) {
  return (
    seatType === "PASSENGER_WINDOW" ||
    seatType === "PASSENGER_AISLE" ||
    seatType === "PASSENGER_MIDDLE"
  );
}

export function PassengerSeatMap({
  rows,
  columns,
  seats,
  selectedSeatIds,
  onToggleSeat,
  maxSelection = 6,
}: PassengerSeatMapProps) {
  const grid = buildSeatGrid(seats, rows, columns);
  const colHeaders = getColumnHeaders(columns);
  const seatById = new Map(seats.map((s) => [s.seatId, s]));

  function handleClick(seatId: string) {
    const seat = seatById.get(seatId);
    if (!seat || seat.status !== "AVAILABLE") return;

    const isSelected = selectedSeatIds.includes(seatId);
    if (!isSelected && selectedSeatIds.length >= maxSelection) return;

    onToggleSeat(seatId);
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex flex-wrap gap-3 mb-4 text-[11px] text-muted-foreground">
        <LegendDot className="border-emerald-200 bg-emerald-50" label="Available" />
        <LegendDot className="border-pink-300 bg-pink-100" label="Selected" />
        <LegendDot className="border-slate-200 bg-slate-100" label="Sold" />
        <LegendDot className="border-amber-200 bg-amber-50" label="Held" />
        <LegendDot className="border-slate-200 bg-slate-50" label="Blocked" />
      </div>

      <div className="inline-block rounded-xl border border-border bg-muted/30 p-4">
        <div
          className="grid gap-1.5 mb-1.5"
          style={{ gridTemplateColumns: `1.5rem repeat(${columns}, 2.5rem)` }}
        >
          <div />
          {colHeaders.map((h) => (
            <div
              key={h}
              className="text-center text-[10px] font-semibold text-muted-foreground"
            >
              {h}
            </div>
          ))}
        </div>

        {grid.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="grid gap-1.5 mb-1.5"
            style={{ gridTemplateColumns: `1.5rem repeat(${columns}, 2.5rem)` }}
          >
            <div className="flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
              {rowIdx + 1}
            </div>

            {row.map((seat, colIdx) => {
              if (!seat) {
                return (
                  <div
                    key={`empty-${rowIdx}-${colIdx}`}
                    className="h-9 w-10 rounded-md border border-transparent"
                  />
                );
              }

              const isSelected = selectedSeatIds.includes(seat.seatId);
              const style = STATUS_STYLES[seat.status];
              const showLabel = isPassengerSeat(seat.seatType);

              if (seat.status === "EMPTY") {
                return <div key={seat.seatId} className="h-9 w-10" />;
              }

              return (
                <button
                  key={seat.seatId}
                  type="button"
                  disabled={!style.clickable && !isSelected}
                  onClick={() => handleClick(seat.seatId)}
                  title={
                    seat.status === "DRIVER"
                      ? "Driver area"
                      : `Seat ${seat.label} — ${seat.status.toLowerCase()}`
                  }
                  className={cn(
                    "h-9 w-10 rounded-md border text-[10px] font-semibold flex items-center justify-center transition-all duration-150",
                    isSelected
                      ? "border-pink-400 bg-pink-100 text-pink-800 ring-2 ring-pink-300"
                      : style.className,
                    style.clickable && "cursor-pointer",
                  )}
                >
                  {seat.status === "DRIVER" ? (
                    <Gauge className="size-3.5" />
                  ) : showLabel ? (
                    seat.label
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}

        <div className="mt-3 text-center text-[10px] text-muted-foreground tracking-widest uppercase flex items-center justify-center gap-2">
          <div className="flex-1 border-t border-dashed border-border" />
          <span>Entrance door</span>
          <div className="flex-1 border-t border-dashed border-border" />
        </div>
      </div>
    </div>
  );
}

function LegendDot({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("size-3.5 rounded-[4px] border", className)} />
      <span>{label}</span>
    </div>
  );
}

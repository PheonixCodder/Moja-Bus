"use client";

import { useState } from "react";
import { AlertTriangle, Gauge } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import type { RouterOutputs } from "@/trpc/client";

type Seat = NonNullable<
  RouterOutputs["fleet"]["getBusDetails"]
>["seats"][number];

interface SeatMapPreviewProps {
  busId: string;
  seats: Seat[];
  rows: number;
  columns: number;
  /** If true, seats can be toggled on/off */
  interactive?: boolean;
  onSeatToggled?: (updatedSeat: Seat) => void;
}

export function SeatMapPreview({
  busId,
  seats,
  rows,
  columns,
  interactive = false,
  onSeatToggled,
}: SeatMapPreviewProps) {
  const [seatStates, setSeatStates] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(seats.map((s) => [s.id, s.isActive])),
  );
  const [toggling, setToggling] = useState<string | null>(null);

  // Build a 2D grid map: grid[row][col] = seat | undefined
  const grid: (Seat | undefined)[][] = Array.from({ length: rows }, () =>
    Array(columns).fill(undefined),
  );
  for (const seat of seats) {
    const r = seat.row - 1;
    const c = seat.col - 1;
    if (r >= 0 && r < rows && c >= 0 && c < columns) {
      grid[r]![c] = seat;
    }
  }

  const trpc = useTRPC();
  const toggleMutation = useMutation({
    ...trpc.fleet.toggleSeatStatus.mutationOptions(),
  });

  function handleSeatClick(seat: Seat) {
    if (!interactive) return;
    if (seat.seatType === "DRIVER_AREA" || seat.seatType === "EMPTY_SPACE")
      return;
    if (toggling) return;

    const nextActive = !seatStates[seat.id];
    setToggling(seat.id);

    toggleMutation.mutate(
      { busId, seatId: seat.id, isActive: nextActive },
      {
        onSuccess: (updated) => {
          setSeatStates((prev) => ({ ...prev, [seat.id]: updated.isActive }));
          onSeatToggled?.(updated);
          toast.success(
            nextActive
              ? `Seat ${seat.label} reactivated`
              : `Seat ${seat.label} placed out of service`,
          );
          setToggling(null);
        },
        onError: () => {
          toast.error("Unable to update seat status");
          setToggling(null);
        },
      },
    );
  }

  // Column headers: A, B, C, D…
  const colHeaders = Array.from({ length: columns }, (_, i) =>
    String.fromCharCode(65 + i),
  );

  return (
    <div className="overflow-x-auto">
      {/* Legend */}
      {interactive && (
        <div className="flex flex-wrap gap-3 mb-4 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="size-3.5 rounded-[4px] border border-primary/30 bg-primary/10" />
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-3.5 rounded-[4px] border border-border bg-muted" />
            <span>Out of service</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-3.5 rounded-[4px] border border-border bg-foreground/80" />
            <span>Driver</span>
          </div>
        </div>
      )}

      <div className="inline-block rounded-xl border border-border bg-muted/30 p-4">
        {/* Column headers */}
        <div
          className="grid gap-1.5 mb-1.5"
          style={{
            gridTemplateColumns: `1.5rem repeat(${columns}, 2.5rem)`,
          }}
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

        {/* Rows */}
        {grid.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="grid gap-1.5 mb-1.5"
            style={{
              gridTemplateColumns: `1.5rem repeat(${columns}, 2.5rem)`,
            }}
          >
            {/* Row number */}
            <div className="flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
              {rowIdx + 1}
            </div>

            {row.map((seat, colIdx) => {
              if (!seat) {
                return (
                  <div
                    key={colIdx}
                    className="h-9 w-10 rounded-md border border-transparent"
                  />
                );
              }

              const isPassenger =
                seat.seatType === "PASSENGER_WINDOW" ||
                seat.seatType === "PASSENGER_AISLE";
              const isActive = seatStates[seat.id] ?? seat.isActive;
              const isDisabled = seat.seatType === "DRIVER_AREA";
              const isEmpty = seat.seatType === "EMPTY_SPACE";
              const isTogglingThis = toggling === seat.id;

              if (isEmpty) {
                return <div key={seat.id} className="h-9 w-10" />;
              }

              return (
                <button
                  key={seat.id}
                  type="button"
                  disabled={!interactive || isDisabled || isTogglingThis}
                  onClick={() => handleSeatClick(seat)}
                  title={
                    isDisabled
                      ? "Driver area"
                      : isPassenger
                        ? `Seat ${seat.label} — ${isActive ? "Active (click to deactivate)" : "Out of service (click to reactivate)"}`
                        : seat.label
                  }
                  className={cn(
                    "h-9 w-10 rounded-md border text-[10px] font-semibold flex flex-col items-center justify-center gap-0.5 select-none transition-all duration-150",
                    isDisabled &&
                      "border-border bg-foreground/80 cursor-not-allowed text-background",
                    isPassenger &&
                      isActive &&
                      !isDisabled &&
                      "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
                    isPassenger &&
                      !isActive &&
                      !isDisabled &&
                      "border-border bg-muted text-muted-foreground",
                    interactive && isPassenger && "cursor-pointer",
                    isTogglingThis && "opacity-50 scale-95",
                  )}
                >
                  {isDisabled ? (
                    <Gauge className="size-3.5" />
                  ) : isPassenger && !isActive ? (
                    <>
                      <AlertTriangle className="size-3 text-chart-4" />
                      <span className="text-[9px]">{seat.label}</span>
                    </>
                  ) : (
                    <span>{seat.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* Door indicator at bottom */}
        <div className="mt-3 text-center text-[10px] text-muted-foreground tracking-widest uppercase flex items-center justify-center gap-2">
          <div className="flex-1 border-t border-dashed border-border" />
          <span>Entrance door</span>
          <div className="flex-1 border-t border-dashed border-border" />
        </div>
      </div>
    </div>
  );
}

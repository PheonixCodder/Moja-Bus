"use client";

import { useMemo, useState } from "react";
import { Gauge } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { Button } from "@moja/ui/components/ui/button";
import { useTranslations } from "next-intl";
import type { PassengerSeatStatus, SeatAvailabilityItem } from "@moja/types";
import { buildSeatGrid, getColumnHeaders } from "../lib/seat-grid";

interface PassengerSeatMapProps {
  rows: number;
  columns: number;
  seats: SeatAvailabilityItem[];
  /** Max deck number present (1 = single deck). */
  deck?: number;
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
      "border-success/30 bg-success/10 text-success hover:border-success/50 hover:bg-success/20",
    clickable: true,
  },
  HELD: {
    className: "border-warning/30 bg-warning/10 text-warning cursor-not-allowed",
    clickable: false,
  },
  SOLD: {
    className:
      "border-border bg-muted text-muted-foreground cursor-not-allowed",
    clickable: false,
  },
  BLOCKED: {
    className: "border-border bg-muted/40 text-muted-foreground/60 cursor-not-allowed",
    clickable: false,
  },
  DRIVER: {
    className: "border-border bg-foreground text-background cursor-not-allowed",
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
  deck = 1,
  selectedSeatIds,
  onToggleSeat,
  maxSelection = 6,
}: PassengerSeatMapProps) {
  const t = useTranslations("booking.seatMap");
  const decks = useMemo(() => {
    const set = new Set(seats.map((s) => s.deck || 1));
    const list = Array.from(set).sort((a, b) => a - b);
    return list.length > 0 ? list : [1];
  }, [seats]);
  const [activeDeck, setActiveDeck] = useState(() => decks[0] ?? 1);

  const deckSeats = useMemo(
    () => seats.filter((s) => (s.deck || 1) === activeDeck),
    [seats, activeDeck],
  );
  const grid = buildSeatGrid(deckSeats, rows, columns);
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
      <div className="w-max mx-auto">
        {decks.length > 1 || deck > 1 ? (
          <div className="flex justify-center gap-2 mb-3">
            {decks.map((d) => (
              <Button
                key={d}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActiveDeck(d)}
                className={cn(
                  "px-3 py-1 h-auto rounded-lg text-xs font-semibold border transition-colors",
                  activeDeck === d
                    ? "border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                    : "border-border text-muted-foreground hover:border-border/80",
                )}
              >
                {t("deck", { n: d })}
              </Button>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap justify-center gap-3 mb-4 text-[11px] text-muted-foreground">
          <LegendDot
            className="border-success/30 bg-success/10"
            label={t("available")}
          />
          <LegendDot
            className="border-primary/40 bg-primary/20"
            label={t("selected")}
          />
          <LegendDot
            className="border-border bg-muted"
            label={t("sold")}
          />
          <LegendDot
            className="border-warning/30 bg-warning/10"
            label={t("held")}
          />
          <LegendDot
            className="border-border bg-muted/40"
            label={t("blocked")}
          />
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
              style={{
                gridTemplateColumns: `1.5rem repeat(${columns}, 2.5rem)`,
              }}
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
                  <Button
                    key={seat.seatId}
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={!style.clickable && !isSelected}
                    onClick={() => handleClick(seat.seatId)}
                    title={
                      seat.status === "DRIVER"
                        ? t("driver")
                        : t("seatStatus", {
                            seat: seat.label,
                            status: seat.status.toLowerCase(),
                          })
                    }
                    className={cn(
                      "h-9 w-10 p-0 rounded-md border text-[10px] font-semibold flex items-center justify-center transition-all duration-150",
                      isSelected
                        ? "border-primary bg-primary/20 text-primary ring-2 ring-primary/40 hover:bg-primary/25 hover:text-primary"
                        : style.className,
                      style.clickable && "cursor-pointer",
                    )}
                  >
                    {seat.status === "DRIVER" ? (
                      <Gauge className="size-3.5" />
                    ) : showLabel ? (
                      seat.label
                    ) : null}
                  </Button>
                );
              })}
            </div>
          ))}

          <div className="mt-3 text-center text-[10px] text-muted-foreground tracking-widest uppercase flex items-center justify-center gap-2">
            <div className="flex-1 border-t border-dashed border-border" />
            <span>{t("entrance")}</span>
            <div className="flex-1 border-t border-dashed border-border" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("size-3.5 rounded-[4px] border", className)} />
      <span>{label}</span>
    </div>
  );
}

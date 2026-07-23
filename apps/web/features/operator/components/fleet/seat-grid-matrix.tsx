"use client";

import { useCallback, useEffect, useRef } from "react";
import { Armchair, Eraser, Gauge, Square } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";

type SeatType = "PASSENGER_WINDOW" | "PASSENGER_AISLE" | "PASSENGER_MIDDLE" | "DRIVER_AREA" | "EMPTY_SPACE";
type Tool = SeatType | "ERASE";

interface GridCell {
  row: number;
  col: number;
  seatType: SeatType;
  label: string;
  isBookable: boolean;
}

export const TOOLS: {
  id: Tool;
  label: string;
  description: string;
  Icon: React.ElementType;
  cellClass: string;
  paletteDot: string;
}[] = [
  {
    id: "PASSENGER_WINDOW",
    label: "Window Seat",
    description: "Passenger seat beside the window",
    Icon: Armchair,
    cellClass: "bg-card border-border text-foreground hover:border-primary/50",
    paletteDot: "bg-card border border-border",
  },
  {
    id: "PASSENGER_AISLE",
    label: "Aisle Seat",
    description: "Passenger seat beside the aisle",
    Icon: Armchair,
    cellClass: "bg-card/60 border-border/60 text-foreground/80 hover:border-primary/40",
    paletteDot: "bg-card/60 border border-border/60",
  },
  {
    id: "PASSENGER_MIDDLE",
    label: "Middle Seat",
    description: "Passenger seat between window and aisle",
    Icon: Armchair,
    cellClass: "bg-card/80 border-border/80 text-foreground/90 hover:border-primary/40",
    paletteDot: "bg-card/80 border border-border/80",
  },
  {
    id: "DRIVER_AREA",
    label: "Driver Area",
    description: "Non-bookable driver/cockpit area",
    Icon: Gauge,
    cellClass: "bg-foreground/80 border-transparent text-background",
    paletteDot: "bg-foreground/80",
  },
  {
    id: "EMPTY_SPACE",
    label: "Empty Space",
    description: "Aisle, door, or other non-seat gap",
    Icon: Square,
    cellClass:
      "border-dashed border-border/60 bg-muted/20 text-muted-foreground/50",
    paletteDot: "border border-dashed border-border",
  },
  {
    id: "ERASE",
    label: "Erase",
    description: "Reset cell to empty space",
    Icon: Eraser,
    cellClass: "",
    paletteDot: "bg-destructive/20 border border-destructive/30",
  },
];

function getCellConfig(seatType: SeatType) {
  return TOOLS.find((t) => t.id === seatType) ?? TOOLS[3]!;
}

interface SeatGridMatrixProps {
  grid: GridCell[][];
  activeTool: Tool;
  onPaint: (row: number, col: number) => void;
  readOnly?: boolean;
}

export function SeatGridMatrix({
  grid,
  activeTool,
  onPaint,
  readOnly = false,
}: SeatGridMatrixProps) {
  const isPaintingRef = useRef(false);
  const cols = grid[0]?.length ?? 0;

  const handleMouseDown = useCallback(
    (row: number, col: number) => {
      if (readOnly) return;
      isPaintingRef.current = true;
      onPaint(row, col);
    },
    [onPaint, readOnly],
  );

  const handleMouseEnter = useCallback(
    (row: number, col: number) => {
      if (!isPaintingRef.current || readOnly) return;
      onPaint(row, col);
    },
    [onPaint, readOnly],
  );

  useEffect(() => {
    const stop = () => {
      isPaintingRef.current = false;
    };
    window.addEventListener("mouseup", stop);
    return () => window.removeEventListener("mouseup", stop);
  }, []);

  const colHeaders = Array.from({ length: cols }, (_, i) =>
    String.fromCharCode(65 + i),
  );

  return (
    <div
      className="inline-block rounded-xl border border-border bg-muted/20 p-4 select-none"
      onMouseLeave={() => {
        isPaintingRef.current = false;
      }}
    >
      <div
        className="grid gap-1.5 mb-1.5"
        style={{ gridTemplateColumns: `1.5rem repeat(${cols}, 2.5rem)` }}
      >
        <div />
        {colHeaders.map((h) => (
          <div
            key={h}
            className="text-center text-[10px] font-bold text-muted-foreground uppercase"
          >
            {h}
          </div>
        ))}
      </div>

      {grid.map((row, rIdx) => (
        <div
          key={rIdx}
          className="grid gap-1.5 mb-1.5"
          style={{ gridTemplateColumns: `1.5rem repeat(${cols}, 2.5rem)` }}
        >
          <div className="flex items-center justify-center text-[10px] font-bold text-muted-foreground">
            {rIdx + 1}
          </div>

          {row.map((cell) => {
            const cfg = getCellConfig(cell.seatType);
            const Icon = cfg.Icon;

            return (
              <button
                key={`${cell.row}-${cell.col}`}
                type="button"
                onMouseDown={() => handleMouseDown(cell.row, cell.col)}
                onMouseEnter={() => handleMouseEnter(cell.row, cell.col)}
                className={cn(
                  "relative flex h-10 w-10 flex-col items-center justify-center rounded-lg border text-xs transition-all duration-150",
                  cfg.cellClass,
                  !readOnly && "hover:scale-105 active:scale-95 cursor-pointer",
                )}
              >
                {cell.seatType === "DRIVER_AREA" ? (
                  <Gauge className="size-4" />
                ) : cell.seatType === "EMPTY_SPACE" ? null : (
                  <>
                    <span className="font-mono text-[11px] font-bold tracking-tight">
                      {cell.label}
                    </span>
                    <Icon className="size-2.5 opacity-60 mt-0.5" />
                  </>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

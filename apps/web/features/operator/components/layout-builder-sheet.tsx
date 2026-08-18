"use client";

import { Button } from "@moja/ui/components/ui/button";
import { Checkbox } from "@moja/ui/components/ui/checkbox";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@moja/ui/components/ui/combobox";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@moja/ui/components/ui/sheet";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { cn } from "@moja/ui/lib/utils";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  Armchair,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Eraser,
  Gauge,
  Layers,
  Luggage,
  Save,
  Square,
  ThermometerSun,
  Wifi,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { RouterOutputs } from "@/trpc/client";
import { useTRPC } from "@/trpc/client";

// ── Types ─────────────────────────────────────────────────────────────────────

type SeatType =
  | "PASSENGER_WINDOW"
  | "PASSENGER_AISLE"
  | "PASSENGER_MIDDLE"
  | "DRIVER_AREA"
  | "EMPTY_SPACE";
type Tool = SeatType | "ERASE";

interface GridCell {
  row: number; // 1-indexed
  col: number; // 1-indexed
  seatType: SeatType;
  label: string;
  isBookable: boolean;
}

type BusType = RouterOutputs["fleet"]["getBusTypes"][number];

export interface LayoutBuilderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busTypes?: BusType[];
  onSuccess?: (newLayoutId: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildDefaultGrid(rows: number, cols: number): GridCell[][] {
  const grid: GridCell[][] = [];
  let seatCounter = 1;

  for (let r = 1; r <= rows; r++) {
    const row: GridCell[] = [];
    for (let c = 1; c <= cols; c++) {
      let seatType: SeatType;
      let isBookable: boolean;
      let label: string;

      if (r === 1 && c === 1) {
        // Driver area at front-left
        seatType = "DRIVER_AREA";
        isBookable = false;
        label = "DRV";
      } else if (cols >= 4 && c === Math.floor(cols / 2) + 1) {
        // Aisle column
        seatType = "EMPTY_SPACE";
        isBookable = false;
        label = "";
      } else {
        seatType =
          c === 1 || c === cols ? "PASSENGER_WINDOW" : "PASSENGER_AISLE";
        isBookable = true;
        label = `${seatCounter++}`;
      }

      row.push({ row: r, col: c, seatType, label, isBookable });
    }
    grid.push(row);
  }

  return grid;
}

/** Re-label all passenger seats in reading order (top-to-bottom, left-to-right). */
function relabelGrid(grid: GridCell[][]): GridCell[][] {
  let counter = 1;
  return grid.map((row) =>
    row.map((cell) => {
      if (
        cell.seatType === "PASSENGER_WINDOW" ||
        cell.seatType === "PASSENGER_AISLE" ||
        cell.seatType === "PASSENGER_MIDDLE"
      ) {
        return { ...cell, label: `${counter++}`, isBookable: true };
      }
      if (cell.seatType === "DRIVER_AREA") {
        return { ...cell, label: "DRV", isBookable: false };
      }
      return { ...cell, label: "", isBookable: false };
    }),
  );
}

function countPassengerSeats(grid: GridCell[][]): number {
  return grid
    .flat()
    .filter(
      (c) =>
        c.seatType === "PASSENGER_WINDOW" ||
        c.seatType === "PASSENGER_AISLE" ||
        c.seatType === "PASSENGER_MIDDLE",
    ).length;
}

// ── Tool Palette Config ───────────────────────────────────────────────────────

const TOOL_STYLES: {
  id: Tool;
  Icon: React.ElementType;
  cellClass: string;
  paletteDot: string;
}[] = [
  {
    id: "PASSENGER_WINDOW",
    Icon: Armchair,
    cellClass: "bg-card border-border text-foreground hover:border-primary/50",
    paletteDot: "bg-card border border-border",
  },
  {
    id: "PASSENGER_AISLE",
    Icon: Armchair,
    cellClass:
      "bg-card/60 border-border/60 text-foreground/80 hover:border-primary/40",
    paletteDot: "bg-card/60 border border-border/60",
  },
  {
    id: "PASSENGER_MIDDLE",
    Icon: Armchair,
    cellClass:
      "bg-card/80 border-border/80 text-foreground/90 hover:border-primary/40",
    paletteDot: "bg-card/80 border border-border/80",
  },
  {
    id: "DRIVER_AREA",
    Icon: Gauge,
    cellClass: "bg-foreground/80 border-transparent text-background",
    paletteDot: "bg-foreground/80",
  },
  {
    id: "EMPTY_SPACE",
    Icon: Square,
    cellClass:
      "border-dashed border-border/60 bg-muted/20 text-muted-foreground/50",
    paletteDot: "border border-dashed border-border",
  },
  {
    id: "ERASE",
    Icon: Eraser,
    cellClass: "",
    paletteDot: "bg-destructive/20 border border-destructive/30",
  },
];

function getCellConfig(seatType: SeatType) {
  return TOOL_STYLES.find((t) => t.id === seatType) ?? TOOL_STYLES[3]!;
}

// ── Step Indicator ────────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const t = useTranslations(
    "operatorDashboard.fleet.layoutBuilder.stepIndicator",
  );
  const steps = [
    { n: 1, label: t("configure") },
    { n: 2, label: t("design") },
    { n: 3, label: t("preview") },
  ] as const;

  return (
    <div className="flex items-center gap-0 shrink-0">
      {steps.map(({ n, label }, i) => (
        <div key={n} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-200",
                step === n
                  ? "bg-primary text-primary-foreground scale-110 shadow-md shadow-primary/30"
                  : step > n
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {step > n ? "✓" : n}
            </div>
            <span
              className={cn(
                "text-[10px] font-medium tracking-wide",
                step === n ? "text-primary" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "h-px w-10 mb-4 mx-1.5 transition-colors duration-200",
                step > n ? "bg-primary/40" : "bg-border",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Grid Canvas ───────────────────────────────────────────────────────────────

interface GridCanvasProps {
  grid: GridCell[][];
  activeTool: Tool;
  onPaint: (row: number, col: number) => void;
  readOnly?: boolean;
}

function GridCanvas({
  grid,
  activeTool,
  onPaint,
  readOnly = false,
}: GridCanvasProps) {
  const t = useTranslations("operatorDashboard.fleet.layoutBuilder.gridCanvas");
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
      {/* Column headers */}
      <div
        className="grid gap-1.5 mb-1.5"
        style={{ gridTemplateColumns: `1.5rem repeat(${cols}, 2.5rem)` }}
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
      {grid.map((row, rIdx) => (
        <div
          key={rIdx}
          className="grid gap-1.5 mb-1.5"
          style={{ gridTemplateColumns: `1.5rem repeat(${cols}, 2.5rem)` }}
        >
          <div className="flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
            {rIdx + 1}
          </div>
          {row.map((cell) => {
            const cfg = getCellConfig(cell.seatType);
            const isEmpty = cell.seatType === "EMPTY_SPACE";
            const isDriver = cell.seatType === "DRIVER_AREA";

            return (
              <div
                key={`${cell.row}-${cell.col}`}
                onMouseDown={() => handleMouseDown(cell.row, cell.col)}
                onMouseEnter={() => handleMouseEnter(cell.row, cell.col)}
                className={cn(
                  "h-9 w-10 rounded-md border text-[10px] font-semibold flex flex-col items-center justify-center transition-all duration-100",
                  readOnly
                    ? "cursor-default"
                    : "cursor-crosshair active:scale-95",
                  cfg.cellClass,
                  isEmpty && "opacity-40",
                )}
              >
                {isDriver ? (
                  <Gauge className="size-3.5" />
                ) : isEmpty ? null : (
                  <span>{cell.label}</span>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Front of bus indicator */}
      <div className="mt-3 text-center text-[10px] text-muted-foreground tracking-widest uppercase flex items-center justify-center gap-2">
        <div className="flex-1 border-t border-dashed border-border" />
        <span>{t("entranceDoor")}</span>
        <div className="flex-1 border-t border-dashed border-border" />
      </div>
    </div>
  );
}

// ── Main Sheet ────────────────────────────────────────────────────────────────

export function LayoutBuilderSheet({
  open,
  onOpenChange,
  busTypes: busTypesProp,
  onSuccess,
}: LayoutBuilderSheetProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: busTypesFetched } = useSuspenseQuery(
    trpc.fleet.getBusTypes.queryOptions(),
  );
  const busTypes = busTypesProp ?? busTypesFetched;

  const createMutation = useMutation(
    trpc.fleet.createCustomLayout.mutationOptions(),
  );

  // ── State ──
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 — config
  const [name, setName] = useState("");
  const [busTypeId, setBusTypeId] = useState("");
  const [rows, setRows] = useState(5);
  const [cols, setCols] = useState(4);
  const [hasAC, setHasAC] = useState(false);
  const [hasWifi, setHasWifi] = useState(false);
  const [hasToilet, setHasToilet] = useState(false);
  const [hasLuggage, setHasLuggage] = useState(true);
  const [configErrors, setConfigErrors] = useState<Record<string, string>>({});

  // Step 2 — design
  const [grid, setGrid] = useState<GridCell[][]>(() => buildDefaultGrid(5, 4));
  const [activeTool, setActiveTool] = useState<Tool>("PASSENGER_WINDOW");

  // Reset on open/close
  useEffect(() => {
    if (!open) {
      setStep(1);
      setName("");
      setBusTypeId("");
      setRows(5);
      setCols(4);
      setHasAC(false);
      setHasWifi(false);
      setHasToilet(false);
      setHasLuggage(true);
      setGrid(buildDefaultGrid(5, 4));
      setActiveTool("PASSENGER_WINDOW");
      setConfigErrors({});
      createMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Step 1 → 2 ──
  function handleConfigNext() {
    const errors: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2)
      errors["name"] = t("step1.errors.name");
    if (!busTypeId) errors["busTypeId"] = t("step1.errors.busTypeId");
    if (rows < 2 || rows > 20) errors["rows"] = t("step1.errors.rows");
    if (cols < 2 || cols > 6) errors["cols"] = t("step1.errors.cols");
    setConfigErrors(errors);
    if (Object.keys(errors).length > 0) return;

    // Build fresh grid for the chosen dimensions
    setGrid(relabelGrid(buildDefaultGrid(rows, cols)));
    setStep(2);
  }

  // ── Paint handler ──
  const handlePaint = useCallback(
    (row: number, col: number) => {
      setGrid((prev) => {
        const next = prev.map((r) => r.map((c) => ({ ...c })));
        const target = next[row - 1]![col - 1]!;
        const newType: SeatType =
          activeTool === "ERASE" ? "EMPTY_SPACE" : activeTool;
        target.seatType = newType;
        return relabelGrid(next);
      });
    },
    [activeTool],
  );

  // ── Save ──
  function handleSave() {
    const seats = grid.flat().map((c) => ({
      row: c.row,
      col: c.col,
      deck: 1,
      label: c.label,
      seatType: c.seatType,
      isBookable: c.isBookable,
    }));

    const totalPassenger = seats.filter(
      (s) =>
        s.seatType === "PASSENGER_WINDOW" ||
        s.seatType === "PASSENGER_AISLE" ||
        s.seatType === "PASSENGER_MIDDLE",
    ).length;

    if (totalPassenger === 0) {
      toast.error(t("toast.noPassengerSeats"));
      return;
    }

    createMutation.mutate(
      {
        name: name.trim(),
        busTypeId,
        rows,
        columns: cols,
        hasAC,
        hasWifi,
        hasToilet,
        hasLuggage,
        seats,
      },
      {
        onSuccess: (created) => {
          toast.success(t("toast.saved", { name: created.name }));
          queryClient.invalidateQueries(
            trpc.fleet.getLayoutTemplates.pathFilter(),
          );
          queryClient.invalidateQueries(
            trpc.fleet.getCustomLayouts.pathFilter(),
          );
          if (onSuccess) onSuccess(created.id);
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err.message || t("toast.saveFailed"));
        },
      },
    );
  }

  const t = useTranslations("operatorDashboard.fleet.layoutBuilder");
  const passengerCount = countPassengerSeats(grid);
  const selectedBusType = busTypes.find((bt) => bt.id === busTypeId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="bg-background border-l border-border w-full max-w-full! flex flex-col p-0 gap-0"
      >
        {/* ── Header ── */}
        <SheetHeader className="shrink-0 text-left !p-4 !border-b !border-border !pr-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <Layers className="size-4 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-base font-semibold text-foreground">
                  {t("title")}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                  {t("description")}
                </SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StepIndicator step={step} />
              <SheetClose
                aria-label={t("closeAria")}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="size-4" />
              </SheetClose>
            </div>
          </div>
        </SheetHeader>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">
          {/* ─────── Step 1: Configure ─────── */}
          {step === 1 && (
            <div className="p-6 max-w-xl mx-auto space-y-6">
              <div className="space-y-0.5">
                <h2 className="text-sm font-semibold text-foreground">
                  {t("step1.title")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t("step1.subtitle")}
                </p>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/80">
                  {t("step1.nameLabel")}
                </Label>
                <Input
                  id="layout-name"
                  placeholder={t("step1.namePlaceholder")}
                  className="h-9 text-sm bg-card border-border"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {configErrors["name"] && (
                  <p className="text-xs text-destructive">
                    {configErrors["name"]}
                  </p>
                )}
              </div>

              {/* Bus Type */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/80">
                  {t("step1.vehicleTypeLabel")}
                </Label>
                <Combobox
                  items={busTypes.map((bt) => ({
                    value: bt.id,
                    label: bt.name,
                  }))}
                  value={busTypeId}
                  onValueChange={(v) => {
                    if (v !== null) setBusTypeId(v);
                  }}
                >
                  <ComboboxInput
                    placeholder={t("step1.vehicleTypePlaceholder")}
                    className="w-full"
                    value={
                      busTypes.find((bt) => bt.id === busTypeId)?.name || ""
                    }
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>{t("step1.noVehicleType")}</ComboboxEmpty>
                    <ComboboxList>
                      {busTypes.map((bt) => (
                        <ComboboxItem key={bt.id} value={bt.id}>
                          <div className="flex flex-col">
                            <span>{bt.name}</span>
                            {"description" in bt && bt.description && (
                              <span className="text-xs text-muted-foreground">
                                {bt.description as string}
                              </span>
                            )}
                          </div>
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                {configErrors["busTypeId"] && (
                  <p className="text-xs text-destructive">
                    {configErrors["busTypeId"]}
                  </p>
                )}
              </div>

              {/* Grid Dimensions */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/80">
                    {t("step1.rowsLabel")}
                  </Label>
                  <Input
                    id="layout-rows"
                    type="number"
                    min={2}
                    max={20}
                    className="h-9 text-sm bg-card border-border"
                    value={rows}
                    onChange={(e) =>
                      setRows(
                        Math.min(
                          20,
                          Math.max(2, parseInt(e.target.value, 10) || 2),
                        ),
                      )
                    }
                  />
                  {configErrors["rows"] && (
                    <p className="text-xs text-destructive">
                      {configErrors["rows"]}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/80">
                    {t("step1.colsLabel")}
                  </Label>
                  <Input
                    id="layout-cols"
                    type="number"
                    min={2}
                    max={6}
                    className="h-9 text-sm bg-card border-border"
                    value={cols}
                    onChange={(e) =>
                      setCols(
                        Math.min(
                          6,
                          Math.max(2, parseInt(e.target.value, 10) || 2),
                        ),
                      )
                    }
                  />
                  {configErrors["cols"] && (
                    <p className="text-xs text-destructive">
                      {configErrors["cols"]}
                    </p>
                  )}
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground/80">
                  {t("step1.amenitiesLabel")}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      key: "hasAC",
                      label: t("step1.ac"),
                      Icon: ThermometerSun,
                      val: hasAC,
                      set: setHasAC,
                    },
                    {
                      key: "hasWifi",
                      label: t("step1.wifi"),
                      Icon: Wifi,
                      val: hasWifi,
                      set: setHasWifi,
                    },
                    {
                      key: "hasToilet",
                      label: t("step1.toilet"),
                      Icon: CircleDot,
                      val: hasToilet,
                      set: setHasToilet,
                    },
                    {
                      key: "hasLuggage",
                      label: t("step1.luggage"),
                      Icon: Luggage,
                      val: hasLuggage,
                      set: setHasLuggage,
                    },
                  ].map(({ key, label, Icon, val, set }) => (
                    <label
                      key={key}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-all duration-150",
                        val
                          ? "border-primary/40 bg-primary/5"
                          : "border-border bg-card hover:border-foreground/20",
                      )}
                    >
                      <Checkbox
                        id={`amenity-${key}`}
                        checked={val}
                        onCheckedChange={(v) => set(Boolean(v))}
                      />
                      <Icon
                        className={cn(
                          "size-3.5",
                          val ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <span
                        className={cn(
                          "text-xs font-medium",
                          val ? "text-primary" : "text-foreground/80",
                        )}
                      >
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─────── Step 2: Design ─────── */}
          {step === 2 && (
            <div className="flex h-full min-h-0">
              {/* Canvas area */}
              <div className="flex-1 overflow-auto p-6 flex items-start justify-center">
                <div className="space-y-4">
                  <div className="text-center space-y-0.5">
                    <h2 className="text-sm font-semibold text-foreground">
                      {name}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {t("step2.paintHint")}
                    </p>
                  </div>
                  <GridCanvas
                    grid={grid}
                    activeTool={activeTool}
                    onPaint={handlePaint}
                  />
                </div>
              </div>

              {/* Right sidebar — Tool palette */}
              <div className="w-64 shrink-0 border-l border-border bg-muted/20 p-4 flex flex-col gap-5">
                {/* Live stats */}
                <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("step2.statsLabel")}
                  </p>
                  <div className="flex items-end justify-between">
                    <span className="text-xs text-muted-foreground">
                      {t("step2.passengerSeats")}
                    </span>
                    <span className="text-xl font-bold text-foreground tabular-nums">
                      {passengerCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t("step2.grid")}</span>
                    <span className="font-medium text-foreground/80">
                      {rows} × {cols}
                    </span>
                  </div>
                  {selectedBusType && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{t("step2.vehicleType")}</span>
                      <span className="font-medium text-foreground/80 truncate max-w-[100px] text-right">
                        {selectedBusType.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Tool palette */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-0.5">
                    {t("step2.paintTools")}
                  </p>
                  <div className="space-y-1">
                    {TOOL_STYLES.map((tool) => {
                      const toolKeyMap: Record<string, string> = {
                        PASSENGER_WINDOW: "windowSeat",
                        PASSENGER_AISLE: "aisleSeat",
                        PASSENGER_MIDDLE: "middleSeat",
                        DRIVER_AREA: "driverArea",
                        EMPTY_SPACE: "emptySpace",
                        ERASE: "erase",
                      };
                      const tk = toolKeyMap[tool.id];
                      const isActive = activeTool === tool.id;
                      return (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => setActiveTool(tool.id)}
                          className={cn(
                            "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150",
                            isActive
                              ? "bg-primary/10 border border-primary/30 shadow-sm"
                              : "border border-transparent hover:bg-muted hover:border-border",
                          )}
                        >
                          <div
                            className={cn(
                              "h-5 w-5 shrink-0 rounded-[5px]",
                              tool.paletteDot,
                            )}
                          />
                          <div className="min-w-0">
                            <p
                              className={cn(
                                "text-[11px] font-semibold",
                                isActive ? "text-primary" : "text-foreground",
                              )}
                            >
                              {t(`step2.tools.${tk}`)}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {t(`step2.tools.${tk}Desc`)}
                            </p>
                          </div>
                          {isActive && (
                            <div className="shrink-0 h-1.5 w-1.5 rounded-full bg-primary ml-auto" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Legend */}
                <div className="rounded-lg border border-border bg-card/50 p-3 mt-auto">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {t("step2.legend")}
                  </p>
                  <div className="space-y-1.5 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="h-3.5 w-3.5 rounded-[3px] bg-card border border-border shrink-0" />
                      <span>{t("step2.legendPassenger")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3.5 w-3.5 rounded-[3px] bg-foreground/80 shrink-0" />
                      <span>{t("step2.legendDriver")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3.5 w-3.5 rounded-[3px] border border-dashed border-border/60 bg-muted/20 shrink-0 opacity-50" />
                      <span>{t("step2.legendEmpty")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─────── Step 3: Preview ─────── */}
          {step === 3 && (
            <div className="p-6 max-w-2xl mx-auto space-y-6">
              <div className="space-y-0.5">
                <h2 className="text-sm font-semibold text-foreground">
                  {t("step3.title")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t("step3.subtitle")}
                </p>
              </div>

              {/* Summary card */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedBusType?.name} · {rows} rows × {cols} columns
                    </p>
                  </div>
                  <div className="shrink-0 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-center">
                    <p className="text-xl font-bold text-primary tabular-nums">
                      {passengerCount}
                    </p>
                    <p className="text-[10px] text-primary/70 font-medium">
                      {t("step3.seats")}
                    </p>
                  </div>
                </div>

                {/* Amenities chips */}
                <div className="flex flex-wrap gap-1.5">
                  {hasAC && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground font-medium">
                      <ThermometerSun className="size-3" /> AC
                    </span>
                  )}
                  {hasWifi && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground font-medium">
                      <Wifi className="size-3" /> Wi-Fi
                    </span>
                  )}
                  {hasToilet && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground font-medium">
                      <CircleDot className="size-3" /> Toilet
                    </span>
                  )}
                  {hasLuggage && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground font-medium">
                      <Luggage className="size-3" /> Luggage
                    </span>
                  )}
                  {!hasAC && !hasWifi && !hasToilet && !hasLuggage && (
                    <span className="text-xs text-muted-foreground">
                      {t("step3.noAmenities")}
                    </span>
                  )}
                </div>
              </div>

              {/* Grid preview (read-only) */}
              <div className="overflow-x-auto">
                <GridCanvas
                  grid={grid}
                  activeTool={activeTool}
                  onPaint={() => {}}
                  readOnly
                />
              </div>

              {passengerCount === 0 && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                  <p className="text-xs text-destructive font-semibold">
                    {t("step3.noPassengerError")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 border-t border-border px-6 py-4 flex items-center justify-between gap-3">
          {/* Back */}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-muted-foreground hover:text-foreground gap-1.5"
            onClick={() => {
              if (step === 1) onOpenChange(false);
              else setStep((s) => (s - 1) as 1 | 2 | 3);
            }}
            disabled={createMutation.isPending}
          >
            <ChevronLeft className="size-4" />
            {step === 1 ? t("footer.cancel") : t("footer.back")}
          </Button>

          {/* Next / Save */}
          {step < 3 ? (
            <Button
              size="sm"
              className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5"
              onClick={() => {
                if (step === 1) handleConfigNext();
                else setStep(3);
              }}
            >
              {step === 2 ? t("footer.previewBtn") : t("footer.next")}
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5"
              onClick={handleSave}
              disabled={createMutation.isPending || passengerCount === 0}
            >
              {createMutation.isPending ? (
                <Spinner className="size-4" />
              ) : (
                <Save className="size-4" />
              )}
              {t("footer.save")}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

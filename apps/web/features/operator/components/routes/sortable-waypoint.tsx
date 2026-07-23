"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CheckCircle2, Clock, GripVertical, Pencil, X, MapPin, ArrowUpRight, ArrowDownRight, Hourglass } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { Input } from "@moja/ui/components/ui/input";
import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import type { RouterOutputs } from "@/trpc/client";

type Terminal = RouterOutputs["terminals"]["list"][number];

export interface WaypointDraft {
  id: string;
  terminalId: string;
  terminal: Terminal;
  offsetMinutes: number;
  dwellMinutes: number;
  distanceFromOriginKm?: number | null;
  allowPickup: boolean;
  allowDropoff: boolean;
}

function formatOffset(minutes: number): string {
  if (minutes === 0) return "Origin";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `+${m}m`;
  if (m === 0) return `+${h}h`;
  return `+${h}h ${m}m`;
}

interface SortableWaypointProps {
  waypoint: WaypointDraft;
  index: number;
  isOrigin: boolean;
  isDest: boolean;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<WaypointDraft>) => void;
}

export function SortableWaypoint({
  waypoint,
  index,
  isOrigin,
  isDest,
  onRemove,
  onUpdate,
}: SortableWaypointProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: waypoint.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [editingOffset, setEditingOffset] = useState(false);
  const [offsetInput, setOffsetInput] = useState(waypoint.offsetMinutes.toString());

  const [editingDwell, setEditingDwell] = useState(false);
  const [dwellInput, setDwellInput] = useState((waypoint.dwellMinutes ?? 15).toString());

  const [editingDistance, setEditingDistance] = useState(false);
  const [distanceInput, setDistanceInput] = useState(
    waypoint.distanceFromOriginKm?.toString() ?? "",
  );

  function commitOffset() {
    const parsed = parseInt(offsetInput, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdate(waypoint.id, { offsetMinutes: parsed });
    } else {
      setOffsetInput(waypoint.offsetMinutes.toString());
    }
    setEditingOffset(false);
  }

  function commitDwell() {
    const parsed = parseInt(dwellInput, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      onUpdate(waypoint.id, { dwellMinutes: parsed });
    } else {
      setDwellInput((waypoint.dwellMinutes ?? 15).toString());
    }
    setEditingDwell(false);
  }

  function commitDistance() {
    if (!distanceInput.trim()) {
      onUpdate(waypoint.id, { distanceFromOriginKm: null });
    } else {
      const parsed = parseFloat(distanceInput);
      if (!isNaN(parsed) && parsed >= 0) {
        onUpdate(waypoint.id, { distanceFromOriginKm: parsed });
      } else {
        setDistanceInput(waypoint.distanceFromOriginKm?.toString() ?? "");
      }
    }
    setEditingDistance(false);
  }

  function togglePickup() {
    if (isOrigin || isDest) return;
    // Don't allow unchecking both pickup and dropoff
    if (waypoint.allowPickup && !waypoint.allowDropoff) return;
    onUpdate(waypoint.id, { allowPickup: !waypoint.allowPickup });
  }

  function toggleDropoff() {
    if (isOrigin || isDest) return;
    // Don't allow unchecking both pickup and dropoff
    if (waypoint.allowDropoff && !waypoint.allowPickup) return;
    onUpdate(waypoint.id, { allowDropoff: !waypoint.allowDropoff });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-stretch gap-0 transition-opacity",
        isDragging && "opacity-50",
      )}
    >
      {/* Timeline column */}
      <div className="flex flex-col items-center w-8 shrink-0">
        <div
          className={cn(
            "size-3.5 rounded-full border-2 mt-1 shrink-0 transition-colors",
            isOrigin || isDest
              ? "border-primary bg-primary"
              : "border-primary/60 bg-background",
          )}
        />
        {!isDest && <div className="w-px flex-1 bg-border min-h-[3rem]" />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4 min-w-0">
        <div className="flex items-start gap-2 bg-card border border-border/80 rounded-lg p-2.5 shadow-2xs hover:border-border transition-colors">
          {/* Drag handle — only on intermediary stops */}
          {!isOrigin && !isDest && (
            <button
              {...attributes}
              {...listeners}
              className="mt-0.5 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0"
              aria-label="Reorder stop"
            >
              <GripVertical className="size-4" />
            </button>
          )}

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight truncate">
                  {waypoint.terminal.name}
                </p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {waypoint.terminal.cityRelation?.name ?? waypoint.terminal.city}
                </p>
              </div>

              {/* Pickup / Dropoff Toggles for intermediate stops */}
              {!isOrigin && !isDest && (
                <div className="flex items-center gap-1 shrink-0">
                  <Badge
                    variant={waypoint.allowPickup ? "default" : "outline"}
                    className={cn(
                      "text-[10px] cursor-pointer select-none font-medium px-1.5 py-0.5 gap-0.5 transition-colors",
                      waypoint.allowPickup
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "text-muted-foreground/60 border-border hover:bg-muted",
                    )}
                    onClick={togglePickup}
                    title="Toggle passenger pickup (boarding)"
                  >
                    <ArrowUpRight className="size-3" />
                    Pickup
                  </Badge>

                  <Badge
                    variant={waypoint.allowDropoff ? "default" : "outline"}
                    className={cn(
                      "text-[10px] cursor-pointer select-none font-medium px-1.5 py-0.5 gap-0.5 transition-colors",
                      waypoint.allowDropoff
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "text-muted-foreground/60 border-border hover:bg-muted",
                    )}
                    onClick={toggleDropoff}
                    title="Toggle passenger dropoff (alighting)"
                  >
                    <ArrowDownRight className="size-3" />
                    Dropoff
                  </Badge>
                </div>
              )}
            </div>

            {/* Metrics row: Offset, Dwell, Distance */}
            <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-border/50 text-[11px]">
              {/* Offset badge / editor */}
              {!isOrigin ? (
                editingOffset ? (
                  <div className="flex items-center gap-1">
                    <Clock className="size-3 text-primary" />
                    <Input
                      type="number"
                      min={0}
                      className="h-6 w-16 text-xs px-1"
                      value={offsetInput}
                      onChange={(e) => setOffsetInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitOffset();
                        if (e.key === "Escape") setEditingOffset(false);
                      }}
                      autoFocus
                    />
                    <span className="text-[10px] text-muted-foreground">min</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-5 text-primary"
                      onClick={commitOffset}
                    >
                      <CheckCircle2 className="size-3" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setOffsetInput(waypoint.offsetMinutes.toString());
                      setEditingOffset(true);
                    }}
                    className="inline-flex items-center gap-1 font-medium text-primary/80 hover:text-primary transition-colors group/offset"
                  >
                    <Clock className="size-3" />
                    <span>Arrival {formatOffset(waypoint.offsetMinutes)}</span>
                    <Pencil className="size-2.5 opacity-0 group-hover/offset:opacity-100 transition-opacity" />
                  </button>
                )
              ) : (
                <span className="inline-flex items-center gap-1 text-muted-foreground font-medium">
                  <Clock className="size-3" /> Origin Departure (0m)
                </span>
              )}

              {/* Dwell time badge / editor for intermediate stops */}
              {!isOrigin && !isDest && (
                editingDwell ? (
                  <div className="flex items-center gap-1">
                    <Hourglass className="size-3 text-amber-600" />
                    <Input
                      type="number"
                      min={1}
                      className="h-6 w-16 text-xs px-1"
                      value={dwellInput}
                      onChange={(e) => setDwellInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitDwell();
                        if (e.key === "Escape") setEditingDwell(false);
                      }}
                      autoFocus
                    />
                    <span className="text-[10px] text-muted-foreground">min dwell</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-5 text-primary"
                      onClick={commitDwell}
                    >
                      <CheckCircle2 className="size-3" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setDwellInput((waypoint.dwellMinutes ?? 15).toString());
                      setEditingDwell(true);
                    }}
                    className="inline-flex items-center gap-1 font-medium text-amber-700/80 hover:text-amber-800 transition-colors group/dwell"
                  >
                    <Hourglass className="size-3" />
                    <span>Dwell {waypoint.dwellMinutes ?? 15}m</span>
                    <Pencil className="size-2.5 opacity-0 group-hover/dwell:opacity-100 transition-opacity" />
                  </button>
                )
              )}

              {/* Distance from origin badge / editor */}
              {!isOrigin && (
                editingDistance ? (
                  <div className="flex items-center gap-1">
                    <MapPin className="size-3 text-muted-foreground" />
                    <Input
                      type="number"
                      min={0}
                      step={0.1}
                      placeholder="km"
                      className="h-6 w-16 text-xs px-1"
                      value={distanceInput}
                      onChange={(e) => setDistanceInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitDistance();
                        if (e.key === "Escape") setEditingDistance(false);
                      }}
                      autoFocus
                    />
                    <span className="text-[10px] text-muted-foreground">km</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-5 text-primary"
                      onClick={commitDistance}
                    >
                      <CheckCircle2 className="size-3" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setDistanceInput(waypoint.distanceFromOriginKm?.toString() ?? "");
                      setEditingDistance(true);
                    }}
                    className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground transition-colors group/dist"
                  >
                    <MapPin className="size-3" />
                    <span>
                      {waypoint.distanceFromOriginKm != null
                        ? `${waypoint.distanceFromOriginKm} km`
                        : "+ Distance"}
                    </span>
                    <Pencil className="size-2.5 opacity-0 group-hover/dist:opacity-100 transition-opacity" />
                  </button>
                )
              )}
            </div>
          </div>

          {/* Remove button for intermediate stops */}
          {!isOrigin && !isDest && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onRemove(waypoint.id)}
              className="size-7 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 shrink-0"
              aria-label="Remove stop"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { Armchair, BusFront, LayoutGrid, Pencil, Trash2 } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";
import { Card, CardContent } from "@moja/ui/components/ui/card";
import { Badge } from "@moja/ui/components/ui/badge";
import { cn } from "@moja/ui/lib/utils";
import type { RouterOutputs } from "@/trpc/client";

type Bus = RouterOutputs["fleet"]["getBuses"]["buses"][number];

const STATUS_CONFIG = {
  ACTIVE: {
    label: "Active",
    className: "bg-chart-2/10 text-chart-2 border-chart-2/20",
    dot: "bg-chart-2",
  },
  MAINTENANCE: {
    label: "Maintenance",
    className: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    dot: "bg-chart-4",
  },
  INACTIVE: {
    label: "Inactive",
    className: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
  RETIRED: {
    label: "Retired",
    className: "bg-muted/50 text-muted-foreground/70 border-border/50",
    dot: "bg-muted-foreground/50",
  },
} as const;

const CLASS_BADGES = {
  VIP: "bg-purple-500/10 text-purple-600 border-purple-500/20 font-bold",
  STANDARD: "bg-blue-500/10 text-blue-600 border-blue-500/20 font-semibold",
  ECONOMY: "bg-slate-500/10 text-slate-600 border-slate-500/20 font-medium",
} as const;

interface BusCardProps {
  bus: Bus;
  canManageFleet?: boolean;
  onEdit: (bus: Bus) => void;
  onDelete: (bus: Bus) => void;
  onViewMap: (bus: Bus) => void;
}

export function BusCard({
  bus,
  canManageFleet = true,
  onEdit,
  onDelete,
  onViewMap,
}: BusCardProps) {
  const status = STATUS_CONFIG[bus.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.INACTIVE;
  const seatClass = bus.seatClass ?? "STANDARD";

  return (
    <Card className="group/bus-card border-border bg-card shadow-none hover:border-primary/30 hover:shadow-sm transition-all duration-200">
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/15">
              <BusFront className="size-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-mono text-sm font-bold text-foreground tracking-wider truncate">
                  {bus.registrationPlate}
                </p>
                <Badge
                  variant="outline"
                  className={cn("text-[9px] uppercase px-1.5 py-0 h-3.5", CLASS_BADGES[seatClass as keyof typeof CLASS_BADGES])}
                >
                  {seatClass}
                </Badge>
              </div>
              {bus.internalName && (
                <p className="text-[11px] text-muted-foreground truncate">
                  {bus.internalName}
                </p>
              )}
            </div>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
              status.className,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
            {status.label}
          </span>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              Type
            </p>
            <p className="text-xs font-medium text-foreground/90 truncate mt-0.5">
              {bus.busType?.name ?? "Standard"}
            </p>
          </div>
          <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              Configuration
            </p>
            <p className="text-xs font-medium text-foreground/90 truncate mt-0.5">
              {bus.layoutTemplate?.name ?? "Default"}
            </p>
          </div>
        </div>

        {/* Notes */}
        {bus.notes && (
          <div className="rounded-md bg-amber-50/60 border border-amber-200/60 px-2.5 py-1.5">
            <p className="text-[10px] text-amber-700 font-semibold uppercase tracking-wider">Notes</p>
            <p className="text-xs text-amber-800/90 mt-0.5 line-clamp-2">{bus.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border/60 -mx-4 px-4 pt-3">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Armchair className="size-3.5" />
            <span>
              <strong className="text-foreground/80 font-semibold">
                {bus.layoutTemplate?.totalSeats ?? 0}
              </strong>{" "}
              seats
            </span>
            {bus.manufactureYear && (
              <span className="text-muted-foreground/70">
                · {bus.manufactureYear}
              </span>
            )}
          </span>

          <div className="flex items-center gap-0.5 opacity-0 group-hover/bus-card:opacity-100 transition-opacity duration-150">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-primary hover:bg-primary/5"
              onClick={() => onViewMap(bus)}
            >
              <LayoutGrid className="size-3.5 mr-1" />
              Plan
            </Button>
            {canManageFleet && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted"
                  onClick={() => onEdit(bus)}
                >
                  <Pencil className="size-3.5 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                  onClick={() => onDelete(bus)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

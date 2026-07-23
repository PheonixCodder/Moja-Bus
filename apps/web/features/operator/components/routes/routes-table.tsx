"use client";

import { ArrowRight, CalendarClock, Clock, MapIcon, Pencil, Trash2 } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";
import { Badge } from "@moja/ui/components/ui/badge";
import { Card, CardContent } from "@moja/ui/components/ui/card";
import Link from "next/link";

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

interface RoutesTableProps {
  routes: any[];
  onEdit: (route: any) => void;
  onDelete: (route: any) => void;
}

export function RoutesTable({ routes, onEdit, onDelete }: RoutesTableProps) {
  if (!routes || routes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg bg-card/50">
        <MapIcon className="size-10 text-muted-foreground/50 mb-3" />
        <h3 className="text-base font-semibold text-foreground">No routes found</h3>
        <p className="text-xs text-muted-foreground max-w-sm mt-1">
          Create your first transit route connecting origin and destination terminals.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {routes.map((route) => {
        const stopCount = route._count?.waypoints ?? 0;
        const scheduleCount = route._count?.schedules ?? 0;

        return (
          <Card
            key={route.id}
            className="group border-border bg-card shadow-none hover:border-primary/30 hover:shadow-sm transition-all duration-200"
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground truncate">
                      {route.name}
                    </p>
                    {route.status === "DRAFT" && (
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold py-0 h-4">
                        Draft
                      </Badge>
                    )}
                    {route.status === "ACTIVE" && (
                      <Badge variant="default" className="text-[10px] uppercase font-bold py-0 h-4 bg-emerald-500 hover:bg-emerald-600 text-white">
                        Active
                      </Badge>
                    )}
                    {route.status === "SUSPENDED" && (
                      <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-4 text-amber-600 border-amber-600/30 bg-amber-50">
                        Suspended
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs text-muted-foreground truncate">
                      {route.originTerminal?.cityRelation?.name ?? route.originTerminal?.city ?? "—"}
                    </span>
                    <ArrowRight className="size-3 shrink-0 text-muted-foreground/40" />
                    <span className="text-xs text-muted-foreground truncate">
                      {route.destTerminal?.cityRelation?.name ?? route.destTerminal?.city ?? "—"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-foreground"
                    onClick={() => onEdit(route)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(route)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1 border-t border-border">
                <div className="flex items-center gap-1.5">
                  <div className="size-1.5 rounded-full bg-primary/60" />
                  <span className="text-[11px] text-muted-foreground">
                    {stopCount + 2} stops
                  </span>
                </div>
                {scheduleCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <CalendarClock className="size-3 text-primary/60" />
                    <span className="text-[11px] font-semibold text-primary/80">
                      {scheduleCount} schedule{scheduleCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                {route.estimatedMinutes && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3 text-muted-foreground/60" />
                    <span className="text-[11px] text-muted-foreground">
                      {formatDuration(route.estimatedMinutes)}
                    </span>
                  </div>
                )}
                {route.distanceKm && (
                  <span className="text-[11px] text-muted-foreground ml-auto">
                    {Number(route.distanceKm).toFixed(1)} km
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

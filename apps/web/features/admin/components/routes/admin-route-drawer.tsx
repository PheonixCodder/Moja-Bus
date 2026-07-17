"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@moja/ui/components/ui/drawer";
import { Map, Clock, ArrowRight } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";

const RouteMapPreview = dynamic(
  () => import("@/features/operator/components/route-map-preview"),
  { ssr: false, loading: () => <MapSkeleton /> }
);

function MapSkeleton() {
  return (
    <div className="h-full w-full bg-slate-50 animate-pulse flex items-center justify-center">
      <div className="text-center space-y-2">
        <Map className="size-8 text-slate-300 mx-auto" />
        <p className="text-xs text-slate-400">Loading map...</p>
      </div>
    </div>
  );
}

function formatOffset(minutes: number): string {
  if (minutes === 0) return "Origin";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `+${m}m`;
  if (m === 0) return `+${h}h`;
  return `+${h}h ${m}m`;
}

interface AdminRouteDrawerProps {
  routeId: string | null;
  open: boolean;
  onClose: () => void;
}

export function AdminRouteDrawer({ routeId, open, onClose }: AdminRouteDrawerProps) {
  const trpc = useTRPC();
  
  const { data: route, isLoading } = useQuery({
    ...trpc.admin.getRoute.queryOptions({ id: routeId ?? "" }),
    enabled: open && !!routeId,
  });

  if (!open) return null;

  const allStops = route ? [
    {
      id: "origin",
      terminal: route.originTerminal,
      offsetMinutes: 0,
    },
    ...route.waypoints.map(wp => ({
      id: wp.id,
      terminal: wp.terminal,
      offsetMinutes: wp.arrivalOffsetMinutes,
    })),
    {
      id: "dest",
      terminal: route.destTerminal,
      offsetMinutes: route.estimatedMinutes ?? 0,
    }
  ] : [];

  const mapTerminals = allStops
    .map(s => s.terminal)
    .filter(t => t.latitude && t.longitude);

  return (
    <Drawer
      open={open}
      onOpenChange={(v) => !v && onClose()}
      direction="right"
    >
      <DrawerContent className="!inset-y-0 !right-0 !left-auto !w-full !max-w-4xl flex flex-col rounded-none border-l border-border bg-card">
        <DrawerHeader className="border-b border-border px-6 py-5 shrink-0 bg-background/50 backdrop-blur-md">
          <DrawerTitle className="text-lg font-bold">
            {isLoading ? "Loading Route..." : route?.name}
          </DrawerTitle>
          <DrawerDescription className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            {route && (
              <>
                <span className="font-medium text-foreground">{route.company.name}</span>
                <span>•</span>
                <span>
                  {route.originTerminal.cityRelation?.name ?? route.originTerminal.city} 
                  <ArrowRight className="inline mx-1 size-3" /> 
                  {route.destTerminal.cityRelation?.name ?? route.destTerminal.city}
                </span>
                <span>•</span>
                <span>{route.status}</span>
              </>
            )}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Waypoints Timeline */}
          <div className="w-[320px] overflow-y-auto border-r border-border bg-card px-6 py-6 space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Route Waypoints</h3>
            
            <div className="space-y-0">
              {isLoading && (
                <div className="text-sm text-muted-foreground animate-pulse">Loading stops...</div>
              )}
              {allStops.map((stop, i) => {
                const isOrigin = i === 0;
                const isDest = i === allStops.length - 1;
                
                return (
                  <div key={stop.id} className="flex items-stretch gap-4">
                    {/* Timeline */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className={cn(
                        "size-3.5 rounded-full border-2 mt-1",
                        isOrigin || isDest ? "border-primary bg-primary" : "border-primary/50 bg-background"
                      )} />
                      {!isDest && <div className="w-px flex-1 bg-border min-h-[2.5rem] my-1" />}
                    </div>

                    {/* Content */}
                    <div className="pb-6">
                      <p className="text-sm font-semibold text-foreground leading-tight">
                        {stop.terminal.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {stop.terminal.cityRelation?.name ?? stop.terminal.city}
                      </p>
                      
                      {!isOrigin && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-primary">
                          <Clock className="size-3.5" />
                          {formatOffset(stop.offsetMinutes)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Map Preview */}
          <div className="flex-1 bg-slate-50 relative">
            {mapTerminals.length > 0 ? (
              <RouteMapPreview terminals={mapTerminals as any} />
            ) : (
              <MapSkeleton />
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

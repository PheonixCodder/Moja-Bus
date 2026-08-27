"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@moja/ui/components/ui/avatar";
import { Button } from "@moja/ui/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bus,
  Clock,
  Layers,
  Radio,
  RefreshCw,
  UserCheck,
  Wifi,
  WifiOff,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DriverStatusBadge } from "@/features/operator/components/drivers/driver-status-badge";
import type { FleetVehicle } from "@/features/operator/components/fleet-live-map";
import { useGatewaySubscription } from "@/lib/gateway-subscription";
import { useTRPC } from "@/trpc/client";

// Leaflet touches `window` at module load — client-only, matching the
// route-map-preview pattern.
const FleetLiveMap = dynamic(
  () => import("@/features/operator/components/fleet-live-map"),
  { ssr: false, loading: () => <div className="size-full bg-zinc-950" /> },
);

export function OperatorFleetMapView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  // Ticking clock so stale-dimming updates between polls.
  const [now, setNow] = useState(() => Date.now());

  const tokenQuery = useQuery(
    trpc.operator.getGatewaySubscriptionToken.queryOptions(),
  );

  const livePositionsOptions = trpc.drivers.getLivePositions.queryOptions();
  const livePositionsKey = trpc.drivers.getLivePositions.queryKey();

  const liveQuery = useQuery({
    ...livePositionsOptions,
    refetchInterval: 10000, // Positions refresh every 10 seconds as structural fallback
  });

  const { isConnected } = useGatewaySubscription({
    token: tokenQuery.data?.token,
    room: tokenQuery.data?.companyId
      ? `company:${tokenQuery.data.companyId}`
      : null,
    enabled: !!tokenQuery.data?.token,
    onMessage: (data: {
      driverProfileId: string;
      tripId?: string;
      latitude: number;
      longitude: number;
      speedKmh?: number | null;
      heading?: number | null;
      recordedAt: string | Date;
    }) => {
      queryClient.setQueryData(livePositionsKey, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((driver) => {
          if (driver.id === data.driverProfileId) {
            return {
              ...driver,
              lastLatitude: data.latitude,
              lastLongitude: data.longitude,
              lastHeading: data.heading ?? driver.lastHeading,
              lastSpeedKmh: data.speedKmh ?? driver.lastSpeedKmh,
              lastPingAt: data.recordedAt,
            };
          }
          return driver;
        });
      });
    },
  });

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const activeDrivers = liveQuery.data ?? [];
  // Phase 23 (D2) — dead coordinates (>24 h) are not live fleet; hide them
  // from both the map AND the roster so the dispatcher never chases ghosts.
  const liveDrivers = activeDrivers.filter(
    (v) =>
      !v.lastPingAt ||
      Date.now() - new Date(v.lastPingAt).getTime() <= 24 * 60 * 60 * 1000,
  );
  const selectedDriver =
    liveDrivers.find((d) => d.id === selectedDriverId) ?? liveDrivers[0];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/operator/drivers">
            <Button variant="ghost" size="icon" className="size-8">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                <Radio className="size-5 text-emerald-500 animate-pulse" />
                Live Fleet Telemetry Map
              </h1>
              {isConnected ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <Wifi className="size-3" />
                  Live Push Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 bg-muted px-2 py-0.5 rounded-full">
                  <WifiOff className="size-3" />
                  10s Sync Active
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Live GPS positions of active buses and dispatched drivers —
              {isConnected
                ? " real-time WebSocket push with 10s fallback."
                : " refreshed every 10 seconds."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => liveQuery.refetch()}
            disabled={liveQuery.isFetching}
            className="gap-1.5"
          >
            <RefreshCw
              className={`size-3.5 ${liveQuery.isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Map & Fleet List Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[650px]">
        {/* Left Side: Active Drivers List */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col shadow-sm">
          <div className="p-3.5 border-b border-border bg-muted/40 flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">
              Active Vehicles Online ({liveDrivers.length})
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              10 s refresh
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {liveDrivers.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <Bus className="size-8 text-muted-foreground/30 mx-auto" />
                <p>
                  No drivers or buses currently on active trips or streaming
                  GPS.
                </p>
              </div>
            ) : (
              liveDrivers.map((driver) => {
                const isSelected = driver.id === selectedDriver?.id;
                return (
                  <button
                    key={driver.id}
                    onClick={() => setSelectedDriverId(driver.id)}
                    className={`w-full p-3.5 text-left transition-colors flex items-start gap-3 ${
                      isSelected
                        ? "bg-primary/5 border-l-4 border-l-primary"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <Avatar className="size-10 shrink-0 border border-border">
                      <AvatarImage src={driver.user.image ?? undefined} />
                      <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                        {driver.user.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-sm text-foreground truncate">
                          {driver.user.fullName}
                        </span>
                        <DriverStatusBadge status={driver.status} />
                      </div>

                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span className="font-mono font-medium">
                          {driver.currentTrip?.bus.registrationPlate ||
                            "No bus plate"}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {driver.lastSpeedKmh
                            ? `${Math.round(driver.lastSpeedKmh)} km/h`
                            : "Stationary"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Real Map (Phase 23) + Selected-Vehicle HUD */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-zinc-950 relative overflow-hidden flex flex-col shadow-sm">
          {selectedDriver &&
          selectedDriver.lastLatitude != null &&
          selectedDriver.lastLongitude != null ? (
            <>
              {/* Top bar — real telemetry for the selected vehicle */}
              <div className="absolute top-3 left-3 right-3 z-[500] flex items-center justify-between pointer-events-none">
                <div className="pointer-events-auto p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 backdrop-blur text-white flex items-center gap-3 shadow-lg">
                  <Bus className="size-5 text-primary" />
                  <div>
                    <div className="text-xs text-zinc-400">
                      {selectedDriver.user.fullName}
                    </div>
                    <div className="font-mono font-bold text-sm">
                      {selectedDriver.currentTrip?.bus.registrationPlate ||
                        "No bus assigned"}
                    </div>
                  </div>
                </div>
                <div className="pointer-events-auto p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 backdrop-blur text-white flex items-center gap-4 shadow-lg">
                  <div className="text-right">
                    <div className="text-[10px] uppercase text-zinc-400 font-semibold">
                      Speed
                    </div>
                    <div className="text-base font-extrabold text-emerald-400 font-mono">
                      {selectedDriver.lastSpeedKmh
                        ? `${Math.round(selectedDriver.lastSpeedKmh)} km/h`
                        : "0 km/h"}
                    </div>
                  </div>
                  <div className="text-right border-l border-zinc-800 pl-3">
                    <div className="text-[10px] uppercase text-zinc-400 font-semibold">
                      Heading
                    </div>
                    <div className="text-base font-extrabold text-cyan-400 font-mono">
                      {selectedDriver.lastHeading
                        ? `${Math.round(selectedDriver.lastHeading)}°`
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>

              <FleetLiveMap
                vehicles={liveDrivers.map((d) => ({
                  id: d.id,
                  fullName: d.user.fullName,
                  plate: d.currentTrip?.bus.registrationPlate ?? null,
                  status: d.status,
                  latitude: d.lastLatitude ?? 0,
                  longitude: d.lastLongitude ?? 0,
                  heading: d.lastHeading,
                  speedKmh: d.lastSpeedKmh,
                  lastPingAt: d.lastPingAt,
                }))}
                selectedId={selectedDriver.id}
                onSelect={(id) => setSelectedDriverId(id)}
                now={now}
              />

              {/* Bottom bar */}
              <div className="absolute bottom-3 left-3 right-3 z-[500] p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 backdrop-blur flex items-center justify-between text-white shadow-lg">
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <Clock className="size-4 text-zinc-400" />
                  Last ping:{" "}
                  <span className="font-semibold text-white">
                    {selectedDriver.lastPingAt
                      ? new Date(selectedDriver.lastPingAt).toLocaleTimeString()
                      : "—"}
                  </span>
                </div>
                <Link href={`/dashboard/operator/drivers/${selectedDriver.id}`}>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 text-xs gap-1.5"
                  >
                    <UserCheck className="size-3.5" />
                    Driver Passport
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="p-8 text-center space-y-2 h-full flex flex-col items-center justify-center">
              <Layers className="size-10 text-zinc-700 mx-auto" />
              <div className="font-semibold text-zinc-300">
                Select an active vehicle
              </div>
              <p className="text-xs text-zinc-500 max-w-xs">
                Pick a driver from the left roster to see its live position on
                the map.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

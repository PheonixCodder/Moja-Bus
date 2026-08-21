"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Radio,
  RefreshCw,
  Bus,
  Gauge,
  Navigation,
  UserCheck,
  Clock,
  Layers,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@moja/ui/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@moja/ui/components/ui/avatar";
import { useTRPC } from "@/trpc/client";
import { DriverStatusBadge } from "@/features/operator/components/drivers/driver-status-badge";

export function OperatorFleetMapView() {
  const trpc = useTRPC();
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  const liveQuery = useQuery({
    ...trpc.drivers.getLivePositions.queryOptions(),
    refetchInterval: 10000, // Poll every 10 seconds as backup
  });

  const activeDrivers = liveQuery.data ?? [];
  const selectedDriver = activeDrivers.find((d) => d.id === selectedDriverId) ?? activeDrivers[0];

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/operator/drivers">
            <Button variant="ghost" size="icon" className="size-8">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Radio className="size-5 text-emerald-500 animate-pulse" />
              Live Fleet Telemetry Map
            </h1>
            <p className="text-xs text-muted-foreground">
              Real-time GPS tracking of active commercial buses and dispatched drivers.
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
            <RefreshCw className={`size-3.5 ${liveQuery.isFetching ? "animate-spin" : ""}`} />
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
              Active Vehicles Online ({activeDrivers.length})
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Live Stream
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {activeDrivers.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <Bus className="size-8 text-muted-foreground/30 mx-auto" />
                <p>No drivers or buses currently on active trips or streaming GPS.</p>
              </div>
            ) : (
              activeDrivers.map((driver) => {
                const isSelected = driver.id === selectedDriver?.id;
                return (
                  <button
                    key={driver.id}
                    onClick={() => setSelectedDriverId(driver.id)}
                    className={`w-full p-3.5 text-left transition-colors flex items-start gap-3 ${
                      isSelected ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-muted/40"
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
                          {driver.currentTrip?.bus.registrationPlate || "No bus plate"}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {driver.lastSpeedKmh ? `${Math.round(driver.lastSpeedKmh)} km/h` : "Stationary"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Map Canvas & HUD */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-zinc-950 relative overflow-hidden flex flex-col items-center justify-center text-zinc-400 shadow-sm">
          {/* Simulated Dark Geo Map Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

          {selectedDriver && selectedDriver.lastLatitude && selectedDriver.lastLongitude ? (
            <div className="relative z-10 w-full h-full flex flex-col justify-between p-6">
              {/* Map Top Bar */}
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 backdrop-blur text-white flex items-center gap-3 shadow-lg">
                  <Bus className="size-5 text-primary" />
                  <div>
                    <div className="text-xs text-zinc-400">Selected Vehicle</div>
                    <div className="font-mono font-bold text-sm">
                      {selectedDriver.currentTrip?.bus.registrationPlate || "Active Vehicle"}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 backdrop-blur text-white flex items-center gap-4 shadow-lg">
                  <div className="text-right">
                    <div className="text-[10px] uppercase text-zinc-400 font-semibold">Speed</div>
                    <div className="text-base font-extrabold text-emerald-400 font-mono">
                      {selectedDriver.lastSpeedKmh ? `${Math.round(selectedDriver.lastSpeedKmh)} km/h` : "0 km/h"}
                    </div>
                  </div>
                  <div className="text-right border-l border-zinc-800 pl-3">
                    <div className="text-[10px] uppercase text-zinc-400 font-semibold">Heading</div>
                    <div className="text-base font-extrabold text-cyan-400 font-mono">
                      {selectedDriver.lastHeading ? `${Math.round(selectedDriver.lastHeading)}°` : "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Map Pin Radar */}
              <div className="flex flex-col items-center justify-center my-auto">
                <div className="relative flex items-center justify-center">
                  <div className="size-24 rounded-full bg-primary/20 animate-ping absolute" />
                  <div className="size-16 rounded-full bg-primary/30 flex items-center justify-center border-2 border-primary shadow-2xl relative z-10">
                    <Navigation
                      className="size-7 text-white transition-transform"
                      style={{
                        transform: `rotate(${selectedDriver.lastHeading || 0}deg)`,
                      }}
                    />
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <div className="font-bold text-white text-base">
                    {selectedDriver.user.fullName}
                  </div>
                  <div className="font-mono text-xs text-zinc-400 mt-0.5">
                    Lat: {selectedDriver.lastLatitude.toFixed(5)}, Lng: {selectedDriver.lastLongitude.toFixed(5)}
                  </div>
                </div>
              </div>

              {/* Bottom HUD bar */}
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 backdrop-blur flex items-center justify-between text-white shadow-lg">
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <Clock className="size-4 text-zinc-400" />
                  Last Ping:{" "}
                  <span className="font-semibold text-white">
                    {selectedDriver.lastPingAt
                      ? new Date(selectedDriver.lastPingAt).toLocaleTimeString()
                      : "Just now"}
                  </span>
                </div>

                <Link href={`/dashboard/operator/drivers/${selectedDriver.id}`}>
                  <Button size="sm" variant="secondary" className="h-8 text-xs gap-1.5">
                    <UserCheck className="size-3.5" />
                    Driver Passport
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center space-y-2">
              <Layers className="size-10 text-zinc-700 mx-auto" />
              <div className="font-semibold text-zinc-300">Select an active vehicle</div>
              <p className="text-xs text-zinc-500 max-w-xs">
                Pick a driver from the left roster to focus the live tracking radar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

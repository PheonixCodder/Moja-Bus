"use client";

import { Button } from "@moja/ui/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@moja/ui/components/ui/combobox";
import { cn } from "@moja/ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Bus,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { UrbanBadge } from "@/components/urban-badge";
import {
  formatTripDate,
  formatTripTime,
} from "@/features/operator/lib/trips/format";
import { TRIP_STATUS_CONFIG } from "@/features/operator/lib/trips/status-config";
import type { RouterOutputs } from "@/trpc/client";
import { useTRPC } from "@/trpc/client";
import { DriverAssignmentRows } from "./driver-assignment-rows";
import { TripStatusBadge } from "./trip-status-badge";

type TripListItem = RouterOutputs["trips"]["list"]["items"][number];
type BusItem = RouterOutputs["fleet"]["getBuses"]["buses"][number];

export function TripCard({
  trip,
  buses,
  canUpdate,
  onViewManifest,
  hasBoothConflict,
}: {
  trip: TripListItem;
  buses: BusItem[];
  canUpdate: boolean;
  onViewManifest: (id: string) => void;
  hasBoothConflict?: boolean;
}) {
  const t = useTranslations("operatorDashboard.trips");
  const [expanded, setExpanded] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const assignBusMutation = useMutation({
    ...trpc.trips.assignBus.mutationOptions(),
    onSuccess: () => {
      toast.success(t("busAssigned"));
      void queryClient.invalidateQueries(trpc.trips.list.pathFilter());
    },
    onError: (err) => toast.error(err.message || t("failedAssignBus")),
  });

  const route = trip.schedule?.route;
  const origin =
    route?.originTerminal?.cityRelation?.name ??
    route?.originTerminal?.city ??
    route?.originTerminal?.name ??
    "\u2014";
  const dest =
    route?.destTerminal?.cityRelation?.name ??
    route?.destTerminal?.city ??
    route?.destTerminal?.name ??
    "\u2014";
  const passengerCount = trip._count?.bookings ?? 0;
  const canAssign =
    canUpdate && !["CANCELLED", "ARRIVED"].includes(trip.status);

  return (
    <div className="border border-border rounded-md bg-card hover:border-primary/20 transition-all duration-200 overflow-hidden">
      <Button
        type="button"
        variant="ghost"
        className="flex items-start gap-3 p-4 w-full h-auto text-left cursor-pointer justify-start rounded-none hover:bg-transparent"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <div
          className={cn(
            "size-2 rounded-full mt-1.5 shrink-0",
            TRIP_STATUS_CONFIG[trip.status].dot,
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  {origin}
                </span>
                <ArrowRight className="size-3 text-muted-foreground/50" />
                <span className="text-sm font-bold text-foreground">
                  {dest}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="size-3" />
                  {formatTripDate(trip.departureDate)}
                </span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" />
                  {formatTripTime(trip.departureDate)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {trip.serviceType === "URBAN" ? (
                <UrbanBadge />
              ) : (
                <span className="rounded-full border border-border bg-muted px-2 py-0 text-[10px] font-semibold text-muted-foreground">
                  {t("intercity")}
                </span>
              )}
              <TripStatusBadge status={trip.status} />
              {hasBoothConflict ? (
                <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  <AlertTriangle className="h-3 w-3" />
                  {t("boothConflictBadge")}
                </div>
              ) : null}
              {expanded ? (
                <ChevronUp className="size-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-3.5 text-muted-foreground" />
              )}
            </div>
          </div>
          {passengerCount > 0 ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              {t("passengerCount", { count: passengerCount })}
            </p>
          ) : null}
        </div>
      </Button>

      {expanded ? (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3 bg-muted/30">
          {canAssign && buses.length > 0 ? (
            <div className="flex items-center gap-2">
              <Bus className="size-4 text-muted-foreground shrink-0" />
              <div className="w-full flex-1">
                <Combobox
                  items={buses
                    .filter((b) => b.status === "ACTIVE")
                    .map((b) => ({
                      value: b.id,
                      label: `${b.registrationPlate}${b.internalName ? ` \u2014 ${b.internalName}` : ""}`,
                    }))}
                  value={trip.busId ?? ""}
                  onValueChange={(val: string | null) => {
                    if (val) {
                      assignBusMutation.mutate({
                        id: trip.id,
                        data: { busId: val },
                      });
                    }
                  }}
                  disabled={assignBusMutation.isPending}
                >
                  <ComboboxInput
                    placeholder={
                      assignBusMutation.isPending
                        ? t("assigning")
                        : t("assignBusPlaceholder")
                    }
                    className="w-full text-xs h-8"
                    value={
                      trip.busId
                        ? (() => {
                            const b = buses.find((x) => x.id === trip.busId);
                            return b
                              ? `${b.registrationPlate}${b.internalName ? ` \u2014 ${b.internalName}` : ""}`
                              : "";
                          })()
                        : ""
                    }
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>{t("noActiveBus")}</ComboboxEmpty>
                    <ComboboxList>
                      {buses
                        .filter((b) => b.status === "ACTIVE")
                        .map((b) => (
                          <ComboboxItem
                            key={b.id}
                            value={b.id}
                            className="text-xs"
                          >
                            {b.registrationPlate}
                            {b.internalName ? ` \u2014 ${b.internalName}` : ""}
                          </ComboboxItem>
                        ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
            </div>
          ) : trip.bus ? (
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Bus className="size-3.5" />
              {trip.bus.registrationPlate}
              {trip.bus.internalName ? ` \u2014 ${trip.bus.internalName}` : ""}
            </p>
          ) : null}

          {/* Driver / Relief / Conductor assignment rows */}
          <DriverAssignmentRows
            tripId={trip.id}
            canAssign={canAssign}
            holders={{
              PRIMARY: trip.driver
                ? { id: trip.driver.id, name: trip.driver.user.fullName ?? "—" }
                : null,
              RELIEF: trip.reliefDriver
                ? {
                    id: trip.reliefDriver.id,
                    name: trip.reliefDriver.user.fullName ?? "—",
                  }
                : null,
              CONDUCTOR: (trip as any).conductorStaff
                ? {
                    id: (trip as any).conductorStaff.id,
                    name: (trip as any).conductorStaff.user?.fullName ?? "—",
                  }
                : null,
            }}
          />

          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => onViewManifest(trip.id)}
          >
            {t("viewManifest")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

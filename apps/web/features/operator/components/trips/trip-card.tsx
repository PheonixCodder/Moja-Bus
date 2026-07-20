"use client";

import { useState } from "react";
import {
  ArrowRight,
  Bus,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@moja/ui/lib/utils";
import { Button } from "@moja/ui/components/ui/button";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@moja/ui/components/ui/combobox";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { RouterOutputs } from "@/trpc/client";
import { TripStatusBadge } from "./trip-status-badge";
import { TRIP_STATUS_CONFIG } from "@/features/operator/lib/trips/status-config";
import {
  formatTripDate,
  formatTripTime,
} from "@/features/operator/lib/trips/format";

type TripListItem = RouterOutputs["trips"]["list"]["items"][number];
type BusItem = RouterOutputs["fleet"]["getBuses"]["buses"][number];

export function TripCard({
  trip,
  buses,
  canUpdate,
  onViewManifest,
}: {
  trip: TripListItem;
  buses: BusItem[];
  canUpdate: boolean;
  onViewManifest: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const assignBusMutation = useMutation({
    ...trpc.trips.assignBus.mutationOptions(),
    onSuccess: () => {
      toast.success("Bus assigned");
      void queryClient.invalidateQueries(trpc.trips.list.pathFilter());
    },
    onError: (err) =>
      toast.error(err.message || "Failed to assign bus"),
  });

  const route = trip.schedule?.route;
  const origin =
    route?.originTerminal?.cityRelation?.name ??
    route?.originTerminal?.city ??
    route?.originTerminal?.name ??
    "—";
  const dest =
    route?.destTerminal?.cityRelation?.name ??
    route?.destTerminal?.city ??
    route?.destTerminal?.name ??
    "—";
  const passengerCount = trip._count?.bookings ?? 0;
  const canAssign =
    canUpdate && !["CANCELLED", "ARRIVED"].includes(trip.status);

  return (
    <div className="border border-border rounded-md bg-card hover:border-primary/20 transition-all duration-200 overflow-hidden">
      <button
        type="button"
        className="flex items-start gap-3 p-4 w-full text-left cursor-pointer"
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
                <span className="text-sm font-bold text-foreground">{origin}</span>
                <ArrowRight className="size-3 text-muted-foreground/50" />
                <span className="text-sm font-bold text-foreground">{dest}</span>
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
              <TripStatusBadge status={trip.status} />
              {expanded ? (
                <ChevronUp className="size-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-3.5 text-muted-foreground" />
              )}
            </div>
          </div>
          {passengerCount > 0 ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              {passengerCount} passenger{passengerCount !== 1 ? "s" : ""}
            </p>
          ) : null}
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3 bg-slate-50/30">
          {canAssign && buses.length > 0 ? (
            <div className="flex items-center gap-2">
              <Bus className="size-4 text-muted-foreground shrink-0" />
              <div className="w-full flex-1">
                <Combobox
                  items={buses
                    .filter((b) => b.status === "ACTIVE")
                    .map((b) => ({
                      value: b.id,
                      label: `${b.registrationPlate}${b.internalName ? ` — ${b.internalName}` : ""}`,
                    }))}
                  value={trip.busId ?? ""}
                  onValueChange={(val) => {
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
                        ? "Assigning..."
                        : "Assign bus…"
                    }
                    className="w-full text-xs h-8"
                    value={
                      trip.busId
                        ? (() => {
                            const b = buses.find((x) => x.id === trip.busId);
                            return b
                              ? `${b.registrationPlate}${b.internalName ? ` — ${b.internalName}` : ""}`
                              : "";
                          })()
                        : ""
                    }
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No active bus found.</ComboboxEmpty>
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
                            {b.internalName ? ` — ${b.internalName}` : ""}
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
              {trip.bus.internalName ? ` — ${trip.bus.internalName}` : ""}
            </p>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => onViewManifest(trip.id)}
          >
            View Manifest
          </Button>
        </div>
      ) : null}
    </div>
  );
}

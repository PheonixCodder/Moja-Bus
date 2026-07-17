"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { format } from "date-fns";
import { ArrowRight, Bus, CalendarDays, MapPin } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { Badge } from "@moja/ui/components/ui/badge";

export function TripAuditHeader({ tripId }: { tripId: string }) {
  const trpc = useTRPC();
  const { data: trip } = useQuery(
    trpc.admin.getTripAudit.queryOptions({ id: tripId })
  );

  if (!trip) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-6 md:flex-row md:items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full font-semibold">
              {trip.company.name}
            </span>
            <Badge
              variant={
                trip.status === "ARRIVED"
                  ? "default"
                  : trip.status === "SCHEDULED" || trip.status === "BOARDING"
                  ? "secondary"
                  : trip.status === "CANCELLED"
                  ? "destructive"
                  : "outline"
              }
            >
              {trip.status}
            </Badge>
            {trip.delayMinutes ? (
              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                {trip.delayMinutes} min delay
              </Badge>
            ) : null}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {trip.schedule.route.originTerminal.cityRelation?.name}
            <ArrowRight className="size-5 text-muted-foreground" />
            {trip.schedule.route.destTerminal.cityRelation?.name}
          </h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
            <CalendarDays className="size-4" />
            {format(new Date(trip.departureDate), "EEEE, MMM d, yyyy 'at' h:mm a")}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-slate-100">
              <Bus className="size-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Bus Assigned
              </p>
              <p className="text-sm font-medium">
                {trip.bus ? trip.bus.registrationPlate : "Unassigned"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-slate-100">
              <MapPin className="size-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Origin Gate
              </p>
              <p className="text-sm font-medium">
                {trip.gate || "Unassigned"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { dispatchSearchParams } from "../lib/search-params";
import { useQueryStates } from "nuqs";
import { cn } from "@moja/ui/lib/utils";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@moja/ui/components/ui/avatar";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@moja/ui/components/ui/empty";
import {
  AlertCircle,
  ArrowRight,
  Bus as BusIcon,
  CheckCircle2,
  Clock,
  ExternalLink,
  Navigation,
  Radio,
  XCircle,
} from "lucide-react";
import type { RouterOutputs } from "@/trpc/client";
import { format } from "date-fns";

type Trip = RouterOutputs["admin"]["listDispatchTrips"][number];

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  SCHEDULED: {
    label: "Scheduled",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Clock,
  },
  BOARDING: {
    label: "Boarding",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: Navigation,
  },
  DEPARTED: {
    label: "Departed",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: BusIcon,
  },
  DELAYED: {
    label: "Delayed",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: AlertCircle,
  },
  ARRIVED: {
    label: "Arrived",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    icon: CheckCircle2,
  },
};

function TripStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["SCHEDULED"];
  const Icon = cfg?.icon ?? Clock;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-bold",
        cfg?.color ?? "bg-slate-100 text-slate-700"
      )}
    >
      <Icon className="size-3" />
      {cfg?.label ?? "Unknown"}
    </span>
  );
}

function SeatFillBar({ booked, total }: { booked: number; total: number }) {
  const pct = total > 0 ? Math.min((booked / total) * 100, 100) : 0;
  const color =
    pct >= 90 ? "bg-red-500" : pct >= 60 ? "bg-amber-500" : "bg-primary";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {booked} / {total} seats
        </span>
        <span className="text-[11px] font-semibold text-foreground">
          {Math.round(pct)}%
        </span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            color
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function TripCard({
  trip,
  onClick,
}: {
  trip: Trip;
  onClick: (id: string) => void;
}) {
  const { schedule, bus, _count, departureDate } = trip;
  const origin = schedule.route.originTerminal.cityRelation?.name || schedule.route.originTerminal.name;
  const dest = schedule.route.destTerminal.cityRelation?.name || schedule.route.destTerminal.name;

  return (
    <div
      onClick={() => onClick(trip.id)}
      className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm cursor-pointer"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{origin}</span>
            <ArrowRight className="size-3.5 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">{dest}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {format(new Date(departureDate), "MMM d, yyyy • h:mm a")}
            {trip.delayMinutes && trip.delayMinutes > 0 && (
              <span className="ml-2 font-medium text-amber-600">
                +{trip.delayMinutes}m delay
              </span>
            )}
          </p>
        </div>
        <TripStatusBadge status={trip.status} />
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Bus Assignment
          </span>
          <span className="text-sm font-medium">
            {bus ? bus.registrationPlate : "Unassigned"}
          </span>
        </div>
        {trip.gate && (
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Gate / Bay
            </span>
            <span className="text-sm font-medium">{trip.gate}</span>
          </div>
        )}
      </div>

      {/* Seat fill bar */}
      <div className="border-t border-border pt-3">
        <SeatFillBar
          booked={_count.bookings}
          total={trip.totalSeats || 0}
        />
      </div>

      {/* View full audit link */}
      <Link
        href={`/dashboard/admin/operations/trips/${trip.id}`}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-1"
      >
        <ExternalLink className="size-3" />
        Full Audit
      </Link>
    </div>
  );
}

function groupTripsByCompany(trips: Trip[]) {
  const map = new Map<string, { companyName: string; logoUrl: string | null; trips: Trip[] }>();
  for (const trip of trips) {
    const key = trip.company.name;
    if (!map.has(key)) {
      map.set(key, {
        companyName: key,
        logoUrl: trip.company.logoUrl,
        trips: [],
      });
    }
    map.get(key)!.trips.push(trip);
  }
  return Array.from(map.values()).sort((a, b) => a.companyName.localeCompare(b.companyName));
}

export function DispatchTripList({ onOpenTrip }: { onOpenTrip: (id: string) => void }) {
  const trpc = useTRPC();
  const [{ status, companyId, from, to }] = useQueryStates(
    dispatchSearchParams,
    { shallow: false }
  );

  const { data: trips = [] } = useSuspenseQuery(
    trpc.admin.listDispatchTrips.queryOptions({
      status: status as any,
      companyId,
      from,
      to,
    })
  );

  const grouped = groupTripsByCompany(trips);

  if (trips.length === 0) {
    return (
      <Empty className="py-16">
        <EmptyMedia>
          <Radio className="size-10 text-muted-foreground/30" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>No active trips found</EmptyTitle>
          <EmptyDescription>
            Try adjusting your filters or date range to see operations.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-8">
      {grouped.map((group) => (
        <div key={group.companyName} className="space-y-4">
          <div className="flex items-center gap-3 border-b border-border pb-2">
            <Avatar className="size-8 border bg-bg-base">
              <AvatarImage src={group.logoUrl ?? undefined} />
              <AvatarFallback className="text-[10px]">
                {group.companyName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-sm font-bold text-foreground">
              {group.companyName}
            </h3>
            <span className="text-xs text-muted-foreground bg-bg-base px-2 py-0.5 rounded-full border">
              {group.trips.length} trip{group.trips.length !== 1 && "s"}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {group.trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onClick={onOpenTrip} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

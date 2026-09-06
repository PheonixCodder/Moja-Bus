"use client";

import { CarrierAvatar } from "@moja/ui/components/ui/carrier-avatar";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@moja/ui/components/ui/empty";
import { cn } from "@moja/ui/lib/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { format } from "date-fns";
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
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";
import type { MouseEvent } from "react";
import type { RouterOutputs } from "@/trpc/client";
import { useTRPC } from "@/trpc/client";
import { dispatchSearchParams } from "../lib/search-params";

type Trip = RouterOutputs["admin"]["listDispatchTrips"][number];

const STATUS_CONFIG: Record<
  string,
  { color: string; icon: React.ElementType }
> = {
  SCHEDULED: {
    color: "bg-primary/10 text-primary border-primary/20",
    icon: Clock,
  },
  BOARDING: {
    color: "bg-success/10 text-success border-success/20",
    icon: Navigation,
  },
  DEPARTED: {
    color: "bg-primary/15 text-primary border-primary/25",
    icon: BusIcon,
  },
  DELAYED: {
    color: "bg-warning/10 text-warning border-warning/20",
    icon: AlertCircle,
  },
  ARRIVED: {
    color: "bg-muted text-muted-foreground border-border",
    icon: CheckCircle2,
  },
  CANCELLED: {
    color: "bg-destructive/10 text-destructive border-destructive/20",
    icon: XCircle,
  },
};

function TripStatusBadge({ status }: { status: string }) {
  const t = useTranslations("adminDashboard.dispatchTripList");
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["SCHEDULED"];
  const Icon = cfg?.icon ?? Clock;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-bold",
        cfg?.color ?? "bg-muted text-muted-foreground",
      )}
    >
      <Icon className="size-3" />
      {t(`statuses.${status}` as any, { default: status })}
    </span>
  );
}

function SeatFillBar({ booked, total }: { booked: number; total: number }) {
  const t = useTranslations("adminDashboard.dispatchTripList");
  const pct = total > 0 ? Math.min((booked / total) * 100, 100) : 0;
  const color =
    pct >= 90 ? "bg-destructive" : pct >= 60 ? "bg-warning" : "bg-primary";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {booked} / {total} {t("seats")}
        </span>
        <span className="text-[11px] font-semibold text-foreground">
          {Math.round(pct)}%
        </span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            color,
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
  const t = useTranslations("adminDashboard.dispatchTripList");
  const { schedule, bus, _count, departureDate } = trip;
  const origin =
    schedule?.route.originTerminal.cityRelation?.name ||
    schedule?.route.originTerminal.name;
  const dest =
    schedule?.route.destTerminal.cityRelation?.name ||
    schedule?.route.destTerminal.name;

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
              <span className="ml-2 font-medium text-warning">
                {t("delayMinutes", { minutes: trip.delayMinutes })}
              </span>
            )}
          </p>
        </div>
        <TripStatusBadge status={trip.status} />
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            {t("busAssignment")}
          </span>
          <span className="text-sm font-medium">
            {bus ? bus.registrationPlate : t("unassigned")}
          </span>
        </div>
        {trip.gate && (
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              {t("gateBay")}
            </span>
            <span className="text-sm font-medium">{trip.gate}</span>
          </div>
        )}
      </div>

      {/* Seat fill bar */}
      <div className="border-t border-border pt-3">
        <SeatFillBar booked={_count.bookings} total={trip.totalSeats || 0} />
      </div>

      {/* View full audit link */}
      <Link
        href={`/dashboard/admin/operations/trips/${trip.id}`}
        onClick={(e: MouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-1"
      >
        <ExternalLink className="size-3" />
        {t("fullAudit")}
      </Link>
    </div>
  );
}

function groupTripsByCompany(trips: Trip[]) {
  const map = new Map<
    string,
    { companyName: string; logoUrl: string | null; trips: Trip[] }
  >();
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
  return Array.from(map.values()).sort((a, b) =>
    a.companyName.localeCompare(b.companyName),
  );
}

export function DispatchTripList({
  onOpenTrip,
}: {
  onOpenTrip: (id: string) => void;
}) {
  const t = useTranslations("adminDashboard.dispatchTripList");
  const trpc = useTRPC();
  const [{ status, companyId, from, to }] = useQueryStates(
    dispatchSearchParams,
    { shallow: false },
  );

  const { data: trips = [] } = useSuspenseQuery(
    trpc.admin.listDispatchTrips.queryOptions({
      status: status as any,
      companyId,
      from,
      to,
    }),
  );

  const grouped = groupTripsByCompany(trips);

  if (trips.length === 0) {
    return (
      <Empty className="py-16">
        <EmptyMedia>
          <Radio className="size-10 text-muted-foreground/30" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>{t("noActiveTrips")}</EmptyTitle>
          <EmptyDescription>{t("noTripsDescription")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-8">
      {grouped.map((group) => (
        <div key={group.companyName} className="space-y-4">
          <div className="flex items-center gap-3 border-b border-border pb-2">
            <CarrierAvatar
              name={group.companyName}
              logoUrl={group.logoUrl}
              size="md"
            />
            <h3 className="text-sm font-bold text-foreground">
              {group.companyName}
            </h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full border">
              {group.trips.length} {t("trip", { count: group.trips.length })}
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

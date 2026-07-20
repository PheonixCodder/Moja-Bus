"use client";

import { useMemo, useState } from "react";
import { useQueryStates } from "nuqs";
import { Radio, RefreshCw } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { Button } from "@moja/ui/components/ui/button";
import { Spinner } from "@moja/ui/components/ui/spinner";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@moja/ui/components/ui/empty";
import { useTRPC } from "@/trpc/client";
import type { TripStatus } from "@moja/schemas";
import {
  useSuspenseQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useStaffPermissions } from "@/features/operator/hooks/use-staff-permissions";
import { useDebounce } from "@/features/operator/hooks/useDebounce";
import { tripListParsers } from "@/features/operator/lib/trips/trip-search-params";
import { formatTripHeaderDate } from "@/features/operator/lib/trips/format";
import { getCalendarDateKey } from "@/lib/timezone";
import { TripCard } from "@/features/operator/components/trips/trip-card";
import { TripsToolbar } from "@/features/operator/components/trips/trips-toolbar";
import { ManifestDrawer } from "@/features/operator/components/trips/manifest-drawer";

// M2: status filter chips for the dispatch board. Counts come from the
// global `trips.statusCounts` query (not the current page).
const STATUS_CHIPS: { status: TripStatus; label: string; dot: string }[] = [
  { status: "SCHEDULED", label: "Scheduled", dot: "bg-blue-500" },
  { status: "BOARDING", label: "Boarding", dot: "bg-green-500" },
  { status: "DELAYED", label: "Delayed", dot: "bg-amber-500" },
  { status: "DEPARTED", label: "Departed", dot: "bg-violet-500" },
  { status: "ARRIVED", label: "Arrived", dot: "bg-teal-500" },
  { status: "CANCELLED", label: "Cancelled", dot: "bg-red-500" },
];

export function OperatorTripsView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { can } = useStaffPermissions();
  const canUpdate = can("trips:update");
  const canCancel = can("trips:cancel");
  const canCheckIn = can("bookings:update");
  const canReadFleet = can("fleet:read");

  const [params, setParams] = useQueryStates(tripListParsers);
  const { q, status, scheduleId, manifest, page, startDate, endDate } = params;
  const debouncedQ = useDebounce(q, 300);
  const [refreshing, setRefreshing] = useState(false);

  const listInput = {
    status: status === "ALL" ? undefined : status,
    scheduleId: scheduleId || undefined,
    q: debouncedQ || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    pageSize: 50,
  };

  const { data: listData } = useSuspenseQuery(
    trpc.trips.list.queryOptions(listInput),
  );

  const { data: statusCountsData } = useQuery({
    ...trpc.trips.statusCounts.queryOptions(),
  });
  const statusCounts = statusCountsData?.counts ?? {};

  const { data: busesData } = useQuery({
    ...trpc.fleet.getBuses.queryOptions({ slim: true }),
    enabled: canReadFleet && canUpdate,
  });
  const buses = busesData?.buses ?? [];

  const scheduleLabel = (() => {
    if (!scheduleId) return null;
    const sample = listData.items.find((t) => t.scheduleId === scheduleId);
    if (!sample?.schedule?.route) return "Filtered schedule";
    const origin =
      sample.schedule.route.originTerminal?.cityRelation?.name ??
      sample.schedule.route.originTerminal?.city ??
      "Origin";
    const dest =
      sample.schedule.route.destTerminal?.cityRelation?.name ??
      sample.schedule.route.destTerminal?.city ??
      "Dest";
    return `${origin} → ${dest}`;
  })();

  const trips = listData.items;
  const grouped = useMemo(() => {
    const map = new Map<string, typeof trips>();
    for (const trip of trips) {
      const key = getCalendarDateKey(new Date(trip.departureDate));
      const bucket = map.get(key);
      if (bucket) bucket.push(trip);
      else map.set(key, [trip]);
    }
    return Array.from(map.entries());
  }, [trips]);

  function handleRefresh() {
    setRefreshing(true);
    void Promise.all([
      queryClient.invalidateQueries(trpc.trips.list.pathFilter()),
      queryClient.invalidateQueries(trpc.trips.statusCounts.queryFilter()),
    ]).finally(() => setRefreshing(false));
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-slate-50/50 shrink-0 flex-wrap">
        <button
          type="button"
          onClick={() => void setParams({ status: "ALL", page: 1 })}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
            status === "ALL"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:bg-slate-100",
          )}
        >
          All
          <span className="font-mono font-bold">{listData.total}</span>
        </button>
        {STATUS_CHIPS.map((chip) => {
          const count = statusCounts[chip.status] ?? 0;
          const active = status === chip.status;
          if (count === 0 && !active) return null;
          return (
            <button
              key={chip.status}
              type="button"
              onClick={() =>
                void setParams({ status: active ? "ALL" : chip.status, page: 1 })
              }
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-slate-100",
              )}
            >
              <span className={cn("size-2 rounded-full", chip.dot)} />
              {chip.label}
              <span className="font-mono font-bold">{count}</span>
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            {listData.total} total · page {listData.page}/{listData.pageCount}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => handleRefresh()}
            disabled={refreshing}
          >
            <RefreshCw
              className={cn("size-3", refreshing && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      <div className="px-5 py-3 border-b border-border shrink-0">
        <TripsToolbar
          status={status}
          onStatusChange={(value) =>
            void setParams({ status: value, page: 1 })
          }
          query={q}
          onQueryChange={(value) => void setParams({ q: value, page: 1 })}
          scheduleLabel={scheduleLabel}
          onClearSchedule={() =>
            void setParams({ scheduleId: "", page: 1 })
          }
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={(value) =>
            void setParams({ startDate: value, page: 1 })
          }
          onEndDateChange={(value) =>
            void setParams({ endDate: value, page: 1 })
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {trips.length === 0 ? (
          <Empty className="py-16">
            <EmptyMedia>
              <Radio className="size-10 text-muted-foreground/30" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>
                {listData.total === 0 ? "No trips yet" : "No trips match"}
              </EmptyTitle>
              <EmptyDescription>
                {listData.total === 0
                  ? "Create a schedule to auto-generate trips. They will appear here."
                  : "Try a different status filter or search term."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-6">
            {grouped.map(([date, dayTrips]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {formatTripHeaderDate(date)}
                  </h3>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[11px] text-muted-foreground">
                    {dayTrips.length} trip{dayTrips.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-3">
                  {dayTrips.map((trip) => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      buses={buses}
                      canUpdate={canUpdate && canReadFleet}
                      onViewManifest={(id) =>
                        void setParams({ manifest: id })
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {listData.pageCount > 1 ? (
          <div className="flex items-center justify-center gap-2 pt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => void setParams({ page: Math.max(1, page - 1) })}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page} of {listData.pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= listData.pageCount}
              onClick={() =>
                void setParams({
                  page: Math.min(listData.pageCount, page + 1),
                })
              }
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>

      <ManifestDrawer
        tripId={manifest || null}
        open={!!manifest}
        onClose={() => void setParams({ manifest: "" })}
        buses={buses}
        canUpdate={canUpdate}
        canCancel={canCancel}
        canCheckIn={canCheckIn}
      />
    </div>
  );
}

export function OperatorTripsViewFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner className="size-6 text-primary" />
    </div>
  );
}

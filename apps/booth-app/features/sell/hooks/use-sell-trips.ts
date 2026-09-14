import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTRPC } from "@/lib/trpc";
import { useHoldPoolStore } from "@/stores/hold-pool";
import {
  selectOperatorProfile,
  selectTerminalId,
  selectTerminalName,
  useSessionStore,
} from "@/stores/session";
import { formatTerminalDisplay } from "@/lib/format-location-label";
import type { DestinationFilter, TodayTrip } from "../types";

const todayDateISO = new Date().toISOString().split("T")[0] ?? "";

export function useSellTrips() {
  const trpc = useTRPC();
  const terminalId = useSessionStore(selectTerminalId);
  const terminalName = useSessionStore(selectTerminalName);
  const profile = useSessionStore(selectOperatorProfile);

  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] =
    useState<DestinationFilter>("ALL");

  // Fetch today's trips
  const tripsQuery = useQuery({
    ...trpc.booth.getTodayTrips.queryOptions({
      terminalId: terminalId ?? "",
      date: todayDateISO,
    }),
    enabled: !!terminalId,
  });

  // Fetch shift reconciliation totals for live cash drawer KPI
  const reconQuery = useQuery({
    ...trpc.booth.getDailyReconciliation.queryOptions({
      terminalId: terminalId ?? "",
      date: todayDateISO,
      staffId: profile?.operatorId ?? undefined,
    }),
    enabled: !!terminalId,
    refetchInterval: 30_000, // Refresh every 30s
  });

  const rawTrips = (tripsQuery.data as TodayTrip[] | undefined) ?? [];

  // 1. Hide all trips prior to today's local date (< today midnight)
  // 2. Compute 30-minute booking cutoff: diffMinutes < 30 means booking has expired
  const processedTrips = useMemo(() => {
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const todayMidnightMs = todayMidnight.getTime();
    const now = Date.now();

    return rawTrips
      .filter((trip) => {
        const depMs = new Date(trip.departureDate).getTime();
        return depMs >= todayMidnightMs;
      })
      .map((trip) => {
        const depMs = new Date(trip.departureDate).getTime();
        const diffMin = Math.round((depMs - now) / (60 * 1000));
        const isClosed =
          diffMin < 30 ||
          trip.availableSeats <= 0 ||
          trip.status === "COMPLETED" ||
          trip.status === "CANCELLED";
        return {
          ...trip,
          isClosed,
        };
      });
  }, [rawTrips]);

  // Offline pool count
  const allHoldPools = useHoldPoolStore((state) => state.pools);
  const offlinePoolCount = useMemo(() => {
    return Object.values(allHoldPools).reduce((sum, pool) => {
      return sum + pool.holds.filter((h) => !h.consumed).length;
    }, 0);
  }, [allHoldPools]);

  // Unique destination labels & counts using geographic hierarchy
  const destinations = useMemo(() => {
    const counts = new Map<string, number>();
    processedTrips.forEach((trip) => {
      const dropoff = trip.tripStops.find((s) => s.isDropoff);
      const isUrban = trip.serviceType === "URBAN";
      const display = formatTerminalDisplay(dropoff?.terminal, isUrban);
      const name = display.primary;
      if (name && name !== "—") {
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    });
    return Array.from(counts.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  }, [processedTrips]);

  // Next departure candidate (strictly between 30 and 75 min, open and available)
  const { imminentTrip, imminentCount } = useMemo(() => {
    const now = Date.now();
    const imminentList = processedTrips
      .filter((t) => {
        if (t.isClosed) return false;
        const diffMs = new Date(t.departureDate).getTime() - now;
        const diffMin = Math.round(diffMs / (60 * 1000));
        return diffMin >= 30 && diffMin <= 75 && t.availableSeats > 0;
      })
      .sort(
        (a, b) =>
          new Date(a.departureDate).getTime() -
          new Date(b.departureDate).getTime(),
      );

    return {
      imminentTrip: imminentList[0] ?? null,
      imminentCount: imminentList.length,
    };
  }, [processedTrips]);

  // Filtered trips based on search text and destination chip
  // Sorted: Open/approaching trips first (ascending by time), then closed trips (at the end)
  const filteredTrips = useMemo(() => {
    const query = search.trim().toLowerCase();
    const now = Date.now();

    const matched = processedTrips.filter((trip) => {
      const dropoff = trip.tripStops.find((s) => s.isDropoff);
      const isUrban = trip.serviceType === "URBAN";
      const display = formatTerminalDisplay(dropoff?.terminal, isUrban);
      const destLabel = display.primary;
      const termSecondary = display.secondary ?? "";
      const cityName = dropoff?.terminal?.cityRelation?.name ?? "";
      const muniName = dropoff?.terminal?.municipality?.name ?? "";
      const quarterName = dropoff?.terminal?.quarter?.name ?? "";
      const terminalNameStr = dropoff?.terminal?.name ?? "";
      const busText =
        trip.bus?.registrationPlate ?? trip.bus?.internalName ?? "";
      const gateText = trip.gate ?? "";

      // Match destination filter chip
      if (selectedFilter === "IMMINENT") {
        if (trip.isClosed) return false;
        const diffMs = new Date(trip.departureDate).getTime() - now;
        const diffMin = Math.round(diffMs / (60 * 1000));
        if (diffMin < 30 || diffMin > 75 || trip.availableSeats <= 0) return false;
      } else if (selectedFilter !== "ALL") {
        if (destLabel.toLowerCase() !== selectedFilter.toLowerCase()) {
          return false;
        }
      }

      // Match text search across all geographic levels and bus/gate
      if (!query) return true;

      return (
        destLabel.toLowerCase().includes(query) ||
        termSecondary.toLowerCase().includes(query) ||
        cityName.toLowerCase().includes(query) ||
        muniName.toLowerCase().includes(query) ||
        quarterName.toLowerCase().includes(query) ||
        terminalNameStr.toLowerCase().includes(query) ||
        busText.toLowerCase().includes(query) ||
        gateText.toLowerCase().includes(query)
      );
    });

    // Partition: approaching open trips at the top (ascending by departure time),
    // closed/expired trips at the end of the list (ascending by departure time)
    const openTrips: TodayTrip[] = [];
    const closedTrips: TodayTrip[] = [];

    matched.forEach((trip) => {
      if (trip.isClosed) {
        closedTrips.push(trip);
      } else {
        openTrips.push(trip);
      }
    });

    openTrips.sort(
      (a, b) =>
        new Date(a.departureDate).getTime() -
        new Date(b.departureDate).getTime(),
    );
    closedTrips.sort(
      (a, b) =>
        new Date(a.departureDate).getTime() -
        new Date(b.departureDate).getTime(),
    );

    return [...openTrips, ...closedTrips];
  }, [processedTrips, search, selectedFilter]);

  return {
    trips: filteredTrips,
    totalCount: processedTrips.length,
    destinations,
    imminentTrip,
    imminentCount,
    search,
    setSearch,
    selectedFilter,
    setSelectedFilter,
    terminalId,
    terminalName,
    profile,
    cashDrawerTotal: reconQuery.data?.cashTotalXOF ?? 0,
    ticketsSoldCount: reconQuery.data?.totalSales ?? 0,
    offlinePoolCount,
    isPending: tripsQuery.isPending,
    isFetching: tripsQuery.isFetching || reconQuery.isFetching,
    refetch: () => {
      tripsQuery.refetch();
      reconQuery.refetch();
    },
  };
}

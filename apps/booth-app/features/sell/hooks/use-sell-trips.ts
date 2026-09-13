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
    rawTrips.forEach((trip) => {
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
  }, [rawTrips]);

  // Next departure candidate (< 75 min)
  const { imminentTrip, imminentCount } = useMemo(() => {
    const now = Date.now();
    const imminentList = rawTrips.filter((t) => {
      const diffMs = new Date(t.departureDate).getTime() - now;
      const diffMin = Math.round(diffMs / (60 * 1000));
      return diffMin >= -10 && diffMin <= 75 && t.availableSeats > 0;
    });

    return {
      imminentTrip: imminentList[0] ?? null,
      imminentCount: imminentList.length,
    };
  }, [rawTrips]);

  // Filtered trips based on search text and destination chip
  const filteredTrips = useMemo(() => {
    const query = search.trim().toLowerCase();
    const now = Date.now();

    return rawTrips.filter((trip) => {
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
        const diffMs = new Date(trip.departureDate).getTime() - now;
        const diffMin = Math.round(diffMs / (60 * 1000));
        if (diffMin < -10 || diffMin > 75) return false;
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
  }, [rawTrips, search, selectedFilter]);

  return {
    trips: filteredTrips,
    totalCount: rawTrips.length,
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

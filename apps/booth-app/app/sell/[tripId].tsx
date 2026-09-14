import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type Seat, SeatMap } from "@/components/seat-map";
import { SubpageHeader } from "@/components/subpage-header";
import { Button } from "@/components/ui/button";
import { IconColors } from "@/constants/ui-colors";
import type { TodayTrip } from "@/features/sell/types";
import { useHoldPool } from "@/hooks/use-hold-pool";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { formatTerminalDisplay } from "@/lib/format-location-label";
import { useTRPC } from "@/lib/trpc";
import { useHoldPoolStore } from "@/stores/hold-pool";
import { useSellSession } from "@/stores/sell-session";
import { useSessionStore } from "@/stores/session";

export default function TripSeatScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const {
    tripId,
    destinationTerminalId,
    offerId: paramOfferId,
    originLabel: paramOriginLabel,
    destLabel: paramDestLabel,
  } = useLocalSearchParams<{
    tripId: string;
    destinationTerminalId?: string;
    offerId?: string;
    originLabel?: string;
    destLabel?: string;
  }>();
  const trpc = useTRPC();
  const terminal = useSessionStore((s) => s.terminal);

  const originLabel = useSellSession((s) => s.originLabel);
  const destinationLabel = useSellSession((s) => s.destinationLabel);
  const setTrip = useSellSession((s) => s.setTrip);
  const setSeat = useSellSession((s) => s.setSeat);
  const setTerminals = useSellSession((s) => s.setTerminals);
  const setFare = useSellSession((s) => s.setFare);
  const sessionFareAmountXOF = useSellSession((s) => s.fareAmountXOF);

  const { isOnline } = useNetworkStatus();
  const { takeHoldForSale } = useHoldPool();

  const currentTripId = (tripId as string) || "";
  const pool = useHoldPoolStore((s) =>
    currentTripId ? s.pools[currentTripId] : undefined,
  );
  const poolHolds = useMemo(() => {
    if (!pool) return [];
    const now = new Date();
    return pool.holds.filter((h) => !h.consumed && new Date(h.expiresAt) > now);
  }, [pool]);

  const availableOfflineSeatIds = useMemo(
    () => new Set(poolHolds.map((h) => h.seatId)),
    [poolHolds],
  );

  // Retrieve cached trip from todayTrips query stably
  const cachedTrip = useMemo(() => {
    if (!currentTripId) return undefined;
    const cache = queryClient.getQueryData<{
      trips: TodayTrip[];
      totalTrips: number;
      imminentTrips: number;
    }>(trpc.booth.getTodayTrips.queryKey({ terminalId: terminal?.id ?? "" }));
    return cache?.trips?.find((t) => t.id === currentTripId);
  }, [queryClient, trpc, terminal?.id, currentTripId]);

  // Compute composite offerId (tripId_originStopId_destStopId) matching traveler-app
  const effectiveOfferId = useMemo(() => {
    if (paramOfferId && paramOfferId.includes("_")) return paramOfferId;
    if (cachedTrip && cachedTrip.tripStops.length >= 2) {
      const pickup =
        cachedTrip.tripStops.find((s) => s.isPickup) || cachedTrip.tripStops[0];
      const dropoff =
        cachedTrip.tripStops.find((s) => s.isDropoff) ||
        cachedTrip.tripStops[cachedTrip.tripStops.length - 1];
      if (pickup && dropoff) {
        return `${cachedTrip.id}_${pickup.id}_${dropoff.id}`;
      }
    }
    return "";
  }, [paramOfferId, cachedTrip]);

  const hasOfferId = Boolean(effectiveOfferId);

  // Primary: Query booking.getSeatAvailability via offerId (identical to traveler-app)
  const {
    data: availabilityData,
    isPending: isAvailabilityPending,
    refetch: refetchAvailability,
  } = useQuery(
    trpc.booking.getSeatAvailability.queryOptions(
      { offerId: effectiveOfferId },
      {
        enabled: Boolean(hasOfferId && isOnline),
        retry: 1,
      },
    ),
  );

  // Secondary: Query booth.getTripSeatMap via tripId (only if no offerId)
  const {
    data: boothSeatMap,
    isPending: isBoothPending,
    refetch: refetchBooth,
  } = useQuery(
    trpc.booth.getTripSeatMap.queryOptions(
      { tripId: currentTripId },
      {
        enabled: Boolean(!hasOfferId && currentTripId && isOnline),
        retry: 1,
      },
    ),
  );

  // Stably memoized synthetic seats from cached trip info
  const fallbackSynthSeats = useMemo(() => {
    if (!cachedTrip) return null;
    const totalSeats = cachedTrip.totalSeats || 40;
    const bookedCount = cachedTrip.bookedCount || 0;
    const farePrice =
      cachedTrip.schedule?.fares?.[0]?.priceXOF ??
      sessionFareAmountXOF ??
      5000;
    const synthSeats: Seat[] = Array.from({ length: totalSeats }).map(
      (_, idx) => ({
        seatId: `seat-${cachedTrip.id}-${idx + 1}`,
        tripSeatId: `trip-seat-${cachedTrip.id}-${idx + 1}`,
        label: String(idx + 1),
        row: Math.floor(idx / 4) + 1,
        col: (idx % 4) + 1,
        deck: 1,
        seatType: "PASSENGER",
        status:
          idx < bookedCount ? ("SOLD" as const) : ("AVAILABLE" as const),
      }),
    );
    return {
      rows: Math.max(Math.ceil(totalSeats / 4), 4),
      columns: 4,
      deck: 1,
      priceXOF: farePrice,
      seats: synthSeats,
    };
  }, [
    cachedTrip?.id,
    cachedTrip?.totalSeats,
    cachedTrip?.bookedCount,
    cachedTrip?.schedule?.fares,
    sessionFareAmountXOF,
  ]);

  // Unified seat map resolution with graceful fallbacks
  const resolvedSeatMap = useMemo(() => {
    // 1. From booking.getSeatAvailability (production traveler-app pipeline)
    if (availabilityData) {
      return {
        rows: availabilityData.rows,
        columns: availabilityData.columns,
        deck: availabilityData.deck,
        priceXOF: availabilityData.priceXOF,
        seats: availabilityData.seats as Seat[],
      };
    }

    // 2. From booth.getTripSeatMap
    if (boothSeatMap) {
      return boothSeatMap;
    }

    // 3. Offline pool holds
    if (!isOnline && poolHolds.length > 0) {
      const synthSeats: Seat[] = poolHolds.map((hold, idx) => ({
        seatId: hold.seatId,
        tripSeatId: hold.holdId,
        label: hold.seatLabel,
        row: Math.floor(idx / 4) + 1,
        col: (idx % 4) + 1,
        deck: 1,
        seatType: "PASSENGER",
        status: "AVAILABLE" as const,
      }));
      return {
        rows: Math.max(Math.ceil(synthSeats.length / 4), 4),
        columns: 4,
        deck: 1,
        priceXOF:
          sessionFareAmountXOF ??
          cachedTrip?.schedule?.fares?.[0]?.priceXOF ??
          5000,
        seats: synthSeats,
      };
    }

    // 4. Resilient Fallback: If network queries are done loading or errored,
    // construct an interactive seat grid from cached trip data so the cashier is NEVER blocked!
    if (fallbackSynthSeats) {
      return fallbackSynthSeats;
    }

    return null;
  }, [
    availabilityData,
    boothSeatMap,
    isOnline,
    poolHolds,
    fallbackSynthSeats,
    cachedTrip,
    sessionFareAmountXOF,
  ]);

  const isPending =
    (isAvailabilityPending && Boolean(effectiveOfferId)) ||
    (isBoothPending && !hasOfferId);

  const isIntercity = resolvedSeatMap
    ? resolvedSeatMap.seats.length > 10
    : true;

  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);

  const selectedTripSeat = useMemo(() => {
    return (
      resolvedSeatMap?.seats.find((s) => s.seatId === selectedSeatId) ?? null
    );
  }, [resolvedSeatMap, selectedSeatId]);

  const handleSeatSelect = useCallback(
    (seat: Seat) => {
      if (!isOnline && !availableOfflineSeatIds.has(seat.seatId)) {
        Alert.alert(
          "Siège non disponible hors-ligne",
          "En mode hors ligne, vous ne pouvez sélectionner que les sièges réservés dans votre lot.",
        );
        return;
      }

      setSelectedSeatId((prev) => (prev === seat.seatId ? null : seat.seatId));
    },
    [isOnline, availableOfflineSeatIds],
  );

  function handlePickFromPool() {
    if (isOnline || !currentTripId) return;
    const hold = takeHoldForSale(currentTripId);
    if (!hold) {
      Alert.alert(t("sell.offlineExpired"));
      return;
    }
    setSelectedSeatId(hold.seatId);
  }

  function handleContinue() {
    if (!resolvedSeatMap || !tripId || !terminal) return;

    const resolvedDestId =
      destinationTerminalId ||
      useSellSession.getState().destinationTerminalId ||
      "";

    setTrip(tripId, isIntercity);
    setSeat(
      selectedSeatId,
      selectedTripSeat ? selectedTripSeat.tripSeatId : null,
    );
    setFare(resolvedSeatMap.priceXOF);
    setTerminals(terminal.id, resolvedDestId);

    router.push({
      pathname: "/sell/passenger",
      params: {
        tripId,
        seatId: selectedSeatId ?? "",
        tripSeatId: selectedTripSeat?.tripSeatId ?? "",
        destinationTerminalId: resolvedDestId,
        isIntercity: String(isIntercity),
      },
    });
  }

  const effectiveOrigin =
    paramOriginLabel ||
    originLabel ||
    (cachedTrip
      ? formatTerminalDisplay(
          cachedTrip.tripStops.find((s) => s.isPickup)?.terminal,
          cachedTrip.serviceType === "URBAN",
        ).primary
      : null) ||
    terminal?.name ||
    "Départ";

  const effectiveDest =
    paramDestLabel ||
    destinationLabel ||
    (cachedTrip
      ? formatTerminalDisplay(
          cachedTrip.tripStops.find((s) => s.isDropoff)?.terminal,
          cachedTrip.serviceType === "URBAN",
        ).primary
      : null) ||
    "Arrivée";

  const routeSubtitle = `${effectiveOrigin} → ${effectiveDest}`;

  const handleRefetch = () => {
    if (effectiveOfferId) {
      void refetchAvailability();
    } else {
      void refetchBooth();
    }
  };

  if (isPending && !resolvedSeatMap) {
    return (
      <View className="flex-1 bg-background">
        <SubpageHeader
          title={t("sell.selectSeat")}
          subtitle={routeSubtitle}
        />
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color={IconColors.brand} />
          <Text className="text-muted-foreground text-xs font-medium">
            Chargement du plan des sièges...
          </Text>
        </View>
      </View>
    );
  }

  if (!resolvedSeatMap) {
    return (
      <View className="flex-1 bg-background">
        <SubpageHeader
          title={t("sell.selectSeat")}
          subtitle={routeSubtitle}
        />
        <View className="flex-1 items-center justify-center bg-background px-6 gap-3">
          <Text className="font-heading text-xl font-bold text-foreground text-center">
            Données du trajet indisponibles
          </Text>
          <Text className="text-muted-foreground text-center text-sm mb-4 max-w-xs leading-5">
            Vérifiez votre connexion internet ou réessayez de charger le plan des sièges.
          </Text>
          <View className="flex-row gap-3">
            <Button
              variant="outline"
              title="Réessayer"
              onPress={handleRefetch}
            />
            <Button
              variant="primary"
              title="Retour aux départs"
              onPress={() => router.back()}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Reusable Subpage Header */}
      <SubpageHeader
        title={t("sell.selectSeat")}
        subtitle={routeSubtitle}
        rightAction={
          <View className="bg-muted/60 border border-border/70 px-3 py-1 rounded-full">
            <Text className="text-xs font-extrabold text-foreground">
              {resolvedSeatMap.priceXOF.toLocaleString("fr-CI")} XOF
            </Text>
          </View>
        }
      />

      <View className="flex-1 px-4 pt-3">
        {/* Quick status bar */}
        <View className="flex-row items-center justify-between bg-card border border-border rounded-2xl px-4 py-3 mb-3 shadow-xs">
          <View>
            <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {t("sell.seatSelection", "Sélection de place")}
            </Text>
            <Text className="text-sm font-extrabold text-foreground mt-0.5">
              {isIntercity ? "Siège numéroté obligatoire" : "Placement libre ou numéroté"}
            </Text>
          </View>
          <View className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
            <Text className="text-primary text-xs font-black">
              {selectedTripSeat ? `Siège ${selectedTripSeat.label}` : "1 Passager"}
            </Text>
          </View>
        </View>

        {/* Modern Seat Map Card Container */}
        <View className="flex-1 bg-card rounded-3xl p-4 shadow-xs border border-border">
          <SeatMap
            rows={resolvedSeatMap.rows}
            columns={resolvedSeatMap.columns}
            deck={resolvedSeatMap.deck}
            seats={resolvedSeatMap.seats}
            selectedSeatId={selectedSeatId}
            onSeatSelect={handleSeatSelect}
            offlineAvailableSeatIds={isOnline ? undefined : availableOfflineSeatIds}
          />
        </View>
      </View>

      {/* Bottom Sticky Action Bar with Safe Area */}
      <View
        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
        className="px-6 pt-4 border-t border-border bg-card/80 backdrop-blur-md"
      >
        {!isOnline && pool ? (
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-amber-800 text-xs font-semibold">
              {poolHolds.length} {t("sell.nextAvailableOffline")}
            </Text>
            {poolHolds.length < 2 ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={handlePickFromPool}
                className="bg-amber-100 border border-amber-300 rounded-lg px-2.5 py-1"
              >
                <Text className="text-amber-900 font-bold text-xs">
                  {t("sell.pickFromPool")}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        <Button
          variant="primary"
          size="lg"
          disabled={isIntercity && !selectedSeatId}
          onPress={handleContinue}
          trailingIslandIcon={
            selectedTripSeat ? (
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={16}
                color="#ffffff"
              />
            ) : null
          }
          title={
            selectedTripSeat
              ? `Continuer avec Siège ${selectedTripSeat.label}`
              : t("sell.selectSeat")
          }
        />
      </View>
    </View>
  );
}

import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconColors } from "@/constants/ui-colors";
import { useHoldPool } from "@/hooks/use-hold-pool";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { BoothFeedback } from "@/lib/haptics";
import { useTRPC } from "@/lib/trpc";
import { useHoldPoolStore } from "@/stores/hold-pool";
import { useSellSession } from "@/stores/sell-session";
import { useSessionStore } from "@/stores/session";

export default function TripSeatScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { tripId, destinationTerminalId } = useLocalSearchParams<{
    tripId: string;
    destinationTerminalId?: string;
  }>();
  const trpc = useTRPC();
  const terminal = useSessionStore((s) => s.terminal);

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
    return pool.holds.filter(
      (h) => !h.consumed && new Date(h.expiresAt) > now,
    );
  }, [pool]);

  const availableOfflineSeatIds = useMemo(
    () => new Set(poolHolds.map((h) => h.seatId)),
    [poolHolds],
  );

  const { data: seatMap, isPending } = useQuery(
    trpc.booth.getTripSeatMap.queryOptions(
      { tripId: tripId as string },
      { enabled: Boolean(tripId && isOnline) },
    ),
  );

  // Fallback offline synthetic seat map if offline and no cached network seatMap
  const resolvedSeatMap = useMemo(() => {
    if (seatMap) return seatMap;
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
        priceXOF: sessionFareAmountXOF ?? 5000,
        seats: synthSeats,
      };
    }
    return null;
  }, [seatMap, isOnline, poolHolds, sessionFareAmountXOF]);

  const isIntercity = resolvedSeatMap
    ? resolvedSeatMap.seats.length > 10
    : true;

  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);

  const selectedTripSeat = useMemo(() => {
    return (
      resolvedSeatMap?.seats.find((s) => s.seatId === selectedSeatId) ?? null
    );
  }, [resolvedSeatMap, selectedSeatId]);

  function handleSeatSelect(seat: Seat) {
    if (!isOnline && !availableOfflineSeatIds.has(seat.seatId)) {
      Alert.alert(
        "Siège non disponible hors-ligne",
        "En mode hors ligne, vous ne pouvez sélectionner que les sièges réservés dans votre lot.",
      );
      return;
    }

    setSelectedSeatId(seat.seatId === selectedSeatId ? null : seat.seatId);
  }

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

  if (isPending && !resolvedSeatMap) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={IconColors.brand} />
      </View>
    );
  }

  if (!resolvedSeatMap) {
    return (
      <View
        style={{ paddingTop: insets.top }}
        className="flex-1 items-center justify-center bg-background px-6"
      >
        <Text className="font-heading text-xl font-bold text-foreground text-center mb-2">
          Données du trajet indisponibles
        </Text>
        <Text className="text-muted-foreground text-center mb-6">
          Vérifiez votre connexion internet pour charger le plan des sièges.
        </Text>
        <Button
          variant="outline"
          title="Retour aux départs"
          onPress={() => router.back()}
        />
      </View>
    );
  }

  return (
    <View
      style={{ paddingTop: Math.max(insets.top, 16) }}
      className="flex-1 bg-background"
    >
      {/* Top Header Bar */}
      <View className="flex-row items-center px-5 pb-4 gap-3 border-b border-border/60">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Retour"
          className="w-11 h-11 rounded-2xl bg-card border border-border items-center justify-center active:bg-muted"
          onPress={() => {
            void BoothFeedback.tap();
            router.back();
          }}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={20}
            color={IconColors.default}
          />
        </TouchableOpacity>

        <View className="flex-1">
          <Text className="font-heading text-xl font-bold text-foreground">
            {t("sell.selectSeat")}
          </Text>
          <Text className="text-muted-foreground text-xs font-medium mt-0.5">
            {terminal?.name}
          </Text>
        </View>

        <Badge
          variant="intercity"
          label={`${resolvedSeatMap.priceXOF.toLocaleString("fr-CI")} XOF`}
        />
      </View>

      {/* Seat Map */}
      <SeatMap
        rows={resolvedSeatMap.rows}
        columns={resolvedSeatMap.columns}
        deck={resolvedSeatMap.deck}
        seats={resolvedSeatMap.seats}
        selectedSeatId={selectedSeatId}
        onSeatSelect={handleSeatSelect}
        offlineAvailableSeatIds={isOnline ? undefined : availableOfflineSeatIds}
      />

      {/* Bottom Sticky Action Bar */}
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

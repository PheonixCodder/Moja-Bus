import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SeatMap } from "@/components/seat-map";
import { useHoldPool } from "@/hooks/use-hold-pool";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { BoothFeedback } from "@/lib/haptics";
import { useTRPC } from "@/lib/trpc";
import { useHoldPoolStore } from "@/stores/hold-pool";
import { useSellSession } from "@/stores/sell-session";
import { useSessionStore } from "@/stores/session";
import { IconColors } from "@/constants/ui-colors";

export default function TripSeatScreen() {
  const { t } = useTranslation();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const trpc = useTRPC();
  const terminal = useSessionStore((s) => s.terminal);

  const setTrip = useSellSession((s) => s.setTrip);
  const setSeat = useSellSession((s) => s.setSeat);
  const setTerminals = useSellSession((s) => s.setTerminals);
  const setFare = useSellSession((s) => s.setFare);
  const sellSession = useSellSession();

  const { isOnline } = useNetworkStatus();
  const { takeHoldForSale } = useHoldPool();
  const pool = useHoldPoolStore((s) =>
    sellSession.tripId ? s.pools[sellSession.tripId] : undefined,
  );
  const poolHolds = useHoldPoolStore((s) =>
    sellSession.tripId ? s.getAvailableForTrip(sellSession.tripId) : [],
  );
  const availableOfflineSeatIds = new Set(poolHolds.map((h) => h.seatId));

  const { data: seatMap, isPending } = useQuery(
    trpc.booth.getTripSeatMap.queryOptions(
      { tripId: tripId as string },
      { enabled: !!tripId && isOnline },
    ),
  );

  const isIntercity = seatMap ? seatMap.seats.length > 10 : true;

  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);

  function handleSeatSelect(seat: { seatId: string; tripSeatId: string }) {
    if (!isOnline && !availableOfflineSeatIds.has(seat.seatId)) {
      Alert.alert(
        "Siège non disponible",
        "En mode hors ligne, vous ne pouvez sélectionner que les sièges de votre réserve.",
      );
      return;
    }

    setSelectedSeatId(seat.seatId === selectedSeatId ? null : seat.seatId);
  }

  function handlePickFromPool() {
    if (isOnline || !sellSession.tripId) return;
    const hold = takeHoldForSale(sellSession.tripId);
    if (!hold) {
      Alert.alert(t("sell.offlineExpired"));
      return;
    }

    setSelectedSeatId(hold.seatId);
  }

  function handleContinue() {
    if (!seatMap || !tripId || !terminal) return;

    const selectedTripSeat = seatMap.seats.find(
      (s) => s.seatId === selectedSeatId,
    );

    setTrip(tripId, isIntercity);
    setSeat(
      selectedSeatId,
      selectedTripSeat ? selectedTripSeat.tripSeatId : null,
    );
    setFare(seatMap.priceXOF);
    setTerminals(terminal.id, "");

    router.push({
      pathname: "/sell/passenger",
      params: {
        tripId,
        seatId: selectedSeatId ?? "",
        tripSeatId: selectedTripSeat?.tripSeatId ?? "",
        isIntercity: String(isIntercity),
      },
    });
  }

  if (isPending || !seatMap) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={IconColors.brand} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-6 pt-14 pb-4 gap-4">
        <TouchableOpacity
          onPress={() => {
            BoothFeedback.tap();
            router.back();
          }}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color={IconColors.default} />
        </TouchableOpacity>
        <Text className="font-heading text-xl font-bold text-foreground flex-1">
          {t("sell.selectSeat")}
        </Text>
        <Text className="text-foreground/60 text-sm">
          {seatMap.priceXOF.toLocaleString("fr-CI")} XOF
        </Text>
      </View>

      <SeatMap
        rows={seatMap.rows}
        columns={seatMap.columns}
        deck={seatMap.deck}
        seats={seatMap.seats}
        selectedSeatId={selectedSeatId}
        onSeatSelect={(seat) =>
          handleSeatSelect({
            seatId: seat.seatId,
            tripSeatId: seat.tripSeatId,
          })
        }
        offlineAvailableSeatIds={isOnline ? undefined : availableOfflineSeatIds}
      />

      <View className="px-6 pb-8 pt-4 border-t border-border">
        {!isOnline && pool && (
          <Text className="text-amber-700 text-sm font-medium mb-3 text-center">
            {poolHolds.length} {t("sell.nextAvailableOffline")}
          </Text>
        )}

        {!isOnline && poolHolds.length < 2 && pool ? (
          <TouchableOpacity
            className="bg-amber-100 border border-amber-300 rounded-xl py-3 items-center mb-2"
            onPress={handlePickFromPool}
          >
            <Text className="text-amber-800 font-semibold text-sm">
              {t("sell.pickFromPool")}
            </Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          className={`rounded-xl py-4 items-center ${
            isIntercity && !selectedSeatId ? "bg-foreground/20" : "bg-primary"
          }`}
          onPress={handleContinue}
          disabled={isIntercity && !selectedSeatId}
        >
          <Text className="text-white font-semibold text-base">
            {t("sell.selectSeat")} →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

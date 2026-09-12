import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { OfflineBanner } from "@/components/offline-banner";
import { BoothFeedback } from "@/lib/haptics";
import { useTRPC } from "@/lib/trpc";
import { useSessionStore } from "@/stores/session";
import { IconColors, PlaceholderColor } from "@/constants/ui-colors";

const todayDateISO = new Date().toISOString().split("T")[0] ?? "";

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SellTab() {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const [search, setSearch] = useState("");
  const terminal = useSessionStore((s) => s.terminal);
  const terminalId: string = terminal ? terminal.id : "";

  const {
    data: trips,
    isPending,
    isFetching,
    refetch,
  } = useQuery({
    ...trpc.booth.getTodayTrips.queryOptions({
      terminalId,
      date: todayDateISO,
    }),
    enabled: !!terminalId,
  });

  const filtered = useMemo(() => {
    if (!trips) return [];
    if (!search.trim()) return trips;
    const lower = search.toLowerCase();
    return trips.filter((trip) => {
      const destStop = trip.tripStops.find((s) => s.isDropoff);
      const dest =
        destStop?.terminal?.cityRelation?.name ??
        destStop?.terminal?.name ??
        "";
      return dest.toLowerCase().includes(lower);
    });
  }, [trips, search]);

  return (
    <View className="flex-1 bg-background">
      <OfflineBanner />

      <View className="px-6 pt-14 pb-4">
        <Text className="font-heading text-2xl font-bold text-foreground">
          {t("sell.title")}
        </Text>
        <Text className="text-foreground/60 text-sm mt-0.5">
          {terminal?.name}
        </Text>
      </View>

      <View className="px-6 mb-4">
        <TextInput
          className="bg-card border border-input rounded-lg px-4 py-2.5 text-foreground"
          placeholder={t("sell.searchPlaceholder")}
          placeholderTextColor={PlaceholderColor}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={IconColors.brand} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-6 gap-3 pb-8"
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={() => refetch()}
            />
          }
          renderItem={({ item }) => {
            const destStop = item.tripStops.find((s) => s.isDropoff);
            const destTerminalId = destStop?.terminalId ?? "";
            const destName =
              destStop?.terminal?.cityRelation?.name ??
              destStop?.terminal?.name ??
              "?";
            const departureTime = formatTime(item.departureDate);
            const busLabel =
              item.bus?.registrationPlate ?? item.bus?.internalName ?? "";
            const isIntercity = item.serviceType === "INTERCITY";

            return (
              <TouchableOpacity
                className="bg-card border border-border rounded-xl px-5 py-4 active:opacity-70"
                onPress={() => {
                  BoothFeedback.tap();
                  router.push({
                    pathname: "/sell/[tripId]",
                    params: {
                      tripId: item.id,
                      destinationTerminalId: destTerminalId,
                    },
                  });
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="font-semibold text-foreground text-base">
                      {terminal?.name} → {destName}
                    </Text>
                    <Text className="text-foreground/60 text-sm mt-0.5">
                      {departureTime} · {busLabel}
                    </Text>
                  </View>
                  <View className="items-end gap-1">
                    <Text
                      className={`text-sm font-semibold ${
                        item.availableSeats === 0
                          ? "text-red-500"
                          : "text-green-600"
                      }`}
                    >
                      {item.availableSeats} {t("sell.availableSeats")}
                    </Text>
                    <View
                      className={`rounded-full px-2.5 py-0.5 ${
                        isIntercity ? "bg-blue-100" : "bg-orange-100"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          isIntercity ? "text-blue-700" : "text-orange-700"
                        }`}
                      >
                        {isIntercity ? "Intercity" : "Urban"}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text className="text-foreground/50 text-center">
                {t("sell.noTrips")}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

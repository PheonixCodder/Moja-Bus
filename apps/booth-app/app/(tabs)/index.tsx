import {
  ArrowRight01Icon,
  Cancel01Icon,
  Clock01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OfflineBanner } from "@/components/offline-banner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Palette } from "@/constants/theme";
import { IconColors } from "@/constants/ui-colors";
import { BoothFeedback } from "@/lib/haptics";
import { useTRPC } from "@/lib/trpc";
import {
  selectTerminalId,
  selectTerminalName,
  useSessionStore,
} from "@/stores/session";

const todayDateISO = new Date().toISOString().split("T")[0] ?? "";

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TRIP_CARD_HEIGHT = 122;

const getTripItemLayout = (_: unknown, index: number) => ({
  length: TRIP_CARD_HEIGHT,
  offset: TRIP_CARD_HEIGHT * index,
  index,
});

interface TripItemProps {
  item: {
    id: string;
    availableSeats: number;
    serviceType: string;
    departureDate: Date | string;
    tripStops: Array<{
      terminalId: string;
      isDropoff: boolean;
      terminal?: {
        name: string;
        cityRelation?: { name: string } | null;
      } | null;
    }>;
    bus?: {
      registrationPlate?: string | null;
      internalName?: string | null;
    } | null;
  };
  terminalName: string;
  onSelect: (tripId: string, destTerminalId: string) => void;
  soldOutLabel: string;
  availableSeatsLabel: string;
}

const TripCard = React.memo(function TripCard({
  item,
  terminalName,
  onSelect,
  soldOutLabel,
  availableSeatsLabel,
}: TripItemProps) {
  const destStop = item.tripStops.find((s) => s.isDropoff);
  const destTerminalId = destStop?.terminalId ?? "";
  const destName =
    destStop?.terminal?.cityRelation?.name ?? destStop?.terminal?.name ?? "?";
  const departureTime = formatTime(item.departureDate);
  const busLabel = item.bus?.registrationPlate ?? item.bus?.internalName ?? "";
  const isIntercity = item.serviceType === "INTERCITY";
  const isSoldOut = item.availableSeats === 0;

  return (
    <Card
      variant="elevated"
      className="p-4"
      onPress={() => onSelect(item.id, destTerminalId)}
    >
      {/* Top Row: Service Badge & Seats */}
      <View className="flex-row items-center justify-between mb-2">
        <Badge variant={isIntercity ? "intercity" : "urban"}>
          <Text
            className={`text-xs font-semibold ${
              isIntercity ? "text-blue-700" : "text-orange-700"
            }`}
          >
            {isIntercity ? "Intercity" : "Urban"}
          </Text>
        </Badge>
        <View
          className={`px-2.5 py-0.5 rounded-full ${
            isSoldOut ? "bg-red-50" : "bg-emerald-50"
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              isSoldOut ? "text-red-700" : "text-emerald-700"
            }`}
          >
            {isSoldOut
              ? soldOutLabel
              : `${item.availableSeats} ${availableSeatsLabel}`}
          </Text>
        </View>
      </View>

      {/* Destination Line */}
      <View className="flex-row items-center gap-2 mb-2">
        <Text
          className="font-heading font-bold text-foreground text-base shrink-0 max-w-[45%]"
          numberOfLines={1}
        >
          {terminalName || "Départ"}
        </Text>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          size={16}
          color={IconColors.muted}
        />
        <Text
          className="font-heading font-bold text-foreground text-base flex-1"
          numberOfLines={1}
        >
          {destName}
        </Text>
      </View>

      {/* Time & Vehicle */}
      <View className="flex-row items-center justify-between pt-2 border-t border-border/60">
        <View className="flex-row items-center gap-1.5">
          <HugeiconsIcon
            icon={Clock01Icon}
            size={14}
            color={IconColors.muted}
          />
          <Text className="text-sm font-semibold text-foreground/80">
            {departureTime}
          </Text>
        </View>
        {busLabel ? (
          <Text className="text-xs font-medium text-muted-foreground">
            {busLabel}
          </Text>
        ) : null}
      </View>
    </Card>
  );
});

export default function SellTab() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const trpc = useTRPC();
  const [search, setSearch] = useState("");
  const terminalId = useSessionStore(selectTerminalId);
  const terminalName = useSessionStore(selectTerminalName);

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

  const handleSelectTrip = useCallback(
    (tripId: string, destinationTerminalId: string) => {
      BoothFeedback.selection();
      router.push({
        pathname: "/sell/[tripId]",
        params: {
          tripId,
          destinationTerminalId,
        },
      });
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: (typeof filtered)[number] }) => (
      <TripCard
        item={item}
        terminalName={terminalName}
        onSelect={handleSelectTrip}
        soldOutLabel={t("sell.soldOut")}
        availableSeatsLabel={t("sell.availableSeats")}
      />
    ),
    [terminalName, handleSelectTrip, t],
  );

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: Math.max(insets.top, 16) }}
    >
      <OfflineBanner />

      {/* Header */}
      <View className="px-6 pt-3 pb-3">
        <View className="flex-row items-baseline justify-between">
          <Text className="font-heading text-2xl font-bold text-foreground tracking-tight">
            {t("sell.title")}
          </Text>
          <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </Text>
        </View>
        <Text className="text-muted-foreground text-sm font-medium mt-0.5">
          {terminalName || t("sell.noTerminal")}
        </Text>
      </View>

      {/* Search Bar */}
      <View className="px-6 mb-3">
        <Input
          placeholder={t("sell.searchPlaceholder")}
          value={search}
          onChangeText={setSearch}
          leftIcon={
            <HugeiconsIcon
              icon={Search01Icon}
              size={18}
              color={IconColors.muted}
            />
          }
          rightIcon={
            search ? (
              <Pressable
                onPress={() => {
                  BoothFeedback.tap();
                  setSearch("");
                }}
                hitSlop={8}
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={18}
                  color={IconColors.muted}
                />
              </Pressable>
            ) : null
          }
        />
      </View>

      {/* List / Loading */}
      {isPending ? (
        <View className="px-6 gap-3 pt-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 gap-3">
              <View className="flex-row justify-between items-center">
                <Skeleton className="h-5 w-40 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </View>
              <View className="flex-row justify-between items-center">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-4 w-20 rounded-md" />
              </View>
            </Card>
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-6 gap-3 pb-8"
          getItemLayout={getTripItemLayout}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === "android"}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={() => refetch()}
              colors={[Palette.rose[500]]}
              tintColor={Palette.rose[500]}
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-4">
              <View className="w-14 h-14 rounded-full bg-muted/30 items-center justify-center mb-3">
                <HugeiconsIcon
                  icon={Search01Icon}
                  size={24}
                  color={IconColors.muted}
                />
              </View>
              <Text className="text-foreground font-semibold text-base text-center">
                {search ? t("sell.noMatchingTrips") : t("sell.noTrips")}
              </Text>
              <Text className="text-muted-foreground text-xs text-center mt-1 max-w-[240px]">
                {search
                  ? t("sell.tryDifferentSearch")
                  : t("sell.checkAgainLater")}
              </Text>
              {search ? (
                <Pressable
                  className="mt-4 px-4 py-2 rounded-xl bg-secondary"
                  onPress={() => setSearch("")}
                >
                  <Text className="text-xs font-semibold text-secondary-foreground">
                    {t("sell.resetSearch")}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          }
        />
      )}
    </View>
  );
}

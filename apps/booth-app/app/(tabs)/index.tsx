import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { router } from "expo-router";
import { useCallback } from "react";
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
import { Palette } from "@/constants/theme";
import { IconColors } from "@/constants/ui-colors";
import { DestinationFilterBar } from "@/features/sell/components/destination-filter-bar";
import { NextDepartureCard } from "@/features/sell/components/next-departure-card";
import { SellHeader } from "@/features/sell/components/sell-header";
import {
  TRIP_CARD_HEIGHT,
  TripCard,
} from "@/features/sell/components/trip-card";
import { TripCardSkeleton } from "@/features/sell/components/trip-card-skeleton";
import { useSellTrips } from "@/features/sell/hooks/use-sell-trips";
import type { TodayTrip } from "@/features/sell/types";
import { BoothFeedback } from "@/lib/haptics";
import { useSellSession } from "@/stores/sell-session";

const CARD_GAP = 14;
const ITEM_TOTAL_HEIGHT = TRIP_CARD_HEIGHT + CARD_GAP;

const getTripItemLayout = (_: unknown, index: number) => ({
  length: ITEM_TOTAL_HEIGHT,
  offset: ITEM_TOTAL_HEIGHT * index,
  index,
});

export default function SellTab() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const {
    trips,
    totalCount,
    destinations,
    imminentTrip,
    imminentCount,
    search,
    setSearch,
    selectedFilter,
    setSelectedFilter,
    terminalName,
    profile,
    offlinePoolCount,
    isPending,
    isFetching,
    refetch,
  } = useSellTrips();

  const handleSelectTrip = useCallback(
    (
      tripId: string,
      destinationTerminalId: string,
      originLabel?: string,
      destLabel?: string,
      offerId?: string,
    ) => {
      BoothFeedback.selection();
      if (originLabel && destLabel) {
        useSellSession.getState().setRouteLabels(originLabel, destLabel);
      }
      router.push({
        pathname: "/sell/[tripId]",
        params: {
          tripId,
          destinationTerminalId,
          offerId: offerId ?? "",
          originLabel: originLabel ?? "",
          destLabel: destLabel ?? "",
        },
      });
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: TodayTrip }) => (
      <TripCard
        item={item}
        terminalName={terminalName}
        onSelect={handleSelectTrip}
      />
    ),
    [terminalName, handleSelectTrip],
  );

  const keyExtractor = useCallback((item: TodayTrip) => item.id, []);

  // Ensure minimum 44px top inset on modern notched devices
  const topPadding = insets.top > 0 ? insets.top + 16 : 28;

  return (
    <View className="flex-1 bg-background">
      <OfflineBanner />

      <FlatList
        data={isPending ? [] : trips}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getTripItemLayout}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === "android"}
        contentContainerStyle={{
          paddingTop: topPadding,
          paddingBottom: 120,
          paddingHorizontal: 20,
          gap: CARD_GAP,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="gap-2">
            {/* Cashier Greeting, Terminal & Notification Bell */}
            <SellHeader
              cashierName={profile?.staffName?.split(" ")[0]}
              terminalName={terminalName}
              companyName={profile?.companyName}
              offlinePoolCount={offlinePoolCount}
            />

            {/* Hero Spotlight: Next Upcoming Departure (< 75m) */}
            <NextDepartureCard
              trip={imminentTrip}
              terminalName={terminalName}
              onSelect={handleSelectTrip}
            />

            {/* Search and Destination Filter Chips */}
            <DestinationFilterBar
              search={search}
              onSearchChange={setSearch}
              selectedFilter={selectedFilter}
              onSelectFilter={setSelectedFilter}
              destinations={destinations}
              totalCount={totalCount}
              imminentCount={imminentCount}
            />
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            colors={[Palette.rose[500]]}
            tintColor={Palette.rose[500]}
          />
        }
        ListEmptyComponent={
          isPending ? (
            <TripCardSkeleton />
          ) : (
            <View className="items-center justify-center py-16 px-6">
              <View className="size-16 rounded-full bg-muted/40 items-center justify-center mb-4">
                <HugeiconsIcon
                  icon={Search01Icon}
                  size={26}
                  color={IconColors.muted}
                />
              </View>
              <Text className="text-foreground font-black text-base text-center">
                {search || selectedFilter !== "ALL"
                  ? t("sell.noMatchingTrips")
                  : t("sell.noTrips")}
              </Text>
              <Text className="text-muted-foreground text-xs text-center mt-2 max-w-[260px] leading-relaxed">
                {search || selectedFilter !== "ALL"
                  ? t("sell.tryDifferentSearch")
                  : t("sell.checkAgainLater")}
              </Text>
              {search || selectedFilter !== "ALL" ? (
                <Pressable
                  className="mt-5 px-6 py-2.5 rounded-xl bg-primary active:opacity-90 shadow-2xs"
                  onPress={() => {
                    BoothFeedback.tap();
                    setSearch("");
                    setSelectedFilter("ALL");
                  }}
                >
                  <Text className="text-xs font-black text-white uppercase tracking-wider">
                    {t("sell.resetSearch")}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          )
        }
      />
    </View>
  );
}

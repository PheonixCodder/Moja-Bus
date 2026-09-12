/**
 * Bookings tab — today's ticket sales list.
 * Shows all BoothSale records for the selected terminal on the current date,
 * filterable by payment method (CASH / Paystack / ALL).
 */

import {
  BanknoteIcon,
  Invoice01Icon,
  SmartPhone01Icon,
  WifiOff01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import React, { useCallback, useState } from "react";
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

type Filter = "ALL" | "CASH" | "PAYSTACK_LINK";

const BOOKING_CARD_HEIGHT = 76;

const getBookingItemLayout = (_: unknown, index: number) => ({
  length: BOOKING_CARD_HEIGHT,
  offset: BOOKING_CARD_HEIGHT * index,
  index,
});

interface BookingItemProps {
  item: {
    id: string;
    paymentMethod: string;
    cashAmountXOF?: number | null;
    confirmedAt?: Date | string | null;
    wasOffline?: boolean;
    booking?: {
      passengerName?: string | null;
      bookingReference?: string | null;
      farePaid?: number | null;
    } | null;
  };
  formattedTime: string;
  offlineLabel: string;
}

const BookingCard = React.memo(function BookingCard({
  item,
  formattedTime,
  offlineLabel,
}: BookingItemProps) {
  const isCash = item.paymentMethod === "CASH";
  const amount = isCash
    ? (item.cashAmountXOF ?? 0)
    : (item.booking?.farePaid ?? 0);

  return (
    <Card variant="elevated" className="p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="font-heading font-bold text-foreground text-sm">
            {item.booking?.passengerName ?? "Passager Guichet"}
          </Text>
          <View className="flex-row items-center gap-1.5 mt-1">
            <Text className="text-muted-foreground text-xs font-medium font-mono">
              {item.booking?.bookingReference ?? "—"}
            </Text>
            {formattedTime ? (
              <Text className="text-muted-foreground text-xs">
                · {formattedTime}
              </Text>
            ) : null}
          </View>
        </View>

        <View className="items-end gap-1.5 shrink-0">
          <Badge variant={isCash ? "cash" : "default"}>
            {isCash ? (
              <HugeiconsIcon
                icon={BanknoteIcon}
                size={12}
                color={IconColors.success}
              />
            ) : (
              <HugeiconsIcon
                icon={SmartPhone01Icon}
                size={12}
                color={IconColors.onPrimary}
              />
            )}
            <Text
              className={`text-xs font-bold ${
                isCash ? "text-green-800" : "text-white"
              }`}
            >
              {amount.toLocaleString("fr-CI")} XOF
            </Text>
          </Badge>

          {item.wasOffline && (
            <Badge variant="offline">
              <HugeiconsIcon
                icon={WifiOff01Icon}
                size={10}
                color={IconColors.warning}
              />
              <Text className="text-[10px] font-bold text-amber-800">
                {offlineLabel}
              </Text>
            </Badge>
          )}
        </View>
      </View>
    </Card>
  );
});

export default function BookingsTab() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const trpc = useTRPC();
  const terminalId = useSessionStore(selectTerminalId);
  const terminalName = useSessionStore(selectTerminalName);

  const [filter, setFilter] = useState<Filter>("ALL");
  const todayDate = format(new Date(), "yyyy-MM-dd");

  const { data, isPending, refetch, isRefetching } = useQuery(
    trpc.booth.getTerminalBookings.queryOptions(
      {
        terminalId,
        date: todayDate,
        paymentMethod: filter,
        page: 1,
        limit: 100,
      },
      { enabled: !!terminalId },
    ),
  );

  const filterTabs: { key: Filter; label: string }[] = [
    { key: "ALL", label: t("bookings.filterAll") },
    { key: "CASH", label: t("bookings.filterCash") },
    { key: "PAYSTACK_LINK", label: t("bookings.filterPaystack") },
  ];

  const formatTime = useCallback(
    (date: Date | string | null | undefined): string => {
      if (!date) return "";
      const d = typeof date === "string" ? new Date(date) : date;
      const locale = i18n.language === "fr" ? "fr-FR" : "en-US";
      return d.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    [i18n.language],
  );

  const cashSalesCount =
    data?.sales.filter((s) => s.paymentMethod === "CASH").length ?? 0;
  const mobileSalesCount =
    data?.sales.filter((s) => s.paymentMethod === "PAYSTACK_LINK").length ?? 0;

  const renderItem = useCallback(
    ({ item }: { item: NonNullable<typeof data>["sales"][number] }) => (
      <BookingCard
        item={item}
        formattedTime={formatTime(item.confirmedAt)}
        offlineLabel={t("bookings.offline")}
      />
    ),
    [formatTime, t],
  );

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: Math.max(insets.top, 16) }}
    >
      <OfflineBanner />

      {/* Header */}
      <View className="px-6 pt-3 pb-3">
        <Text className="font-heading text-2xl font-bold text-foreground tracking-tight">
          {t("bookings.title")}
        </Text>
        <Text className="text-muted-foreground text-sm font-medium mt-0.5">
          {todayDate} · {terminalName}
        </Text>
      </View>

      {/* Filter Tabs */}
      <View className="flex-row px-6 gap-2 mb-3">
        {filterTabs.map((tab) => {
          const isSelected = filter === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => {
                BoothFeedback.selection();
                setFilter(tab.key);
              }}
              className={`px-4 py-2 rounded-2xl border min-h-[40px] items-center justify-center ${
                isSelected
                  ? "bg-primary border-primary shadow-sm"
                  : "border-border bg-card"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  isSelected
                    ? "text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Summary Stat Cards */}
      {data && (
        <View className="flex-row px-6 gap-3 mb-3">
          <Card
            variant="elevated"
            className="flex-1 p-3.5 bg-emerald-50/50 border-emerald-200"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-emerald-700 text-xs font-semibold uppercase tracking-wider">
                {t("bookings.filterCash")}
              </Text>
              <HugeiconsIcon
                icon={BanknoteIcon}
                size={16}
                color={IconColors.success}
              />
            </View>
            <Text className="text-emerald-900 font-heading font-bold text-xl mt-1">
              {cashSalesCount}
            </Text>
            <Text className="text-emerald-600 text-xs">
              {t("bookings.sales")}
            </Text>
          </Card>

          <Card
            variant="elevated"
            className="flex-1 p-3.5 bg-blue-50/50 border-blue-200"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-blue-700 text-xs font-semibold uppercase tracking-wider">
                {t("bookings.filterPaystack")}
              </Text>
              <HugeiconsIcon
                icon={SmartPhone01Icon}
                size={16}
                color={IconColors.info}
              />
            </View>
            <Text className="text-blue-900 font-heading font-bold text-xl mt-1">
              {mobileSalesCount}
            </Text>
            <Text className="text-blue-600 text-xs">{t("bookings.sales")}</Text>
          </Card>
        </View>
      )}

      {/* List / Loading */}
      {isPending ? (
        <View className="px-6 gap-3 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4 gap-2">
              <View className="flex-row justify-between items-center">
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </View>
              <Skeleton className="h-3.5 w-24 rounded-md" />
            </Card>
          ))}
        </View>
      ) : (
        <FlatList
          data={data?.sales ?? []}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-6 gap-3 pb-8"
          getItemLayout={getBookingItemLayout}
          initialNumToRender={10}
          maxToRenderPerBatch={12}
          windowSize={5}
          removeClippedSubviews={Platform.OS === "android"}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              colors={[Palette.rose[500]]}
              tintColor={Palette.rose[500]}
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-4">
              <View className="w-14 h-14 rounded-full bg-muted/30 items-center justify-center mb-3">
                <HugeiconsIcon
                  icon={Invoice01Icon}
                  size={24}
                  color={IconColors.muted}
                />
              </View>
              <Text className="text-foreground font-semibold text-base text-center">
                {t("bookings.noBookings")}
              </Text>
              <Text className="text-muted-foreground text-xs text-center mt-1">
                {t("bookings.noBookingsHelp") ||
                  "Les billets vendus aujourd'hui s'afficheront ici"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

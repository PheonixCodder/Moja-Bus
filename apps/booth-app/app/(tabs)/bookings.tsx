/**
 * Bookings tab — today's ticket sales list.
 * Shows all BoothSale records for the selected terminal on the current date,
 * filterable by payment method (CASH / Paystack / ALL).
 */

import {
  BanknoteIcon,
  SmartPhone01Icon,
  WifiOff01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { OfflineBanner } from "@/components/offline-banner";
import { BoothFeedback } from "@/lib/haptics";
import { useTRPC } from "@/lib/trpc";
import { useSessionStore } from "@/stores/session";
import { IconColors } from "@/constants/ui-colors";

type Filter = "ALL" | "CASH" | "PAYSTACK_LINK";

export default function BookingsTab() {
  const { t, i18n } = useTranslation();
  const trpc = useTRPC();
  const terminal = useSessionStore((s) => s.terminal);

  const [filter, setFilter] = useState<Filter>("ALL");
  const todayDate = format(new Date(), "yyyy-MM-dd");

  const { data, isPending, refetch, isRefetching } = useQuery(
    trpc.booth.getTerminalBookings.queryOptions(
      {
        terminalId: terminal?.id ?? "",
        date: todayDate,
        paymentMethod: filter,
        page: 1,
        limit: 100,
      },
      { enabled: !!terminal?.id },
    ),
  );

  const filterTabs: { key: Filter; label: string }[] = [
    { key: "ALL", label: t("bookings.filterAll") },
    { key: "CASH", label: t("bookings.filterCash") },
    { key: "PAYSTACK_LINK", label: t("bookings.filterPaystack") },
  ];

  function formatTime(date: Date | string | null | undefined): string {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    const locale = i18n.language === "fr" ? "fr-FR" : "en-US";
    return d.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <View className="flex-1 bg-background">
      <OfflineBanner />

      <View className="px-6 pt-14 pb-4">
        <Text className="font-heading text-2xl font-bold text-foreground">
          {t("bookings.title")}
        </Text>
        <Text className="text-foreground/60 text-sm mt-0.5">
          {todayDate} · {terminal?.name ?? ""}
        </Text>
      </View>

      <View className="flex-row px-6 gap-2 mb-4">
        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => {
              BoothFeedback.tap();
              setFilter(tab.key);
            }}
            className={`px-4 py-1.5 rounded-full border ${
              filter === tab.key
                ? "bg-primary border-primary"
                : "border-border bg-card"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                filter === tab.key ? "text-white" : "text-foreground/70"
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {data && (
        <View className="flex-row px-6 gap-4 mb-4">
          <View className="flex-1 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <Text className="text-green-700 text-xs font-medium">Espèces</Text>
            <Text className="text-green-800 font-bold text-base mt-0.5">
              {data.sales.filter((s) => s.paymentMethod === "CASH").length}{" "}
              {t("bookings.sales")}
            </Text>
          </View>
          <View className="flex-1 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <Text className="text-blue-700 text-xs font-medium">Mobile</Text>
            <Text className="text-blue-800 font-bold text-base mt-0.5">
              {
                data.sales.filter((s) => s.paymentMethod === "PAYSTACK_LINK")
                  .length
              }{" "}
              {t("bookings.sales")}
            </Text>
          </View>
        </View>
      )}

      <FlatList
        data={data?.sales ?? []}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-6 gap-3 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
          />
        }
        renderItem={({ item }) => {
          const isCash = item.paymentMethod === "CASH";
          const amount = isCash
            ? (item.cashAmountXOF ?? 0)
            : (item.booking?.farePaid ?? 0);
          const formattedTime = formatTime(item.confirmedAt);

          return (
            <View className="bg-card border border-border rounded-xl px-4 py-3.5">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-semibold text-foreground text-sm">
                    {item.booking?.passengerName ?? "—"}
                  </Text>
                  <Text className="text-foreground/60 text-xs mt-0.5">
                    {item.booking?.bookingReference ?? ""}
                    {formattedTime ? ` · ${formattedTime}` : ""}
                  </Text>
                </View>
                <View className="items-end gap-1">
                  <View
                    className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${
                      isCash ? "bg-green-100" : "bg-blue-100"
                    }`}
                  >
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
                        color={IconColors.info}
                      />
                    )}
                    <Text
                      className={`text-xs font-medium ${
                        isCash ? "text-green-700" : "text-blue-700"
                      }`}
                    >
                      {amount.toLocaleString("fr-CI")} XOF
                    </Text>
                  </View>
                  {item.wasOffline && (
                    <View className="flex-row items-center gap-0.5">
                      <HugeiconsIcon
                        icon={WifiOff01Icon}
                        size={10}
                        color={IconColors.warning}
                      />
                      <Text className="text-amber-600 text-xs">
                        {t("bookings.offline")}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          !isPending ? (
            <View className="items-center py-16">
              <Text className="text-foreground/50">
                {t("bookings.noBookings")}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

/**
 * Reconciliation screen — end-of-day sales summary.
 * Shows totals broken down by payment method, walk-ups, offline sales,
 * a per-sale detail list, and a share button to export the report.
 */
import {
  BanknoteIcon,
  BarChartIcon,
  RefreshIcon,
  Share01Icon,
  SmartPhone01Icon,
  WifiOff01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { IconColors } from "@/constants/ui-colors";
import { BoothFeedback } from "@/lib/haptics";
import { useTRPC } from "@/lib/trpc";
import { useSessionStore } from "@/stores/session";

export default function ReconcileScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const trpc = useTRPC();
  const terminal = useSessionStore((s) => s.terminal);
  const profile = useSessionStore((s) => s.profile);

  const todayDate = format(new Date(), "yyyy-MM-dd");
  const locale = i18n.language === "fr" ? fr : enUS;

  const { data, isPending, refetch, isFetching } = useQuery(
    trpc.booth.getDailyReconciliation.queryOptions(
      {
        terminalId: terminal?.id ?? "",
        date: todayDate,
      },
      { enabled: !!terminal?.id },
    ),
  );

  async function handleShare() {
    if (!data) return;
    BoothFeedback.tap();

    const text = [
      `=== ${t("reconcile.shareTitle", { date: todayDate })} ===`,
      `Agent : ${profile?.staffName ?? ""}`,
      `Terminal : ${terminal?.name ?? ""}`,
      ``,
      `${t("reconcile.totalSales")} : ${data.totalSales}`,
      `${t("reconcile.cashTotal")} : ${(data.cashTotalXOF ?? 0).toLocaleString("fr-CI")} XOF (${data.cashCount ?? 0} ${t("bookings.sales")})`,
      `${t("reconcile.paystackTotal")} : ${(data.paystackTotalXOF ?? 0).toLocaleString("fr-CI")} XOF (${data.paystackCount ?? 0} ${t("bookings.sales")})`,
      `${t("reconcile.grandTotal")} : ${(data.grandTotalXOF ?? 0).toLocaleString("fr-CI")} XOF`,
      ``,
      `Ventes hors ligne : ${data.offlineSalesCount ?? 0}`,
      `Passagers au comptoir : ${data.walkUpCount ?? 0}`,
      ``,
      `--- ${t("reconcile.saleDetail")} ---`,
      ...(data.sales ?? []).map((s) => {
        const time = s.confirmedAt
          ? format(new Date(s.confirmedAt), "HH:mm")
          : "--:--";
        const isCash = s.paymentMethod === "CASH";
        const amount = isCash
          ? (s.cashAmountXOF ?? 0)
          : (s.booking?.farePaid ?? 0);
        return `${time} · ${s.booking?.passengerName ?? "?"} · ${s.booking?.trip?.serviceType ?? ""} · ${amount.toLocaleString("fr-CI")} XOF (${isCash ? t("reconcile.cashAbbr") : "Mobile"})`;
      }),
    ].join("\n");

    await Share.share(
      { message: text, title: t("reconcile.shareTitle", { date: todayDate }) },
      { dialogTitle: t("reconcile.shareTitle", { date: todayDate }) },
    );
  }

  return (
    <View
      className="flex-1 bg-background"
      style={{
        paddingTop: Math.max(insets.top, 16),
      }}
    >
      {/* Top App Bar */}
      <View className="flex-row items-center justify-between px-6 pt-3 pb-4 border-b border-border">
        <View>
          <Text className="font-heading text-2xl font-bold text-foreground tracking-tight">
            {t("reconcile.title")}
          </Text>
          <Text className="text-muted-foreground text-xs mt-0.5">
            {format(new Date(), "d MMMM yyyy", { locale })} ·{" "}
            {terminal?.name ?? ""}
          </Text>
        </View>
        <Pressable
          className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary active:opacity-75"
          onPress={() => {
            if (isFetching) return;
            BoothFeedback.tap();
            void refetch();
          }}
        >
          {isFetching ? (
            <ActivityIndicator size="small" color={IconColors.brand} />
          ) : (
            <HugeiconsIcon
              icon={RefreshIcon}
              size={14}
              color={IconColors.muted}
            />
          )}
          <Text className="text-xs font-semibold text-secondary-foreground">
            {isFetching ? t("reconcile.refreshing") : t("reconcile.refresh")}
          </Text>
        </Pressable>
      </View>

      {/* Body */}
      {isPending || !data ? (
        <View className="flex-1 px-6 py-6 gap-4">
          <View className="flex-row gap-3">
            <Skeleton className="flex-1 h-24 rounded-2xl" />
            <Skeleton className="flex-1 h-24 rounded-2xl" />
          </View>
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </View>
      ) : (
        <View className="flex-1">
          <ScrollView
            className="flex-1"
            contentContainerClassName="px-6 py-5 gap-4"
          >
            {/* Top Stat Pair */}
            <View className="flex-row gap-3">
              <Card variant="elevated" className="flex-1 p-4">
                <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  {t("reconcile.totalSales")}
                </Text>
                <Text className="font-heading font-bold text-2xl text-foreground mt-1">
                  {data.totalSales ?? 0}
                </Text>
                <Text className="text-xs text-muted-foreground mt-0.5">
                  {t("bookings.sales")} au total
                </Text>
              </Card>

              <Card variant="elevated" className="flex-1 p-4">
                <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  {t("reconcile.walkUps")}
                </Text>
                <Text className="font-heading font-bold text-2xl text-foreground mt-1">
                  {data.walkUpCount ?? 0}
                </Text>
                <Text className="text-xs text-muted-foreground mt-0.5">
                  Au guichet physique
                </Text>
              </Card>
            </View>

            {/* Cash Card */}
            <Card
              variant="elevated"
              className="p-4 bg-emerald-50/60 border-emerald-200"
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-2">
                  <HugeiconsIcon
                    icon={BanknoteIcon}
                    size={18}
                    color={IconColors.success}
                  />
                  <Text className="text-emerald-800 text-xs font-bold uppercase tracking-wider">
                    {t("reconcile.cashTotal")}
                  </Text>
                </View>
                <Badge
                  variant="outline"
                  className="border-emerald-300 bg-white/60"
                >
                  <Text className="text-emerald-800 font-bold text-xs">
                    {data.cashCount ?? 0} {t("bookings.sales")}
                  </Text>
                </Badge>
              </View>
              <Text className="font-heading font-bold text-2xl text-emerald-950 mt-2">
                {(data.cashTotalXOF ?? 0).toLocaleString("fr-CI")} XOF
              </Text>
            </Card>

            {/* Mobile Paystack Card */}
            <Card
              variant="elevated"
              className="p-4 bg-blue-50/60 border-blue-200"
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-2">
                  <HugeiconsIcon
                    icon={SmartPhone01Icon}
                    size={18}
                    color={IconColors.info}
                  />
                  <Text className="text-blue-800 text-xs font-bold uppercase tracking-wider">
                    {t("reconcile.paystackTotal")}
                  </Text>
                </View>
                <Badge
                  variant="outline"
                  className="border-blue-300 bg-white/60"
                >
                  <Text className="text-blue-800 font-bold text-xs">
                    {data.paystackCount ?? 0} {t("bookings.sales")}
                  </Text>
                </Badge>
              </View>
              <Text className="font-heading font-bold text-2xl text-blue-950 mt-2">
                {(data.paystackTotalXOF ?? 0).toLocaleString("fr-CI")} XOF
              </Text>
            </Card>

            {/* Grand Total Highlight */}
            <Card
              variant="elevated"
              className="p-5 bg-primary/10 border-primary/20"
            >
              <Text className="text-primary text-xs font-bold uppercase tracking-wider">
                {t("reconcile.grandTotal")}
              </Text>
              <Text className="font-heading font-bold text-3xl text-primary mt-1">
                {(data.grandTotalXOF ?? 0).toLocaleString("fr-CI")} XOF
              </Text>
              <View className="flex-row items-center gap-4 mt-2 pt-2 border-t border-primary/15">
                <Text className="text-xs text-primary/80">
                  Hors ligne : {data.offlineSalesCount ?? 0}
                </Text>
                <Text className="text-xs text-primary/80">·</Text>
                <Text className="text-xs text-primary/80">
                  Guichet : {data.walkUpCount ?? 0}
                </Text>
              </View>
            </Card>

            {/* Sales Details Section */}
            {(data.sales ?? []).length > 0 && (
              <View className="gap-2.5 mt-2">
                <Text className="font-heading font-bold text-foreground text-base">
                  {t("reconcile.saleDetail")}
                </Text>
                {(data.sales ?? []).map((sale) => {
                  const time = sale.confirmedAt
                    ? format(new Date(sale.confirmedAt), "HH:mm")
                    : "--:--";
                  const isCash = sale.paymentMethod === "CASH";
                  const amount = isCash
                    ? (sale.cashAmountXOF ?? 0)
                    : (sale.booking?.farePaid ?? 0);

                  return (
                    <Card key={sale.id} variant="elevated" className="p-3.5">
                      <View className="flex-row justify-between items-center">
                        <View className="flex-1 pr-2">
                          <Text className="font-heading font-bold text-foreground text-sm">
                            {sale.booking?.passengerName ?? "Passager"}
                          </Text>
                          <View className="flex-row items-center gap-1.5 mt-0.5">
                            <Text className="text-muted-foreground text-xs font-mono">
                              {time}
                            </Text>
                            {sale.booking?.trip?.serviceType ? (
                              <Text className="text-muted-foreground text-xs">
                                · {sale.booking.trip.serviceType}
                              </Text>
                            ) : null}
                          </View>
                        </View>

                        <View className="items-end gap-1">
                          <Badge variant={isCash ? "cash" : "default"}>
                            <Text
                              className={`text-xs font-bold ${
                                isCash ? "text-green-800" : "text-white"
                              }`}
                            >
                              {amount.toLocaleString("fr-CI")} XOF
                            </Text>
                          </Badge>
                          {sale.wasOffline && (
                            <Badge variant="offline">
                              <HugeiconsIcon
                                icon={WifiOff01Icon}
                                size={10}
                                color={IconColors.warning}
                              />
                              <Text className="text-[10px] font-bold text-amber-800">
                                Hors ligne
                              </Text>
                            </Badge>
                          )}
                        </View>
                      </View>
                    </Card>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Bottom Share Bar */}
          <View
            className="px-6 pt-3 border-t border-border bg-card"
            style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
          >
            <Button className="w-full" onPress={handleShare}>
              <View className="flex-row items-center gap-2">
                <HugeiconsIcon icon={Share01Icon} size={18} color="#ffffff" />
                <Text className="text-primary-foreground font-semibold text-base">
                  {t("reconcile.shareButton")}
                </Text>
              </View>
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}

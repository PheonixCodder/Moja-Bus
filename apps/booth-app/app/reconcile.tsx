/**
 * Reconciliation screen — end-of-day sales summary.
 * Shows totals broken down by payment method, walk-ups, offline sales,
 * a per-sale detail list, and a share button to export the report.
 */
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTRPC } from "@/lib/trpc";
import { useSessionStore } from "@/stores/session";
import { IconColors } from "@/constants/ui-colors";

export default function ReconcileScreen() {
  const { t, i18n } = useTranslation();
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

  if (isPending || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={IconColors.brand} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-6 pt-14 pb-4 border-b border-border">
        <Text className="font-heading text-xl font-bold text-foreground flex-1">
          {t("reconcile.title")}
        </Text>
        <TouchableOpacity
          onPress={() => {
            if (isFetching) return;
            void refetch();
          }}
        >
          <Text className="text-primary text-sm font-medium">
            {isFetching ? t("reconcile.refreshing") : t("reconcile.refresh")}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 py-6 gap-4"
        >
          <Text className="text-foreground/60 text-sm">
            {format(new Date(), "d MMMM yyyy", { locale })} ·{" "}
            {terminal?.name ?? ""}
          </Text>

          <View className="gap-3">
            <View className="flex-row gap-3">
              <View className="flex-1 bg-card border border-border rounded-xl px-4 py-4">
                <Text className="text-foreground/60 text-sm">
                  {t("reconcile.totalSales")}
                </Text>
                <Text className="text-foreground font-bold text-2xl mt-1">
                  {data.totalSales ?? "-"}
                </Text>
              </View>
              <View className="flex-1 bg-card border border-border rounded-xl px-4 py-4">
                <Text className="text-foreground/60 text-sm">
                  {t("reconcile.walkUps")}
                </Text>
                <Text className="text-foreground font-bold text-2xl mt-1">
                  {data.walkUpCount ?? "-"}
                </Text>
              </View>
            </View>

            <View className="bg-green-50 border border-green-200 rounded-xl px-5 py-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-green-700 font-medium">
                  {t("reconcile.cashTotal")}
                </Text>
                <Text className="text-green-800 font-bold text-sm">
                  {data.cashCount ?? 0} {t("bookings.sales")}
                </Text>
              </View>
              <Text className="text-green-900 font-bold text-xl mt-1">
                {(data.cashTotalXOF ?? 0).toLocaleString("fr-CI")} XOF
              </Text>
            </View>

            <View className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-blue-700 font-medium">
                  {t("reconcile.paystackTotal")}
                </Text>
                <Text className="text-blue-800 font-bold text-sm">
                  {data.paystackCount ?? 0} {t("bookings.sales")}
                </Text>
              </View>
              <Text className="text-blue-900 font-bold text-xl mt-1">
                {(data.paystackTotalXOF ?? 0).toLocaleString("fr-CI")} XOF
              </Text>
            </View>

            <View className="bg-primary/10 border border-primary/20 rounded-xl px-5 py-4">
              <Text className="text-primary font-medium">
                {t("reconcile.grandTotal")}
              </Text>
              <Text className="text-primary font-bold text-2xl mt-1">
                {(data.grandTotalXOF ?? 0).toLocaleString("fr-CI")} XOF
              </Text>
            </View>
          </View>

          {(data.sales ?? []).length > 0 && (
            <View className="gap-2 mt-2">
              <Text className="font-semibold text-foreground">
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
                  <View
                    key={sale.id}
                    className="bg-card border border-border rounded-lg px-4 py-3"
                  >
                    <View className="flex-row justify-between">
                      <Text className="text-foreground/60 text-xs">
                        {time}
                        {sale.wasOffline ? " · Hors ligne" : ""}
                      </Text>
                      <Text
                        className={`text-xs font-medium ${
                          isCash ? "text-green-700" : "text-blue-700"
                        }`}
                      >
                        {isCash ? t("reconcile.cashAbbr") : "Mobile"}
                      </Text>
                    </View>
                    <Text className="text-foreground font-medium text-sm mt-0.5">
                      {sale.booking?.passengerName ?? "—"}
                    </Text>
                    <View className="flex-row justify-between mt-0.5">
                      <Text className="text-foreground/60 text-xs">
                        {sale.booking?.trip?.serviceType ?? ""}
                      </Text>
                      <Text className="text-foreground font-semibold text-sm">
                        {amount.toLocaleString("fr-CI")} XOF
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        <View className="px-6 pb-8 pt-4 border-t border-border">
          <TouchableOpacity
            className="bg-primary rounded-xl py-4 items-center"
            onPress={handleShare}
          >
            <Text className="text-white font-semibold">
              {t("reconcile.shareButton")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Gift, Ticket } from "lucide-react-native";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/ui/text";
import { useTRPC } from "@/lib/trpc";

export function PromoIncentives() {
  const { t } = useTranslation("wallet");
  const trpc = useTRPC();

  const vouchersQuery = useQuery(
    trpc.discounts.listMyVouchers.queryOptions({ includeExpired: false }),
  );
  const creditsQuery = useQuery(trpc.discounts.listMyCredits.queryOptions());

  const vouchers = vouchersQuery.data ?? [];
  const credits = creditsQuery.data ?? [];
  const creditTotal = credits.reduce(
    (sum, lot) => sum + Math.max(0, lot.remainingXOF - lot.reservedXOF),
    0,
  );

  return (
    <View className="rounded-2xl border border-slate-100 bg-white p-4 gap-3">
      <View>
        <Text className="text-sm font-bold text-slate-800">{t("promoTitle")}</Text>
        <Text className="text-xs text-slate-500 mt-0.5">{t("promoHint")}</Text>
      </View>

      <View className="rounded-xl bg-slate-50 p-3 gap-1">
        <View className="flex-row items-center gap-2">
          <Gift size={16} color="#ee237c" />
          <Text className="text-sm font-semibold text-slate-800">
            {t("promoCreditsTitle")}
          </Text>
        </View>
        <Text className="text-xl font-bold tabular-nums text-slate-900">
          {creditTotal.toLocaleString()} XOF
        </Text>
        {credits.length === 0 ? (
          <Text className="text-xs text-slate-500">{t("promoCreditsEmpty")}</Text>
        ) : (
          credits.slice(0, 5).map((lot) => (
            <Text key={lot.id} className="text-xs text-slate-600">
              {Math.max(0, lot.remainingXOF - lot.reservedXOF).toLocaleString()}{" "}
              XOF · {lot.status}
            </Text>
          ))
        )}
      </View>

      <View className="rounded-xl bg-slate-50 p-3 gap-1">
        <View className="flex-row items-center gap-2">
          <Ticket size={16} color="#ee237c" />
          <Text className="text-sm font-semibold text-slate-800">
            {t("promoVouchersTitle")}
          </Text>
        </View>
        {vouchers.length === 0 ? (
          <Text className="text-xs text-slate-500">{t("promoVouchersEmpty")}</Text>
        ) : (
          vouchers.slice(0, 8).map((v) => (
            <Text key={v.id} className="text-xs text-slate-600">
              {v.remainingAmountXOF.toLocaleString()} XOF
              {v.code ? ` · ${v.code}` : ""} · {v.source}
            </Text>
          ))
        )}
        <Text className="text-[11px] text-slate-500 mt-1">
          {t("promoVoucherCeiling")}
        </Text>
      </View>
    </View>
  );
}

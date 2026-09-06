import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Gift } from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/ui/text";
import { Palette, Colors } from "@/constants/theme";
import { useTRPC } from "@/lib/trpc";

function sourceLabel(source: string, t: (k: any) => string): string {
  switch (source) {
    case "REFERRAL":
    case "REFERRAL_REWARD":
      return t("promoSourceReferral");
    case "ADMIN":
    case "ADMIN_MANUAL":
      return t("promoSourceAdmin");
    case "PROMO_GRANT":
    case "MARKETING_GRANT":
      return t("promoSourcePromo");
    case "GOODWILL":
      return t("promoSourceGoodwill");
    case "LOYALTY":
      return t("promoSourceLoyalty");
    default:
      return source;
  }
}

export function PromoIncentives() {
  const { t } = useTranslation("wallet");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [claimCode, setClaimCode] = useState("");

  const lotsQuery = useQuery(trpc.discounts.listMyCreditLots.queryOptions());

  const claimMutation = useMutation(
    trpc.discounts.claimCreditGrant.mutationOptions({
      onSuccess: async () => {
        Alert.alert(t("promoClaimSuccess"));
        setClaimCode("");
        await Promise.all([
          queryClient.invalidateQueries(trpc.discounts.listMyCredits.pathFilter()),
          queryClient.invalidateQueries(
            trpc.discounts.listMyCreditLots.pathFilter(),
          ),
        ]);
      },
      onError: (err) => Alert.alert(t("promoClaimFailed"), err.message),
    }),
  );

  const lots = lotsQuery.data ?? [];
  const available = lots.filter(
    (l) => l.status === "ACTIVE" || l.status === "PARTIALLY_REDEEMED",
  );
  const pending = lots.filter((l) => l.status === "PENDING");
  const creditTotal = available.reduce(
    (sum, lot) => sum + Math.max(0, lot.remainingXOF - lot.reservedXOF),
    0,
  );

  return (
    <View className="rounded-2xl border border-border bg-card p-4 gap-3">
      <View>
        <Text className="text-sm font-bold text-foreground">{t("promoTitle")}</Text>
        <Text className="text-xs text-muted-foreground mt-0.5">{t("promoHint")}</Text>
        <Text className="text-xs text-muted-foreground mt-1">{t("promoHowToEarn")}</Text>
      </View>

      <View className="gap-2">
        <Text className="text-xs font-semibold text-foreground">
          {t("promoClaimLabel")}
        </Text>
        <View className="flex-row gap-2">
          <TextInput
            value={claimCode}
            onChangeText={setClaimCode}
            placeholder={t("promoClaimPlaceholder")}
            autoCapitalize="characters"
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            placeholderTextColor={Colors.light.textMuted}
          />
          <Pressable
            disabled={!claimCode.trim() || claimMutation.isPending}
            onPress={async () => {
              const { getDeviceHash } = await import("@/lib/device-hash");
              const deviceHash = await getDeviceHash();
              claimMutation.mutate({
                code: claimCode.trim(),
                ...(deviceHash ? { deviceHash } : {}),
              });
            }}
            accessibilityRole="button"
            className="rounded-xl bg-primary px-3 py-2 items-center justify-center min-h-10"
          >
            <Text className="text-xs font-semibold text-primary-foreground">
              {t("promoClaimCta")}
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="rounded-xl bg-muted/40 p-3 gap-1">
        <View className="flex-row items-center gap-2">
          <Gift size={16} color={Palette.rose[500]} />
          <Text className="text-sm font-semibold text-foreground">
            {t("promoCreditsTitle")}
          </Text>
        </View>
        <Text className="text-xl font-bold tabular-nums text-foreground">
          {creditTotal.toLocaleString()} XOF
        </Text>
        {available.length === 0 ? (
          <Text className="text-xs text-muted-foreground">{t("promoCreditsEmpty")}</Text>
        ) : (
          available.slice(0, 5).map((lot) => (
            <Text key={lot.id} className="text-xs text-muted-foreground">
              {Math.max(0, lot.remainingXOF - lot.reservedXOF).toLocaleString()}{" "}
              XOF · {sourceLabel(lot.source, t)} · {lot.status}
            </Text>
          ))
        )}
      </View>

      {pending.length > 0 ? (
        <View className="rounded-xl bg-warning/10 p-3 gap-1 border border-warning/20">
          <Text className="text-sm font-semibold text-foreground">
            {t("promoCreditsPending")}
          </Text>
          {pending.slice(0, 5).map((lot) => (
            <Text key={lot.id} className="text-xs text-muted-foreground">
              {lot.amountXOF.toLocaleString()} XOF ·{" "}
              {sourceLabel(lot.source, t)}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

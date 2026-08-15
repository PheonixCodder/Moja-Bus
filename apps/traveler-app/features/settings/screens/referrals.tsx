import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { SubpageHeader } from "@/components/subpage-header";
import { Text } from "@/components/ui/text";
import { BottomTabInset } from "@/constants/theme";
import { useTRPC } from "@/lib/trpc";

const WEB_ORIGIN =
  process.env["EXPO_PUBLIC_WEB_URL"] ??
  process.env["EXPO_PUBLIC_API_URL"] ??
  "https://mojaride.com";

function ProgressBar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = Math.round((count / Math.max(1, max)) * 100);
  return (
    <View className="gap-1">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-medium text-slate-700">{label}</Text>
        <Text className="text-xs tabular-nums text-slate-500">{count}</Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-slate-100">
        <View className="h-full rounded-full bg-[#ee237c]" style={{ width: `${pct}%` }} />
      </View>
    </View>
  );
}

export function ReferralsView() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation("referrals");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [codeInput, setCodeInput] = useState("");

  const referralQuery = useQuery(trpc.discounts.myReferral.queryOptions());
  const applyMutation = useMutation(
    trpc.discounts.applyReferralCode.mutationOptions({
      onSuccess: async () => {
        Alert.alert(t("applySuccess"));
        setCodeInput("");
        await queryClient.invalidateQueries(trpc.discounts.myReferral.pathFilter());
      },
      onError: (err) => Alert.alert(t("applyFailed"), err.message),
    }),
  );

  const code = referralQuery.data?.code ?? "—";
  const attributed = referralQuery.data?.attributed ?? 0;
  const qualified = referralQuery.data?.qualified ?? 0;
  const rewarded = referralQuery.data?.rewarded ?? 0;
  const max = Math.max(1, attributed, qualified, rewarded);
  const shareUrl = `${WEB_ORIGIN.replace(/\/$/, "")}/?ref=${encodeURIComponent(code)}`;

  async function copyCode() {
    try {
      await Clipboard.setStringAsync(code);
      Alert.alert(t("copied"));
    } catch {
      Alert.alert(t("shareFailed"));
    }
  }

  async function shareInvite() {
    try {
      await Share.share({ message: `${t("yourCode")}: ${code}\n${shareUrl}` });
    } catch {
      Alert.alert(t("shareFailed"));
    }
  }

  return (
    <View className="flex-1 bg-slate-900">
      <SubpageHeader title={t("title")} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: BottomTabInset + insets.bottom + 24,
          paddingHorizontal: 16,
          paddingTop: 16,
          gap: 16,
        }}
      >
        <Text className="text-sm text-white/70">{t("subtitle")}</Text>

        <View className="rounded-2xl bg-white p-4 gap-4">
          <View className="gap-1">
            <Text className="text-base font-semibold text-slate-900">{t("yourCode")}</Text>
            <Text className="text-xs text-slate-500">{t("yourCodeHint")}</Text>
          </View>

          {referralQuery.isLoading ? (
            <ActivityIndicator color="#ee237c" />
          ) : referralQuery.isError ? (
            <Text className="text-sm text-slate-500">{t("disabled")}</Text>
          ) : (
            <>
              <View className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Text className="font-mono text-xl font-bold tracking-widest text-slate-900">
                  {code}
                </Text>
              </View>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => void copyCode()}
                  className="flex-1 items-center rounded-xl border border-slate-200 py-3 active:opacity-70"
                >
                  <Text className="text-sm font-semibold text-slate-800">{t("copyCode")}</Text>
                </Pressable>
                <Pressable
                  onPress={() => void shareInvite()}
                  className="flex-1 items-center rounded-xl bg-[#ee237c] py-3 active:opacity-85"
                >
                  <Text className="text-sm font-semibold text-white">{t("shareLink")}</Text>
                </Pressable>
              </View>

              <View className="gap-3 border-t border-slate-100 pt-4">
                <Text className="text-sm font-semibold text-slate-900">{t("progress")}</Text>
                <ProgressBar label={t("attributed")} count={attributed} max={max} />
                <ProgressBar label={t("qualified")} count={qualified} max={max} />
                <ProgressBar label={t("rewarded")} count={rewarded} max={max} />
              </View>
            </>
          )}
        </View>

        <View className="rounded-2xl bg-white p-4 gap-3">
          <Text className="text-base font-semibold text-slate-900">{t("haveCode")}</Text>
          <Text className="text-xs text-slate-500">{t("haveCodeHint")}</Text>
          <TextInput
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold uppercase text-slate-900"
            placeholder={t("codePlaceholder")}
            placeholderTextColor="#94a3b8"
            autoCapitalize="characters"
            value={codeInput}
            onChangeText={(v) => setCodeInput(v.toUpperCase())}
            editable={!applyMutation.isPending}
          />
          <Pressable
            disabled={!codeInput.trim() || applyMutation.isPending}
            onPress={() =>
              applyMutation.mutate({ code: codeInput.trim().toUpperCase() })
            }
            className={`items-center rounded-xl bg-[#ee237c] py-3 active:opacity-85 ${
              !codeInput.trim() || applyMutation.isPending ? "opacity-40" : ""
            }`}
          >
            {applyMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-sm font-semibold text-white">{t("apply")}</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

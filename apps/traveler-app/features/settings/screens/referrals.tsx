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

function formatJoinedAt(value: Date | string) {
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return "—";
  }
}

export function ReferralsView() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation("referrals");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [codeInput, setCodeInput] = useState("");

  const referralQuery = useQuery(trpc.discounts.myReferral.queryOptions());
  const inviteesQuery = useQuery(
    trpc.discounts.listMyInvitees.queryOptions({ limit: 50, offset: 0 }),
  );
  const applyMutation = useMutation(
    trpc.discounts.applyReferralCode.mutationOptions({
      onSuccess: async (result) => {
        if (result.welcomeCouponCode) {
          Alert.alert(
            t("applySuccess"),
            t("applySuccessWelcome", { code: result.welcomeCouponCode }),
          );
        } else {
          Alert.alert(t("applySuccess"));
        }
        setCodeInput("");
        await Promise.all([
          queryClient.invalidateQueries(trpc.discounts.myReferral.pathFilter()),
          queryClient.invalidateQueries(trpc.discounts.listMyInvitees.pathFilter()),
        ]);
      },
      onError: (err) => Alert.alert(t("applyFailed"), err.message),
    }),
  );

  const code = referralQuery.data?.code ?? "—";
  const program = referralQuery.data?.program;
  const programActive = program?.isActive ?? false;
  const attributed = referralQuery.data?.attributed ?? 0;
  const qualified = referralQuery.data?.qualified ?? 0;
  const rewarded = referralQuery.data?.rewarded ?? 0;
  const max = Math.max(1, attributed, qualified, rewarded);
  const shareUrl = `${WEB_ORIGIN.replace(/\/$/, "")}/r/${encodeURIComponent(code)}`;
  const invitees = inviteesQuery.data?.items ?? [];

  async function copyCode() {
    if (!programActive) {
      Alert.alert(t("disabled"));
      return;
    }
    try {
      await Clipboard.setStringAsync(code);
      Alert.alert(t("copied"));
    } catch {
      Alert.alert(t("shareFailed"));
    }
  }

  async function shareInvite() {
    if (!programActive) {
      Alert.alert(t("disabled"));
      return;
    }
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

        {!programActive && !referralQuery.isLoading ? (
          <View className="rounded-2xl bg-amber-50 px-4 py-3">
            <Text className="text-sm text-amber-950">{t("disabled")}</Text>
          </View>
        ) : null}

        {programActive && program ? (
          <View className="rounded-2xl bg-white p-4 gap-1">
            <Text className="text-sm font-semibold text-slate-900">{t("howItWorks")}</Text>
            <Text className="text-xs text-slate-500">
              {t("howItWorksBody", {
                amount: program.referrerCreditAmountXOF.toLocaleString(),
                delay: program.rewardDelayHours,
                recurring: program.recurringCreditAmountXOF.toLocaleString(),
                max: program.recurringMaxBookings,
              })}
            </Text>
          </View>
        ) : null}

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
                  disabled={!programActive}
                  className={`flex-1 items-center rounded-xl border border-slate-200 py-3 active:opacity-70 ${
                    !programActive ? "opacity-40" : ""
                  }`}
                >
                  <Text className="text-sm font-semibold text-slate-800">{t("copyCode")}</Text>
                </Pressable>
                <Pressable
                  onPress={() => void shareInvite()}
                  disabled={!programActive}
                  className={`flex-1 items-center rounded-xl bg-[#ee237c] py-3 active:opacity-85 ${
                    !programActive ? "opacity-40" : ""
                  }`}
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
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-1 gap-1">
              <Text className="text-base font-semibold text-slate-900">
                {t("inviteesTitle")}
              </Text>
              <Text className="text-xs text-slate-500">{t("inviteesHint")}</Text>
            </View>
            <Text className="text-xs text-slate-500">
              {inviteesQuery.data?.total ?? 0}
            </Text>
          </View>

          {inviteesQuery.isLoading ? (
            <ActivityIndicator color="#ee237c" />
          ) : invitees.length === 0 ? (
            <Text className="text-sm text-slate-500">{t("inviteesEmpty")}</Text>
          ) : (
            <View className="gap-2">
              {invitees.map((row) => (
                <View
                  key={row.id}
                  className="flex-row items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-3"
                >
                  <View className="flex-1 gap-0.5">
                    <Text className="text-sm font-medium text-slate-900">
                      {row.refereeName}
                    </Text>
                    <Text className="text-xs text-slate-500">
                      {formatJoinedAt(row.attributedAt)}
                    </Text>
                  </View>
                  <View className="rounded-full bg-slate-100 px-2.5 py-1">
                    <Text className="text-xs font-medium text-slate-700">
                      {row.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
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
            editable={!applyMutation.isPending && programActive}
          />
          <Pressable
            disabled={!codeInput.trim() || applyMutation.isPending || !programActive}
            onPress={() => {
              void (async () => {
                const { getDeviceHash } = await import("@/lib/device-hash");
                const deviceHash = await getDeviceHash();
                applyMutation.mutate({
                  code: codeInput.trim().toUpperCase(),
                  ...(deviceHash ? { deviceHash } : {}),
                });
              })();
            }}
            className={`items-center rounded-xl bg-[#ee237c] py-3 active:opacity-85 ${
              !codeInput.trim() || applyMutation.isPending || !programActive
                ? "opacity-40"
                : ""
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

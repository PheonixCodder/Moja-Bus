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
import { SubpageHeader } from "@/components/subpage-header";
import { Text } from "@/components/ui/text";
import { BottomTabInset, Palette, Colors } from "@/constants/theme";
import { PlaceholderColor } from "@/constants/ui-colors";
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
        <Text className="text-xs font-medium text-foreground">{label}</Text>
        <Text className="text-xs tabular-nums text-muted-foreground">{count}</Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-muted">
        <View className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
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
      const Clipboard = await import("expo-clipboard");
      await Clipboard.setStringAsync(code);
      Alert.alert(t("copied"));
    } catch {
      Alert.alert(t("copied"), code);
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
    <View className="flex-1 bg-background">
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
        <Text className="text-sm text-foreground/70">{t("subtitle")}</Text>

        {!programActive && !referralQuery.isLoading ? (
          <View className="rounded-2xl bg-warning/10 border border-warning/20 px-4 py-3">
            <Text className="text-sm text-warning font-semibold">{t("disabled")}</Text>
          </View>
        ) : null}

        {programActive && program ? (
          <View className="rounded-2xl bg-card border border-border p-4 gap-1">
            <Text className="text-sm font-semibold text-foreground">{t("howItWorks")}</Text>
            <Text className="text-xs text-muted-foreground">
              {t("howItWorksBody", {
                amount: program.referrerCreditAmountXOF.toLocaleString(),
                delay: program.rewardDelayHours,
                recurring: program.recurringCreditAmountXOF.toLocaleString(),
                max: program.recurringMaxBookings,
              })}
            </Text>
          </View>
        ) : null}

        <View className="rounded-2xl bg-card border border-border p-4 gap-4">
          <View className="gap-1">
            <Text className="text-base font-semibold text-foreground">{t("yourCode")}</Text>
            <Text className="text-xs text-muted-foreground">{t("yourCodeHint")}</Text>
          </View>

          {referralQuery.isLoading ? (
            <ActivityIndicator color={Palette.rose[500]} />
          ) : referralQuery.isError ? (
            <Text className="text-sm text-muted-foreground">{t("disabled")}</Text>
          ) : (
            <>
              <View className="rounded-xl border border-border bg-background px-4 py-3">
                <Text className="font-mono text-xl font-bold tracking-widest text-foreground">
                  {code}
                </Text>
              </View>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => void copyCode()}
                  disabled={!programActive}
                  accessibilityRole="button"
                  className={`flex-1 items-center rounded-xl border border-border py-3 active:opacity-70 min-h-12 justify-center ${
                    !programActive ? "opacity-40" : ""
                  }`}
                >
                  <Text className="text-sm font-semibold text-foreground">{t("copyCode")}</Text>
                </Pressable>
                <Pressable
                  onPress={() => void shareInvite()}
                  disabled={!programActive}
                  accessibilityRole="button"
                  className={`flex-1 items-center rounded-xl bg-primary py-3 active:opacity-85 min-h-12 justify-center ${
                    !programActive ? "opacity-40" : ""
                  }`}
                >
                  <Text className="text-sm font-semibold text-primary-foreground">{t("shareLink")}</Text>
                </Pressable>
              </View>

              <View className="gap-3 border-t border-border pt-4">
                <Text className="text-sm font-semibold text-foreground">{t("progress")}</Text>
                <ProgressBar label={t("attributed")} count={attributed} max={max} />
                <ProgressBar label={t("qualified")} count={qualified} max={max} />
                <ProgressBar label={t("rewarded")} count={rewarded} max={max} />
              </View>
            </>
          )}
        </View>

        <View className="rounded-2xl bg-card border border-border p-4 gap-3">
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-1 gap-1">
              <Text className="text-base font-semibold text-foreground">
                {t("inviteesTitle")}
              </Text>
              <Text className="text-xs text-muted-foreground">{t("inviteesHint")}</Text>
            </View>
            <Text className="text-xs text-muted-foreground">
              {inviteesQuery.data?.total ?? 0}
            </Text>
          </View>

          {inviteesQuery.isLoading ? (
            <ActivityIndicator color={Palette.rose[500]} />
          ) : invitees.length === 0 ? (
            <Text className="text-sm text-muted-foreground">{t("inviteesEmpty")}</Text>
          ) : (
            <View className="gap-2">
              {invitees.map((row) => (
                <View
                  key={row.id}
                  className="flex-row items-center justify-between gap-3 rounded-xl border border-border px-3 py-3"
                >
                  <View className="flex-1 gap-0.5">
                    <Text className="text-sm font-medium text-foreground">
                      {row.refereeName}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {formatJoinedAt(row.attributedAt)}
                    </Text>
                  </View>
                  <View className="rounded-full bg-muted px-2.5 py-1">
                    <Text className="text-xs font-medium text-foreground">
                      {row.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="rounded-2xl bg-card border border-border p-4 gap-3">
          <Text className="text-base font-semibold text-foreground">{t("haveCode")}</Text>
          <Text className="text-xs text-muted-foreground">{t("haveCodeHint")}</Text>
          <TextInput
            className="rounded-xl border border-border bg-background px-4 py-3 text-base font-semibold uppercase text-foreground"
            placeholder={t("codePlaceholder")}
            placeholderTextColor={PlaceholderColor}
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
            accessibilityRole="button"
            className={`items-center rounded-xl bg-primary py-3 active:opacity-85 min-h-12 justify-center ${
              !codeInput.trim() || applyMutation.isPending || !programActive
                ? "opacity-40"
                : ""
            }`}
          >
            {applyMutation.isPending ? (
              <ActivityIndicator color={Palette.zinc[50]} />
            ) : (
              <Text className="text-sm font-semibold text-primary-foreground">{t("apply")}</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

export default ReferralsView;

import { Wallet01Icon, UserGroupIcon, ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Pressable, View, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import { useWalletBalance } from "@/hooks/use-wallet";

export function SettingsDetails() {
  const { t } = useTranslation("settings");
  const { data: balance, isLoading } = useWalletBalance() as unknown as { data: { availableBalance: number } | undefined; isLoading: boolean };

  return (
    <View className="gap-2">
      <Pressable
        onPress={() => router.push("/wallet" as any)}
        className="flex-row items-center bg-white rounded-2xl px-4 py-4 gap-4 border border-slate-100 active:opacity-70"
      >
        <View className="size-10 rounded-full bg-pink-500/10 items-center justify-center">
          <HugeiconsIcon icon={Wallet01Icon} size={18} color="#ee237c" />
        </View>

        <View className="flex-1">
          <Text className="text-sm font-semibold text-slate-900">
            {t("wallet")}
          </Text>
          <Text className="text-xs font-normal text-slate-500 mt-0.5">
            {t("balanceLabel")}
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color="#ee237c" />
        ) : (
          <Text className="text-sm font-bold text-pink-600">
            {balance ? `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(balance.availableBalance)} XOF` : "0 XOF"}
          </Text>
        )}

        <HugeiconsIcon icon={ArrowRight02Icon} size={16} color="#94a3b8" />
      </Pressable>

      <Pressable
        onPress={() => router.push("/passengers" as any)}
        className="flex-row items-center bg-white rounded-2xl px-4 py-4 gap-4 border border-slate-100 active:opacity-70"
      >
        <View className="size-10 rounded-full bg-pink-500/10 items-center justify-center">
          <HugeiconsIcon icon={UserGroupIcon} size={18} color="#ee237c" />
        </View>

        <View className="flex-1">
          <Text className="text-sm font-semibold text-slate-900">
            {t("passengersLabel")}
          </Text>
          <Text className="text-xs font-normal text-slate-500 mt-0.5">
            {t("passengers")}
          </Text>
        </View>

        <HugeiconsIcon icon={ArrowRight02Icon} size={16} color="#94a3b8" />
      </Pressable>
    </View>
  );
}

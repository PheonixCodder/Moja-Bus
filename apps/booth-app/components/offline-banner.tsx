import { Alert01Icon, WifiOff01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useHoldPoolStore } from "@/stores/hold-pool";
import { useOfflineQueue } from "@/stores/offline-queue";

export function OfflineBanner() {
  const { t } = useTranslation();
  const { isOnline } = useNetworkStatus();
  const { pools } = useHoldPoolStore();
  const { queue, conflictCount } = useOfflineQueue();

  if (isOnline && conflictCount > 0) {
    return (
      <View className="bg-amber-500 px-4 py-2 flex-row items-center gap-2">
        <HugeiconsIcon icon={Alert01Icon} size={16} color="white" />
        <Text className="text-white text-sm font-medium flex-1">
          {t("offline.conflictBanner")}
        </Text>
      </View>
    );
  }

  if (isOnline) return null;

  const now = new Date();
  const totalAvailable = Object.values(pools).reduce((sum, pool) => {
    const available = pool.holds.filter(
      (h) => !h.consumed && new Date(h.expiresAt) > now,
    ).length;
    return sum + available;
  }, 0);

  const hasExpiredPool = Object.values(pools).some((pool) =>
    pool.holds.every((h) => h.consumed || new Date(h.expiresAt) <= now),
  );

  return (
    <View className="bg-amber-500 px-4 py-2 flex-row items-center gap-2">
      <HugeiconsIcon icon={WifiOff01Icon} size={16} color="white" />
      <Text className="text-white text-sm font-medium flex-1">
        {hasExpiredPool && totalAvailable === 0
          ? t("sell.offlineExpired")
          : t("sell.offlineBanner", { count: totalAvailable })}
      </Text>
      {queue.length > 0 && (
        <View className="bg-white/20 rounded-full px-2 py-0.5">
          <Text className="text-white text-xs">
            {queue.length} {t("offline.pending")}
          </Text>
        </View>
      )}
    </View>
  );
}

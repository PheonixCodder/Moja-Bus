import {
  Alert01Icon,
  RotateRight01Icon,
  WifiOff01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View } from "react-native";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { cn } from "@/lib/utils";
import { useHoldPoolStore } from "@/stores/hold-pool";
import { useOfflineQueue } from "@/stores/offline-queue";

export function OfflineBanner() {
  const { t } = useTranslation();
  const { isOnline } = useNetworkStatus();
  const pools = useHoldPoolStore((s) => s.pools);
  const queueLength = useOfflineQueue((s) => s.queue.length);
  const conflictCount = useOfflineQueue((s) => s.conflictCount);
  const syncStatus = useOfflineQueue((s) => s.syncStatus);

  // Reconnected & syncing in progress
  if (isOnline && syncStatus === "syncing") {
    return (
      <View className="mx-4 my-2 px-4 py-2.5 rounded-2xl bg-blue-500 border border-blue-600/30 flex-row items-center gap-2.5 shadow-sm">
        <ActivityIndicator size="small" color="#ffffff" />
        <Text className="text-white text-sm font-semibold flex-1">
          Synchronisation des ventes en cours...
        </Text>
        <View className="bg-white/20 rounded-full px-2.5 py-0.5">
          <Text className="text-white text-xs font-bold">
            {queueLength} restante(s)
          </Text>
        </View>
      </View>
    );
  }

  // Conflict alert
  if (isOnline && conflictCount > 0) {
    return (
      <View className="mx-4 my-2 px-4 py-2.5 rounded-2xl bg-amber-500 border border-amber-600/30 flex-row items-center gap-2.5 shadow-sm">
        <HugeiconsIcon icon={Alert01Icon} size={18} color="white" />
        <Text className="text-white text-sm font-semibold flex-1">
          {t("offline.conflictBanner")}
        </Text>
      </View>
    );
  }

  // Online and clean -> no banner needed
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
    <View className="mx-4 my-2 px-4 py-2.5 rounded-2xl bg-amber-500 border border-amber-600/30 flex-row items-center gap-2.5 shadow-sm">
      <HugeiconsIcon icon={WifiOff01Icon} size={18} color="white" />
      <Text className="text-white text-sm font-semibold flex-1">
        {hasExpiredPool && totalAvailable === 0
          ? t("sell.offlineExpired")
          : t("sell.offlineBanner", { count: totalAvailable })}
      </Text>
      {queueLength > 0 && (
        <View className="bg-black/20 rounded-full px-2.5 py-0.5">
          <Text className="text-white text-xs font-bold">
            {queueLength} {t("offline.pending")}
          </Text>
        </View>
      )}
    </View>
  );
}

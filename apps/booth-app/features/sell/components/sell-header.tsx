import { WifiDisconnected01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { NotificationBell } from "@/components/notification-bell";
import { IconColors } from "@/constants/ui-colors";

interface SellHeaderProps {
  cashierName?: string;
  terminalName?: string;
  companyName?: string;
  isOffline?: boolean;
  offlinePoolCount?: number;
}

export const SellHeader = React.memo(function SellHeader({
  cashierName = "Agent",
  terminalName,
  companyName,
  isOffline = false,
  offlinePoolCount = 0,
}: SellHeaderProps) {
  const { t } = useTranslation();

  return (
    <View className="mb-5">
      {/* Offline Alert Strip if network drops */}
      {isOffline ? (
        <View className="flex-row items-center gap-2 bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-2xl mb-3">
          <HugeiconsIcon
            icon={WifiDisconnected01Icon}
            size={16}
            color={IconColors.warning}
          />
          <Text className="text-xs font-bold text-amber-800 flex-1">
            Mode hors-ligne actif • {offlinePoolCount} siège(s) en réserve
          </Text>
        </View>
      ) : null}

      {/* Primary Header Row with Greeting & Notification Bell */}
      <View className="flex-row items-center justify-between">
        {/* Left: Terminal & Cashier Greeting */}
        <View className="flex-1 pr-3">
          <Text
            className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest mb-0.5"
            numberOfLines={1}
          >
            {companyName ? `${companyName} • ` : ""}
            {terminalName || t("sell.noTerminal")}
          </Text>
          <Text
            className="font-heading text-2xl font-black text-foreground tracking-tight"
            numberOfLines={1}
          >
            Bonjour, {cashierName} 👋
          </Text>
        </View>

        {/* Right: Notification Bell (Traveler App pattern) */}
        <View className="flex-row items-center gap-2">
          <NotificationBell />
        </View>
      </View>
    </View>
  );
});

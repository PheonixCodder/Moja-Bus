import { View, Text, Pressable } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Wallet01Icon, Add01Icon } from "@hugeicons/core-free-icons";
import { usePersonalInfo } from "@/hooks/use-personal-info";
import { NotificationBell } from "@/components/notification-bell";
import { router } from "expo-router";

interface HomeHeaderProps {
  walletBalance: number;
}

export function HomeHeader({ walletBalance }: HomeHeaderProps) {
  const { data: info } = usePersonalInfo();
  const userName = info?.fullName ? info.fullName.split(" ")[0] : "Voyageur";

  return (
    <View className="flex-row items-center justify-between py-1">
      {/* User Greeting */}
      <View className="flex-1 pr-3 gap-0.5">
        <Text className="will-change-variable text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
          Bonjour
        </Text>
        <Text
          className="will-change-variable text-2xl font-black text-slate-900 tracking-tight"
          numberOfLines={1}
        >
          {userName}
        </Text>
      </View>

      {/* Action Chips: Wallet + Notifications */}
      <View className="flex-row items-center gap-2">
        {/* Wallet Balance Chip */}
        <Pressable
          onPress={() => router.push("/wallet")}
          className="will-change-pressable flex-row items-center gap-1.5 bg-rose-50 border border-rose-100 px-3 py-2 rounded-full active:bg-rose-100"
        >
          <HugeiconsIcon icon={Wallet01Icon} size={15} color="#ee237c" />
          <Text className="will-change-variable text-xs font-extrabold text-rose-700">
            {walletBalance.toLocaleString("fr-FR")} F
          </Text>
          <View className="bg-rose-500 rounded-full p-0.5 ml-0.5">
            <HugeiconsIcon icon={Add01Icon} size={9} color="#ffffff" />
          </View>
        </Pressable>

        {/* Notification Bell — Novu unread badge + routes to /notifications */}
        <NotificationBell />
      </View>
    </View>
  );
}

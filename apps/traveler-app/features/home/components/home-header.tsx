import { View, Text, Pressable } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Wallet01Icon,
  Notification01Icon,
  Add01Icon,
} from "@hugeicons/core-free-icons";
import { usePersonalInfo } from "@/hooks/use-personal-info";
import { router } from "expo-router";

interface HomeHeaderProps {
  walletBalance: number;
}

export function HomeHeader({ walletBalance }: HomeHeaderProps) {
  const { data: info } = usePersonalInfo();
  const userName = info?.fullName ? info.fullName.split(" ")[0] : "Voyageur";

  return (
    <View className="flex-row items-center justify-between py-2">
      {/* User Greeting */}
      <View className="flex-1 pr-2">
        <Text className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Bonjour 👋
        </Text>
        <Text className="text-xl font-extrabold text-slate-900 tracking-tight" numberOfLines={1}>
          {userName}
        </Text>
      </View>

      {/* Action Chips: Wallet + Notifications */}
      <View className="flex-row items-center gap-2">
        {/* Wallet Balance Chip */}
        <Pressable
          onPress={() => router.push("/(tabs)/settings")}
          className="flex-row items-center gap-1.5 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full"
        >
          <HugeiconsIcon icon={Wallet01Icon} size={16} color="#ee237c" />
          <Text className="text-xs font-extrabold text-rose-700">
            {walletBalance.toLocaleString("fr-FR")} F
          </Text>
          <View className="bg-rose-500 rounded-full p-0.5 ml-0.5">
            <HugeiconsIcon icon={Add01Icon} size={10} color="#ffffff" />
          </View>
        </Pressable>

        {/* Notification Bell */}
        <Pressable
          onPress={() => router.push("/(tabs)/settings")}
          className="size-9 rounded-full bg-white border border-slate-200 items-center justify-center shadow-3xs"
        >
          <HugeiconsIcon icon={Notification01Icon} size={20} color="#334155" />
        </Pressable>
      </View>
    </View>
  );
}

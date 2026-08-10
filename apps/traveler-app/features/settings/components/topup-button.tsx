import { Wallet01Icon, ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";

export function TopUpButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-white rounded-2xl px-4 py-4 gap-4 border border-slate-100 active:opacity-70"
    >
      <View className="w-10 h-10 rounded-full bg-pink-50 items-center justify-center">
        <HugeiconsIcon icon={Wallet01Icon} size={18} color="#ee237c" />
      </View>

      <View className="flex-1">
        <Text className="text-sm font-semibold text-slate-800">Top Up Wallet</Text>
        <Text className="text-xs text-slate-400 mt-0.5">Add funds via Paystack</Text>
      </View>

      <HugeiconsIcon icon={ArrowRight02Icon} size={16} color="#94a3b8" />
    </Pressable>
  );
}
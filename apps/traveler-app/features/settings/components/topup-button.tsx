import { Wallet01Icon, ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { Palette } from "@/constants/theme";

export function TopUpButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center bg-card rounded-2xl px-4 py-4 gap-4 border border-border active:opacity-70 min-h-12"
    >
      <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
        <HugeiconsIcon icon={Wallet01Icon} size={18} color={Palette.rose[500]} />
      </View>

      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground">Top Up Wallet</Text>
        <Text className="text-xs text-muted-foreground mt-0.5">Add funds via Paystack</Text>
      </View>

      <HugeiconsIcon icon={ArrowRight02Icon} size={16} color={Palette.zinc[400]} />
    </Pressable>
  );
}
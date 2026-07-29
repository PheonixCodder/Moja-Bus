import { Wallet01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { Colors, Spacing } from "@moja/theme/tokens";
import { primaryRGB } from "@/constants/theme";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";

export function TopUpButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.light.background,
        borderRadius: 16,
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.four,
        gap: Spacing.four,
        opacity: pressed ? 0.7 : 1,
        borderWidth: 1,
        borderColor: Colors.light.backgroundSelected,
      })}
    >
      <View
        style={{
          width: Spacing.three,
          height: Spacing.three,
          borderRadius: Spacing.three / 2,
          backgroundColor: `rgba(${primaryRGB}, 0.12)`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <HugeiconsIcon icon={Wallet01Icon} size={18} color={Colors.light.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.light.text }}>
          Top Up Wallet
        </Text>
        <Text style={{ fontSize: 12, fontWeight: "400", color: Colors.light.textSecondary, marginTop: 2 }}>
          Add funds via Paystack
        </Text>
      </View>

        <HugeiconsIcon icon={ArrowRight02Icon} size={16} color={Colors.light.textSecondary} />
    </Pressable>
  );
}
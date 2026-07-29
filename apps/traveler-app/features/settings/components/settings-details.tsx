import { Wallet01Icon, UserGroupIcon, ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Pressable, View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import { primaryRGB } from "@/constants/theme";
import { Colors, Spacing } from "@moja/theme/tokens";
import { useWalletBalance } from "@/hooks/use-wallet";

export function SettingsDetails() {
  const { data: balance, isLoading } = useWalletBalance() as unknown as { data: { availableBalance: number } | undefined; isLoading: boolean };

  return (
    <View style={{ gap: Spacing.two }}>
      <Pressable
        onPress={() => router.push("/wallet" as any)}
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
            Wallet
          </Text>
          <Text style={{ fontSize: 12, fontWeight: "400", color: Colors.light.textSecondary, marginTop: 2 }}>
            Balance
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.light.primary} />
        ) : (
          <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.light.primary }}>
            {balance ? `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(balance.availableBalance)} XOF` : "0 XOF"}
          </Text>
        )}

        <HugeiconsIcon icon={ArrowRight02Icon} size={16} color={Colors.light.textSecondary} />
      </Pressable>

      <Pressable
        onPress={() => router.push("/passengers" as any)}
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
          <HugeiconsIcon icon={UserGroupIcon} size={18} color={Colors.light.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.light.text }}>
            Passengers
          </Text>
          <Text style={{ fontSize: 12, fontWeight: "400", color: Colors.light.textSecondary, marginTop: 2 }}>
            Passengers
          </Text>
        </View>

        <HugeiconsIcon icon={ArrowRight02Icon} size={16} color={Colors.light.textSecondary} />
      </Pressable>
    </View>
  );
}

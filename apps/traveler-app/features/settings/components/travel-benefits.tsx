import { TrendingUp } from "lucide-react-native";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Colors, Spacing } from "@moja/theme/tokens";

export function TravelBenefits() {
  return (
    <View style={{
      backgroundColor: Colors.light.background,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: Colors.light.backgroundSelected,
      padding: Spacing.four,
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.one, marginBottom: Spacing.three }}>
        <TrendingUp size={16} color={Colors.light.primary} />
        <Text style={{ fontSize: 11, fontWeight: "700", color: Colors.light.textSecondary, letterSpacing: 1, textTransform: "uppercase" }}>
          Travel Benefits
        </Text>
      </View>

      <View style={{ gap: Spacing.three }}>
        <View style={{ flexDirection: "row", gap: Spacing.two }}>
          <View style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: "rgba(238, 35, 124, 0.1)",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Text style={{ fontSize: 10, fontWeight: "900", color: Colors.light.primary }}>1</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.light.text }}>
              Instant Booking
            </Text>
            <Text style={{ fontSize: 11, color: Colors.light.textSecondary, marginTop: 2, lineHeight: 16 }}>
              Book trips instantly without needing to pay each time — the fare is deducted from your wallet.
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: Spacing.two }}>
          <View style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: "rgba(238, 35, 124, 0.1)",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Text style={{ fontSize: 10, fontWeight: "900", color: Colors.light.primary }}>2</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.light.text }}>
              One-Click Refunds
            </Text>
            <Text style={{ fontSize: 11, color: Colors.light.textSecondary, marginTop: 2, lineHeight: 16 }}>
              Cancelled trips are refunded directly to your wallet — no waiting, no paperwork.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

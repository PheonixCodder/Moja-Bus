import { AlertCircle } from "lucide-react-native";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Colors, Spacing } from "@moja/theme/tokens";

type BalanceAllocationProps = {
  availableBalance: number;
  reservedBalance: number;
};

export function BalanceAllocation({ availableBalance, reservedBalance }: BalanceAllocationProps) {
  return (
    <View style={{
      backgroundColor: Colors.light.background,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: Colors.light.backgroundSelected,
      paddingHorizontal: Spacing.four,
      paddingVertical: Spacing.four,
    }}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: Colors.light.textSecondary, letterSpacing: 1, textTransform: "uppercase", marginBottom: Spacing.three }}>
        Allocation
      </Text>

      <View style={{ height: 12, backgroundColor: "#f1f5f9", borderRadius: 100, overflow: "hidden" }}>
        <View style={{
          flex: 1,
          backgroundColor: Colors.light.primary,
          borderRadius: 100,
        }} />
      </View>

      <View style={{ marginTop: Spacing.three }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.one }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.light.primary }} />
          <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.light.text }}>Balance</Text>
        </View>
        <Text style={{ fontSize: 11, color: Colors.light.textSecondary, marginTop: 2, marginLeft: 18 }}>
          {availableBalance.toLocaleString()} XOF — available for bookings
        </Text>
      </View>

      {reservedBalance > 0 ? (
        <View style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: Spacing.one,
          backgroundColor: "#f8fafc",
          padding: Spacing.two,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#f1f5f9",
          marginTop: Spacing.two,
        }}>
          <AlertCircle size={14} color="#6366f1" style={{ marginTop: 2 }} />
          <Text style={{ fontSize: 11, color: Colors.light.textSecondary, flex: 1, lineHeight: 16 }}>
            XOF {reservedBalance.toLocaleString()} is reserved for pending trips and won't be available until those trips are completed or cancelled.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

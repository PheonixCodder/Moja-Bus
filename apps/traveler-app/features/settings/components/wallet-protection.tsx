import { ShieldCheck, CheckCircle2, Lock } from "lucide-react-native";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Colors, Spacing } from "@moja/theme/tokens";

export function WalletProtection() {
  return (
    <View style={{
      backgroundColor: Colors.light.background,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: Colors.light.backgroundSelected,
      padding: Spacing.four,
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.one, marginBottom: Spacing.three }}>
        <ShieldCheck size={16} color="#10b981" />
        <Text style={{ fontSize: 11, fontWeight: "700", color: Colors.light.textSecondary, letterSpacing: 1, textTransform: "uppercase" }}>
          Wallet Protection
        </Text>
      </View>

      <View style={{
        backgroundColor: Colors.light.backgroundElement,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.light.backgroundSelected,
        padding: Spacing.four,
        gap: Spacing.three,
      }}>
        <View style={{ flexDirection: "row", gap: Spacing.two }}>
          <CheckCircle2 size={16} color="#10b981" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.light.text }}>
              Consolidated Treasury
            </Text>
            <Text style={{ fontSize: 11, color: Colors.light.textSecondary, marginTop: 2, lineHeight: 16 }}>
              Your funds are held in a segregated account, separate from operational funds.
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: Spacing.two }}>
          <Lock size={16} color="#10b981" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.light.text }}>
              Paystack Verified
            </Text>
            <Text style={{ fontSize: 11, color: Colors.light.textSecondary, marginTop: 2, lineHeight: 16 }}>
              All transactions are processed securely through Paystack, a PCI-DSS compliant payment gateway.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

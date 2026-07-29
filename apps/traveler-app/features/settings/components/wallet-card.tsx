import { Wallet, Plus, ShieldCheck } from "lucide-react-native";
import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { Colors, Spacing } from "@moja/theme/tokens";

type WalletCardProps = {
  availableBalance: number;
  walletId: string;
  onOpenTopup: () => void;
};

export function WalletCard({ availableBalance, walletId, onOpenTopup }: WalletCardProps) {
  const accountSuffix = walletId ? walletId.slice(-6).toUpperCase() : "XXXXXX";

  return (
    <View style={{
      backgroundColor: Colors.light.primary,
      borderRadius: 24,
      paddingHorizontal: Spacing.four,
      paddingVertical: Spacing.five,
      minHeight: 200,
      shadowColor: Colors.light.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 16,
    }}>
      <View style={{
        position: "absolute",
        top: -40,
        right: -40,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: "rgba(255,255,255,0.08)",
      }} />
      <View style={{
        position: "absolute",
        bottom: -30,
        left: -30,
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: "rgba(0,0,0,0.06)",
      }} />

      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.two }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 16,
            backgroundColor: "rgba(255,255,255,0.12)",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Wallet size={20} color="#fff" />
          </View>
          <View>
            <Text style={{ fontSize: 12, fontWeight: "800", letterSpacing: 1, color: "rgba(255,255,255,0.9)", textTransform: "uppercase" }}>
              Moja Wallet
            </Text>
            <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontFamily: "monospace", marginTop: 2 }}>
              •••• {accountSuffix}
            </Text>
          </View>
        </View>

        <View style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 100,
          backgroundColor: "rgba(255,255,255,0.10)",
        }}>
          <ShieldCheck size={14} color="#6ee7b7" />
          <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1, color: "#fff", textTransform: "uppercase" }}>
            Verified
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.6)", letterSpacing: 2, textTransform: "uppercase" }}>
          Balance
        </Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: Spacing.one, marginTop: Spacing.one }}>
          <Text style={{ fontSize: 36, fontWeight: "900", color: "#fff", letterSpacing: -1 }}>
            {availableBalance.toLocaleString()}
          </Text>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "rgba(255,255,255,0.8)" }}>
            XOF
          </Text>
        </View>
      </View>

      <View style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.12)",
        paddingTop: Spacing.four,
        marginTop: Spacing.two,
      }}>
        <Text style={{ fontSize: 10, fontWeight: "600", color: "rgba(255,255,255,0.7)" }}>
          Pre-funded account
        </Text>

        <Pressable
          onPress={onOpenTopup}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.one,
            backgroundColor: "#fff",
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 14,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Plus size={16} color={Colors.light.primary} />
          <Text style={{ fontSize: 12, fontWeight: "700", color: Colors.light.primary }}>
            Top Up
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

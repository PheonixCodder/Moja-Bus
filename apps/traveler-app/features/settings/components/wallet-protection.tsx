import { ShieldCheck, CheckCircle2, Lock } from "lucide-react-native";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Palette } from "@/constants/theme";

export function WalletProtection() {
  return (
    <View className="bg-card rounded-2xl border border-border p-4">
      <View className="flex-row items-center gap-1 mb-3">
        <ShieldCheck size={16} color={Palette.emerald[500]} />
        <Text className="text-sm font-bold text-muted-foreground tracking-widest uppercase">
          Wallet Protection
        </Text>
      </View>

      <View className="bg-muted/40 rounded-xl border border-border p-4 gap-3">
        <View className="flex-row gap-2">
          <CheckCircle2 size={16} color={Palette.emerald[500]} style={{ marginTop: 2 }} />
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">Consolidated Treasury</Text>
            <Text className="text-sm text-muted-foreground mt-0.5 leading-4">
              Your funds are held in a segregated account, separate from operational funds.
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          <Lock size={16} color={Palette.emerald[500]} style={{ marginTop: 2 }} />
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">Paystack Verified</Text>
            <Text className="text-sm text-muted-foreground mt-0.5 leading-4">
              All transactions are processed securely through Paystack, a PCI-DSS compliant payment gateway.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

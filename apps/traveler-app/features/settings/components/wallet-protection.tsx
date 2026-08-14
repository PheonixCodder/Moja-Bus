import { ShieldCheck, CheckCircle2, Lock } from "lucide-react-native";
import { View } from "react-native";
import { Text } from "@/components/ui/text";

export function WalletProtection() {
  return (
    <View className="bg-white rounded-2xl border border-slate-100 p-4">
      <View className="flex-row items-center gap-1 mb-3">
        <ShieldCheck size={16} color="#10b981" />
        <Text className="text-sm font-bold text-slate-400 tracking-widest uppercase">
          Wallet Protection
        </Text>
      </View>

      <View className="bg-slate-50 rounded-xl border border-slate-100 p-4 gap-3">
        <View className="flex-row gap-2">
          <CheckCircle2 size={16} color="#10b981" style={{ marginTop: 2 }} />
          <View className="flex-1">
            <Text className="text-sm font-semibold text-slate-800">Consolidated Treasury</Text>
            <Text className="text-sm text-slate-500 mt-0.5 leading-4">
              Your funds are held in a segregated account, separate from operational funds.
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          <Lock size={16} color="#10b981" style={{ marginTop: 2 }} />
          <View className="flex-1">
            <Text className="text-sm font-semibold text-slate-800">Paystack Verified</Text>
            <Text className="text-sm text-slate-500 mt-0.5 leading-4">
              All transactions are processed securely through Paystack, a PCI-DSS compliant payment gateway.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

import { AlertCircle } from "lucide-react-native";
import { View } from "react-native";
import { Text } from "@/components/ui/text";

type BalanceAllocationProps = {
  availableBalance: number;
  reservedBalance: number;
};

export function BalanceAllocation({ availableBalance, reservedBalance }: BalanceAllocationProps) {
  return (
    <View className="bg-white rounded-2xl border border-slate-100 px-4 py-4">
      <Text className="text-sm font-bold text-slate-400 tracking-widest uppercase mb-3">
        Allocation
      </Text>

      <View className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <View className="flex-1 bg-pink-600 rounded-full" />
      </View>

      <View className="mt-3">
        <View className="flex-row items-center gap-1">
          <View className="w-2.5 h-2.5 rounded-full bg-pink-600" />
          <Text className="text-sm font-semibold text-slate-800">Balance</Text>
        </View>
        <Text className="text-sm text-slate-500 mt-0.5 ml-[18px]">
          {availableBalance.toLocaleString()} XOF — available for bookings
        </Text>
      </View>

      {reservedBalance > 0 ? (
        <View className="flex-row items-start gap-1 bg-slate-50 p-2 rounded-xl border border-slate-100 mt-2">
          <AlertCircle size={14} color="#6366f1" style={{ marginTop: 2 }} />
          <Text className="text-sm text-slate-500 flex-1 leading-4">
            XOF {reservedBalance.toLocaleString()} is reserved for pending trips and won't be available until those trips are completed or cancelled.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

import { AlertCircle } from "lucide-react-native";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Palette } from "@/constants/theme";

type BalanceAllocationProps = {
  availableBalance: number;
  reservedBalance: number;
};

export function BalanceAllocation({ availableBalance, reservedBalance }: BalanceAllocationProps) {
  return (
    <View className="bg-card rounded-2xl border border-border px-4 py-4">
      <Text className="text-sm font-bold text-muted-foreground tracking-widest uppercase mb-3">
        Allocation
      </Text>

      <View className="h-3 bg-muted rounded-full overflow-hidden">
        <View className="flex-1 bg-primary rounded-full" />
      </View>

      <View className="mt-3">
        <View className="flex-row items-center gap-1">
          <View className="w-2.5 h-2.5 rounded-full bg-primary" />
          <Text className="text-sm font-semibold text-foreground">Balance</Text>
        </View>
        <Text className="text-sm text-muted-foreground mt-0.5 ml-[18px]">
          {availableBalance.toLocaleString()} XOF — available for bookings
        </Text>
      </View>

      {reservedBalance > 0 ? (
        <View className="flex-row items-start gap-1 bg-muted/40 p-2 rounded-xl border border-border mt-2">
          <AlertCircle size={14} color={Palette.blue[500]} style={{ marginTop: 2 }} />
          <Text className="text-sm text-muted-foreground flex-1 leading-4">
            XOF {reservedBalance.toLocaleString()} is reserved for pending trips and won't be available until those trips are completed or cancelled.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { View, FlatList, ActivityIndicator, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { Palette } from "@/constants/theme";

interface LedgerEntry {
  id: string;
  side: "CREDIT" | "DEBIT";
  amount: number;
  description: string | null;
  effectiveAt: string;
  transactionId: string;
}

type TransactionListProps = {
  data: LedgerEntry[];
  total: number;
  page: number;
  pageSize: number;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: diffDays > 365 ? "numeric" : undefined,
  }).format(date);
}

export function TransactionList({ data, total, page, pageSize, isLoadingMore, onLoadMore, onRefresh }: TransactionListProps) {
  const isEmpty = data.length === 0;

  if (isEmpty) {
    return (
      <View className="items-center py-6">
        <Text className="text-base text-muted-foreground">No transactions yet</Text>
        <Pressable onPress={onRefresh} accessibilityRole="button" className="mt-2 min-h-9 justify-center">
          <Text className="text-sm font-semibold text-primary">Top Up</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      onEndReached={() => {
        if (data.length < total && !isLoadingMore) {
          onLoadMore();
        }
      }}
      onEndReachedThreshold={0.5}
      refreshing={isLoadingMore && data.length === 0}
      onRefresh={onRefresh}
      ListFooterComponent={
        isLoadingMore ? (
          <ActivityIndicator size="small" color={Palette.rose[500]} className="py-4" />
        ) : null
      }
      renderItem={({ item }) => (
        <View className="flex-row items-center gap-4 px-4 py-4 border-b border-border">
          <View
            className={`w-10 h-10 rounded-full items-center justify-center ${
              item.side === "CREDIT" ? "bg-success/10" : "bg-destructive/10"
            }`}
          >
            <HugeiconsIcon
              icon={item.side === "CREDIT" ? ArrowUp01Icon : ArrowDown01Icon}
              size={16}
              color={item.side === "CREDIT" ? Palette.emerald[500] : Palette.red[500]}
            />
          </View>

          <View className="flex-1">
            <Text className="text-base font-medium text-foreground">
              {item.description ?? "Transaction"}
            </Text>
            <Text className="text-xs text-muted-foreground mt-0.5">{formatDate(item.effectiveAt)}</Text>
          </View>

          <Text
            className={`text-base font-semibold ${
              item.side === "CREDIT" ? "text-success" : "text-destructive"
            }`}
          >
            {item.side === "CREDIT" ? "+" : "-"}
            {new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(item.amount)} XOF
          </Text>
        </View>
      )}
    />
  );
}
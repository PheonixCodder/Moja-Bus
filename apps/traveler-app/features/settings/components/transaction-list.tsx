import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { View, FlatList, ActivityIndicator, Pressable } from "react-native";
import { Text } from "@/components/ui/text";

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
        <Text className="text-base text-slate-500">No transactions yet</Text>
        <Pressable onPress={onRefresh} className="mt-2">
          <Text className="text-sm font-semibold text-pink-600">Top Up</Text>
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
          <ActivityIndicator size="small" color="#ee237c" className="py-4" />
        ) : null
      }
      renderItem={({ item }) => (
        <View className="flex-row items-center gap-4 px-4 py-4 border-b border-slate-100">
          <View
            className={`w-10 h-10 rounded-full items-center justify-center ${
              item.side === "CREDIT" ? "bg-green-500/10" : "bg-red-500/10"
            }`}
          >
            <HugeiconsIcon
              icon={item.side === "CREDIT" ? ArrowUp01Icon : ArrowDown01Icon}
              size={16}
              color={item.side === "CREDIT" ? "#22c55e" : "#ef4444"}
            />
          </View>

          <View className="flex-1">
            <Text className="text-base font-medium text-slate-800">
              {item.description ?? "Transaction"}
            </Text>
            <Text className="text-xs text-slate-400 mt-0.5">{formatDate(item.effectiveAt)}</Text>
          </View>

          <Text
            className={`text-base font-semibold ${
              item.side === "CREDIT" ? "text-green-500" : "text-red-500"
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
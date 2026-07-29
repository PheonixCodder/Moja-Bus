import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { View, FlatList, ActivityIndicator, Text, Pressable } from "react-native";
import { Text as UIText } from "@/components/ui/text";
import { Colors, Spacing } from "@moja/theme/tokens";

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
      <View style={{ alignItems: "center", paddingVertical: Spacing.six }}>
        <UIText style={{ fontSize: 15, color: Colors.light.textSecondary }}>
          No transactions yet
        </UIText>
        <Pressable onPress={onRefresh} style={{ marginTop: Spacing.two }}>
          <UIText style={{ fontSize: 14, fontWeight: "600", color: Colors.light.primary }}>
            Top Up
          </UIText>
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
          <ActivityIndicator size="small" color={Colors.light.primary} style={{ paddingVertical: Spacing.four }} />
        ) : null
      }
      renderItem={({ item }) => (
        <View
          style={{
            paddingVertical: Spacing.four,
            paddingHorizontal: Spacing.four,
            borderBottomWidth: 0.5,
            borderBottomColor: Colors.light.backgroundSelected,
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.four,
          }}
        >
          <View
            style={{
              width: Spacing.three,
              height: Spacing.three,
              borderRadius: Spacing.three / 2,
              backgroundColor: item.side === "CREDIT" ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <HugeiconsIcon
              icon={item.side === "CREDIT" ? ArrowUp01Icon : ArrowDown01Icon}
              size={16}
              color={item.side === "CREDIT" ? "#22c55e" : "#ef4444"}
            />
          </View>

          <View style={{ flex: 1 }}>
            <UIText style={{ fontSize: 15, fontWeight: "500", color: Colors.light.text }}>
              {item.description ?? "Transaction"}
            </UIText>
            <UIText style={{ fontSize: 12, fontWeight: "400", color: Colors.light.textSecondary, marginTop: 2 }}>
              {formatDate(item.effectiveAt)}
            </UIText>
          </View>

          <UIText
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: item.side === "CREDIT" ? "#22c55e" : "#ef4444",
            }}
          >
            {item.side === "CREDIT" ? "+" : "-"}
            {new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(item.amount)} XOF
          </UIText>
        </View>
      )}
    />
  );
}
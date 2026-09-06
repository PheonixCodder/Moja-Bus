import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, History } from "lucide-react-native";
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

type TransactionHistoryProps = {
  data: LedgerEntry[];
  total: number;
  pageSize: number;
  currentPage: number;
  isLoading: boolean;
  isFetching: boolean;
  onPageChange: (page: number) => void;
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

export function TransactionHistory({
  data,
  total,
  pageSize,
  currentPage,
  isLoading,
  isFetching,
  onPageChange,
  onRefresh,
}: TransactionHistoryProps) {
  const isEmpty = data.length === 0;
  const totalPages = Math.ceil(total / pageSize);

  if (isLoading) {
    return (
      <View className="items-center py-5">
        <ActivityIndicator size="small" color={Palette.rose[500]} />
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View className="bg-card rounded-2xl border border-border py-5 items-center gap-2">
        <View className="w-12 h-12 rounded-full bg-muted items-center justify-center">
          <History size={24} color={Palette.zinc[400]} />
        </View>
        <Text className="text-sm font-medium text-muted-foreground">No transactions yet</Text>
        <Text className="text-xs text-muted-foreground max-w-[280px] text-center leading-4">
          Your transaction history will appear here after your first top-up or booking.
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <Text className="text-sm font-extrabold text-foreground">Transaction History</Text>
        <Text className="text-sm text-muted-foreground">{total} total</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => {
          const isCredit = item.side === "CREDIT";
          return (
            <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border/50">
              <View
                className={`w-9 h-9 rounded-full items-center justify-center border ${
                  isCredit
                    ? "bg-success/10 border-success/20"
                    : "bg-destructive/10 border-destructive/20"
                }`}
              >
                {isCredit ? (
                  <ArrowDownLeft size={16} color={Palette.emerald[500]} />
                ) : (
                  <ArrowUpRight size={16} color={Palette.red[500]} />
                )}
              </View>

              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">
                  {item.description ?? "Transaction"}
                </Text>
                <View className="flex-row items-center gap-1 mt-0.5">
                  <View className="px-1.5 py-[1px] rounded bg-muted">
                    <Text className="text-xs font-bold text-muted-foreground tracking-wide uppercase">
                      {isCredit ? "Paystack" : "Wallet"}
                    </Text>
                  </View>
                  <Text className="text-sm text-muted-foreground">{formatDate(item.effectiveAt)}</Text>
                </View>
              </View>

              <Text className={`text-sm font-bold ${isCredit ? "text-success" : "text-foreground"}`}>
                {isCredit ? "+" : "-"}{item.amount.toLocaleString()} XOF
              </Text>
            </View>
          );
        }}
      />

      {totalPages > 1 ? (
        <View className="flex-row items-center justify-between px-4 py-3 border-t border-border">
          <Text className="text-sm text-muted-foreground">
            Showing {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, total)} of {total}
          </Text>
          <View className="flex-row gap-1">
            <Pressable
              onPress={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
              accessibilityRole="button"
              className={`px-2 py-1 rounded-lg border border-border min-h-8 justify-center ${currentPage === 0 ? "opacity-40" : ""}`}
            >
              <Text className="text-sm font-semibold text-foreground">Previous</Text>
            </Pressable>
            <Pressable
              onPress={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              accessibilityRole="button"
              className={`px-2 py-1 rounded-lg border border-border min-h-8 justify-center ${currentPage >= totalPages - 1 ? "opacity-40" : ""}`}
            >
              <Text className="text-sm font-semibold text-foreground">Next</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

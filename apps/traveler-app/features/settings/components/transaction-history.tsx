import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, History } from "lucide-react-native";
import { View, FlatList, ActivityIndicator, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { Colors, Spacing } from "@moja/theme/tokens";

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
      <View style={{ alignItems: "center", paddingVertical: Spacing.five }}>
        <ActivityIndicator size="small" color={Colors.light.primary} />
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View style={{
        backgroundColor: Colors.light.background,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.light.backgroundSelected,
        paddingVertical: Spacing.five,
        alignItems: "center",
        gap: Spacing.two,
      }}>
        <View style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: Colors.light.backgroundElement,
          alignItems: "center",
          justifyContent: "center",
        }}>
          <History size={24} color={Colors.light.textSecondary} />
        </View>
        <Text style={{ fontSize: 14, fontWeight: "500", color: Colors.light.textSecondary }}>
          No transactions yet
        </Text>
        <Text style={{ fontSize: 12, color: Colors.light.textSecondary, maxWidth: 280, textAlign: "center", lineHeight: 16 }}>
          Your transaction history will appear here after your first top-up or booking.
        </Text>
      </View>
    );
  }

  return (
    <View style={{
      backgroundColor: Colors.light.background,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: Colors.light.backgroundSelected,
      overflow: "hidden",
    }}>
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.backgroundSelected,
      }}>
        <Text style={{ fontSize: 14, fontWeight: "800", color: Colors.light.text }}>
          Transaction History
        </Text>
        <Text style={{ fontSize: 11, color: Colors.light.textSecondary }}>
          {total} total
        </Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => {
          const isCredit = item.side === "CREDIT";
          return (
            <View style={{
              paddingVertical: Spacing.three,
              paddingHorizontal: Spacing.four,
              borderBottomWidth: 0.5,
              borderBottomColor: Colors.light.backgroundSelected,
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.three,
            }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isCredit ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: isCredit ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
              }}>
                {isCredit ? (
                  <ArrowDownLeft size={16} color="#10b981" />
                ) : (
                  <ArrowUpRight size={16} color="#ef4444" />
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.light.text }}>
                  {item.description ?? "Transaction"}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.one, marginTop: 2 }}>
                  <View style={{
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                    borderRadius: 4,
                    backgroundColor: Colors.light.backgroundElement,
                  }}>
                    <Text style={{ fontSize: 9, fontWeight: "700", color: Colors.light.textSecondary, letterSpacing: 0.5, textTransform: "uppercase" }}>
                      {isCredit ? "Paystack" : "Wallet"}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: Colors.light.textSecondary }}>
                    {formatDate(item.effectiveAt)}
                  </Text>
                </View>
              </View>

              <Text style={{
                fontSize: 14,
                fontWeight: "700",
                color: isCredit ? "#10b981" : Colors.light.text,
              }}>
                {isCredit ? "+" : "-"}
                {item.amount.toLocaleString()} XOF
              </Text>
            </View>
          );
        }}
      />

      {totalPages > 1 ? (
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: Spacing.four,
          paddingVertical: Spacing.three,
          borderTopWidth: 1,
          borderTopColor: Colors.light.backgroundSelected,
        }}>
          <Text style={{ fontSize: 11, color: Colors.light.textSecondary }}>
            Showing {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, total)} of {total}
          </Text>
          <View style={{ flexDirection: "row", gap: Spacing.one }}>
            <Pressable
              onPress={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
              style={{
                paddingHorizontal: Spacing.two,
                paddingVertical: Spacing.one,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: Colors.light.backgroundSelected,
                opacity: currentPage === 0 ? 0.4 : 1,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "600", color: Colors.light.text }}>Previous</Text>
            </Pressable>
            <Pressable
              onPress={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              style={{
                paddingHorizontal: Spacing.two,
                paddingVertical: Spacing.one,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: Colors.light.backgroundSelected,
                opacity: currentPage >= totalPages - 1 ? 0.4 : 1,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "600", color: Colors.light.text }}>Next</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

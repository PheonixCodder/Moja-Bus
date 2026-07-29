import { useState, useCallback } from "react";
import { View, ActivityIndicator, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SubpageHeader } from "@/components/subpage-header";
import { Text } from "@/components/ui/text";
import { BottomTabInset } from "@/constants/theme";
import { Colors, Spacing } from "@moja/theme/tokens";
import { authClient } from "@/lib/auth-client";
import {
  useWalletBalance,
  useWalletLedger,
  useTopUpWallet,
} from "@/hooks/use-wallet";
import type { WalletBalance, WalletLedgerData, TopUpResult } from "@/hooks/use-wallet";
import { WalletCard } from "../components/wallet-card";
import { BalanceAllocation } from "../components/balance-allocation";
import { TransactionHistory } from "../components/transaction-history";
import { TopupDialog } from "../components/topup-dialog";
import { WalletProtection } from "../components/wallet-protection";
import { TravelBenefits } from "../components/travel-benefits";
import { PaystackWebView } from "../components/paystack-webview";

const PAGE_SIZE = 10;

export function WalletView() {
  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = useState(0);
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [authorizationUrl, setAuthorizationUrl] = useState<string | null>(null);

  const { data: session, isPending: sessionPending } = authClient.useSession();
  const isAuth = !!session?.user;

  const balanceQuery = useWalletBalance(isAuth);
  const ledgerQuery = useWalletLedger(currentPage, isAuth);
  const topUpMutation = useTopUpWallet();

  const refreshAll = useCallback(() => {
    balanceQuery.refetch();
    ledgerQuery.refetch();
  }, []);

  const handleTopupSubmit = (amount: number) => {
    topUpMutation.mutate(
      { amountXOF: amount } as any,
      {
        onSuccess: (result: any) => {
          const data = result as TopUpResult;
          setIsTopupOpen(false);
          setAuthorizationUrl(data.authorizationUrl);
        },
        onError: (error: any) => {
          Alert.alert("Top-up failed", error?.message ?? "Could not initiate top-up. Please try again.");
        },
      },
    );
  };

  const handlePaymentSuccess = () => {
    setAuthorizationUrl(null);
    refreshAll();
  };

  const handlePaymentCancel = () => {
    setAuthorizationUrl(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (sessionPending || balanceQuery.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.light.background }}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!isAuth) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.light.background }}>
        <Text style={{ color: Colors.light.textSecondary, fontSize: 15 }}>Sign in to view your wallet</Text>
      </View>
    );
  }

  const balance = balanceQuery.data as WalletBalance | undefined;
  const ledgerData = ledgerQuery.data as WalletLedgerData | undefined;
  const walletId = balance?.postedBalance?.toString() ?? "";

  return (
    <View style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <SubpageHeader title="Wallet" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: Spacing.four,
          paddingTop: Spacing.two,
          paddingBottom: BottomTabInset + insets.bottom + 24,
          gap: Spacing.three,
        }}
      >
        {balance ? (
          <WalletCard
            availableBalance={balance.availableBalance}
            walletId={walletId}
            onOpenTopup={() => setIsTopupOpen(true)}
          />
        ) : null}

        {balance ? (
          <BalanceAllocation
            availableBalance={balance.availableBalance}
            reservedBalance={balance.reservedBalance}
          />
        ) : null}

        {ledgerData ? (
          <TransactionHistory
            data={ledgerData.items}
            total={ledgerData.total}
            pageSize={PAGE_SIZE}
            currentPage={currentPage}
            isLoading={ledgerQuery.isLoading}
            isFetching={ledgerQuery.isFetching}
            onPageChange={handlePageChange}
            onRefresh={refreshAll}
          />
        ) : null}

        <WalletProtection />
        <TravelBenefits />

        <View style={{ height: 20 }} />
      </ScrollView>

      <TopupDialog
        isOpen={isTopupOpen}
        onClose={() => setIsTopupOpen(false)}
        onSubmitTopup={handleTopupSubmit}
        isPending={topUpMutation.isPending}
      />

      <PaystackWebView
        authorizationUrl={authorizationUrl ?? ""}
        visible={!!authorizationUrl}
        onSuccess={handlePaymentSuccess}
        onCancel={handlePaymentCancel}
      />
    </View>
  );
}

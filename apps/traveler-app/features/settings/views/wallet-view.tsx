import { useState, useCallback, useEffect, useRef } from "react";
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
  useVerifyTopUp,
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
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 24;

const MOBILE_CALLBACK_BASE =
  `${process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.100.3:3000"}/api/payments/mobile-callback`;

export function WalletView() {
  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = useState(0);
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [authorizationUrl, setAuthorizationUrl] = useState<string | null>(null);
  const [topUpReference, setTopUpReference] = useState<string | null>(null);
  const [pendingReference, setPendingReference] = useState<string | null>(null);
  const pollCountRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: session, isPending: sessionPending } = authClient.useSession();
  const isAuth = !!session?.user;

  const balanceQuery = useWalletBalance(isAuth);
  const ledgerQuery = useWalletLedger(currentPage, isAuth);
  const topUpMutation = useTopUpWallet();
  const verifyTopUpMutation = useVerifyTopUp();

  const refreshAll = useCallback(() => {
    balanceQuery.refetch();
    ledgerQuery.refetch();
  }, []);

  // Polling loop: verifies the top-up and checks balance increase.
  // First poll establishes the baseline balance; subsequent polls compare against it.
  useEffect(() => {
    if (!pendingReference) return;

    pollCountRef.current = 0;
    let baseline: number | undefined;

    pollTimerRef.current = setInterval(async () => {
      pollCountRef.current += 1;

      if (pollCountRef.current > MAX_POLL_ATTEMPTS) {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        setPendingReference(null);
        return;
      }

      try {
        await verifyTopUpMutation.mutateAsync({ reference: pendingReference });
      } catch {
        // verify may fail until webhook arrives — keep polling
      }

      const { data: newBalance } = await balanceQuery.refetch();
      if (baseline === undefined) {
        baseline = newBalance?.availableBalance;
        return;
      }
      if (newBalance && newBalance.availableBalance > baseline) {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        setPendingReference(null);
        ledgerQuery.refetch();
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [pendingReference]);

  const handleTopupSubmit = (amount: number) => {
    topUpMutation.mutate(
      { amountXOF: amount, callbackUrl: MOBILE_CALLBACK_BASE } as any,
      {
        onSuccess: (result: any) => {
          const data = result as TopUpResult;
          setIsTopupOpen(false);
          setAuthorizationUrl(data.authorizationUrl);
          setTopUpReference(data.reference);
        },
        onError: (error: any) => {
          Alert.alert("Top-up failed", error?.message ?? "Could not initiate top-up. Please try again.");
        },
      },
    );
  };

  const handlePaymentSuccess = async (reference?: string) => {
    setAuthorizationUrl(null);

    if (reference) {
      setPendingReference(reference);
      try {
        await verifyTopUpMutation.mutateAsync({ reference });
      } catch {
        // Polling will retry
      }
    }

    refreshAll();
  };

  const handlePaymentCancel = () => {
    setAuthorizationUrl(null);
    setTopUpReference(null);
    setPendingReference(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const isVerifying = pendingReference != null;

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

      {isVerifying ? (
        <View style={{
          flexDirection: "row", alignItems: "center", gap: Spacing.two,
          paddingHorizontal: Spacing.four, paddingVertical: Spacing.two,
          backgroundColor: "#FFF3CD", marginHorizontal: Spacing.four, marginTop: Spacing.two,
          borderRadius: 12,
        }}>
          <ActivityIndicator size="small" color={Colors.light.primary} />
          <Text style={{ fontSize: 13, color: "#856404" }}>
            Verifying your top-up...
          </Text>
        </View>
      ) : null}

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
        reference={topUpReference ?? undefined}
        visible={!!authorizationUrl}
        onSuccess={handlePaymentSuccess}
        onCancel={handlePaymentCancel}
      />
    </View>
  );
}

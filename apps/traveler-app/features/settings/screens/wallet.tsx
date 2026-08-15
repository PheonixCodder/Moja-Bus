import { useState, useCallback, useEffect, useRef } from "react";
import { View, ActivityIndicator, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { SubpageHeader } from "@/components/subpage-header";
import { Text } from "@/components/ui/text";
import { BottomTabInset } from "@/constants/theme";
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
import { PromoIncentives } from "../components/promo-incentives";
import { PaystackWebView } from "../components/paystack-webview";

const PAGE_SIZE = 10;
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 24;

const MOBILE_CALLBACK_BASE =
  `${process.env["EXPO_PUBLIC_API_URL"] ?? "http://192.168.100.3:3000"}/api/payments/mobile-callback`;

export function WalletView() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation("wallet");
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

  useEffect(() => {
    if (!pendingReference) return;

    pollCountRef.current = 0;

    pollTimerRef.current = setInterval(async () => {
      pollCountRef.current += 1;

      if (pollCountRef.current > MAX_POLL_ATTEMPTS) {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        setPendingReference(null);
        return;
      }

      try {
        const result = await verifyTopUpMutation.mutateAsync({ reference: pendingReference });
        if (result.success) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setPendingReference(null);
          refreshAll();
        }
      } catch {
        // verify may fail until webhook arrives — keep polling
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
          setTopUpReference(data.reference ?? null);
        },
        onError: () => {
          Alert.alert(t("topUpFailed"), t("couldNotInitiateTopUp"));
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
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#ee237c" />
      </View>
    );
  }

  if (!isAuth) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-base text-slate-500">{t("signInToViewWallet")}</Text>
      </View>
    );
  }

  const balance = balanceQuery.data as WalletBalance | undefined;
  const ledgerData = ledgerQuery.data as WalletLedgerData | undefined;
  const walletId = balance?.postedBalance?.toString() ?? "";

  return (
    <View className="flex-1 bg-white">
      <SubpageHeader title={t("wallet")} />

      {isVerifying ? (
        <View className="flex-row items-center gap-2 px-4 py-2 bg-yellow-50 mx-4 mt-2 rounded-xl">
          <ActivityIndicator size="small" color="#ee237c" />
          <Text className="text-sm text-yellow-800">{t("verifyingTopUp")}</Text>
        </View>
      ) : null}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: BottomTabInset + insets.bottom + 24,
          gap: 12,
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

        <PromoIncentives />
        <WalletProtection />
        <TravelBenefits />

        <View className="h-5" />
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

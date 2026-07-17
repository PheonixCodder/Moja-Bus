"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQueryState, parseAsInteger } from "nuqs";
import { AlertCircle } from "lucide-react";
import { Spinner } from "@moja/ui/components/ui/spinner";

import { WalletCard } from "../components/wallet-card";
import { BalanceAllocation } from "../components/balance-allocation";
import { TopupDialog } from "../components/topup-dialog";
import { TransactionHistory } from "../components/transaction-history";
import { WalletProtection } from "../components/wallet-protection";
import { TravelBenefits } from "../components/travel-benefits";

export function PassengerWalletView() {
  const trpc = useTRPC();

  // URL state management via nuqs
  const [currentPageParam, setCurrentPageParam] = useQueryState("page", parseAsInteger.withDefault(1));
  const [topupStatus, setTopupStatus] = useQueryState("topup", { defaultValue: "" });
  const [pendingRef, setPendingRef] = useQueryState("ref", { defaultValue: "" });

  const currentPage = currentPageParam - 1; // 0-indexed for API pagination offset
  const pageSize = 20;

  // Modals / Dialog state
  const [isTopupOpen, setIsTopupOpen] = useState(false);

  // Suspense Queries (prefetching is done on the page router layer)
  const { data: balance, refetch: refetchBalance } = useSuspenseQuery(
    trpc.passenger.getWalletBalance.queryOptions()
  );

  const { data: ledgerResult, refetch: refetchLedger } = useSuspenseQuery(
    trpc.passenger.getWalletLedger.queryOptions({
      limit: pageSize,
      offset: currentPage * pageSize,
    })
  );

  // Top up mutations
  const topupMutation = useMutation(
    trpc.passenger.initiateWalletTopUp.mutationOptions({
      onSuccess: (res) => {
        toast.success("Redirecting to Paystack checkout...");
        window.location.href = res.authorizationUrl;
      },
      onError: (err) => {
        toast.error(err.message || "Failed to initialize top-up");
      },
    })
  );

  const verifyTopUpMutation = useMutation(
    trpc.passenger.verifyWalletTopUp.mutationOptions()
  );

  const handleTopupSubmit = (amount: number) => {
    topupMutation.mutate({ amountXOF: amount });
  };

  // Poll balance if a topup is pending in the URL params
  useEffect(() => {
    if (topupStatus === "pending") {
      const interval = setInterval(async () => {
        if (pendingRef) {
          try {
            await verifyTopUpMutation.mutateAsync({ reference: pendingRef });
          } catch (e) {
            console.error("Top-up verification check failed", e);
          }
        }

        const prevAvailable = balance.availableBalance;
        const { data: newBalance } = await refetchBalance();
        
        if (newBalance && newBalance.availableBalance > prevAvailable) {
          toast.success("Wallet topped up successfully!");
          // Clear query params to end polling
          void setTopupStatus(null);
          void setPendingRef(null);
          void refetchLedger();
          clearInterval(interval);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [topupStatus, pendingRef, balance.availableBalance, refetchBalance, refetchLedger, setTopupStatus, setPendingRef]);

  return (
    <div className="space-y-6">
      {topupStatus === "pending" && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs shadow-sm">
          <AlertCircle className="size-4 text-amber-600 shrink-0" />
          <div className="space-y-0.5">
            <span className="font-bold">Top-Up Verification Pending</span>
            <p className="text-amber-700">
              We are waiting for confirmation from Paystack. This page will automatically update once payment settles. Reference: <span className="font-mono">{pendingRef}</span>.
            </p>
          </div>
          <Spinner className="size-4 text-amber-600 ml-auto" />
        </div>
      )}

      {/* Two-column responsive dashboard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (Wallet & History) */}
        <div className="lg:col-span-8 space-y-6">
          <WalletCard
            availableBalance={balance.availableBalance}
            walletId={balance.postedBalance ? balance.postedBalance.toString() : ""} // Mocked placeholder mapping or similar
            onOpenTopup={() => setIsTopupOpen(true)}
          />

          <BalanceAllocation
            availableBalance={balance.availableBalance}
            reservedBalance={balance.reservedBalance}
          />

          <TransactionHistory
            ledgerResult={ledgerResult}
            pageSize={pageSize}
            currentPageParam={currentPageParam}
            setCurrentPageParam={setCurrentPageParam}
          />
        </div>

        {/* Right Column (Security & Travel Perks) */}
        <div className="lg:col-span-4 space-y-6">
          <WalletProtection />
          <TravelBenefits />
        </div>
      </div>

      {/* Top-up Dialog Flow */}
      <TopupDialog
        isOpen={isTopupOpen}
        onClose={() => setIsTopupOpen(false)}
        onSubmitTopup={handleTopupSubmit}
        isPending={topupMutation.isPending}
      />
    </div>
  );
}

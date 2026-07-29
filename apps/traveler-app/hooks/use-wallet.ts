import { useTRPC } from "@/lib/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";

const PAGE_SIZE = 10;

export interface WalletBalance {
  availableBalance: number;
  postedBalance: number;
  reservedBalance: number;
}

export interface LedgerEntry {
  id: string;
  side: "CREDIT" | "DEBIT";
  amount: number;
  description: string | null;
  effectiveAt: string;
  transactionId: string;
}

export interface WalletLedgerData {
  items: LedgerEntry[];
  total: number;
}

export interface TopUpResult {
  authorizationUrl: string;
  paystackReference?: string
}

export function useWalletBalance(enabled?: boolean) {
  const trpc = useTRPC();
  return useQuery({
    ...(trpc as any).passenger.getWalletBalance.queryOptions(),
    enabled,
  });
}

export function useWalletLedger(page: number, enabled?: boolean) {
  const trpc = useTRPC();
  return useQuery({
    ...(trpc as any).passenger.getWalletLedger.queryOptions({ limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
    enabled,
  });
}

export function useTopUpWallet() {
  const trpc = useTRPC();
  return useMutation((trpc as any).passenger.initiateWalletTopUp.mutationOptions());
}

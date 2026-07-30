import { useTRPC } from "@/lib/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";

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
  reference?: string;
}

interface TrpcQuery<TInput, TOutput> {
  queryOptions: (input: TInput) => {
    queryKey: unknown[];
    queryFn: () => Promise<TOutput>;
    meta?: Record<string, unknown>;
  };
}

interface TrpcMutation<TInput, TOutput> {
  mutationOptions: () => {
    mutationFn: (input: TInput) => Promise<TOutput>;
  };
}

type PassengerRouter = {
  getWalletBalance: TrpcQuery<void, WalletBalance>;
  getWalletLedger: TrpcQuery<{ limit: number; offset: number }, WalletLedgerData>;
  initiateWalletTopUp: TrpcMutation<{ amountXOF: number; callbackUrl?: string }, TopUpResult>;
  verifyWalletTopUp: TrpcMutation<{ reference: string }, { success: boolean }>;
};

type TypedTRPC = {
  passenger: PassengerRouter;
};

export function useWalletBalance(enabled?: boolean) {
  const trpc = useTRPC() as unknown as TypedTRPC;
  return useQuery({
    ...trpc.passenger.getWalletBalance.queryOptions(),
    enabled,
  });
}

export function useWalletLedger(page: number, enabled?: boolean) {
  const trpc = useTRPC() as unknown as TypedTRPC;
  return useQuery({
    ...trpc.passenger.getWalletLedger.queryOptions({ limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
    enabled,
  });
}

export function useTopUpWallet() {
  const trpc = useTRPC() as unknown as TypedTRPC;
  return useMutation(trpc.passenger.initiateWalletTopUp.mutationOptions());
}

export function useVerifyTopUp() {
  const trpc = useTRPC() as unknown as TypedTRPC;
  return useMutation(trpc.passenger.verifyWalletTopUp.mutationOptions());
}

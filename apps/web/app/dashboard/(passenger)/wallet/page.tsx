import { PassengerWalletView } from "@/features/passenger/views/passenger-wallet-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { PageTitleHeader } from "@/features/dashboard/components/page-title-header";

export const metadata = {
  title: "Digital Wallet — Moja Ride",
  description: "Manage your wallet balance, top up funds, and view payment history.",
};

export default async function WalletPage() {
  // Prefetch balance and first page of ledger entries for SSR efficiency
  await prefetch(trpc.passenger.getWalletBalance.queryOptions());
  await prefetch(
    trpc.passenger.getWalletLedger.queryOptions({
      limit: 20,
      offset: 0,
    })
  );

  return (
    <HydrateClient>
      <div className="flex-1 p-6 lg:p-10 max-w-6xl mx-auto w-full">
        <PageTitleHeader
          title="Digital Wallet"
          description="Manage your pre-funded wallet, top up instantly using Paystack, and review transaction ledgers."
        />

        <PassengerWalletView />
      </div>
    </HydrateClient>
  );
}

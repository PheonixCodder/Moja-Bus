import { SidebarTrigger } from "@moja/ui/components/ui/sidebar";
import { Separator } from "@moja/ui/components/ui/separator";
import { PassengerWalletView } from "@/features/passenger/views/passenger-wallet-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { PageHeader } from "@/features/dashboard/components/page-header";

export const metadata = {
  title: "Digital Wallet — Moja Ride",
  description: "Manage your wallet balance, top up funds, and view payment history.",
};

export default async function WalletPage() {
  // Prefetch balance and first page of ledger entries
  await prefetch(trpc.passenger.getWalletBalance.queryOptions());
  await prefetch(
    trpc.passenger.getWalletLedger.queryOptions({
      limit: 20,
      offset: 0,
    })
  );

  return (
    <HydrateClient>
      <div className="flex flex-1 flex-col">
        {/* Mobile Header */}
        <PageHeader title="Digital Wallet" className="lg:hidden" />
        
        {/* Desktop Header */}
        <header className="hidden lg:flex h-12 shrink-0 items-center gap-2 border-b border-border bg-bg-base px-4">
          <SidebarTrigger className="text-text-muted hover:text-text-primary" />
          <Separator orientation="vertical" className="h-4 bg-border" />
          <nav className="flex items-center gap-1 text-xs text-text-muted">
            <span>Dashboard</span>
            <span className="mx-1 text-text-muted/40">/</span>
            <span className="text-text-primary font-medium">Digital Wallet</span>
          </nav>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-8">
          <div className="hidden lg:block space-y-1">
            <h1 className="text-2xl font-bold font-display tracking-tight text-text-primary">
              Digital Wallet
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
              Manage your wallet balance, top up funds, and view payment history.
            </p>
          </div>

          <PassengerWalletView />
        </div>
      </div>
    </HydrateClient>
  );
}

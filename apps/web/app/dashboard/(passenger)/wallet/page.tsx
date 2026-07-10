import { CreditCard, Wallet, Plus, History } from "lucide-react";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { Button } from "@moja/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";

export default function WalletPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Digital Wallet" className="lg:hidden" />
      <div className="flex flex-1 flex-col gap-8 p-4 lg:p-8">
        <div className="hidden lg:block">
          <h1 className="text-2xl font-bold text-text-primary">Digital Wallet</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage your wallet balance, top up funds, and view payment history.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Balance Card */}
          <Card className="border-border bg-bg-surface md:col-span-2 overflow-hidden relative">
            <div className="absolute right-0 top-0 translate-y-2 -translate-x-2 text-text-muted/5 pointer-events-none">
              <Wallet className="w-40 h-40" />
            </div>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
                Available Balance
              </CardTitle>
              <CardDescription>Use this balance for quick checkout on ticket bookings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-4xl font-extrabold text-text-primary tracking-tight">
                0 <span className="text-xl font-normal text-text-secondary">XOF</span>
              </div>
              <div className="flex gap-3">
                <Button className="bg-primary text-white hover:bg-primary/95 gap-2">
                  <Plus className="w-4 h-4" /> Top Up Balance
                </Button>
                <Button variant="outline" className="border-border text-text-primary hover:bg-bg-elevated gap-2">
                  <CreditCard className="w-4 h-4" /> Manage Cards
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Info Card */}
          <Card className="border-border bg-bg-surface">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
                Why use Moja Wallet?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-text-secondary leading-relaxed">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">1</div>
                <div>
                  <span className="font-semibold text-text-primary block">Instant Booking</span>
                  No need to authorize mobile money or input card details at checkout.
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">2</div>
                <div>
                  <span className="font-semibold text-text-primary block">Instant Refunds</span>
                  Refunds on cancelled eligible tickets are credited to your wallet instantly.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions list */}
        <Card className="border-border bg-bg-surface">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-text-primary">Transaction History</CardTitle>
              <CardDescription>All your wallet operations and booking payments.</CardDescription>
            </div>
            <History className="w-4 h-4 text-text-muted" />
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center text-sm text-text-secondary space-y-3">
            <div className="w-10 h-10 bg-bg-elevated rounded-full flex items-center justify-center text-text-muted">
              <History className="w-5 h-5" />
            </div>
            <p>No transactions found. Your wallet history will appear here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

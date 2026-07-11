"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQueryState, parseAsInteger } from "nuqs";
import {
  Wallet,
  Plus,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Spinner } from "@moja/ui/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import { Badge } from "@moja/ui/components/ui/badge";
import { formatPriceXOF } from "@/features/search/lib/format";

export function PassengerWalletView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [currentPageParam, setCurrentPageParam] = useQueryState("page", parseAsInteger.withDefault(1));
  const [topupStatus, setTopupStatus] = useQueryState("topup", { defaultValue: "" });
  const [pendingRef, setPendingRef] = useQueryState("ref", { defaultValue: "" });

  const currentPage = currentPageParam - 1; // 0-indexed for Prisma
  const pageSize = 20;

  // Dialog State
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");

  // Suspense Queries
  const { data: balance, refetch: refetchBalance } = useSuspenseQuery(
    trpc.passenger.getWalletBalance.queryOptions()
  );

  const { data: ledgerResult, refetch: refetchLedger } = useSuspenseQuery(
    trpc.passenger.getWalletLedger.queryOptions({
      limit: pageSize,
      offset: currentPage * pageSize,
    })
  );

  // Top up mutation
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

  const handleTopupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(topupAmount);
    if (isNaN(amount) || amount < 100) {
      toast.error("Minimum top-up amount is 100 XOF");
      return;
    }

    topupMutation.mutate({ amountXOF: amount });
  };

  // Poll balance if a topup is pending
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
          // Clear query params
          void setTopupStatus(null);
          void setPendingRef(null);
          void refetchLedger();
          clearInterval(interval);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [topupStatus, pendingRef, balance.availableBalance, refetchBalance, refetchLedger, setTopupStatus, setPendingRef]);

  const getLedgerTypeStyle = (amount: number, description?: string | null) => {
    const desc = description ?? "";
    // For passenger wallet, a CREDIT ledger entry means funds added (+ XOF), a DEBIT means funds spent (- XOF).
    const isCredit = desc.toLowerCase().includes("credit") || desc.toLowerCase().includes("top up") || desc.toLowerCase().includes("refund");
    return isCredit
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-red-50 text-red-700 border-red-200";
  };

  return (
    <div className="space-y-6">
      {topupStatus === "pending" && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
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
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-extrabold text-text-primary tracking-tight">
                {balance.availableBalance.toLocaleString()}
              </div>
              <span className="text-xl font-normal text-text-secondary">XOF</span>
            </div>

            {balance.reservedBalance > 0 && (
              <div className="text-xs text-text-secondary flex items-center gap-1.5 bg-slate-50 p-2.5 rounded border border-slate-100 w-fit">
                <AlertCircle className="size-3.5 text-blue-500" />
                <span>
                  Reserved Balance: <span className="font-bold text-text-primary">{balance.reservedBalance.toLocaleString()} XOF</span> (locked in active booking checkouts)
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setTopupAmount("");
                  setIsTopupOpen(true);
                }}
                className="bg-[#ee237c] text-white hover:bg-[#d01867] gap-2 font-bold h-10 px-5"
              >
                <Plus className="w-4 h-4" /> Top Up Balance
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Benefits Card */}
        <Card className="border-border bg-bg-surface">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <TrendingUp className="size-4 text-primary" />
              Moja Wallet Benefits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-text-secondary leading-relaxed">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">1</div>
              <div>
                <span className="font-semibold text-text-primary block">Instant Booking</span>
                Skip Mobile Money authorization delays or card checks during peak ticket booking times.
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">2</div>
              <div>
                <span className="font-semibold text-text-primary block">Instant Refunds</span>
                Cancellations are instantly credited to your wallet balance for immediate re-booking.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="border-border bg-bg-surface">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-text-primary">Transaction History</CardTitle>
            <CardDescription>Wallet deposits, refunds, and ticket bookings.</CardDescription>
          </div>
          <History className="w-4 h-4 text-text-muted" />
        </CardHeader>
        <CardContent className="p-0">
          {ledgerResult && ledgerResult.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-text-secondary space-y-3">
              <div className="w-10 h-10 bg-bg-elevated rounded-full flex items-center justify-center text-text-muted">
                <History className="w-5 h-5" />
              </div>
              <p>No transactions found. Your wallet history will appear here.</p>
            </div>
          ) : ledgerResult ? (
            <div className="space-y-4 p-4">
              <div className="border border-border rounded-md bg-white overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Type</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Amount</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Description</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerResult.items.map((entry) => {
                      const desc = entry.description ?? "";
                      const isCredit = desc.toLowerCase().includes("credit") || desc.toLowerCase().includes("top up") || desc.toLowerCase().includes("refund");
                      return (
                        <TableRow key={entry.id} className="hover:bg-slate-50/50">
                          <TableCell className="px-4 py-3">
                            <Badge className={getLedgerTypeStyle(entry.amount, desc)}>
                              {isCredit ? (
                                <span className="flex items-center gap-1">
                                  <ArrowDownLeft className="size-3" />
                                  Credit
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <ArrowUpRight className="size-3" />
                                  Debit
                                </span>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-slate-900 text-xs font-bold">
                            {isCredit ? "+" : "-"}
                            {entry.amount.toLocaleString()} XOF
                          </TableCell>
                          <TableCell className="px-4 py-3 text-slate-600 text-xs">{entry.description}</TableCell>
                          <TableCell className="px-4 py-3 text-slate-500 text-xs">
                            {new Date(entry.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {ledgerResult.total > pageSize && (
                <div className="flex justify-between items-center text-xs pt-2">
                  <span className="text-slate-500 font-medium">
                    Showing {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, ledgerResult.total)} of {ledgerResult.total} entries
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPageParam === 1}
                      onClick={() => setCurrentPageParam((p) => p - 1)}
                      className="h-8 text-xs font-semibold"
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPageParam * pageSize >= ledgerResult.total}
                      onClick={() => setCurrentPageParam((p) => p + 1)}
                      className="h-8 text-xs font-semibold"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Top-up Dialog */}
      <Dialog open={isTopupOpen} onOpenChange={(open) => !open && setIsTopupOpen(false)}>
        <DialogContent className="max-w-md border border-border bg-white rounded-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Top Up Moja Wallet</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Load prepaid balance into your Moja Ride digital wallet using card or mobile money. Minimum deposit is 100 XOF.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTopupSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Deposit Amount (XOF)
              </label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="e.g. 5000"
                  min="100"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  required
                  className="pr-12"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">XOF</span>
              </div>
            </div>

            <DialogFooter className="pt-4 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                className="h-9"
                onClick={() => setIsTopupOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary-hover text-white h-9"
                disabled={topupMutation.isPending}
              >
                {topupMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 size-3.5 text-white" />
                    Initializing...
                  </>
                ) : (
                  "Proceed to Paystack"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

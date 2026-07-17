"use client";

import * as React from "react";
import { Plus, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { Button } from "@moja/ui/components/ui/button";

interface LedgerEntryItem {
  id: string;
  side: "DEBIT" | "CREDIT";
  amount: bigint | number;
  description: string | null;
  createdAt: Date;
}

interface WalletQuickDepositProps {
  recentTransactions: LedgerEntryItem[];
}

export function WalletQuickDeposit({ recentTransactions }: WalletQuickDepositProps) {
  const trpc = useTRPC();
  const [amount, setAmount] = React.useState("");

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

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInt(amount);
    if (isNaN(numAmount) || numAmount < 100) {
      toast.error("Minimum top-up amount is 100 XOF");
      return;
    }
    topupMutation.mutate({ amountXOF: numAmount });
  };

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-foreground">Wallet Hub</CardTitle>
        <CardDescription className="text-[10px] text-muted-foreground">
          Fund balance or check recent statements.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleDeposit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              placeholder="Amount (XOF)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden pr-12 font-mono"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-foreground font-mono">
              XOF
            </span>
          </div>
          <Button
            type="submit"
            size="sm"
            className="h-9 px-3 shrink-0 gap-1.5 font-semibold bg-primary text-white hover:bg-primary/95"
            disabled={topupMutation.isPending}
          >
            <Plus className="size-3.5" />
            Deposit
          </Button>
        </form>

        {recentTransactions.length > 0 && (
          <div className="space-y-2 border-t border-border/60 pt-3">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Recent Activity
            </h4>
            <div className="space-y-1.5">
              {recentTransactions.map((entry) => {
                const amountNum = Math.abs(Number(entry.amount));
                const isDeposit =
                  entry.side === "DEBIT" ||
                  (entry.description?.toLowerCase().includes("topup") ?? false) ||
                  (entry.description?.toLowerCase().includes("deposit") ?? false);

                return (
                  <div key={entry.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isDeposit ? (
                        <ArrowDownLeft className="size-3 text-emerald-500 shrink-0" />
                      ) : (
                        <ArrowUpRight className="size-3 text-amber-500 shrink-0" />
                      )}
                      <span className="text-[10px] text-muted-foreground truncate">
                        {entry.description || (isDeposit ? "Wallet Deposit" : "Ticket Payment")}
                      </span>
                    </div>
                    <span
                      className={`font-mono text-[10px] font-bold shrink-0 ${
                        isDeposit ? "text-emerald-600" : "text-foreground"
                      }`}
                    >
                      {isDeposit ? "+" : "-"}{amountNum.toLocaleString("fr-FR")} XOF
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

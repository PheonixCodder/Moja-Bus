"use client";

import { useState } from "react";
import { useSuspenseQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import {
  Building2,
  Coins,
  ReceiptText,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@moja/ui/components/ui/card";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { Spinner } from "@moja/ui/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { cn } from "@moja/ui/lib/utils";

function formatXOF(amount: number): string {
  return new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface SettlementsPayoutPanelProps {
  onSuccess?: () => void;
}

export function SettlementsPayoutPanel({ onSuccess }: SettlementsPayoutPanelProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [amountStr, setAmountStr] = useState("");
  const [note, setNote] = useState("");

  // Fetch operators list
  const { data: operators } = useSuspenseQuery(
    trpc.public.listOperators.queryOptions()
  );

  // Lazily fetch operator ledger once a company is selected
  const { data: operatorLedger, isLoading: isLoadingLedger } = useQuery({
    ...trpc.payments.exportOperatorLedger.queryOptions({ companyId: selectedCompanyId }),
    enabled: !!selectedCompanyId,
  });

  const { mutate: recordSettlement, isPending } = useMutation(
    trpc.payments.recordSettlement.mutationOptions({
      onSuccess: () => {
        toast.success("Settlement recorded successfully");
        setAmountStr("");
        setNote("");
        setSelectedCompanyId("");
        queryClient.invalidateQueries(trpc.payments.getTreasuryOverview.pathFilter());
        queryClient.invalidateQueries(trpc.payments.listSettlementHistory.pathFilter());
        onSuccess?.();
      },
      onError: (err) => {
        toast.error(err.message || "Failed to record settlement");
      },
    })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(amountStr.replace(/\D/g, ""), 10);
    if (!selectedCompanyId) {
      toast.error("Please select an operator");
      return;
    }
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!note.trim()) {
      toast.error("Please enter a reference note");
      return;
    }
    if (operatorLedger && amount > operatorLedger.balanceXOF) {
      toast.error("Amount exceeds operator posted balance");
      return;
    }

    recordSettlement({
      companyId: selectedCompanyId,
      amountXOF: amount,
      note: note.trim(),
    });
  };

  const selectedOperatorName = operators.find((o) => o.id === selectedCompanyId)?.name;
  const balance = operatorLedger?.balanceXOF ?? null;
  const amount = parseInt(amountStr.replace(/\D/g, ""), 10) || 0;
  const exceedsBalance = balance !== null && amount > balance;

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50">
            <Coins className="size-4.5 text-amber-600" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-foreground">
              Record Manual Offline Settlement
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              Use this when an operator has been paid offline (cash or bank transfer) and the
              ledger needs to be updated to reflect the disbursement.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Left column — operator select + balance card */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">
                  Operator
                </Label>
                <Select
                  value={selectedCompanyId}
                  onValueChange={(v) => {
                    setSelectedCompanyId(v ?? "");
                    setAmountStr("");
                  }}
                >
                  <SelectTrigger
                    id="settlement-operator"
                    className="h-10 border-border bg-background text-sm"
                  >
                    <SelectValue placeholder="Select a transport company…" />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-popover">
                    {operators.map((op) => (
                      <SelectItem key={op.id} value={op.id} className="text-sm">
                        {op.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Balance preview */}
              <div
                className={cn(
                  "rounded-lg border p-4 transition-colors duration-200",
                  selectedCompanyId
                    ? "border-border bg-muted/40"
                    : "border-dashed border-border/50 bg-muted/20"
                )}
              >
                {!selectedCompanyId ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="size-4 text-muted-foreground/50" />
                    Select an operator above to preview their posted balance.
                  </div>
                ) : isLoadingLedger ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Spinner className="size-3.5" />
                    Loading balance…
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {selectedOperatorName}
                    </p>
                    <p className="text-2xl font-bold tracking-tight text-foreground">
                      {balance !== null ? formatXOF(balance) : "—"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Posted balance ({operatorLedger?.entryCount ?? 0} ledger entries)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right column — amount + note */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="settlement-amount"
                  className="text-xs font-semibold text-foreground/70 uppercase tracking-wide"
                >
                  Amount (XOF)
                </Label>
                <Input
                  id="settlement-amount"
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 500000"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value.replace(/\D/g, ""))}
                  className={cn(
                    "h-10 border-border bg-background font-mono text-sm",
                    exceedsBalance && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                {exceedsBalance && (
                  <p className="flex items-center gap-1 text-[11px] text-destructive">
                    <AlertTriangle className="size-3" />
                    Exceeds operator&apos;s posted balance of {formatXOF(balance!)}
                  </p>
                )}
                {amount > 0 && !exceedsBalance && (
                  <p className="text-[11px] text-muted-foreground">
                    = {formatXOF(amount)}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="settlement-note"
                  className="text-xs font-semibold text-foreground/70 uppercase tracking-wide"
                >
                  Reference Note <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="settlement-note"
                  type="text"
                  placeholder="e.g. Handed cash at Abidjan office – Jul 14"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="h-10 border-border bg-background text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  This note is permanently recorded in the ledger.
                </p>
              </div>

              <Button
                id="settlement-submit-btn"
                type="submit"
                disabled={isPending || !selectedCompanyId || !amountStr || !note.trim() || exceedsBalance}
                className="mt-1 w-full h-10 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 font-semibold text-sm"
              >
                {isPending ? (
                  <><Spinner className="size-4 mr-2" /> Recording…</>
                ) : (
                  <><ReceiptText className="size-4 mr-2" /> Record Manual Settlement</>
                )}
              </Button>
            </div>
          </div>

          {/* Warning callout */}
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
            <p className="text-[11px] leading-relaxed text-amber-700">
              This action is <strong>irreversible</strong>. It debits the operator&apos;s receivable
              ledger and credits the Paystack clearing account. Only record this if you have
              physically transferred the funds outside of the Paystack payout system.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

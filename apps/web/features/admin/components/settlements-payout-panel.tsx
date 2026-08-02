"use client";

import { useState } from "react";
import { useSuspenseQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
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
  return new Intl.NumberFormat("en-US", {
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
  const t = useTranslations("adminDashboard.settlementsPayoutPanel");
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
        toast.success(t("settlementRecorded"));
        setAmountStr("");
        setNote("");
        setSelectedCompanyId("");
        queryClient.invalidateQueries(trpc.payments.getTreasuryOverview.pathFilter());
        queryClient.invalidateQueries(trpc.payments.listSettlementHistory.pathFilter());
        onSuccess?.();
      },
      onError: (err) => {
        toast.error(err.message || t("failedToRecordSettlement"));
      },
    })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(amountStr.replace(/\D/g, ""), 10);
    if (!selectedCompanyId) {
      toast.error(t("pleaseSelectOperator"));
      return;
    }
    if (!amount || amount <= 0) {
      toast.error(t("pleaseEnterValidAmount"));
      return;
    }
    if (!note.trim()) {
      toast.error(t("pleaseEnterReferenceNote"));
      return;
    }
    if (operatorLedger && amount > operatorLedger.balanceXOF) {
      toast.error(t("exceedsBalance"));
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
              {t("recordManualOfflineSettlement")}
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              {t("settlementDescription")}
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
                  {t("operator")}
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
                    <SelectValue placeholder={t("selectOperatorPlaceholder")} />
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
                    {t("selectOperatorToPreview")}
                  </div>
                ) : isLoadingLedger ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Spinner className="size-3.5" />
                    {t("loadingBalance")}
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
                      {t("postedBalance", { count: operatorLedger?.entryCount ?? 0 })}
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
                  {t("amountXOF")}
                </Label>
                <Input
                  id="settlement-amount"
                  type="text"
                  inputMode="numeric"
                  placeholder={t("amountPlaceholder")}
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
                    {t("exceedsBalanceMessage", { balance: formatXOF(balance!) })}
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
                  {t("referenceNote")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="settlement-note"
                  type="text"
                  placeholder={t("notePlaceholder")}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="h-10 border-border bg-background text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  {t("noteDescription")}
                </p>
              </div>

              <Button
                id="settlement-submit-btn"
                type="submit"
                disabled={isPending || !selectedCompanyId || !amountStr || !note.trim() || exceedsBalance}
                className="mt-1 w-full h-10 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 font-semibold text-sm"
              >
                {isPending ? (
                  <><Spinner className="size-4 mr-2" /> {t("recording")}</>
                ) : (
                  <><ReceiptText className="size-4 mr-2" /> {t("recordManualSettlement")}</>
                )}
              </Button>
            </div>
          </div>

          {/* Warning callout */}
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
            <p className="text-[11px] leading-relaxed text-amber-700">
              {t("irreversibleWarning")}
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

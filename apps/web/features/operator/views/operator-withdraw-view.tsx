"use client";

import { useTranslations } from "next-intl";
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { Button } from "@moja/ui/components/ui/button";
import { Wallet, Info, AlertCircle, History } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import Link from "next/link";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { useQueryState, parseAsInteger } from "nuqs";
import { toXOFBigInt, toSafeDisplayNumber } from "@/lib/money";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import { Badge } from "@moja/ui/components/ui/badge";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { useStaffPermissions } from "@/features/operator/hooks/use-staff-permissions";

export function OperatorWithdrawView() {
  const t = useTranslations("operatorDashboard.withdraw");
  const trpc = useTRPC();
  const { can } = useStaffPermissions();
  const [amountXOF, setAmountXOF] = useState<string>("");
  // Stable per-attempt nonce sent to the server so a duplicate request
  // (double-click before the button disables, network retry) is treated as
  // exactly-once instead of initiating a second payout.
  const [withdrawNonce, setWithdrawNonce] = useState<string>(() => crypto.randomUUID());

  const [currentPageParam, setCurrentPageParam] = useQueryState(
    "withdrawPage",
    parseAsInteger.withDefault(1)
  );

  // Withdrawal controls (F-18): whether 2FA is required + the frequency window.
  const { data: withdrawalControls } = useSuspenseQuery(
    trpc.operator.getWithdrawalControls.queryOptions()
  );
  const require2FA = Boolean(withdrawalControls?.require2FA);
  const frequencyHours = withdrawalControls?.frequencyHours ?? 0;

  // Withdrawal 2FA challenge state (F-18).
  const [twoFactorCode, setTwoFactorCode] = useState<string>("");
  const [challengeSent, setChallengeSent] = useState<boolean>(false);

  const currentPage = currentPageParam - 1; // 0-indexed for database
  const pageSize = 10;

  // Query live balances
  const { data: snapshot, refetch } = useSuspenseQuery(
    trpc.operator.getAccountSnapshot.queryOptions({ period: "DAILY" })
  );

  const { data: settings } = useSuspenseQuery(
    trpc.operator.getSettings.queryOptions()
  );

  const bankAccounts = settings.company.bankAccounts ?? [];
  const defaultBank =
    bankAccounts.find((b) => b.isDefault) ?? bankAccounts[0];
  const bankVerified = Boolean(
    defaultBank?.isVerified && defaultBank?.paystackTransferRecipientCode,
  );

  // Query withdrawals history list
  const { data: withdrawals, refetch: refetchWithdrawals } = useSuspenseQuery(
    trpc.operator.listWithdrawals.queryOptions({
      limit: pageSize,
      offset: currentPage * pageSize,
    })
  );

  const withdrawMutation = useMutation(
    trpc.operator.requestWithdrawal.mutationOptions({
      onSuccess: () => {
        toast.success(t("toast.success"));
        setAmountXOF("");
        // Fresh nonce + clear 2FA state for the next withdrawal attempt.
        setWithdrawNonce(crypto.randomUUID());
        setTwoFactorCode("");
        setChallengeSent(false);
        refetch();
        refetchWithdrawals();
      },
      onError: (err: any) => {
        toast.error(err.message || t("toast.failed"));
        // Allow a genuine retry after a failure with a new nonce.
        setWithdrawNonce(crypto.randomUUID());
      },
    })
  );

  // Requests a withdrawal 2FA code (F-18).
  const challengeMutation = useMutation(
    trpc.operator.requestWithdrawalChallenge.mutationOptions({
      onSuccess: () => {
        setChallengeSent(true);
        toast.success(t("toast.codeSent"));
      },
      onError: (err: any) => {
        toast.error(err.message || t("toast.codeFailed"));
      },
    })
  );

  const availableBalance = toXOFBigInt(snapshot.liveAvailableBalance);
  const reservedBalance = toXOFBigInt(snapshot.liveReservedBalance);
  const postedBalance = toXOFBigInt(snapshot.livePostedBalance);
  const escrowBalance = reservedBalance;
  // Buckets must always reconcile: posted = available + reserved.
  // Momentary divergence means a ledger/cron write is in flight.
  const balancesReconciling =
    postedBalance !== availableBalance + reservedBalance;

  const handleWithdraw = () => {
    const parsedAmount = parseInt(amountXOF.replace(/\D/g, ""), 10);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error(t("toast.invalidAmount"));
      return;
    }
    if (toXOFBigInt(parsedAmount) > availableBalance) {
      toast.error(t("toast.insufficientBalance"));
      return;
    }
    withdrawMutation.mutate({
      amountXOF: parsedAmount,
      idempotencyKey: withdrawNonce,
      ...(require2FA ? { twoFactorCode: twoFactorCode.trim() } : {}),
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900">
          {t("title")}
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
          {t("description")}
        </p>
      </div>

      {!bankVerified ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1 text-sm text-amber-900">
            <p className="font-semibold">{t("bankNotVerifiedTitle")}</p>
            <p className="text-amber-800 mt-0.5">
              {t("bankNotVerifiedDesc")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            render={<Link href="/dashboard/operator/settings" />}
            nativeButton={false}
          >
            {t("goToSettings")}
          </Button>
        </div>
      ) : null}

      {balancesReconciling ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1 text-sm text-amber-900">
            <p className="font-semibold">{t("reconcilingTitle")}</p>
            <p className="text-amber-800 mt-0.5">
              {t("reconcilingDesc")}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              {t("availableBalance")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-950">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "XOF",
                maximumFractionDigits: 0,
              }).format(availableBalance)}
            </div>
            <p className="text-xs text-emerald-600/80 mt-1">{t("readyForWithdrawal")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Info className="h-4 w-4" />
              {t("inEscrow")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "XOF",
                maximumFractionDigits: 0,
              }).format(escrowBalance)}
            </div>
            <p className="text-xs text-slate-500 mt-1">{t("escrowDescription")}</p>
          </CardContent>
        </Card>
      </div>

      {can("withdrawals:create") ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("requestPayout")}</CardTitle>
            <CardDescription>
              {t("requestPayoutDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="amount">{t("amount")}</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={amountXOF}
                  onChange={(e) => setAmountXOF(e.target.value)}
                  min="0"
                  max={toSafeDisplayNumber(availableBalance)}
                  disabled={withdrawMutation.isPending || availableBalance <= 0n}
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">XOF</span>
              </div>
              {availableBalance > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("maxAvailable", {
                    amount: new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "XOF",
                      maximumFractionDigits: 0,
                    }).format(availableBalance)
                  })}
                </p>
              )}
            </div>
            {require2FA ? (
              <div className="space-y-2">
                <Label htmlFor="twoFactorCode">{t("confirmationCode")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="twoFactorCode"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder={t("codePlaceholder")}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    disabled={withdrawMutation.isPending}
                    className="max-w-[200px]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                  onClick={() => challengeMutation.mutate({})}
                  disabled={challengeMutation.isPending || withdrawMutation.isPending}
                >
                  {challengeMutation.isPending
                    ? t("sending")
                    : challengeSent
                      ? t("resendCode")
                      : t("sendCode")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("codeDescription")}
              </p>
            </div>
          ) : null}

          <Button
            className="w-full"
            onClick={handleWithdraw}
            disabled={
              withdrawMutation.isPending ||
              availableBalance <= 0n ||
              !amountXOF ||
              !bankVerified ||
              (require2FA && !twoFactorCode.trim())
            }
          >
            {withdrawMutation.isPending ? (
              <>
                <Spinner className="mr-2 size-3.5 text-white" />
                {t("processing")}
              </>
            ) : (
              t("request")
            )}
          </Button>

          <div className="rounded-lg bg-amber-50 p-4 border border-amber-100 mt-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <div className="space-y-1 text-sm text-amber-800">
                <p className="font-medium">{t("withdrawRules")}</p>
                <ul className="list-disc pl-4 space-y-1 text-amber-700/90 text-xs">
                  <li>{t("minAmountRule")}</li>
                  {frequencyHours > 0 ? (
                    <li>{t("frequencyRule", { frequencyHours })}</li>
                  ) : null}
                  {require2FA ? (
                    <li>{t("codeRequiredRule")}</li>
                  ) : null}
                  <li>{t("feeRule")}</li>
                  <li>{t("settlementRule")}</li>
                  <li className="font-semibold text-amber-900 mt-2">
                    {t("warningRule")}
                  </li>
                </ul>
              </div>
            </div>
          </div>
          </CardContent>
        </Card>
      ) : null}

       {/* Withdrawal History Card */}
      <Card className="border border-border bg-white rounded-lg shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">{t("history")}</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {t("historyDescription")}
            </CardDescription>
          </div>
          <History className="h-5 w-5 text-slate-400" />
        </CardHeader>
        <CardContent className="p-0">
          {withdrawals && withdrawals.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-slate-500 space-y-3">
              <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                <History className="h-5 w-5" />
              </div>
              <p>{t("noWithdrawals")}</p>
            </div>
          ) : withdrawals ? (
            <div className="space-y-4 p-4">
              <div className="border border-border rounded-md bg-white overflow-hidden shadow-xs">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">{t("columns.dateId")}</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">{t("columns.transferDetails")}</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">{t("columns.status")}</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4 text-right">{t("columns.grossPayout")}</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4 text-right">{t("columns.paystackFee")}</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4 text-right">{t("columns.netSettled")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.items.map((tx) => {
                      const metadata = (tx.metadata as any) || {};
                      const fee = metadata.fee !== undefined ? Number(metadata.fee) : 100;
                      // The gross amount is the debit from the operator account
                      const grossAmount = toSafeDisplayNumber(tx.entries[0]?.amount);
                      const netAmount = Math.max(0, grossAmount - fee);

                      let statusBadge = (
                        <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          {t("statusBadge.pending")}
                        </Badge>
                      );
                      if (tx.status === "SETTLED") {
                        statusBadge = (
                          <Badge className="bg-green-50 text-green-700 border-green-200">
                            {t("statusBadge.settled")}
                          </Badge>
                        );
                      } else if (tx.status === "FAILED" || tx.status === "REVERSED") {
                        statusBadge = (
                          <Badge className="bg-red-50 text-red-700 border-red-200">
                            {t("statusBadge.failed")}
                          </Badge>
                        );
                      }

                      return (
                        <TableRow key={tx.id} className="hover:bg-slate-50/50">
                          <TableCell className="px-4 py-3">
                            <div className="space-y-0.5">
                              <div className="text-xs font-medium text-slate-900">
                                {new Date(tx.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">
                                {t("txLabel", { id: tx.id.slice(-8).toUpperCase() })}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="space-y-0.5">
                              <div className="text-xs text-slate-700 font-medium">
                                {t("paystackCode", { code: tx.externalPaymentId || t("na") })}
                              </div>
                              {metadata.bankAccountId && (
                                <div className="text-[10px] text-slate-500">
                                  {t("settledToBank")}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">{statusBadge}</TableCell>
                          <TableCell className="px-4 py-3 text-right text-xs font-semibold text-slate-900">
                            {grossAmount.toLocaleString()} XOF
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right text-xs text-slate-500">
                            {fee.toLocaleString()} XOF
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right text-xs font-bold text-slate-900">
                            {netAmount.toLocaleString()} XOF
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {withdrawals.total > pageSize && (
                <div className="flex justify-between items-center text-xs pt-2">
                  <span className="text-slate-500 font-medium">
                    {t("pagination", {
                      start: currentPage * pageSize + 1,
                      end: Math.min((currentPage + 1) * pageSize, withdrawals.total),
                      total: withdrawals.total
                    })}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPageParam === 1}
                      onClick={() => setCurrentPageParam((p) => p - 1)}
                      className="h-8 text-xs font-semibold"
                    >
                      {t("previous")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPageParam * pageSize >= withdrawals.total}
                      onClick={() => setCurrentPageParam((p) => p + 1)}
                      className="h-8 text-xs font-semibold"
                    >
                      {t("next")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

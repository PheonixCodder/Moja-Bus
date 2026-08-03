"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { formatXOF } from "@/features/operator/lib/currency";
import { WithdrawalRow } from "./withdrawals-columns";
import { toast } from "sonner";
import { TRPCClientError } from "@trpc/client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import { Button } from "@moja/ui/components/ui/button";
import { Textarea } from "@moja/ui/components/ui/textarea";
import { Label } from "@moja/ui/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@moja/ui/components/ui/radio-group";
import { useTranslations } from "next-intl";

interface WithdrawalsResolveDialogProps {
  row: WithdrawalRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function WithdrawalsResolveDialog({
  row,
  open,
  onOpenChange,
  onSuccess,
}: WithdrawalsResolveDialogProps) {
  const trpc = useTRPC();
  const t = useTranslations("adminDashboard.withdrawalsResolveDialog");
  const [action, setAction] = useState<"FORCE_COMPLETE" | "FORCE_FAIL">("FORCE_COMPLETE");
  const [reason, setReason] = useState("");

  const resolveMutation = useMutation(
    trpc.admin.resolveWithdrawal.mutationOptions({
      onSuccess: () => {
        toast.success(
          action === "FORCE_COMPLETE"
            ? t("settledSuccess")
            : t("failedSuccess")
        );
        setReason("");
        onSuccess();
      },
      onError: (err: any) => {
        toast.error(
          err instanceof TRPCClientError
            ? err.message
            : t("resolveError")
        );
      },
    })
  );

  if (!row) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-bg-muted border border-border">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-text-primary">
                {row.companyName}
              </span>
              <span className="text-xs text-text-muted">
                {t("ref")}: {row.id.split("-")[0]}
              </span>
            </div>
            <div className="text-lg font-mono font-bold text-text-primary">
              {formatXOF(row.amount)}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Label>{t("resolutionAction")}</Label>
            <RadioGroup
              value={action}
              onValueChange={(val) => setAction(val as "FORCE_COMPLETE" | "FORCE_FAIL")}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="FORCE_COMPLETE"
                  id="force-complete"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="force-complete"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-border bg-transparent p-4 hover:bg-bg-muted hover:text-text-primary peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-50 dark:peer-data-[state=checked]:bg-emerald-950/20 [&:has([data-state=checked])]:border-emerald-500 cursor-pointer"
                >
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {t("forceSettle")}
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="FORCE_FAIL"
                  id="force-fail"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="force-fail"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-border bg-transparent p-4 hover:bg-bg-muted hover:text-text-primary peer-data-[state=checked]:border-rose-500 peer-data-[state=checked]:bg-rose-50 dark:peer-data-[state=checked]:bg-rose-950/20 [&:has([data-state=checked])]:border-rose-500 cursor-pointer"
                >
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    {t("forceFail")}
                  </span>
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-text-muted mt-1">
              {action === "FORCE_COMPLETE"
                ? t("forceSettleDesc")
                : t("forceFailDesc")}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="reason">
              {t("resolutionNote")} <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder={t("resolutionNotePlaceholder")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() =>
              resolveMutation.mutate({
                transactionId: row.id,
                action,
                reason,
              })
            }
            disabled={!reason.trim() || resolveMutation.isPending}
            className={action === "FORCE_COMPLETE" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-rose-600 hover:bg-rose-700 text-white"}
          >
            {resolveMutation.isPending ? t("applying") : t("applyResolution")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

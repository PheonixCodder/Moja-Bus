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
  const [action, setAction] = useState<"FORCE_COMPLETE" | "FORCE_FAIL">("FORCE_COMPLETE");
  const [reason, setReason] = useState("");

  const resolveMutation = useMutation(
    trpc.admin.resolveWithdrawal.mutationOptions({
      onSuccess: () => {
        toast.success(
          `Withdrawal successfully ${action === "FORCE_COMPLETE" ? "settled" : "failed"}!`
        );
        setReason("");
        onSuccess();
      },
      onError: (err: any) => {
        toast.error(
          err instanceof TRPCClientError
            ? err.message
            : "Failed to resolve withdrawal."
        );
      },
    })
  );

  if (!row) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Resolve Withdrawal Request</DialogTitle>
          <DialogDescription>
            Manually force the completion or failure of a pending payout.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-bg-muted border border-border">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-text-primary">
                {row.companyName}
              </span>
              <span className="text-xs text-text-muted">
                Ref: {row.id.split("-")[0]}
              </span>
            </div>
            <div className="text-lg font-mono font-bold text-text-primary">
              {formatXOF(row.amount)}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Label>Resolution Action</Label>
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
                    Force Settle (Paid)
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
                    Force Fail (Reverse)
                  </span>
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-text-muted mt-1">
              {action === "FORCE_COMPLETE"
                ? "Marks the status as SETTLED. Use this if the funds successfully left Paystack but the webhook was missed."
                : "Marks the status as FAILED and reverses the ledger entries. Use this if the transfer bounced."}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="reason">
              Resolution Note / Ticket ID <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="e.g. Confirmed paid via Paystack dashboard (Ticket #1234)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
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
            {resolveMutation.isPending ? "Applying..." : "Apply Resolution"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

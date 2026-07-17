"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import { Button } from "@moja/ui/components/ui/button";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { approveVerificationFormSchema } from "../lib/schemas";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@moja/ui/components/ui/combobox";

interface VerificationsApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCompany: any;
  selectedBankCode: string;
  setSelectedBankCode: (code: string) => void;
  paystackBanks: any[] | undefined;
  onSuccess: () => void;
}

export function VerificationsApproveDialog({
  open,
  onOpenChange,
  selectedCompany,
  selectedBankCode,
  setSelectedBankCode,
  paystackBanks,
  onSuccess,
}: VerificationsApproveDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [validationError, setValidationError] = useState<string | null>(null);

  const verifyMutation = useMutation(
    trpc.admin.verifyOperator.mutationOptions({
      onSuccess: (res) => {
        toast.success(`Company approved! Paystack recipient ${res.recipientCode} created.`);
        onOpenChange(false);
        onSuccess();
        queryClient.invalidateQueries(trpc.admin.listCompaniesForVerification.pathFilter());
      },
      onError: (err) => {
        toast.error(err.message || "Failed to verify company");
      },
    })
  );

  const handleConfirm = () => {
    const result = approveVerificationFormSchema.safeParse({ bankCode: selectedBankCode });
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid bank code selection";
      setValidationError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    setValidationError(null);

    verifyMutation.mutate({
      companyId: selectedCompany.id,
      bankCode: selectedBankCode,
    });
  };

  const pendingBank =
    selectedCompany?.bankAccounts?.find((b: any) => !b.isVerified) ||
    selectedCompany?.bankAccounts?.[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border border-border bg-white rounded-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900">
            Verify & Register Transfer Recipient
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            To enable withdrawals, map the bank details below to the correct Ivory Coast bank code to create the Paystack Transfer Recipient.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="rounded border border-slate-100 p-3 bg-slate-50 space-y-1.5 text-xs text-slate-600">
            <div>
              <span className="font-semibold text-slate-700">Bank Name (Operator Input):</span>{" "}
              {pendingBank?.bankName || "N/A"}
            </div>
            <div>
              <span className="font-semibold text-slate-700">Account Number:</span> ••••••••••••
              {pendingBank?.accountNumberLast4 || "N/A"}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Settlement Bank Code (Paystack List)
            </label>
            <Combobox
              items={[
                { label: "-- Select Bank Code --", value: "" },
                ...(paystackBanks?.map((bank: any) => ({
                  label: `${bank.code} - ${bank.name}`,
                  value: bank.code,
                })) ?? []),
              ]}
              value={selectedBankCode}
              onValueChange={(val) => {
                setSelectedBankCode(val ?? "");
                setValidationError(null);
              }}
            >
              <ComboboxInput
                placeholder="Search bank..."
                className="w-full h-10"
              />
              <ComboboxContent>
                <ComboboxEmpty>No bank found.</ComboboxEmpty>
                <ComboboxList>
                  {paystackBanks?.map((bank: any) => (
                    <ComboboxItem key={bank.code} value={bank.code}>
                      {bank.code} — {bank.name}
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            {validationError && (
              <p className="text-xs text-destructive font-medium">{validationError}</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" className="h-9" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90 text-white h-9"
            disabled={verifyMutation.isPending}
            onClick={handleConfirm}
          >
            {verifyMutation.isPending ? (
              <>
                <Spinner className="mr-2 size-3.5 text-white" />
                Registering...
              </>
            ) : (
              "Confirm Verification"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

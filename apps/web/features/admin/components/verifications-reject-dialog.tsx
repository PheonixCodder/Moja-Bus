"use client";

import { Button } from "@moja/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { rejectVerificationFormSchema } from "../lib/schemas";

interface VerificationsRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCompany: any;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  onSuccess: () => void;
}

export function VerificationsRejectDialog({
  open,
  onOpenChange,
  selectedCompany,
  rejectionReason,
  setRejectionReason,
  onSuccess,
}: VerificationsRejectDialogProps) {
  const t = useTranslations("adminDashboard.verificationsRejectDialog");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [validationError, setValidationError] = useState<string | null>(null);

  const rejectMutation = useMutation(
    trpc.admin.rejectOperator.mutationOptions({
      onSuccess: () => {
        toast.success(t("verificationRejected"));
        onOpenChange(false);
        onSuccess();
        queryClient.invalidateQueries(
          trpc.admin.listCompaniesForVerification.pathFilter(),
        );
      },
      onError: (err) => {
        toast.error(err.message || t("failedToRejectCompany"));
      },
    }),
  );

  const handleConfirm = () => {
    const result = rejectVerificationFormSchema.safeParse({
      reason: rejectionReason,
    });
    if (!result.success) {
      const errorMsg =
        result.error.issues[0]?.message || t("invalidRejectionReason");
      setValidationError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    setValidationError(null);

    rejectMutation.mutate({
      companyId: selectedCompany.id,
      reason: rejectionReason,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border border-border bg-white rounded-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900">
            {t("rejectVerificationRequest")}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {t("dialogDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-2">
          <textarea
            className="w-full min-h-[100px] rounded-md border border-border bg-white p-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
            placeholder={t("rejectionReasonPlaceholder")}
            value={rejectionReason}
            onChange={(e) => {
              setRejectionReason(e.target.value);
              setValidationError(null);
            }}
          />
          {validationError && (
            <p className="text-xs text-destructive font-medium">
              {validationError}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            className="h-9"
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white h-9"
            disabled={rejectMutation.isPending}
            onClick={handleConfirm}
          >
            {rejectMutation.isPending ? (
              <>
                <Spinner className="mr-2 size-3.5 text-white" />
                {t("submitting")}
              </>
            ) : (
              t("submitRejection")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [validationError, setValidationError] = useState<string | null>(null);

  const rejectMutation = useMutation(
    trpc.admin.rejectOperator.mutationOptions({
      onSuccess: () => {
        toast.success("Verification request rejected");
        onOpenChange(false);
        onSuccess();
        queryClient.invalidateQueries(trpc.admin.listCompaniesForVerification.pathFilter());
      },
      onError: (err) => {
        toast.error(err.message || "Failed to reject company");
      },
    })
  );

  const handleConfirm = () => {
    const result = rejectVerificationFormSchema.safeParse({ reason: rejectionReason });
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid rejection reason";
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
            Reject Verification Request
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Provide a clear reason for the rejection. This description will be sent back to the operator to correct their details.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-2">
          <textarea
            className="w-full min-h-[100px] rounded-md border border-border bg-white p-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
            placeholder="e.g. Tax clearance certificate is expired, or bank account name does not match the company registration document."
            value={rejectionReason}
            onChange={(e) => {
              setRejectionReason(e.target.value);
              setValidationError(null);
            }}
          />
          {validationError && (
            <p className="text-xs text-destructive font-medium">{validationError}</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" className="h-9" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white h-9"
            disabled={rejectMutation.isPending}
            onClick={handleConfirm}
          >
            {rejectMutation.isPending ? (
              <>
                <Spinner className="mr-2 size-3.5 text-white" />
                Submitting...
              </>
            ) : (
              "Submit Rejection"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

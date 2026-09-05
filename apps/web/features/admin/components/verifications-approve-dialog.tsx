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
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

interface VerificationsApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCompany: any;
  onSuccess: () => void;
}

export function VerificationsApproveDialog({
  open,
  onOpenChange,
  selectedCompany,
  onSuccess,
}: VerificationsApproveDialogProps) {
  const t = useTranslations("adminDashboard.verificationsApproveDialog");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const verifyMutation = useMutation(
    trpc.admin.verifyOperator.mutationOptions({
      onSuccess: (res) => {
        toast.success(
          t("companyApproved", { recipientCode: res.recipientCode }),
        );
        onOpenChange(false);
        onSuccess();
        queryClient.invalidateQueries(
          trpc.admin.listCompaniesForVerification.pathFilter(),
        );
      },
      onError: (err) => {
        toast.error(err.message || t("failedToVerifyCompany"));
      },
    }),
  );

  const pendingBank =
    selectedCompany?.bankAccounts?.find((b: any) => !b.isVerified) ||
    selectedCompany?.bankAccounts?.[0];

  const handleConfirm = () => {
    verifyMutation.mutate({
      companyId: selectedCompany.id,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border border-border bg-card rounded-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            {t("approveCompanyTitle")}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("dialogDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="rounded border border-border p-3 bg-muted/40 space-y-1.5 text-xs text-muted-foreground">
            <div>
              <span className="font-semibold text-foreground">
                {t("bankNameLabel")}
              </span>{" "}
              {pendingBank?.bankName || t("na")}
            </div>
            <div>
              <span className="font-semibold text-foreground">
                {t("accountNumberLabel")}
              </span>{" "}
              ••••••••••••
              {pendingBank?.accountNumberLast4 || t("na")}
            </div>
            {pendingBank?.verificationPayload?.accountNameMatched === false && (
              <div className="text-warning">
                <span className="font-semibold">
                  {t("accountNameMismatchLabel")}
                </span>{" "}
                {t("accountNameMismatchHint")}
              </div>
            )}
          </div>
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
            className="h-9"
            disabled={verifyMutation.isPending}
            onClick={handleConfirm}
          >
            {verifyMutation.isPending ? (
              <>
                <Spinner className="mr-2 size-3.5" />
                {t("approving")}
              </>
            ) : (
              t("confirmVerification")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

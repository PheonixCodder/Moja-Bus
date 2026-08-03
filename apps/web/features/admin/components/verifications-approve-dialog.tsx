"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { useTranslations } from "next-intl";
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
        toast.success(t("companyApproved", { recipientCode: res.recipientCode }));
        onOpenChange(false);
        onSuccess();
        queryClient.invalidateQueries(trpc.admin.listCompaniesForVerification.pathFilter());
      },
      onError: (err) => {
        toast.error(err.message || t("failedToVerifyCompany"));
      },
    })
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
      <DialogContent className="max-w-md border border-border bg-white rounded-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900">
            {t("approveCompanyTitle")}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {t("dialogDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="rounded border border-slate-100 p-3 bg-slate-50 space-y-1.5 text-xs text-slate-600">
            <div>
              <span className="font-semibold text-slate-700">{t("bankNameLabel")}</span>{" "}
              {pendingBank?.bankName || t("na")}
            </div>
            <div>
              <span className="font-semibold text-slate-700">{t("accountNumberLabel")}</span> ••••••••••••
              {pendingBank?.accountNumberLast4 || t("na")}
            </div>
            {pendingBank?.verificationPayload?.accountNameMatched === false && (
              <div className="text-amber-700">
                <span className="font-semibold">{t("accountNameMismatchLabel")}</span>{" "}
                {t("accountNameMismatchHint")}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" className="h-9" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90 text-white h-9"
            disabled={verifyMutation.isPending}
            onClick={handleConfirm}
          >
            {verifyMutation.isPending ? (
              <>
                <Spinner className="mr-2 size-3.5 text-white" />
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

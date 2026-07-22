"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ActionDrawer } from "@moja/ui/components/ui/action-drawer";
import { CheckCircle2, Clock, ShieldCheck, ShieldAlert, AlertCircle, Lock } from "lucide-react";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { Button } from "@moja/ui/components/ui/button";
import { getCompanyStatusPresentation, getBankVerificationState, getDocumentsVerificationState, getCompanyProfileState } from "../../../lib/company-status";
import { useCompanySettings } from "../../api/use-company-settings";

interface VerificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VerificationDrawer({ isOpen, onClose }: VerificationDrawerProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: settings } = useCompanySettings();

  const companyStatus = getCompanyStatusPresentation(settings?.company?.status);
  const companyProfileState = getCompanyProfileState(settings?.company);
  const bankVerificationState = getBankVerificationState(settings?.company?.bankAccounts?.[0]);
  const documentsVerificationState = getDocumentsVerificationState(settings?.company?.documents || []);

  const completeOnboardingMutation = useMutation(
    trpc.operator.completeOnboarding.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(trpc.operator.getSettings.queryFilter()),
    })
  );

  const resubmitVerificationMutation = useMutation(
    trpc.operator.resubmitVerification.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(trpc.operator.getSettings.queryFilter()),
    })
  );

  const handleSubmitVerification = async () => {
    try {
      toast.loading("Submitting for verification...", { id: "submit-verification" });
      await completeOnboardingMutation.mutateAsync();
      toast.success("Verification request submitted", { id: "submit-verification" });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit";
      toast.error(message, { id: "submit-verification" });
    }
  };

  const handleResubmitVerification = async () => {
    try {
      toast.loading("Resubmitting for verification...", { id: "resubmit-verification" });
      await resubmitVerificationMutation.mutateAsync();
      toast.success("Verification request resubmitted", { id: "resubmit-verification" });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to resubmit";
      toast.error(message, { id: "resubmit-verification" });
    }
  };

  if (!settings) return null;

  const { company } = settings;
  const statusPresentation = getCompanyStatusPresentation(company.status);
  const checklist = [
    {
      label: "Company profile details filled",
      done: !!company.name && !!company.taxId,
    },
    {
      label: "Settlement bank details verified",
      done: bankVerificationState === "verified",
    },
    {
      label: "Business registration certificate approved",
      done: company.documents?.some(
        (d) => d.type === "BUSINESS_REGISTRATION_CERTIFICATE" && d.status === "APPROVED"
      ),
    },
    {
      label: "Operating permit approved",
      done: company.documents?.some(
        (d) => d.type === "TRANSPORT_OPERATING_PERMIT" && d.status === "APPROVED"
      ),
    },
  ];

  const canSubmit = statusPresentation.canSubmitForVerification;
  const canResubmit = statusPresentation.canResubmit;

  return (
    <ActionDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Verification Status"
      description="Track your application progress and platform compliance state."
      footer={
        <div className="flex w-full justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {canSubmit && (
            <Button onClick={handleSubmitVerification} disabled={completeOnboardingMutation.isPending}>
              {completeOnboardingMutation.isPending ? "Submitting..." : "Submit for Verification"}
            </Button>
          )}
          {canResubmit && !canSubmit && (
            <Button onClick={handleResubmitVerification} disabled={resubmitVerificationMutation.isPending}>
              {resubmitVerificationMutation.isPending ? "Resubmitting..." : "Resubmit Application"}
            </Button>
          )}
        </div>
      }
    >
      <div className="p-6 space-y-8">
        <div className="relative pl-6 border-l-2 border-border space-y-8">
          {/* Step 1: Company Profile */}
          <div className="relative">
            {companyProfileState === "complete" ? (
              <>
                <div className="absolute -left-[31px] top-0.5 size-4 rounded-full border bg-background flex items-center justify-center border-emerald-500 text-emerald-500">
                  <CheckCircle2 className="size-3.5 fill-background" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Company Profile Details
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Registration number, tax TIN ID, and company details provided.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="absolute -left-[31px] top-0.5 size-4 rounded-full border bg-background flex items-center justify-center border-muted-foreground text-muted-foreground">
                  <div className="size-1.5 rounded-full bg-muted-foreground" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Company Profile Details
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Please provide your registration number and tax ID in the profile section.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Step 2: Bank Details */}
          <div className="relative">
            {bankVerificationState === "verified" ? (
              <>
                <div className="absolute -left-[31px] top-0.5 size-4 rounded-full border bg-background flex items-center justify-center border-emerald-500 text-emerald-500">
                  <CheckCircle2 className="size-3.5 fill-background" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Settlement Bank Account
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Bank account verified by platform.
                  </p>
                </div>
              </>
            ) : bankVerificationState === "pending" ? (
              <>
                <div className="absolute -left-[31px] top-0.5 size-4 rounded-full border bg-background flex items-center justify-center border-amber-500 text-amber-500">
                  <Clock className="size-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Settlement Bank Account
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Bank details submitted — pending admin verification.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="absolute -left-[31px] top-0.5 size-4 rounded-full border bg-background flex items-center justify-center border-muted-foreground/30 text-muted-foreground/50">
                  <Clock className="size-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground">
                    Settlement Bank Account
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Please add bank details to receive ticket booking payouts.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Step 3: Operating Permit & Docs */}
          <div className="relative">
            {documentsVerificationState === "approved" ? (
              <>
                <div className="absolute -left-[31px] top-0.5 size-4 rounded-full border bg-background flex items-center justify-center border-emerald-500 text-emerald-500">
                  <CheckCircle2 className="size-3.5 fill-background" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Compliance Permits & Documents
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Required documents uploaded and approved.
                  </p>
                </div>
              </>
            ) : documentsVerificationState === "pending" ? (
              <>
                <div className="absolute -left-[31px] top-0.5 size-4 rounded-full border bg-background flex items-center justify-center border-amber-500 text-amber-500">
                  <Clock className="size-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Compliance Permits & Documents
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Documents submitted — pending admin approval.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="absolute -left-[31px] top-0.5 size-4 rounded-full border bg-background flex items-center justify-center border-muted-foreground/30 text-muted-foreground/50">
                  <Clock className="size-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground">
                    Compliance Permits & Documents
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Please upload all required business permits.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Step 4: Admin Review */}
          <div className="relative">
            {company.status === "VERIFIED" || company.status === "ACTIVE" ? (
              <>
                <div className="absolute -left-[31px] top-0.5 size-4 rounded-full border bg-background flex items-center justify-center border-emerald-500 text-emerald-500">
                  <CheckCircle2 className="size-3.5 fill-background" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Admin Verification Review
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Compliance review verified and approved.
                  </p>
                </div>
              </>
            ) : company.status === "REJECTED" ? (
              <>
                <div className="absolute -left-[31px] top-0.5 size-4 rounded-full border bg-background flex items-center justify-center border-red-500 text-red-500">
                  <AlertCircle className="size-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Admin Verification Review
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your application was rejected. Update your profile and resubmit when ready.
                  </p>
                </div>
              </>
            ) : company.status === "SUSPENDED" ? (
              <>
                <div className="absolute -left-[31px] top-0.5 size-4 rounded-full border bg-background flex items-center justify-center border-orange-500 text-orange-500">
                  <ShieldAlert className="size-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Admin Verification Review
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your account is suspended. Contact support for assistance.
                  </p>
                </div>
              </>
            ) : company.status === "PENDING_VERIFICATION" ? (
              <>
                <div className="absolute -left-[31px] top-0.5 size-4 rounded-full border bg-background flex items-center justify-center border-amber-500 text-amber-500">
                  <Spinner className="size-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Admin Verification Review
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your documents are currently pending review by the admin team.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="absolute -left-[31px] top-0.5 size-4 rounded-full border bg-background flex items-center justify-center border-muted-foreground/30 text-muted-foreground/50">
                  <Clock className="size-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground">
                    Admin Verification Review
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Submit your profile for review once all steps are complete.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Step 5: Approval */}
          <div className="relative">
            {company.status === "VERIFIED" || company.status === "ACTIVE" ? (
              <>
                <div className="absolute -left-[31px] top-0.5 size-4 rounded-full border bg-background flex items-center justify-center border-emerald-500 text-emerald-500">
                  <ShieldCheck className="size-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Company Fully Verified
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your company is authorized to host active routes and sell tickets.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="absolute -left-[31px] top-0.5 size-4 rounded-full border bg-background flex items-center justify-center border-muted-foreground/30 text-muted-foreground/50">
                  <Lock className="size-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground">
                    Approval Authorized
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Authorized state unlocked on verification.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {company.rejectionReason && (
          <div className="p-4 bg-red-500/10 border border-red-200 rounded-lg">
            <h5 className="text-sm font-bold text-red-600 flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4" /> Rejection Reason
            </h5>
            <p className="text-sm text-red-600/90">{company.rejectionReason}</p>
          </div>
        )}
      </div>
    </ActionDrawer>
  );
}

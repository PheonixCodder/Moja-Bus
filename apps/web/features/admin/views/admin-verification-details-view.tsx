"use client";

import { Button } from "@moja/ui/components/ui/button";
import { cn } from "@moja/ui/lib/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Building, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { VerificationDetailsBanks } from "../components/verification-details-banks";
import { VerificationDetailsChecklist } from "../components/verification-details-checklist";
import { VerificationDetailsDecision } from "../components/verification-details-decision";
import { VerificationDetailsDocuments } from "../components/verification-details-documents";
import { VerificationDetailsHeader } from "../components/verification-details-header";
import { VerificationDetailsTimeline } from "../components/verification-details-timeline";
import { VerificationsApproveDialog } from "../components/verifications-approve-dialog";
import { VerificationsRejectDialog } from "../components/verifications-reject-dialog";

interface AdminVerificationDetailsViewProps {
  companyId: string;
}

export function AdminVerificationDetailsView({
  companyId,
}: AdminVerificationDetailsViewProps) {
  const trpc = useTRPC();
  const t = useTranslations("adminDashboard.adminVerificationDetailsView");

  // Tab State synced to URL
  const [activeTab, setActiveTab] = useQueryState("tab", {
    defaultValue: "overview",
  });

  // Suspense Query company details
  const { data: company } = useSuspenseQuery(
    trpc.admin.getCompanyForVerification.queryOptions({ companyId }),
  );

  // Decision Modal Dialog States
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApproveClick = () => {
    setIsApproveOpen(true);
  };

  const handleRejectClick = () => {
    setRejectionReason("");
    setIsRejectOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex gap-2 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab("overview")}
          className={cn(
            "px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px rounded-none transition-colors flex items-center gap-1.5 h-auto hover:bg-transparent",
            activeTab === "overview"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Building className="size-4" />
          {t("overview")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab("history")}
          className={cn(
            "px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px rounded-none transition-colors flex items-center gap-1.5 h-auto hover:bg-transparent",
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Clock className="size-4" />
          {t("activityLogs")}
        </Button>
      </div>

      {activeTab === "overview" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Main column - Profile and documents */}
          <div className="lg:col-span-2 space-y-6">
            <VerificationDetailsHeader company={company} />
            <VerificationDetailsDocuments documents={company.documents} />
            <VerificationDetailsBanks bankAccounts={company.bankAccounts} />
          </div>

          {/* Right sidebar column - KYC Checklist and CTA Decisons */}
          <div className="space-y-6">
            <VerificationDetailsDecision
              company={company}
              onApproveClick={handleApproveClick}
              onRejectClick={handleRejectClick}
            />
            <VerificationDetailsChecklist
              companyId={company.id}
              verification={company.verification}
            />
          </div>
        </div>
      ) : (
        <div className="max-w-3xl">
          <VerificationDetailsTimeline
            activityLogs={company.activityLogs || []}
          />
        </div>
      )}

      {/* Approve Dialog */}
      <VerificationsApproveDialog
        open={isApproveOpen}
        onOpenChange={setIsApproveOpen}
        selectedCompany={company}
        onSuccess={() => {
          setIsApproveOpen(false);
        }}
      />

      {/* Reject Dialog */}
      <VerificationsRejectDialog
        open={isRejectOpen}
        onOpenChange={setIsRejectOpen}
        selectedCompany={company}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        onSuccess={() => {
          setIsRejectOpen(false);
        }}
      />
    </div>
  );
}

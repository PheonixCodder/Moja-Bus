"use client";

import { useState } from "react";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { Building, Clock } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { cn } from "@moja/ui/lib/utils";

import { VerificationDetailsHeader } from "../components/verification-details-header";
import { VerificationDetailsDocuments } from "../components/verification-details-documents";
import { VerificationDetailsBanks } from "../components/verification-details-banks";
import { VerificationDetailsChecklist } from "../components/verification-details-checklist";
import { VerificationDetailsDecision } from "../components/verification-details-decision";
import { VerificationDetailsTimeline } from "../components/verification-details-timeline";
import { VerificationsApproveDialog } from "../components/verifications-approve-dialog";
import { VerificationsRejectDialog } from "../components/verifications-reject-dialog";

interface AdminVerificationDetailsViewProps {
  companyId: string;
}

export function AdminVerificationDetailsView({ companyId }: AdminVerificationDetailsViewProps) {
  const trpc = useTRPC();

  // Tab State synced to URL
  const [activeTab, setActiveTab] = useQueryState("tab", { defaultValue: "overview" });

  // Suspense Query company details
  const { data: company } = useSuspenseQuery(
    trpc.admin.getCompanyForVerification.queryOptions({ companyId })
  );

  // Bank code list
  const { data: paystackBanks } = useQuery(
    trpc.payments.listBanks.queryOptions({})
  );

  // Decision Modal Dialog States
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedBankCode, setSelectedBankCode] = useState("");

  const handleApproveClick = () => {
    const pendingBank =
      company.bankAccounts?.find((b: any) => !b.isVerified) ||
      company.bankAccounts?.[0];

    const matchingBank = paystackBanks?.find(
      (b: any) =>
        pendingBank?.bankName
          ?.toLowerCase()
          ?.includes(b.name.split(" ")[0].toLowerCase())
    );
    setSelectedBankCode(pendingBank?.bankCode || matchingBank?.code || "");
    setIsApproveOpen(true);
  };

  const handleRejectClick = () => {
    setRejectionReason("");
    setIsRejectOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors flex items-center gap-1.5",
            activeTab === "overview"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          <Building className="size-4" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={cn(
            "px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors flex items-center gap-1.5",
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          <Clock className="size-4" />
          Activity logs
        </button>
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
          <VerificationDetailsTimeline activityLogs={company.activityLogs || []} />
        </div>
      )}

      {/* Approve Dialog */}
      <VerificationsApproveDialog
        open={isApproveOpen}
        onOpenChange={setIsApproveOpen}
        selectedCompany={company}
        selectedBankCode={selectedBankCode}
        setSelectedBankCode={setSelectedBankCode}
        paystackBanks={paystackBanks}
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

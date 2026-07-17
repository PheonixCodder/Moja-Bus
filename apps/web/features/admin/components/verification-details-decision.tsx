"use client";

import { ShieldCheck, ShieldAlert, BadgeCheck, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@moja/ui/components/ui/card";
import { Button } from "@moja/ui/components/ui/button";
import { Badge } from "@moja/ui/components/ui/badge";
import { cn } from "@moja/ui/lib/utils";

interface VerificationDetailsDecisionProps {
  company: any;
  onApproveClick: () => void;
  onRejectClick: () => void;
}

export function VerificationDetailsDecision({
  company,
  onApproveClick,
  onRejectClick,
}: VerificationDetailsDecisionProps) {
  const status = company.status;
  const hasBank = company.bankAccounts && company.bankAccounts.length > 0;

  // Status badges config
  let badgeClass = "bg-slate-50 text-slate-700 border-slate-200";
  let dotClass = "bg-slate-400";

  if (status === "ACTIVE") {
    badgeClass = "bg-green-50 text-green-700 border-green-200";
    dotClass = "bg-green-600";
  } else if (status === "PENDING_VERIFICATION") {
    badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
    dotClass = "bg-amber-500";
  } else if (status === "REJECTED" || status === "SUSPENDED") {
    badgeClass = "bg-red-50 text-red-700 border-red-200";
    dotClass = "bg-red-600";
  } else if (status === "DRAFT") {
    badgeClass = "bg-sky-50 text-sky-700 border-sky-200";
    dotClass = "bg-sky-500";
  }

  return (
    <Card className="bg-white border-border shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b border-border/60 pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-bold text-slate-900">
              Platform Decision Board
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Verify operator to activate dynamic subaccounts.
            </CardDescription>
          </div>
          <Badge className={cn("gap-1.5 border px-2 py-1 font-semibold text-xs", badgeClass)} variant="outline">
            <span className={cn("size-1.5 rounded-full", dotClass)} />
            {status.replace(/_/g, " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {status === "PENDING_VERIFICATION" && (
          <div className="space-y-3">
            <div className="text-xs text-slate-500 leading-relaxed font-medium">
              Check that all KYC Checklist items are verified before approving. Approvals require a default bank account mappings to generate Paystack subaccount IDs.
            </div>
            <div className="flex flex-col  gap-3 pt-2">
              <Button
                variant="outline"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-10 font-bold text-xs"
                onClick={onRejectClick}
              >
                Reject Verification
              </Button>
              <Button
                className="w-full bg-primary hover:bg-primary/95 text-white h-10 font-bold text-xs"
                disabled={!hasBank}
                onClick={onApproveClick}
              >
                <ShieldCheck className="size-4 mr-1.5 shrink-0" />
                Approve & Register Bank
              </Button>
            </div>
          </div>
        )}

        {status === "ACTIVE" && (
          <div className="rounded-lg border border-green-100 bg-green-50/30 p-4 space-y-3">
            <div className="flex gap-2.5">
              <BadgeCheck className="size-5 text-green-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-xs font-bold text-green-800">Operator Verified Successfully</div>
                <p className="text-[11px] text-green-700 leading-relaxed font-medium">
                  This bus operator has been approved. Mapped to recipient code:{" "}
                  <span className="font-mono font-bold bg-green-100 px-1 py-0.5 rounded text-green-800">
                    {company.paystackTransferRecipientCode || "N/A"}
                  </span>
                </p>
              </div>
            </div>
            {company.verifiedAt && (
              <div className="text-[10px] text-slate-400 font-medium border-t border-green-100/50 pt-2 flex items-center justify-between">
                <span>Verified: {new Date(company.verifiedAt).toLocaleString()}</span>
                {company.verifiedById && (
                  <span className="font-bold text-slate-500">ID: {company.verifiedById.slice(0, 8)}</span>
                )}
              </div>
            )}
          </div>
        )}

        {status === "REJECTED" && (
          <div className="rounded-lg border border-red-100 bg-red-50/30 p-4 space-y-3">
            <div className="flex gap-2.5">
              <AlertCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-xs font-bold text-red-800">Registration Request Rejected</div>
                <div className="text-[11px] text-red-700 leading-relaxed font-semibold">
                  Reason:
                  <p className="font-normal text-red-600 bg-white rounded border border-red-100/50 p-2.5 mt-1 leading-normal italic shadow-3xs">
                    {company.rejectionReason || "No reason specified."}
                  </p>
                </div>
              </div>
            </div>
            {company.activityLogs?.[0]?.createdAt && (
              <div className="text-[10px] text-slate-400 font-medium border-t border-red-100/50 pt-2">
                Rejected on: {new Date(company.activityLogs[0].createdAt).toLocaleString()}
              </div>
            )}
          </div>
        )}

        {status === "DRAFT" && (
          <div className="rounded-lg border border-sky-100 bg-sky-50/30 p-4 flex gap-2.5">
            <AlertCircle className="size-5 text-sky-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-bold text-sky-800">In Draft Mode</div>
              <p className="text-[11px] text-sky-700 leading-relaxed font-medium">
                The operator is still filling out company details and has not submitted registration documents for review yet.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

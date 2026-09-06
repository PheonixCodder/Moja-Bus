"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import { cn } from "@moja/ui/lib/utils";
import {
  AlertCircle,
  BadgeCheck,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("adminDashboard.verificationDetailsDecision");
  const status = company.status;
  const hasBank = company.bankAccounts && company.bankAccounts.length > 0;

  // Status badges config
  let badgeClass = "bg-muted text-muted-foreground border-border";
  let dotClass = "bg-muted-foreground";

  if (status === "ACTIVE") {
    badgeClass = "bg-success/15 text-success border-success/30";
    dotClass = "bg-success";
  } else if (status === "PENDING_VERIFICATION") {
    badgeClass = "bg-warning/15 text-warning border-warning/30";
    dotClass = "bg-warning";
  } else if (status === "REJECTED" || status === "SUSPENDED") {
    badgeClass = "bg-destructive/15 text-destructive border-destructive/30";
    dotClass = "bg-destructive";
  } else if (status === "DRAFT") {
    badgeClass = "bg-primary/15 text-primary border-primary/30";
    dotClass = "bg-primary";
  }

  return (
    <Card className="bg-card border-border shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/40 border-b border-border/60 pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-bold text-foreground">
              {t("platformDecisionBoard")}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {t("decisionBoardDescription")}
            </CardDescription>
          </div>
          <Badge
            className={cn(
              "gap-1.5 border px-2 py-1 font-semibold text-xs",
              badgeClass,
            )}
            variant="outline"
          >
            <span className={cn("size-1.5 rounded-full", dotClass)} />
            {status.replace(/_/g, " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {status === "PENDING_VERIFICATION" && (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground leading-relaxed font-medium">
              {t("approveChecklistNote")}
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 h-10 font-bold text-xs"
                onClick={onRejectClick}
              >
                {t("rejectVerification")}
              </Button>
              <Button
                className="w-full h-10 font-bold text-xs"
                disabled={!hasBank}
                onClick={onApproveClick}
              >
                <ShieldCheck className="size-4 mr-1.5 shrink-0" />
                {t("approveRegisterBank")}
              </Button>
            </div>
          </div>
        )}

        {status === "ACTIVE" && (
          <div className="rounded-lg border border-success/20 bg-success/10 p-4 space-y-3">
            <div className="flex gap-2.5">
              <BadgeCheck className="size-5 text-success shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-xs font-bold text-success">
                  {t("operatorVerified")}
                </div>
                <p className="text-xs text-success leading-relaxed font-medium">
                  {t("operatorApproved")}{" "}
                  <span className="font-mono font-bold bg-success/20 px-1 py-0.5 rounded text-success">
                    {company.paystackTransferRecipientCode || t("na")}
                  </span>
                </p>
              </div>
            </div>
            {company.verifiedAt && (
              <div className="text-xs text-muted-foreground font-medium border-t border-success/20 pt-2 flex items-center justify-between">
                <span>
                  {t("verifiedOn")}:{" "}
                  {new Date(company.verifiedAt).toLocaleString()}
                </span>
                {company.verifiedById && (
                  <span className="font-bold text-muted-foreground">
                    {t("idLabel")}: {company.verifiedById.slice(0, 8)}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {status === "REJECTED" && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 space-y-3">
            <div className="flex gap-2.5">
              <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-xs font-bold text-destructive">
                  {t("registrationRejected")}
                </div>
                <div className="text-xs text-destructive leading-relaxed font-semibold">
                  {t("reasonLabel")}:
                  <p className="font-normal text-destructive bg-card rounded border border-destructive/20 p-2.5 mt-1 leading-normal italic">
                    {company.rejectionReason || t("noReasonSpecified")}
                  </p>
                </div>
              </div>
            </div>
            {company.activityLogs?.[0]?.createdAt && (
              <div className="text-xs text-muted-foreground font-medium border-t border-destructive/20 pt-2">
                {t("rejectedOn")}:{" "}
                {new Date(company.activityLogs[0].createdAt).toLocaleString()}
              </div>
            )}
          </div>
        )}

        {status === "DRAFT" && (
          <div className="rounded-lg border border-primary/20 bg-primary/10 p-4 flex gap-2.5">
            <AlertCircle className="size-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-bold text-primary">
                {t("draftMode")}
              </div>
              <p className="text-xs text-primary leading-relaxed font-medium">
                {t("draftDescription")}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

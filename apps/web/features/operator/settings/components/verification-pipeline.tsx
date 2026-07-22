"use client";

import { useCompanySettings } from "../api/use-company-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { Button } from "@moja/ui/components/ui/button";
import { ShieldCheck, ArrowRight, ShieldAlert } from "lucide-react";
import { getCompanyStatusPresentation } from "../../lib/company-status";
import { cn } from "@moja/ui/lib/utils";

interface VerificationPipelineProps {
  onManage: () => void;
}

export function VerificationPipeline({ onManage }: VerificationPipelineProps) {
  const { data: settings } = useCompanySettings();
  const status = getCompanyStatusPresentation(settings?.company.status);

  return (
    <Card className={cn("overflow-hidden border-2", 
      status.isFullyVerified ? "border-emerald-500/50" : "border-border"
    )}>
      <CardHeader className={cn("pb-4", 
        status.isFullyVerified ? "bg-emerald-500/5 dark:bg-emerald-500/10" : "bg-muted/30"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {status.isFullyVerified ? (
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-muted-foreground" />
              )}
              Platform Verification
            </CardTitle>
            <CardDescription>{status.description}</CardDescription>
          </div>
          <Button 
            variant={status.isFullyVerified ? "outline" : "default"} 
            className="w-full sm:w-auto shrink-0" 
            onClick={onManage}
          >
            {status.isFullyVerified ? "View Details" : "Continue Setup"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x text-sm">
          <div className="p-4 flex flex-col gap-1">
            <span className="text-muted-foreground">Current Status</span>
            <span className={cn("font-medium", status.badgeClassName.split(" ")[1])}>
              {status.label}
            </span>
          </div>
          <div className="p-4 flex flex-col gap-1">
            <span className="text-muted-foreground">Profile Details</span>
            <span className={settings?.company.name && settings?.company.taxId ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
              {settings?.company.name && settings?.company.taxId ? "Complete" : "Incomplete"}
            </span>
          </div>
          <div className="p-4 flex flex-col gap-1">
            <span className="text-muted-foreground">Payout Account</span>
            <span className={settings?.company?.bankAccounts?.some(b => b.isVerified) ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
              {settings?.company?.bankAccounts?.some(b => b.isVerified) ? "Verified" : "Pending"}
            </span>
          </div>
          <div className="p-4 flex flex-col gap-1">
            <span className="text-muted-foreground">Legal Docs</span>
            <span className={settings?.company.documents?.some(d => d.status === "APPROVED") ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
              {settings?.company.documents?.some(d => d.status === "APPROVED") ? "Approved" : "Action Needed"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

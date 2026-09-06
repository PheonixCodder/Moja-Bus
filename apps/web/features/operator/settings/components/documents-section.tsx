"use client";

import { useTranslations } from "next-intl";
import { useCompanySettings } from "../api/use-company-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import { Button } from "@moja/ui/components/ui/button";
import {
  FileText,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@moja/ui/components/ui/badge";
import {
  getDocumentsVerificationState,
  REQUIRED_DOC_TYPES,
} from "../../lib/company-status";

interface DocumentsSectionProps {
  onManage: () => void;
}

export function DocumentsSection({ onManage }: DocumentsSectionProps) {
  const t = useTranslations("operatorDashboard.settings.compliance");
  const { data: settings } = useCompanySettings();
  const documents = settings?.company.documents || [];
  const state = getDocumentsVerificationState(documents);

  const activeDocs = documents.filter((d) => !d.supersededAt);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            {t("complianceDocs")}
          </CardTitle>
          <CardDescription>{t("legalRequirements")}</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onManage}>
          {t("manage")}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 mt-4">
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20 mb-4">
          <div className="space-y-1">
            <p className="font-medium text-sm">{t("statusLabel")}</p>
            <div className="flex items-center gap-2">
              {state === "approved" && (
                <Badge
                  variant="outline"
                  className="bg-success/10 text-success border-success/20"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" /> {t("allApproved")}
                </Badge>
              )}
              {state === "pending" && (
                <Badge
                  variant="outline"
                  className="bg-warning/10 text-warning border-warning/20"
                >
                  <Clock className="w-3 h-3 mr-1" /> {t("inReview")}
                </Badge>
              )}
              {state === "missing" && (
                <Badge
                  variant="outline"
                  className="bg-warning/10 text-warning border-warning/20"
                >
                  <AlertCircle className="w-3 h-3 mr-1" /> {t("actionRequired")}
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right space-y-1 text-sm">
            <p className="font-medium">
              {t("uploadedCount", { count: activeDocs.length })}
            </p>
            <p className="text-muted-foreground">
              {t("requiredCount", { count: REQUIRED_DOC_TYPES.length })}
            </p>
          </div>
        </div>

        <ul className="space-y-3 text-sm">
          {activeDocs.slice(0, 3).map((doc) => (
            <li key={doc.id} className="flex items-center justify-between">
              <span className="truncate pr-4 text-muted-foreground">
                {t(`types.${doc.type}` as any) || doc.type.replace(/_/g, " ")}
              </span>
              {doc.status === "APPROVED" && (
                <span className="text-success font-medium text-xs">
                  {t("status.APPROVED")}
                </span>
              )}
              {doc.status === "PENDING" && (
                <span className="text-warning font-medium text-xs">
                  {t("status.PENDING")}
                </span>
              )}
              {doc.status === "REJECTED" && (
                <span className="text-destructive font-medium text-xs">
                  {t("status.REJECTED")}
                </span>
              )}
            </li>
          ))}
          {activeDocs.length === 0 && (
            <p className="text-muted-foreground text-center text-sm py-2">
              {t("noDocs")}
            </p>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

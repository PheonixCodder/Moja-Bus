"use client";

import { useCompanySettings } from "../api/use-company-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { Button } from "@moja/ui/components/ui/button";
import { FileText, ArrowRight, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@moja/ui/components/ui/badge";
import { getDocumentsVerificationState, REQUIRED_DOC_TYPES } from "../../lib/company-status";

interface DocumentsSectionProps {
  onManage: () => void;
}

export function DocumentsSection({ onManage }: DocumentsSectionProps) {
  const { data: settings } = useCompanySettings();
  const documents = settings?.company.documents || [];
  const state = getDocumentsVerificationState(documents);

  const activeDocs = documents.filter(d => !d.supersededAt);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            Compliance Docs
          </CardTitle>
          <CardDescription>Legal operating requirements</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onManage}>
          Manage
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 mt-4">
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20 mb-4">
          <div className="space-y-1">
            <p className="font-medium text-sm">Status</p>
            <div className="flex items-center gap-2">
              {state === "approved" && (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> All Approved
                </Badge>
              )}
              {state === "pending" && (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">
                  <Clock className="w-3 h-3 mr-1" /> In Review
                </Badge>
              )}
              {state === "missing" && (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200">
                  <AlertCircle className="w-3 h-3 mr-1" /> Action Required
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right space-y-1 text-sm">
            <p className="font-medium">{activeDocs.length} uploaded</p>
            <p className="text-muted-foreground">Required: {REQUIRED_DOC_TYPES.length}</p>
          </div>
        </div>

        <ul className="space-y-3 text-sm">
          {activeDocs.slice(0, 3).map((doc) => (
            <li key={doc.id} className="flex items-center justify-between">
              <span className="truncate pr-4 text-muted-foreground">
                {doc.type.replace(/_/g, " ")}
              </span>
              {doc.status === "APPROVED" && <span className="text-green-600 font-medium text-xs">Approved</span>}
              {doc.status === "PENDING" && <span className="text-yellow-600 font-medium text-xs">Pending</span>}
              {doc.status === "REJECTED" && <span className="text-red-600 font-medium text-xs">Rejected</span>}
            </li>
          ))}
          {activeDocs.length === 0 && (
            <p className="text-muted-foreground text-center text-sm py-2">
              No documents uploaded yet.
            </p>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

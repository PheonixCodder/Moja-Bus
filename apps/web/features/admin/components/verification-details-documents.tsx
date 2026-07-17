"use client";

import { FileText, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@moja/ui/components/ui/card";
import { Button } from "@moja/ui/components/ui/button";
import { formatAdminDate } from "@/lib/format-date";

interface VerificationDetailsDocumentsProps {
  documents: any[];
}

export function VerificationDetailsDocuments({ documents }: VerificationDetailsDocumentsProps) {
  return (
    <Card className="bg-white border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-bold text-slate-900">
          Uploaded Legal Registry Files
        </CardTitle>
        <CardDescription className="text-xs text-slate-400">
          Operator uploaded documentation including permit approvals and tax clearances.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="grid gap-3">
          {documents && documents.length > 0 ? (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between border border-slate-100 rounded-lg p-4 bg-white hover:bg-slate-50/50 transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200/40 flex items-center justify-center text-slate-500">
                    <FileText className="size-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800 truncate max-w-[280px]">
                      {doc.fileName || doc.type.replace(/_/g, " ")}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                      Uploaded on {formatAdminDate(doc.createdAt)}
                    </div>
                  </div>
                </div>
                {doc.fileUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 text-xs font-semibold"
                    nativeButton={false}
                    render={
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                        View File
                        <ExternalLink className="size-3" />
                      </a>
                    }
                  />
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
              No registry documents uploaded by this company.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

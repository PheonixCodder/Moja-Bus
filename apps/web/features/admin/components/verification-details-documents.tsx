"use client";

import { Button } from "@moja/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { ExternalLink, FileText, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { formatAdminDate } from "@/lib/format-date";
import { useTRPC } from "@/trpc/client";

interface VerificationDetailsDocumentsProps {
  documents: any[];
}

export function VerificationDetailsDocuments({
  documents,
}: VerificationDetailsDocumentsProps) {
  const t = useTranslations("adminDashboard.verificationDetailsDocuments");
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-bold text-foreground">
          {t("uploadedLegalRegistryFiles")}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {t("documentsDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="grid gap-3">
          {documents && documents.length > 0 ? (
            documents.map((doc) => <DocumentRow key={doc.id} doc={doc} />)
          ) : (
            <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-lg bg-muted/30">
              {t("noDocumentsUploaded")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentRow({ doc }: { doc: any }) {
  const t = useTranslations("adminDashboard.verificationDetailsDocuments");
  const trpc = useTRPC();
  const [opening, setOpening] = useState(false);
  const downloadMutation = useMutation(
    trpc.storage.presignDownload.mutationOptions(),
  );

  const handleView = async () => {
    // Legacy public documents: open the stored URL directly.
    if (!doc.objectKey && doc.fileUrl) {
      window.open(doc.fileUrl, "_blank", "noreferrer");
      return;
    }

    try {
      setOpening(true);
      const { downloadUrl } = await downloadMutation.mutateAsync({
        purpose: "operator-document",
        documentId: doc.id,
      });
      if (downloadUrl) {
        window.open(downloadUrl, "_blank", "noreferrer");
      }
    } catch (e) {
      // error handled silently; button re-enables via finally
    } finally {
      setOpening(false);
    }
  };

  return (
    <div
      key={doc.id}
      className="flex items-center justify-between border border-border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors shadow-2xs"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground">
          <FileText className="size-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground truncate max-w-72">
            {doc.fileName || doc.type.replace(/_/g, " ")}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 font-medium">
            {t("uploadedOn", { date: formatAdminDate(doc.createdAt) })}
          </div>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-8 gap-1 text-xs font-semibold"
        disabled={opening}
        onClick={handleView}
      >
        {opening ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <ExternalLink className="size-3" />
        )}
        {t("viewFile")}
      </Button>
    </div>
  );
}

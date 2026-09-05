"use client";

import { useTranslations } from "next-intl";
import { useTRPC } from "@/trpc/client";
import { useCompanySettings } from "../../api/use-company-settings";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Label } from "@moja/ui/components/ui/label";
import { Input } from "@moja/ui/components/ui/input";
import { Button } from "@moja/ui/components/ui/button";
import { DatePicker } from "@moja/ui/components/ui/date-picker";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { Eye, Trash2, FileUp, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useStorageUpload } from "@/lib/storage-client";
import { cn } from "@moja/ui/lib/utils";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@moja/ui/components/ui/alert-dialog";
import { HealthScore } from "../health-score";
import { useStaffPermissions } from "@/features/operator/hooks/use-staff-permissions";

const DOCUMENT_SLOTS = [
  {
    key: "BUSINESS_REGISTRATION_CERTIFICATE" as const,
  },
  {
    key: "TAX_CLEARANCE_CERTIFICATE" as const,
  },
  {
    key: "TRANSPORT_OPERATING_PERMIT" as const,
  },
  {
    key: "INSURANCE_CERTIFICATE" as const,
  },
] as const;

export function ComplianceView() {
  const t = useTranslations("operatorDashboard.settings.compliance");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { can } = useStaffPermissions();
  const canManageCompliance = can("company:compliance:update");

  const { data: settings } = useCompanySettings();

  const addDocumentMutation = useMutation(
    trpc.operator.addDocument.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(trpc.operator.getSettings.queryFilter()),
    }),
  );

  const deleteDocumentMutation = useMutation(
    trpc.operator.deleteDocument.mutationOptions({
      onMutate: async (variables) => {
        const queryKey = trpc.operator.getSettings.queryKey();
        await queryClient.cancelQueries({ queryKey });

        const previousSettings = queryClient.getQueryData(queryKey);

        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old || !old.company || !old.company.documents) return old;
          return {
            ...old,
            company: {
              ...old.company,
              documents: old.company.documents.filter(
                (doc: any) => doc.id !== variables.id,
              ),
            },
          };
        });

        return { previousSettings };
      },
      onError: (err, variables, context) => {
        if (context?.previousSettings) {
          queryClient.setQueryData(
            trpc.operator.getSettings.queryKey(),
            context.previousSettings,
          );
        }
      },
      onSettled: () =>
        queryClient.invalidateQueries(trpc.operator.getSettings.queryFilter()),
    }),
  );

  const presignDownloadMutation = useMutation(
    trpc.storage.presignDownload.mutationOptions(),
  );

  const { upload: uploadDocument } = useStorageUpload("operator-document");

  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [docExpiryDates, setDocExpiryDates] = useState<Record<string, string>>(
    {},
  );

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingIsApproved, setDeletingIsApproved] = useState(false);

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File exceeds the maximum size of 5MB");
      return;
    }

    const validTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error(
        "Invalid file format. Please upload a PDF, PNG, or JPEG file.",
      );
      return;
    }

    setUploadingDocType(type);
    setUploadProgress(0);

    try {
      setUploadProgress(10);
      const { fileUrl, objectKey } = await uploadDocument(file);
      setUploadProgress(100);

      await addDocumentMutation.mutateAsync({
        type: type as any,
        fileName: file.name,
        fileUrl,
        objectKey,
        fileSize: file.size,
        mimeType: file.type || "application/pdf",
        expiresAt: docExpiryDates[type]
          ? new Date(docExpiryDates[type]).toISOString()
          : undefined,
      });

      toast.success(t("toast.uploaded"));
    } catch (err: any) {
      toast.error(err.message || t("toast.uploadFailed"));
    } finally {
      setUploadingDocType(null);
      setUploadProgress(0);
    }
  };

  const handleTrashClick = (doc: any) => {
    setDeletingId(doc.id);
    setDeletingIsApproved(doc.status === "APPROVED");
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    try {
      await deleteDocumentMutation.mutateAsync({ id: deletingId });
      toast.success(t("toast.deleted"));
      setDeletingId(null);
      setDeletingIsApproved(false);
    } catch (err: any) {
      toast.error(err.message || t("toast.deleteFailed"));
    }
  };

  const handleViewDocument = async (id: string, objectKey: string) => {
    const newWindow = window.open("about:blank", "_blank");
    if (!newWindow) {
      toast.error("Please allow popups to view documents");
      return;
    }

    try {
      toast.loading("Generating secure link...", { id: "view-doc" });
      const { downloadUrl } = await presignDownloadMutation.mutateAsync({
        purpose: "operator-document",
        documentId: id,
        objectKey,
      });
      toast.dismiss("view-doc");

      if (downloadUrl) {
        newWindow.location.href = downloadUrl;
      } else {
        newWindow.close();
        toast.error("Could not generate document link");
      }
    } catch (err: any) {
      newWindow.close();
      toast.dismiss("view-doc");
      toast.error(err.message || "Failed to view document");
    }
  };

  const documents = settings?.company?.documents || [];

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h3 className="text-lg font-medium">{t("title")}</h3>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <HealthScore />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DOCUMENT_SLOTS.map((slot) => {
          const uploaded = documents.find((d: any) => d.type === slot.key);
          const isUploading = uploadingDocType === slot.key;

          return (
            <div
              key={slot.key}
              className={cn(
                "border rounded-xl p-5 flex flex-col justify-between bg-card transition-colors",
                uploaded?.status === "REJECTED"
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-border",
              )}
            >
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">
                  {t(`slots.${slot.key}.label` as any)}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t(`slots.${slot.key}.desc` as any)}
                </p>
              </div>

              {uploaded?.status === "REJECTED" && (
                <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-destructive" />
                  <div>
                    <p className="font-semibold text-xs text-destructive mb-0.5">
                      {t("documentRejectedDesc")}
                    </p>
                    <p className="text-xs">
                      {uploaded.notes ||
                        "No specific reason provided. Please upload a clearer copy."}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-border/60">
                {isUploading ? (
                  <div className="space-y-2 py-3 text-center">
                    <Spinner className="w-5 h-5 mx-auto" />
                    <p className="text-[11px] text-primary font-semibold font-mono">
                      {t("uploading")} {uploadProgress}%
                    </p>
                  </div>
                ) : uploaded ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground truncate max-w-28 sm:max-w-44 inline-block">
                          {uploaded.fileName}
                        </span>
                        {uploaded.status === "APPROVED" && (
                          <span className="px-1.5 py-0.5 rounded-full bg-success/15 text-success text-[9px] font-bold tracking-wider shrink-0">
                            {t("status.APPROVED")}
                          </span>
                        )}
                        {uploaded.status === "PENDING" && (
                          <span className="px-1.5 py-0.5 rounded-full bg-warning/15 text-warning text-[9px] font-bold tracking-wider shrink-0">
                            {t("status.PENDING")}
                          </span>
                        )}
                        {uploaded.status === "REJECTED" && (
                          <span className="px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive text-[9px] font-bold tracking-wider shrink-0">
                            {t("status.REJECTED")}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span>
                          {uploaded.mimeType === "application/pdf"
                            ? "PDF"
                            : "IMG"}
                        </span>
                        <span>•</span>
                        <span>
                          {t("uploadedOn", {
                            date: format(new Date(uploaded.createdAt), "PPP"),
                          })}
                        </span>
                        {uploaded.expiresAt && (
                          <>
                            <span>•</span>
                            <span
                              className={cn(
                                "truncate",
                                new Date(uploaded.expiresAt) < new Date()
                                  ? "text-destructive font-bold"
                                  : new Date(uploaded.expiresAt) <
                                      new Date(
                                        Date.now() + 30 * 24 * 60 * 60 * 1000,
                                      )
                                    ? "text-warning font-bold"
                                    : "",
                              )}
                            >
                              {t("expiresOnDate", {
                                date: format(
                                  new Date(uploaded.expiresAt),
                                  "PPP",
                                ),
                              })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {canManageCompliance && (
                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 sm:pl-2 border-t sm:border-t-0 border-border/40 w-full sm:w-auto justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleViewDocument(uploaded.id, uploaded.objectKey!)
                          }
                          className="h-8 w-8 border border-border text-muted-foreground shrink-0 shadow-sm"
                          title={t("viewDocument")}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTrashClick(uploaded)}
                          className="h-8 w-8 border border-border hover:bg-destructive/10 hover:text-destructive text-muted-foreground shrink-0 shadow-sm"
                          title={t("replaceDocument")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <Label
                      htmlFor={`uploader-${slot.key}`}
                      className="w-full flex flex-col items-center justify-center py-6 border-2 border-dashed border-muted-foreground/30 rounded-lg hover:border-primary cursor-pointer hover:bg-primary/5 transition-colors"
                    >
                      <FileUp className="w-6 h-6 text-muted-foreground/60 mb-2" />
                      <span className="text-xs font-semibold text-foreground">
                        {t("chooseFile")}
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-1">
                        {t("dropHint")}
                      </span>
                      {/* Hidden file input for file upload interaction */}
                      <Input
                        type="file"
                        id={`uploader-${slot.key}`}
                        accept="application/pdf, image/png, image/jpeg"
                        onChange={(e) => handleDocumentUpload(e, slot.key)}
                        className="hidden"
                      />
                    </Label>
                    <div className="mt-3 space-y-1.5 w-full">
                      <Label
                        htmlFor={`expiry-${slot.key}`}
                        className="text-xs text-muted-foreground"
                      >
                        {t("expiresOn")}
                      </Label>
                      <DatePicker
                        value={docExpiryDates[slot.key] || ""}
                        onChange={(date) => {
                          if (date) {
                            const yyyy = date.getFullYear();
                            const mm = String(date.getMonth() + 1).padStart(
                              2,
                              "0",
                            );
                            const dd = String(date.getDate()).padStart(2, "0");
                            setDocExpiryDates((prev) => ({
                              ...prev,
                              [slot.key]: `${yyyy}-${mm}-${dd}`,
                            }));
                          } else {
                            setDocExpiryDates((prev) => ({
                              ...prev,
                              [slot.key]: "",
                            }));
                          }
                        }}
                        placeholder={t("selectExpiry")}
                        className="h-9 text-sm w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-warning/10 mb-4">
              <AlertTriangle className="size-6 text-warning" />
            </div>
            <AlertDialogTitle>{t("dialog.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingIsApproved
                ? "This document is currently APPROVED. If you delete it to upload a new one, your compliance score will drop until the new document is reviewed by an admin. Are you sure?"
                : t("dialog.deleteDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("dialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteDocumentMutation.isPending}
            >
              {deleteDocumentMutation.isPending
                ? "Deleting..."
                : t("dialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

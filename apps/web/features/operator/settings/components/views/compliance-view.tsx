"use client";

import { useTRPC } from "@/trpc/client";
import { useCompanySettings } from "../../api/use-company-settings";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Label } from "@moja/ui/components/ui/label";
import { Input } from "@moja/ui/components/ui/input";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { Eye, Trash2, FileUp, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useStorageUpload } from "@/lib/storage-client";
import { cn } from "@moja/ui/lib/utils";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@moja/ui/components/ui/alert-dialog";
import { HealthScore } from "../health-score";

const DOCUMENT_SLOTS = [
  {
    key: "BUSINESS_REGISTRATION_CERTIFICATE",
    label: "Business Registration License",
    desc: "Proof of legal commerce registry.",
  },
  {
    key: "TAX_CLEARANCE_CERTIFICATE",
    label: "Tax Compliance Certificate",
    desc: "TIN verification certificate.",
  },
  {
    key: "TRANSPORT_OPERATING_PERMIT",
    label: "National Transport Permit",
    desc: "Permit to operate intercity passenger transport.",
  },
  {
    key: "INSURANCE_CERTIFICATE",
    label: "Passenger Fleet Insurance",
    desc: "Proof of liability insurance coverage.",
  },
] as const;

export function ComplianceView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: settings } = useCompanySettings();
  
  const addDocumentMutation = useMutation(
    trpc.operator.addDocument.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(trpc.operator.getSettings.queryFilter()),
    })
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
              documents: old.company.documents.filter((doc: any) => doc.id !== variables.id)
            }
          };
        });

        return { previousSettings };
      },
      onError: (err, variables, context) => {
        if (context?.previousSettings) {
          queryClient.setQueryData(trpc.operator.getSettings.queryKey(), context.previousSettings);
        }
      },
      onSettled: () => queryClient.invalidateQueries(trpc.operator.getSettings.queryFilter()),
    })
  );

  const presignDownloadMutation = useMutation(trpc.storage.presignDownload.mutationOptions());

  const { upload: uploadDocument } = useStorageUpload("operator-document");

  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [docExpiryDates, setDocExpiryDates] = useState<Record<string, string>>({});
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingIsApproved, setDeletingIsApproved] = useState(false);

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File exceeds the maximum size of 5MB");
      return;
    }

    const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file format. Please upload a PDF, PNG, or JPEG file.");
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
        expiresAt: docExpiryDates[type] ? new Date(docExpiryDates[type]).toISOString() : undefined,
      });

      toast.success(`${type.replace(/_/g, " ")} uploaded successfully`);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload document");
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
      toast.success("Document deleted");
      setDeletingId(null);
      setDeletingIsApproved(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete document");
    }
  };

  const handleViewDocument = async (id: string, objectKey: string) => {
    const newWindow = window.open('about:blank', '_blank');
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
        <h3 className="text-lg font-medium">Compliance & Documents</h3>
        <p className="text-sm text-muted-foreground">
          Upload and manage your company's legal operating requirements.
        </p>
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
                uploaded?.status === "REJECTED" ? "border-red-200 bg-red-50/30" : "border-border"
              )}
            >
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">
                  {slot.label}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {slot.desc}
                </p>
              </div>

              {uploaded?.status === "REJECTED" && (
                <div className="mt-3 p-3 bg-red-100/50 rounded-lg text-sm text-red-800 flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <div>
                    <p className="font-semibold text-xs text-red-900 mb-0.5">Admin Rejected this Document:</p>
                    <p className="text-xs">{uploaded.notes || "No specific reason provided. Please upload a clearer copy."}</p>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-border/60">
                {isUploading ? (
                  <div className="space-y-2 py-3 text-center">
                    <Spinner className="w-5 h-5 mx-auto" />
                    <p className="text-[11px] text-primary font-semibold font-mono">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                ) : uploaded ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground truncate max-w-[150px] inline-block">
                          {uploaded.fileName}
                        </span>
                        {uploaded.status === "APPROVED" && (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold tracking-wider shrink-0">
                            APPROVED
                          </span>
                        )}
                        {uploaded.status === "PENDING" && (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold tracking-wider shrink-0">
                            PENDING
                          </span>
                        )}
                        {uploaded.status === "REJECTED" && (
                          <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[9px] font-bold tracking-wider shrink-0">
                            REJECTED
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground truncate">
                        <span>{uploaded.mimeType === "application/pdf" ? "PDF" : "IMG"}</span>
                        <span>•</span>
                        <span>
                          {format(new Date(uploaded.createdAt), "PPP")}
                        </span>
                        {uploaded.expiresAt && (
                          <>
                            <span>•</span>
                            <span className={cn(
                              "truncate",
                              new Date(uploaded.expiresAt) < new Date() ? "text-red-500 font-bold" :
                              new Date(uploaded.expiresAt) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? "text-amber-500 font-bold" : ""
                            )}>
                              Expires: {format(new Date(uploaded.expiresAt), "PPP")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pl-2">
                      <button
                        type="button"
                        onClick={() => handleViewDocument(uploaded.id, uploaded.objectKey!)}
                        className="inline-flex items-center justify-center w-8 h-8 border border-border hover:bg-slate-50 rounded-md text-muted-foreground transition-colors shrink-0 shadow-sm"
                        title="View Document"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTrashClick(uploaded)}
                        className="inline-flex items-center justify-center w-8 h-8 border border-border hover:bg-red-50 hover:text-red-500 transition-colors rounded-md text-muted-foreground shrink-0 shadow-sm"
                        title="Replace Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Label
                      htmlFor={`uploader-${slot.key}`}
                      className="w-full flex flex-col items-center justify-center py-6 border-2 border-dashed border-muted-foreground/30 rounded-lg hover:border-primary cursor-pointer hover:bg-primary/5 transition-colors"
                    >
                      <FileUp className="w-6 h-6 text-muted-foreground/60 mb-2" />
                      <span className="text-xs font-semibold text-foreground">
                        Click to upload
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-1">
                        PDF or image files up to 5MB
                      </span>
                      <input
                        type="file"
                        id={`uploader-${slot.key}`}
                        accept="application/pdf, image/png, image/jpeg"
                        onChange={(e) => handleDocumentUpload(e, slot.key)}
                        className="hidden"
                      />
                    </Label>
                    <div className="mt-3 space-y-1.5 w-full">
                      <Label htmlFor={`expiry-${slot.key}`} className="text-xs text-muted-foreground">Expiry Date (Optional)</Label>
                      <Input
                        id={`expiry-${slot.key}`}
                        type="date"
                        className="h-9 text-sm w-full"
                        value={docExpiryDates[slot.key] || ""}
                        onChange={(e) => setDocExpiryDates(prev => ({ ...prev, [slot.key]: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100 mb-4">
              <AlertTriangle className="size-6 text-amber-600" />
            </div>
            <AlertDialogTitle>Replace Compliance Document?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingIsApproved 
                ? "This document is currently APPROVED. If you delete it to upload a new one, your compliance score will drop until the new document is reviewed by an admin. Are you sure?"
                : "Are you sure you want to delete this document and upload a new one?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete} disabled={deleteDocumentMutation.isPending}>
              {deleteDocumentMutation.isPending ? "Deleting..." : "Yes, remove document"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useDropzone } from "react-dropzone";
import { Button } from "@moja/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import {
  CheckCircle2,
  UploadCloud,
  FileText,
  X,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { type DocumentsStepInput, type DocumentInput } from "@moja/schemas";
import { useStorageUpload } from "@/lib/storage-client";

interface DocumentsStepProps {
  initialData?: any;
  onSave: (data: DocumentsStepInput) => Promise<boolean>;
  onBack: () => void;
  isSaving: boolean;
}

type DocumentTypeConfig = {
  id: string;
  value: string;
  label: string;
  description: string;
  required: boolean;
};

export function DocumentsStep({
  initialData,
  onSave,
  onBack,
  isSaving,
}: DocumentsStepProps) {
  const t = useTranslations("onboarding.documents");
  const tRoot = useTranslations("onboarding");
  const { upload: uploadDocument } = useStorageUpload("operator-document");

  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const documentTypes: DocumentTypeConfig[] = [
    {
      id: "business_registration",
      value: "BUSINESS_REGISTRATION_CERTIFICATE",
      label: t("businessRegistration"),
      description: t("businessRegistrationDesc"),
      required: true,
    },
    {
      id: "tax_clearance",
      value: "TAX_CLEARANCE_CERTIFICATE",
      label: t("taxClearance"),
      description: t("taxClearanceDesc"),
      required: true,
    },
    {
      id: "transport_permit",
      value: "TRANSPORT_OPERATING_PERMIT",
      label: t("transportPermit"),
      description: t("transportPermitDesc"),
      required: true,
    },
    {
      id: "other",
      value: "OTHER",
      label: t("otherDocuments"),
      description: t("otherDocumentsDesc"),
      required: false,
    },
  ];

  // Pre-fill form if initialData exists
  useEffect(() => {
    if (
      initialData?.company?.documents &&
      initialData.company.documents.length > 0
    ) {
      const mapped = initialData.company.documents.map((doc: any) => ({
        id: doc.id || crypto.randomUUID(),
        name: doc.fileName || "",
        size: doc.fileSize || 1024 * 1024,
        type: doc.mimeType || "application/pdf",
        documentType: doc.type,
        status: "success",
        url: doc.fileUrl || "",
        objectKey: doc.objectKey || "",
      }));
      setUploadedFiles(mapped);
    }
  }, [initialData]);

  const onDrop = useCallback(
    (acceptedFiles: File[], documentType: string) => {
      const newFiles = acceptedFiles.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type || "application/pdf",
        documentType,
        status: "uploading",
        url: "",
        file,
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);

      newFiles.forEach(async (entry) => {
        try {
          const { fileUrl, objectKey } = await uploadDocument(entry.file);
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id
                ? {
                    ...f,
                    status: "success",
                    url: fileUrl,
                    objectKey,
                  }
                : f,
            ),
          );
        } catch {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id ? { ...f, status: "error" } : f,
            ),
          );
        }
      });
    },
    [uploadDocument],
  );

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const getFilesForType = (documentType: string) => {
    return uploadedFiles.filter((f) => f.documentType === documentType);
  };

  const isTypeComplete = (docType: DocumentTypeConfig) => {
    const files = getFilesForType(docType.value);
    return files.some((f) => f.status === "success");
  };

  const requiredDocumentsComplete = documentTypes
    .filter((d) => d.required)
    .every(isTypeComplete);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requiredDocumentsComplete) {
      return;
    }

    // Prepare payload
    const documentsPayload: DocumentInput[] = uploadedFiles
      .filter((f) => f.status === "success")
      .map((f) => ({
        type: f.documentType,
        fileName: f.name,
        fileUrl: f.url,
        objectKey: f.objectKey,
        fileSize: f.size,
        mimeType: f.type,
      }));

    await onSave({ documents: documentsPayload });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-border rounded-md shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">{t("title")}</CardTitle>
              <CardDescription>{t("description")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documentTypes.map((docType) => {
              const files = getFilesForType(docType.value);
              const hasUploaded = files.length > 0;
              const isUploading = files.some((f) => f.status === "uploading");
              const isSuccess = files.some((f) => f.status === "success");

              return (
                <div
                  key={docType.id}
                  className={cn(
                    "p-4 border rounded-md transition-all",
                    isSuccess && "border-green-200 bg-green-50/10",
                    isUploading && "border-primary/30 bg-primary/5",
                    !hasUploaded && "border-border",
                  )}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        {docType.label}
                        {docType.required && (
                          <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                            {t("required")}
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {docType.description}
                      </p>
                    </div>

                    {isSuccess && (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    )}
                  </div>

                  {/* Dropzone */}
                  {!hasUploaded && (
                    <DropZoneInput
                      onDrop={(files: File[]) => onDrop(files, docType.value)}
                    />
                  )}

                  {/* File List */}
                  {hasUploaded && (
                    <div className="space-y-2">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-2.5 bg-background border border-border rounded-md text-sm"
                        >
                          <div className="flex items-center gap-2 overflow-hidden mr-2">
                            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate font-medium text-xs">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground flex-shrink-0">
                              ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {file.status === "uploading" ? (
                              <span className="text-[10px] text-primary animate-pulse font-semibold">
                                {t("uploading")}
                              </span>
                            ) : (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFile(file.id)}
                                aria-label={t("removeFile")}
                                className="text-muted-foreground hover:text-destructive w-6 h-6 rounded-full"
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sticky Bottom Action Bar container placeholder */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSaving}
          className="border-border hover:bg-slate-100 rounded-md px-6 py-2"
        >
          {tRoot("back")}
        </Button>
        <Button
          type="submit"
          disabled={isSaving || !requiredDocumentsComplete}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-md px-6 py-2"
        >
          {isSaving ? tRoot("saving") : tRoot("saveAndContinue")}
        </Button>
      </div>
    </form>
  );
}

// Inner helper Dropzone component
function DropZoneInput({ onDrop }: { onDrop: (files: File[]) => void }) {
  const t = useTranslations("onboarding.documents");
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      onDrop(acceptedFiles);
    },
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".jpeg", ".jpg", ".png"],
    },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed border-border rounded-md p-4 text-center cursor-pointer hover:border-primary/50 transition-colors",
        isDragActive && "border-primary bg-primary/5",
      )}
    >
      <input {...getInputProps()} />
      <UploadCloud className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
      <p className="text-xs font-semibold text-foreground">
        {t("dragAndDrop")}{" "}
        <span className="text-primary hover:underline">{t("browse")}</span>
      </p>
      <p className="text-[10px] text-muted-foreground mt-1">
        {t("formatHint")}
      </p>
    </div>
  );
}

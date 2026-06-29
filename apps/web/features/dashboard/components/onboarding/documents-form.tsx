"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "@moja/ui/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { CheckCircle2, UploadCloud, FileText, X, AlertCircle, Clock, ShieldCheck } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";

type DocumentType = {
  id: string;
  value: string;
  label: string;
  description: string;
  required: boolean;
  icon: React.ReactNode;
};

type UploadedFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  documentType: string;
  status: "uploading" | "success" | "error";
  url?: string;
};

export function DocumentsForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const documentTypes: DocumentType[] = [
    {
      id: "business_registration",
      value: "BUSINESS_REGISTRATION_CERTIFICATE",
      label: "Business Registration Certificate",
      description: "Official certificate of business registration",
      required: true,
      icon: <FileText className="w-5 h-5" />,
    },
    {
      id: "tax_clearance",
      value: "TAX_CLEARANCE_CERTIFICATE",
      label: "Tax Clearance Certificate",
      description: "Proof of tax compliance from revenue authority",
      required: true,
      icon: <ShieldCheck className="w-5 h-5" />,
    },
    {
      id: "transport_permit",
      value: "TRANSPORT_OPERATING_PERMIT",
      label: "Transport Operating Permit",
      description: "Government permit to operate transport services",
      required: true,
      icon: <FileText className="w-5 h-5" />,
    },
    {
      id: "insurance",
      value: "INSURANCE_CERTIFICATE",
      label: "Insurance Certificate",
      description: "Valid insurance coverage for vehicles and passengers",
      required: true,
      icon: <ShieldCheck className="w-5 h-5" />,
    },
    {
      id: "bank_statement",
      value: "BANK_STATEMENT",
      label: "Bank Statement",
      description: "Recent bank statement (last 3 months)",
      required: false,
      icon: <FileText className="w-5 h-5" />,
    },
    {
      id: "other",
      value: "OTHER",
      label: "Other Documents",
      description: "Any additional supporting documents",
      required: false,
      icon: <FileText className="w-5 h-5" />,
    },
  ];

  const onDrop = useCallback((acceptedFiles: File[], documentType: string) => {
    const newFiles = acceptedFiles.map(file => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      documentType,
      status: "uploading" as const,
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Simulate upload
    newFiles.forEach(file => {
      setTimeout(() => {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === file.id ? { ...f, status: "success", url: URL.createObjectURL(new Blob([file.name])) } : f
          )
        );
      }, 1500);
    });
    
    toast.success(`${acceptedFiles.length} file(s) uploaded successfully`);
  }, []);

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const getDocumentUploaded = (documentType: string) => {
    return uploadedFiles.filter(f => f.documentType === documentType);
  };

  const requiredDocumentsComplete = documentTypes
    .filter(d => d.required)
    .every(d => getDocumentUploaded(d.value).length > 0);

  async function handleSubmit() {
    if (!requiredDocumentsComplete) {
      toast.error("Please upload all required documents");
      return;
    }
    
    setIsLoading(true);
    try {
      // TODO: Save documents data
      console.log("Documents data:", uploadedFiles);
      
      toast.success("Documents saved!");
      router.push("/dashboard/operator/onboarding/bank");
    } catch (error) {
      toast.error("Failed to save documents. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => onDrop(files, "other"),
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".jpeg", ".jpg", ".png"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
      {/* Verification Status Card */}
      <Card className="border-amber-100 bg-amber-50/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Verification Status</CardTitle>
              <CardDescription>
                Upload documents to verify your business and unlock full features
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-slate-200">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="3"
                  strokeDasharray="100 100"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#FBBF24"
                  strokeWidth="3"
                  strokeDasharray="100 100"
                  strokeDashoffset={requiredDocumentsComplete ? 0 : 70}
                  style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {requiredDocumentsComplete ? (
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                ) : (
                  <Clock className="w-8 h-8 text-amber-500" />
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">
                {requiredDocumentsComplete ? "All Required Documents Uploaded!" : "Upload Required Documents"}
              </h3>
              <p className="text-sm text-slate-500">
                {requiredDocumentsComplete 
                  ? "Your verification is in progress. We'll review and approve within 24-48 hours."
                  : `Upload ${documentTypes.filter(d => d.required).length} required documents to continue.`
                }
              </p>
              <div className="flex gap-2 mt-2">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  {documentTypes.filter(d => d.required && getDocumentUploaded(d.value).length > 0).length} Required
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                  {documentTypes.filter(d => !d.required && getDocumentUploaded(d.value).length > 0).length} Optional
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Types */}
      <div className="space-y-4">
        {documentTypes.map((docType) => {
          const uploaded = getDocumentUploaded(docType.value);
          const isUploaded = uploaded.length > 0;
          
          return (
            <Card 
              key={docType.id}
              className={cn(
                "border-2 transition-colors",
                isUploaded ? "border-green-200 bg-green-50/50" : "border-slate-200"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      isUploaded ? "bg-green-500" : "bg-slate-100"
                    )}>
                      {isUploaded ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : (
                        <div className="text-slate-600">{docType.icon}</div>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {docType.label}
                        {docType.required && <span className="text-destructive">*</span>}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {docType.description}
                      </CardDescription>
                    </div>
                  </div>
                  {isUploaded && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => uploaded[0] && removeFile(uploaded[0].id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isUploaded ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">{uploaded[0]?.name || ""}</p>
                        <p className="text-xs text-green-600">
                          {uploaded[0] ? (uploaded[0].size / 1024 / 1024).toFixed(2) + " MB - Uploaded" : ""}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                      Complete
                    </span>
                  </div>
                ) : (
                  <UploadZone
                    docType={docType}
                    onDrop={(files) => onDrop(files, docType.value)}
                    accept={{ "application/pdf": [".pdf"], "image/*": [".jpeg", ".jpg", ".png"] }}
                    maxSize={10 * 1024 * 1024}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* General Upload Zone */}
      <Card className="border-2 border-dashed border-slate-300 bg-slate-50/50">
        <CardContent className="pt-6">
          <div 
            {...getRootProps()}
            className={cn(
              "flex flex-col items-center justify-center gap-4 p-8 rounded-lg cursor-pointer transition-all",
              isDragActive ? "bg-amber-50 border-amber-300" : ""
            )}
          >
            <input {...getInputProps()} />
            <UploadCloud className="w-12 h-12 text-amber-500" />
            <div className="text-center">
              <h3 className="font-semibold text-slate-900">Drag & Drop Files Here</h3>
              <p className="text-sm text-slate-500">
                Or click to browse - PDF, JPG, PNG (Max 10MB per file)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Document Tips</h4>
              <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                <li>Ensure all documents are clear and legible</li>
                <li>Files should be in PDF, JPG, or PNG format</li>
                <li>Maximum file size: 10MB per document</li>
                <li>Required documents must be official and valid</li>
                <li>Verification typically takes 24-48 hours</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-between items-center">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/dashboard/operator/onboarding/locations")}
          disabled={isLoading}
        >
          Back
        </Button>
        <Button
          type="submit"
          size="lg"
          className="bg-amber-600 hover:bg-amber-700 text-white min-w-48"
          disabled={isLoading || !requiredDocumentsComplete}
        >
          {isLoading ? "Saving..." : "Continue to Bank Setup"}
        </Button>
      </div>
    </form>
  );
}

// Upload zone component for each document type
function UploadZone({
  docType,
  onDrop,
  accept,
  maxSize,
}: {
  docType: DocumentType;
  onDrop: (files: File[]) => void;
  accept: Record<string, string[]>;
  maxSize: number;
}) {
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    noClick: false,
  });

  const errors = fileRejections.map(rejection => {
    if (rejection.errors[0]?.code === "file-too-large") {
      return `File too large (max ${maxSize / 1024 / 1024}MB)`;
    }
    if (rejection.errors[0]?.code === "file-invalid-type") {
      return "Invalid file type - PDF, JPG, or PNG only";
    }
    return "Upload failed";
  });

  return (
    <div 
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all",
        isDragActive ? "border-amber-500 bg-amber-50/50" : "border-slate-300 bg-slate-50/0"
      )}
    >
      <input {...getInputProps()} />
      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
        <UploadCloud className="w-5 h-5 text-slate-500" />
      </div>
      <p className="text-sm text-slate-600">
        Click to upload or drag file here
      </p>
      <p className="text-xs text-slate-400">
        {docType.label} ({Object.values(accept).flat().join(", ")})
      </p>
      {errors.length > 0 && (
        <p className="text-xs text-destructive">{errors[0]}</p>
      )}
    </div>
  );
}

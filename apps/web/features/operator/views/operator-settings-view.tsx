"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Building2,
  Landmark,
  FileText,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Plus,
  FileUp,
  RefreshCw,
  Clock,
  ArrowRight,
  Lock,
  Settings,
  Link2,
  Palette,
  Bell,
  KeyRound,
  Eye,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@moja/ui/lib/utils";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { Textarea } from "@moja/ui/components/ui/textarea";
import { Spinner } from "@moja/ui/components/ui/spinner";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@moja/ui/components/ui/drawer";
import { storageAdapter } from "../lib/storage-adapter";
import {
  getSettings,
  updateCompany,
  updateBank,
  addDocument,
  deleteDocument,
  type OperatorSettings,
  type Company,
  type BankAccount,
  type CompanyDocument,
} from "../api/settings";

type SettingsSection = "profile" | "bank" | "documents" | "verification";

export function OperatorSettingsView() {
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("profile");
  const [settings, setSettings] = useState<OperatorSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit Drawers State
  const [activeDrawer, setActiveDrawer] = useState<
    "profile" | "legal" | "bank" | null
  >(null);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    description: "",
  });

  const [legalForm, setLegalForm] = useState({
    businessType: "SOLE_PROPRIETORSHIP",
    registrationNumber: "",
    taxId: "",
    yearEstablished: "",
  });

  const [bankForm, setBankForm] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
    branch: "",
    swiftCode: "",
    iban: "",
  });

  // Document upload state
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      setSettings(data);

      // Pre-fill forms
      setProfileForm({
        name: data.company.name || "",
        email: data.company.email || "",
        phone: data.company.phone || "",
        website: data.company.website || "",
        description: data.company.description || "",
      });

      setLegalForm({
        businessType: data.company.businessType || "SOLE_PROPRIETORSHIP",
        registrationNumber: data.company.registrationNumber || "",
        taxId: data.company.taxId || "",
        yearEstablished: data.company.yearEstablished?.toString() || "",
      });

      if (data.company.bankAccount) {
        setBankForm({
          bankName: data.company.bankAccount.bankName || "",
          accountNumber: data.company.bankAccount.accountNumber || "",
          accountName: data.company.bankAccount.accountName || "",
          branch: data.company.bankAccount.branch || "",
          swiftCode: data.company.bankAccount.swiftCode || "",
          iban: data.company.bankAccount.iban || "",
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load settings data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  // Handle Save Company Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateCompany({
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        website: profileForm.website || null,
        description: profileForm.description || null,
      });
      setSettings((prev) =>
        prev ? { ...prev, company: { ...prev.company, ...updated } } : null,
      );
      toast.success("Company profile updated successfully");
      setActiveDrawer(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Handle Save Legal Details
  const handleSaveLegal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateCompany({
        businessType: legalForm.businessType as any,
        registrationNumber: legalForm.registrationNumber,
        taxId: legalForm.taxId,
        yearEstablished: legalForm.yearEstablished
          ? parseInt(legalForm.yearEstablished, 10)
          : null,
      });
      setSettings((prev) =>
        prev ? { ...prev, company: { ...prev.company, ...updated } } : null,
      );
      toast.success("Legal business details updated successfully");
      setActiveDrawer(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update legal details");
    } finally {
      setSaving(false);
    }
  };

  // Handle Save Bank details
  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateBank({
        bankName: bankForm.bankName,
        accountNumber: bankForm.accountNumber,
        accountName: bankForm.accountName,
        branch: bankForm.branch || null,
        swiftCode: bankForm.swiftCode || null,
        iban: bankForm.iban || null,
      });
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              company: { ...prev.company, bankAccount: updated },
            }
          : null,
      );
      toast.success("Settlement bank details updated successfully");
      setActiveDrawer(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update bank account");
    } finally {
      setSaving(false);
    }
  };

  // Handle Document Upload
  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: any,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDocType(type);
    setUploadProgress(0);

    try {
      // Decoupled storage adapter call
      const fileUrl = await storageAdapter.uploadFile(file, (pct) => {
        setUploadProgress(pct);
      });

      // Save document meta to database
      const newDoc = await addDocument({
        type,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type || "application/pdf",
      });

      setSettings((prev) =>
        prev
          ? {
              ...prev,
              company: {
                ...prev.company,
                documents: [...prev.company.documents, newDoc],
              },
            }
          : null,
      );
      toast.success(`${type.replace("_", " ")} uploaded successfully`);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload document");
    } finally {
      setUploadingDocType(null);
      setUploadProgress(0);
    }
  };

  // Handle Document Deletion
  const handleDeleteDocument = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this document? It will remove this compliance file from your profile.",
    );
    if (!confirmDelete) return;

    try {
      await deleteDocument(id);
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              company: {
                ...prev.company,
                documents: prev.company.documents.filter((d) => d.id !== id),
              },
            }
          : null,
      );
      toast.success("Document deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete document");
    }
  };

  // Handle Logo Upload/Update
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.loading("Uploading logo...", { id: "logo-upload" });
      const fileUrl = await storageAdapter.uploadFile(file);
      const updated = await updateCompany({ logoUrl: fileUrl });

      setSettings((prev) =>
        prev ? { ...prev, company: { ...prev.company, ...updated } } : null,
      );
      toast.success("Company logo updated successfully", { id: "logo-upload" });
    } catch (err: any) {
      toast.error(err.message || "Failed to upload logo", {
        id: "logo-upload",
      });
    }
  };

  // Handle Logo Removal
  const handleLogoRemove = async () => {
    try {
      toast.loading("Removing logo...", { id: "logo-remove" });
      const updated = await updateCompany({ logoUrl: "" });
      setSettings((prev) =>
        prev ? { ...prev, company: { ...prev.company, ...updated } } : null,
      );
      toast.success("Company logo removed", { id: "logo-remove" });
    } catch (err: any) {
      toast.error(err.message || "Failed to remove logo", {
        id: "logo-remove",
      });
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Spinner className="size-8" />
        <p className="text-sm font-semibold text-muted-foreground">
          Loading company settings...
        </p>
      </div>
    );
  }

  const { company } = settings;

  // Calculate Health Completion metrics
  const checklist = [
    {
      label: "Company profile details filled",
      done: !!company.name && !!company.taxId,
    },
    {
      label: "Settlement bank details configured",
      done: !!company.bankAccount,
    },
    {
      label: "Business License uploaded",
      done: company.documents.some((d) => d.type === "BUSINESS_LICENSE"),
    },
    {
      label: "Operating Permit uploaded",
      done: company.documents.some((d) => d.type === "OPERATING_PERMIT"),
    },
  ];
  const completedCount = checklist.filter((c) => c.done).length;
  const healthPercent = Math.round((completedCount / checklist.length) * 100);

  const missingTasks = checklist.filter((c) => !c.done);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Verification Banner */}
      <div className="flex items-center justify-between border border-border bg-card p-4 rounded-lg shadow-xs">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-2.5 h-2.5 rounded-full animate-pulse",
              company.status === "APPROVED"
                ? "bg-emerald-500"
                : company.status === "PENDING_VERIFICATION"
                  ? "bg-amber-500"
                  : "bg-slate-400",
            )}
          />
          <div>
            <h4 className="text-xs font-semibold text-foreground">
              Verification Status:{" "}
              <span className="font-bold">
                {company.status.replace("_", " ")}
              </span>
            </h4>
            {company.rejectionReason && (
              <p className="text-[11px] text-destructive mt-0.5">
                Rejection reason: {company.rejectionReason}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {company.status === "DRAFT" && (
            <Button
              size="sm"
              variant="default"
              onClick={async () => {
                try {
                  toast.loading("Submitting for verification...", {
                    id: "submit-verification",
                  });
                  // Simulate complete
                  await fetch(
                    `${API_BASE}/api/v1/operator/onboarding/complete`,
                    {
                      method: "POST",
                      headers: getHeaders(),
                      credentials: "include",
                    },
                  );
                  await loadSettings();
                  toast.success(
                    "Submitted for admin verification successfully",
                    { id: "submit-verification" },
                  );
                } catch (err: any) {
                  toast.error(err.message || "Failed to submit", {
                    id: "submit-verification",
                  });
                }
              }}
            >
              Submit for Verification
            </Button>
          )}
        </div>
      </div>

      {/* Grid Settings Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left-hand Navigation */}
        <div className="md:col-span-1 space-y-6">
          <div className="border border-border bg-card rounded-lg overflow-hidden shadow-xs">
            <div className="p-4 border-b border-border/60">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Company Settings
              </h3>
            </div>
            <nav className="flex flex-col">
              <button
                type="button"
                onClick={() => setActiveSection("profile")}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-xs font-semibold text-left border-l-2 transition-all outline-none",
                  activeSection === "profile"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-transparent text-muted-foreground hover:bg-slate-50 hover:text-foreground",
                )}
              >
                <Building2 className="size-4" />
                Company Profile
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("bank")}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-xs font-semibold text-left border-l-2 transition-all outline-none",
                  activeSection === "bank"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-transparent text-muted-foreground hover:bg-slate-50 hover:text-foreground",
                )}
              >
                <Landmark className="size-4" />
                Bank Account
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("documents")}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-xs font-semibold text-left border-l-2 transition-all outline-none",
                  activeSection === "documents"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-transparent text-muted-foreground hover:bg-slate-50 hover:text-foreground",
                )}
              >
                <FileText className="size-4" />
                Compliance Documents
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("verification")}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-xs font-semibold text-left border-l-2 transition-all outline-none",
                  activeSection === "verification"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-transparent text-muted-foreground hover:bg-slate-50 hover:text-foreground",
                )}
              >
                <CheckCircle2 className="size-4" />
                Verification Status
              </button>
            </nav>
          </div>

          {/* Placeholders for Future Scales */}
          <div className="border border-border bg-card/60 rounded-lg overflow-hidden shadow-xs opacity-65">
            <div className="p-4 border-b border-border/60">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Features (Upcoming)
              </h3>
            </div>
            <div className="flex flex-col text-xs text-muted-foreground/60 select-none">
              <div className="flex items-center gap-3 px-4 py-3 border-l-2 border-transparent">
                <Bell className="size-4 text-muted-foreground/40" />
                Notifications Settings
              </div>
              <div className="flex items-center gap-3 px-4 py-3 border-l-2 border-transparent">
                <KeyRound className="size-4 text-muted-foreground/40" />
                API Keys & Webhooks
              </div>
              <div className="flex items-center gap-3 px-4 py-3 border-l-2 border-transparent">
                <Palette className="size-4 text-muted-foreground/40" />
                Branding Colors
              </div>
              <div className="flex items-center gap-3 px-4 py-3 border-l-2 border-transparent">
                <Link2 className="size-4 text-muted-foreground/40" />
                Integrations
              </div>
            </div>
          </div>
        </div>

        {/* Right-hand Content Area */}
        <div className="md:col-span-3 space-y-6">
          {/* Company Health Dashboard Card */}
          <div className="border border-border bg-card p-6 rounded-lg shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Company Control Health
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Complete required details to keep your account operational and
                  verified.
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold font-mono text-primary">
                  {healthPercent}%
                </span>
              </div>
            </div>

            {/* Health completion progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${healthPercent}%` }}
              />
            </div>

            {/* Checklist details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Completed checklist
                </h4>
                <div className="space-y-1">
                  {checklist.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      {item.done ? (
                        <>
                          <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                          <span className="text-muted-foreground line-through decoration-muted-foreground/30">
                            {item.label}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="size-3.5 border border-dashed border-muted-foreground/40 rounded-full shrink-0" />
                          <span className="text-muted-foreground/70">
                            {item.label}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {missingTasks.length > 0 && (
                <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-border/80 pt-3 md:pt-0 md:pl-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-destructive">
                    Action Required
                  </h4>
                  <div className="space-y-1">
                    {missingTasks.map((task, idx) => (
                      <p
                        key={idx}
                        className="text-xs text-foreground font-semibold flex items-center gap-1.5"
                      >
                        <span className="w-1 h-1 bg-destructive rounded-full shrink-0" />
                        {task.label}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tab Views */}

          {/* COMPANY PROFILE SUB-PAGE */}
          {activeSection === "profile" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* General details Card */}
              <div className="border border-border bg-card rounded-lg overflow-hidden shadow-xs">
                <div className="p-4 border-b border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-muted-foreground" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">
                      General Information
                    </h3>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveDrawer("profile")}
                  >
                    Edit General
                  </Button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Company Name</span>
                    <p className="font-semibold text-foreground mt-0.5">
                      {company.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Slug</span>
                    <p className="font-semibold text-foreground mt-0.5 font-mono">
                      {company.slug}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Business Email
                    </span>
                    <p className="font-semibold text-foreground mt-0.5">
                      {company.email}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Company Phone</span>
                    <p className="font-semibold text-foreground mt-0.5">
                      {company.phone}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground">Website</span>
                    <p className="font-semibold text-foreground mt-0.5">
                      {company.website ? (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {company.website} <ExternalLink className="size-3" />
                        </a>
                      ) : (
                        "None configured"
                      )}
                    </p>
                  </div>
                  <div className="md:col-span-2 border-t border-border/60 pt-4 mt-2">
                    <span className="text-muted-foreground">
                      Business Description
                    </span>
                    <p className="font-semibold text-foreground mt-1 whitespace-pre-wrap leading-relaxed">
                      {company.description || "No description configured."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Legal Details Card */}
              <div className="border border-border bg-card rounded-lg overflow-hidden shadow-xs">
                <div className="p-4 border-b border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-muted-foreground" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">
                      Legal & Compliance Details
                    </h3>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveDrawer("legal")}
                  >
                    Edit Legal
                  </Button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">
                      Business Entity Type
                    </span>
                    <p className="font-semibold text-foreground mt-0.5">
                      {company.businessType.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Year Established
                    </span>
                    <p className="font-semibold text-foreground mt-0.5">
                      {company.yearEstablished || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Registration / Permit Number
                    </span>
                    <p className="font-semibold text-foreground mt-0.5 font-mono">
                      {company.registrationNumber}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Tax Identification Number (TIN)
                    </span>
                    <p className="font-semibold text-foreground mt-0.5 font-mono">
                      {company.taxId}
                    </p>
                  </div>
                </div>
              </div>

              {/* Logo / Branding Card */}
              <div className="border border-border bg-card rounded-lg overflow-hidden shadow-xs">
                <div className="p-4 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <Palette className="size-4 text-muted-foreground" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">
                      Branding Logo
                    </h3>
                  </div>
                </div>
                <div className="p-6 flex flex-col md:flex-row items-center gap-6">
                  <div className="size-24 border border-border bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden shrink-0 relative">
                    {company.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt="Company logo"
                        className="object-contain w-full h-full"
                      />
                    ) : (
                      <Building2 className="size-8 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="space-y-3 w-full">
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">
                        Company Logo
                      </h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                        Logo used on passenger ticket manifests, printed
                        receipts, and mobile applications. PNG/JPG formats up to
                        2MB recommended (512x512px square).
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label
                        htmlFor="logo-uploader"
                        className="inline-flex items-center justify-center rounded-lg border border-border hover:bg-slate-50 cursor-pointer h-8 px-3 text-xs font-semibold"
                      >
                        <FileUp className="size-3.5 mr-1.5" />
                        {company.logoUrl ? "Replace logo" : "Upload PNG/JPG"}
                        <input
                          type="file"
                          id="logo-uploader"
                          accept="image/png, image/jpeg"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </Label>
                      {company.logoUrl && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleLogoRemove}
                          className="h-8"
                        >
                          <Trash2 className="size-3.5 mr-1.5" /> Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BANK ACCOUNT SUB-PAGE */}
          {activeSection === "bank" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border border-border bg-card rounded-lg overflow-hidden shadow-xs">
                <div className="p-4 border-b border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Landmark className="size-4 text-muted-foreground" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">
                      Bank Settlement Account
                    </h3>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveDrawer("bank")}
                  >
                    {company.bankAccount
                      ? "Edit Bank Account"
                      : "Configure Bank"}
                  </Button>
                </div>

                {company.bankAccount ? (
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Bank Name</span>
                        <p className="font-semibold text-foreground mt-0.5">
                          {company.bankAccount.bankName}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Account Holder Name
                        </span>
                        <p className="font-semibold text-foreground mt-0.5">
                          {company.bankAccount.accountName}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Account Number
                        </span>
                        <p className="font-semibold text-foreground mt-0.5 font-mono">
                          ••••••{company.bankAccount.accountNumber.slice(-4)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Bank Branch / Location
                        </span>
                        <p className="font-semibold text-foreground mt-0.5">
                          {company.bankAccount.branch || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          SWIFT / BIC Code
                        </span>
                        <p className="font-semibold text-foreground mt-0.5 font-mono">
                          {company.bankAccount.swiftCode || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">IBAN</span>
                        <p className="font-semibold text-foreground mt-0.5 font-mono">
                          {company.bankAccount.iban || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-10 text-center space-y-3">
                    <div className="size-10 bg-slate-50 text-muted-foreground/50 mx-auto rounded-full flex items-center justify-center">
                      <Landmark className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        No bank account configured
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed mt-0.5">
                        Add settlement details to receive automatic payouts for
                        tickets booked through passenger apps.
                      </p>
                    </div>
                    <Button size="sm" onClick={() => setActiveDrawer("bank")}>
                      Configure Payout Bank
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COMPLIANCE DOCUMENTS SUB-PAGE */}
          {activeSection === "documents" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border border-border bg-card rounded-lg overflow-hidden shadow-xs">
                <div className="p-4 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-muted-foreground" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">
                      Compliance Documents
                    </h3>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  {/* Grid of required document slots */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      {
                        key: "BUSINESS_LICENSE",
                        label: "Business Registration License",
                        desc: "Proof of legal commerce registry.",
                      },
                      {
                        key: "TAX_CERTIFICATE",
                        label: "Tax Compliance Certificate",
                        desc: "TIN verification certificate.",
                      },
                      {
                        key: "OPERATING_PERMIT",
                        label: "National Transport Permit",
                        desc: "Permit to operate intercity passenger transport.",
                      },
                      {
                        key: "INSURANCE_PROOF",
                        label: "Passenger Fleet Insurance",
                        desc: "Proof of liability insurance coverage.",
                      },
                    ].map((slot) => {
                      const uploaded = company.documents.find(
                        (d) => d.type === slot.key,
                      );
                      const isUploading = uploadingDocType === slot.key;

                      return (
                        <div
                          key={slot.key}
                          className="border border-border rounded-lg p-5 flex flex-col justify-between bg-slate-50/20"
                        >
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-foreground">
                              {slot.label}
                            </h4>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              {slot.desc}
                            </p>
                          </div>

                          {/* Upload state card */}
                          <div className="mt-4 pt-4 border-t border-border/60">
                            {isUploading ? (
                              <div className="space-y-2 py-3 text-center">
                                <Spinner className="size-5 mx-auto" />
                                <p className="text-[11px] text-primary font-semibold font-mono">
                                  Uploading... {uploadProgress}%
                                </p>
                              </div>
                            ) : uploaded ? (
                              <div className="flex items-center justify-between text-xs">
                                <div className="space-y-1">
                                  <span className="font-semibold text-foreground truncate max-w-[150px] inline-block">
                                    {uploaded.fileName}
                                  </span>
                                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                    <span>PDF</span>
                                    <span>•</span>
                                    <span>
                                      {format(
                                        new Date(uploaded.createdAt),
                                        "PPP",
                                      )}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 pl-2">
                                  <a
                                    href={uploaded.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center size-7 border border-border hover:bg-slate-50 rounded text-muted-foreground"
                                    title="View Document"
                                  >
                                    <Eye className="size-3.5" />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteDocument(uploaded.id)
                                    }
                                    className="inline-flex items-center justify-center size-7 border border-border hover:bg-red-50 hover:text-red-500 rounded text-muted-foreground"
                                    title="Delete Document"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="relative">
                                <Label
                                  htmlFor={`uploader-${slot.key}`}
                                  className="w-full flex flex-col items-center justify-center py-4 border border-dashed border-muted-foreground/30 rounded-lg hover:border-primary cursor-pointer hover:bg-primary/5 transition-colors"
                                >
                                  <FileUp className="size-5 text-muted-foreground/60 mb-1" />
                                  <span className="text-[10px] font-bold text-foreground">
                                    Upload document
                                  </span>
                                  <span className="text-[9px] text-muted-foreground mt-0.5">
                                    PDF or image files up to 5MB
                                  </span>
                                  <input
                                    type="file"
                                    id={`uploader-${slot.key}`}
                                    accept="application/pdf, image/png, image/jpeg"
                                    onChange={(e) =>
                                      handleDocumentUpload(e, slot.key as any)
                                    }
                                    className="hidden"
                                  />
                                </Label>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VERIFICATION PIPELINE */}
          {activeSection === "verification" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border border-border bg-card rounded-lg overflow-hidden shadow-xs">
                <div className="p-4 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-muted-foreground" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">
                      Business Verification Status
                    </h3>
                  </div>
                </div>

                <div className="p-8 max-w-lg mx-auto space-y-8">
                  {/* Vertical pipeline checklist (like GitHub Actions) */}
                  <div className="relative pl-6 border-l-2 border-slate-100 space-y-8">
                    {/* Step 1: Company Profile */}
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0.5 size-4 rounded-full border bg-white flex items-center justify-center border-emerald-500 text-emerald-500">
                        <CheckCircle2 className="size-3.5 fill-white" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">
                          Company Profile Details
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Registration number, tax TIN ID, and company details
                          provided.
                        </p>
                      </div>
                    </div>

                    {/* Step 2: Bank Details */}
                    <div className="relative">
                      {company.bankAccount ? (
                        <>
                          <div className="absolute -left-[31px] top-0.5 size-4 rounded-full border bg-white flex items-center justify-center border-emerald-500 text-emerald-500">
                            <CheckCircle2 className="size-3.5 fill-white" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-foreground">
                              Settlement Bank Account
                            </h4>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Bank branch and account details configured.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="absolute -left-[31px] top-0.5 size-4 rounded-full border bg-white flex items-center justify-center border-slate-300 text-slate-400">
                            <Clock className="size-3.5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-muted-foreground">
                              Settlement Bank Account
                            </h4>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Please add bank details to receive ticket booking
                              payouts.
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Step 3: Operating Permit & Docs */}
                    <div className="relative">
                      {company.documents.length >= 2 ? (
                        <>
                          <div className="absolute -left-[31px] top-0.5 size-4 rounded-full border bg-white flex items-center justify-center border-emerald-500 text-emerald-500">
                            <CheckCircle2 className="size-3.5 fill-white" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-foreground">
                              Compliance Permits & Documents
                            </h4>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Required operating permit and business licenses
                              submitted.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="absolute -left-[31px] top-0.5 size-4 rounded-full border bg-white flex items-center justify-center border-slate-300 text-slate-400">
                            <Clock className="size-3.5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-muted-foreground">
                              Compliance Permits & Documents
                            </h4>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Please upload all required business permits.
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Step 4: Admin Review */}
                    <div className="relative">
                      {company.status === "APPROVED" ? (
                        <>
                          <div className="absolute -left-[31px] top-0.5 size-4 rounded-full border bg-white flex items-center justify-center border-emerald-500 text-emerald-500">
                            <CheckCircle2 className="size-3.5 fill-white" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-foreground">
                              Admin Verification Review
                            </h4>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Compliance review verified and approved.
                            </p>
                          </div>
                        </>
                      ) : company.status === "PENDING_VERIFICATION" ? (
                        <>
                          <div className="absolute -left-[31px] top-0.5 size-4 rounded-full border bg-white flex items-center justify-center border-amber-500 text-amber-500">
                            <Spinner className="size-3.5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-foreground">
                              Admin Verification Review
                            </h4>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Your documents are currently pending review by
                              Moja Ride support team.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="absolute -left-[31px] top-0.5 size-4 rounded-full border bg-white flex items-center justify-center border-slate-300 text-slate-400">
                            <Clock className="size-3.5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-muted-foreground">
                              Admin Verification Review
                            </h4>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Submit your profile for review once all steps are
                              complete.
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Step 5: Approval */}
                    <div className="relative">
                      {company.status === "APPROVED" ? (
                        <>
                          <div className="absolute -left-[31px] top-0.5 size-4 rounded-full border bg-white flex items-center justify-center border-emerald-500 text-emerald-500">
                            <ShieldCheck className="size-3.5 text-emerald-500" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-foreground">
                              Company Fully Verified
                            </h4>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Your company is authorized to host active routes
                              and sell tickets.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="absolute -left-[31px] top-0.5 size-4 rounded-full border bg-white flex items-center justify-center border-slate-200 text-slate-300">
                            <Lock className="size-3" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-muted-foreground">
                              Approval Authorized
                            </h4>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Authorized state unlocked on verification.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DRAWERS FOR FORMS EDITING */}

      {/* 1. General Profile Drawer */}
      <Drawer
        direction="right"
        open={activeDrawer === "profile"}
        onOpenChange={(open) => !open && setActiveDrawer(null)}
      >
        <DrawerContent className="h-full max-w-md ml-auto border-l">
          <form
            onSubmit={handleSaveProfile}
            className="h-full flex flex-col justify-between"
          >
            <DrawerHeader>
              <DrawerTitle>Edit General Information</DrawerTitle>
              <DrawerDescription>
                Update your primary business info.
              </DrawerDescription>
            </DrawerHeader>

            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <Label htmlFor="company-name">Company Name *</Label>
                <Input
                  id="company-name"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="company-email">Business Email *</Label>
                <Input
                  id="company-email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="company-phone">Company Phone *</Label>
                <Input
                  id="company-phone"
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, phone: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="company-website">Website URL (Optional)</Label>
                <Input
                  id="company-website"
                  placeholder="https://example.com"
                  value={profileForm.website}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, website: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="company-description">Description</Label>
                <Textarea
                  id="company-description"
                  rows={4}
                  placeholder="Describe your company services..."
                  value={profileForm.description}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="p-6 border-t border-border flex items-center justify-end gap-3 bg-slate-50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveDrawer(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Spinner className="size-4" /> : "Save Changes"}
              </Button>
            </div>
          </form>
        </DrawerContent>
      </Drawer>

      {/* 2. Legal details Drawer */}
      <Drawer
        direction="right"
        open={activeDrawer === "legal"}
        onOpenChange={(open) => !open && setActiveDrawer(null)}
      >
        <DrawerContent className="h-full max-w-md ml-auto border-l">
          <form
            onSubmit={handleSaveLegal}
            className="h-full flex flex-col justify-between"
          >
            <DrawerHeader>
              <DrawerTitle>Edit Legal Details</DrawerTitle>
              <DrawerDescription>
                Update corporate registration parameters.
              </DrawerDescription>
            </DrawerHeader>

            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <Label htmlFor="business-type">Business Entity Type *</Label>
                <select
                  id="business-type"
                  value={legalForm.businessType}
                  onChange={(e) =>
                    setLegalForm({ ...legalForm, businessType: e.target.value })
                  }
                  className="w-full h-9 rounded-lg border border-input px-3 py-1.5 text-sm outline-none focus:ring-3 focus:ring-primary/10 focus:border-primary"
                >
                  <option value="SOLE_PROPRIETORSHIP">
                    Sole Proprietorship
                  </option>
                  <option value="PARTNERSHIP">Partnership</option>
                  <option value="CORPORATION">Corporation</option>
                  <option value="COOPERATIVE">Cooperative</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="registration-number">
                  Registration Number *
                </Label>
                <Input
                  id="registration-number"
                  value={legalForm.registrationNumber}
                  onChange={(e) =>
                    setLegalForm({
                      ...legalForm,
                      registrationNumber: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tax-id">Tax ID (TIN) *</Label>
                <Input
                  id="tax-id"
                  value={legalForm.taxId}
                  onChange={(e) =>
                    setLegalForm({ ...legalForm, taxId: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="year-established">Year Established</Label>
                <Input
                  id="year-established"
                  type="number"
                  value={legalForm.yearEstablished}
                  onChange={(e) =>
                    setLegalForm({
                      ...legalForm,
                      yearEstablished: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="p-6 border-t border-border flex items-center justify-end gap-3 bg-slate-50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveDrawer(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Spinner className="size-4" /> : "Save Changes"}
              </Button>
            </div>
          </form>
        </DrawerContent>
      </Drawer>

      {/* 3. Bank Account Drawer */}
      <Drawer
        direction="right"
        open={activeDrawer === "bank"}
        onOpenChange={(open) => !open && setActiveDrawer(null)}
      >
        <DrawerContent className="h-full max-w-md ml-auto border-l">
          <form
            onSubmit={handleSaveBank}
            className="h-full flex flex-col justify-between"
          >
            <DrawerHeader>
              <DrawerTitle>Edit Settlement Bank Account</DrawerTitle>
              <DrawerDescription>
                Configure account parameters for automated ticket payouts.
              </DrawerDescription>
            </DrawerHeader>

            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <Label htmlFor="bank-name">Bank Name *</Label>
                <Input
                  id="bank-name"
                  value={bankForm.bankName}
                  onChange={(e) =>
                    setBankForm({ ...bankForm, bankName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="account-name">Account Holder Name *</Label>
                <Input
                  id="account-name"
                  value={bankForm.accountName}
                  onChange={(e) =>
                    setBankForm({ ...bankForm, accountName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="account-number">Account Number *</Label>
                <Input
                  id="account-number"
                  value={bankForm.accountNumber}
                  onChange={(e) =>
                    setBankForm({ ...bankForm, accountNumber: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bank-branch">Branch Location</Label>
                <Input
                  id="bank-branch"
                  value={bankForm.branch}
                  onChange={(e) =>
                    setBankForm({ ...bankForm, branch: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bank-swift">SWIFT / BIC Code</Label>
                <Input
                  id="bank-swift"
                  value={bankForm.swiftCode}
                  onChange={(e) =>
                    setBankForm({ ...bankForm, swiftCode: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bank-iban">IBAN</Label>
                <Input
                  id="bank-iban"
                  value={bankForm.iban}
                  onChange={(e) =>
                    setBankForm({ ...bankForm, iban: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="p-6 border-t border-border flex items-center justify-end gap-3 bg-slate-50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveDrawer(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Spinner className="size-4" /> : "Save Changes"}
              </Button>
            </div>
          </form>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import { Textarea } from "@moja/ui/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  HeartPulse,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

/**
 * Phase 15 (F-DV-05) — only http(s) document URLs render in an <img>.
 * Pre-pipeline registrations stored device-local `file://` URIs; those show
 * the "missing" placeholder with a re-upload prompt instead of broken images.
 */
function renderableDoc(url?: string | null): string | null {
  return url && /^https?:\/\//.test(url) ? url : null;
}

interface DriverVerificationDialogProps {
  driver: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DriverVerificationDialog({
  driver,
  open,
  onOpenChange,
}: DriverVerificationDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const verifyMutation = useMutation(
    trpc.admin.verifyDriver.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        toast.success("Driver verification status updated.");
        onOpenChange(false);
        setIsRejecting(false);
        setRejectReason("");
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to update driver status.");
      },
    }),
  );

  if (!driver) return null;

  const handleApprove = () => {
    verifyMutation.mutate({
      driverProfileId: driver.id,
      action: "APPROVE",
    });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejecting this application.");
      return;
    }
    verifyMutation.mutate({
      driverProfileId: driver.id,
      action: "REJECT",
      rejectionReason: rejectReason.trim(),
    });
  };

  const handleSuspend = () => {
    verifyMutation.mutate({
      driverProfileId: driver.id,
      action: "SUSPEND",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold font-display flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              Driver Compliance Dossier
            </DialogTitle>
            <Badge
              variant="outline"
              className={
                driver.verificationStatus === "VERIFIED"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : driver.verificationStatus === "REJECTED"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
              }
            >
              {driver.verificationStatus}
            </Badge>
          </div>
          <DialogDescription>
            Review commercial driver credentials, identity, and transport
            regulatory compliance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Driver Demographics Header */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="size-16 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-500 font-bold text-xl border">
              {driver.user?.image ? (
                <img
                  src={driver.user.image}
                  alt={driver.user.fullName}
                  className="size-full object-cover"
                />
              ) : (
                <User className="size-8 text-slate-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900">
                {driver.user?.fullName ?? "Unnamed Driver"}
              </h3>
              <p className="text-sm font-mono text-slate-500">
                {driver.user?.phoneNumber ?? "No phone"} • {driver.user?.email}
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-mono">
                  Class {driver.licenseCategory} Commercial
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Award className="size-3.5" /> {driver.yearsOfExperience}{" "}
                  Years Experience
                </span>
              </div>
            </div>
          </div>

          {/* License & Credentials Inspection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <span className="text-xs font-semibold uppercase text-slate-400">
                Driving License Number
              </span>
              <p className="text-base font-mono font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="size-4 text-slate-500" />
                {driver.licenseNumber}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="size-3.5" />
                Expires:{" "}
                {new Date(driver.licenseExpiryDate).toLocaleDateString()}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <span className="text-xs font-semibold uppercase text-slate-400">
                Carrier Affiliation
              </span>
              <p className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="size-4 text-slate-500" />
                {driver.companyAffiliations?.[0]?.company?.name ??
                  "Independent Freelance"}
              </p>
              <p className="text-xs text-slate-500">
                Type:{" "}
                {driver.companyAffiliations?.[0]?.employmentType ??
                  "CONTRACTOR_URBAN"}
              </p>
            </div>
          </div>

          {/* Document Previews — Phase 15: legacy device URIs render as "missing" */}

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900">
              Submitted Documents
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* License Front */}
              <div className="border rounded-xl p-3 bg-slate-50 space-y-2">
                <span className="text-xs font-semibold text-slate-600">
                  License (Front)
                </span>
                {renderableDoc(driver.licenseFrontUrl) ? (
                  <div className="h-44 rounded-lg bg-slate-900 overflow-hidden flex items-center justify-center">
                    <img
                      src={renderableDoc(driver.licenseFrontUrl)!}
                      alt="License Front"
                      className="size-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-44 rounded-lg bg-slate-200/70 border border-dashed flex items-center justify-center text-xs text-slate-500">
                    {driver.licenseFrontUrl
                      ? "Legacy device URI — ask the driver to re-upload"
                      : "No Front Photo Provided"}
                  </div>
                )}
              </div>

              {/* License Back */}
              <div className="border rounded-xl p-3 bg-slate-50 space-y-2">
                <span className="text-xs font-semibold text-slate-600">
                  License (Back)
                </span>
                {renderableDoc(driver.licenseBackUrl) ? (
                  <div className="h-44 rounded-lg bg-slate-900 overflow-hidden flex items-center justify-center">
                    <img
                      src={renderableDoc(driver.licenseBackUrl)!}
                      alt="License Back"
                      className="size-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-44 rounded-lg bg-slate-200/70 border border-dashed flex items-center justify-center text-xs text-slate-500">
                    {driver.licenseBackUrl
                      ? "Legacy device URI — ask the driver to re-upload"
                      : "No Back Photo Provided"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rejection Note Form (If Rejecting) */}
          {isRejecting && (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-3">
              <label className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="size-4 text-rose-600" />
                Reason for Rejection (Displayed to Driver)
              </label>
              <Textarea
                placeholder="e.g. License photo is unreadable or expired. Please upload high-resolution scan."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="bg-white border-rose-300"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {isRejecting ? (
            <div className="flex items-center gap-2 w-full justify-end">
              <Button variant="outline" onClick={() => setIsRejecting(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={verifyMutation.isPending}
              >
                Confirm Rejection
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                className="text-amber-600 border-amber-200 hover:bg-amber-50"
                onClick={handleSuspend}
                disabled={verifyMutation.isPending}
              >
                Suspend Driver
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                  onClick={() => setIsRejecting(true)}
                  disabled={verifyMutation.isPending}
                >
                  Reject Application
                </Button>
                {/* Phase 26 (F-OP-16) — approving a document-less driver is
                    server-refused anyway; mirror that here so the button tells
                    the truth instead of failing on click. */}
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
                  onClick={handleApprove}
                  disabled={
                    verifyMutation.isPending ||
                    !(
                      driver?.licenseFrontUrl ||
                      driver?.licenseBackUrl ||
                      driver?.medicalDocUrl
                    )
                  }
                  title={
                    driver?.licenseFrontUrl ||
                    driver?.licenseBackUrl ||
                    driver?.medicalDocUrl
                      ? undefined
                      : "Attach at least one compliance document first"
                  }
                >
                  <CheckCircle2 className="size-4" />
                  Approve Driver License
                </Button>
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

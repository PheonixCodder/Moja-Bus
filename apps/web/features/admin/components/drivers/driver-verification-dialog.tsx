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
import { DriverDocPreview } from "@/features/driver/components/driver-doc-preview";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

/**
 * Phase 15 (F-DV-05) legacy note: pre-pipeline registrations stored
 * device-local `file://` URIs; those render as "missing" placeholders via
 * <DriverDocPreview>. Phase-2 audit: URLs are minted on demand per view —
 * baked-in presigned links expired before a reviewer opened the dossier.
 */

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
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
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
                  ? "bg-success/10 text-success border-success/20"
                  : driver.verificationStatus === "REJECTED"
                    ? "bg-destructive/10 text-destructive border-destructive/20"
                    : "bg-warning/10 text-warning border-warning/20"
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
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border">
            <div className="size-16 rounded-full bg-muted overflow-hidden flex items-center justify-center text-muted-foreground font-bold text-xl border border-border">
              {driver.user?.image ? (
                <img
                  src={driver.user.image}
                  alt={driver.user.fullName}
                  className="size-full object-cover"
                />
              ) : (
                <User className="size-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground">
                {driver.user?.fullName ?? "Unnamed Driver"}
              </h3>
              <p className="text-sm font-mono text-muted-foreground">
                {driver.user?.phoneNumber ?? "No phone"} • {driver.user?.email}
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary font-mono">
                  Class {driver.licenseCategory} Commercial
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Award className="size-3.5" /> {driver.yearsOfExperience}{" "}
                  Years Experience
                </span>
              </div>
            </div>
          </div>

          {/* License & Credentials Inspection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                Driving License Number
              </span>
              <p className="text-base font-mono font-bold text-foreground flex items-center gap-2">
                <CreditCard className="size-4 text-muted-foreground" />
                {driver.licenseNumber}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="size-3.5" />
                Expires:{" "}
                {new Date(driver.licenseExpiryDate).toLocaleDateString()}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                Carrier Affiliation
              </span>
              <p className="text-base font-bold text-foreground flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground" />
                {driver.companyAffiliations?.[0]?.company?.name ??
                  "Independent Freelance"}
              </p>
              <p className="text-xs text-muted-foreground">
                Type:{" "}
                {driver.companyAffiliations?.[0]?.employmentType ??
                  "CONTRACTOR_URBAN"}
              </p>
            </div>
          </div>

          {/* Document Previews — Phase-2 audit: on-demand presigned rendering
              via <DriverDocPreview>; the medical certificate now previews too
              (it always gated approval but was never visible). */}

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-foreground">
              Submitted Documents
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DriverDocPreview
                audience="admin"
                driverProfileId={driver.id}
                docType="driver-license-front"
                label="License (Front)"
                storedValue={driver.licenseFrontUrl ?? null}
              />
              <DriverDocPreview
                audience="admin"
                driverProfileId={driver.id}
                docType="driver-license-back"
                label="License (Back)"
                storedValue={driver.licenseBackUrl ?? null}
              />
              <DriverDocPreview
                audience="admin"
                driverProfileId={driver.id}
                docType="driver-medical-doc"
                label="Medical Certificate"
                storedValue={driver.medicalDocUrl ?? null}
              />
            </div>
          </div>

          {/* Rejection Note Form (If Rejecting) */}
          {isRejecting && (
            <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/10 space-y-3">
              <label className="text-xs font-bold text-destructive flex items-center gap-1.5">
                <AlertTriangle className="size-4 text-destructive" />
                Reason for Rejection (Displayed to Driver)
              </label>
              <Textarea
                placeholder="e.g. License photo is unreadable or expired. Please upload high-resolution scan."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="bg-card border-destructive/30"
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
                className="text-warning border-warning/20 hover:bg-warning/10"
                onClick={handleSuspend}
                disabled={verifyMutation.isPending}
              >
                Suspend Driver
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="text-destructive border-destructive/20 hover:bg-destructive/10"
                  onClick={() => setIsRejecting(true)}
                  disabled={verifyMutation.isPending}
                >
                  Reject Application
                </Button>
                {/* Phase 26 (F-OP-16) — approving a document-less driver is
                    server-refused anyway; mirror that here so the button tells
                    the truth instead of failing on click. */}
                <Button
                  className="bg-success text-success-foreground hover:bg-success/90 font-bold gap-1.5"
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

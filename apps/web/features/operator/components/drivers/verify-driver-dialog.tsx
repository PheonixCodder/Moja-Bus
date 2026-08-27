"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DriverDocPreview } from "@/features/driver/components/driver-doc-preview";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import { Button } from "@moja/ui/components/ui/button";
import { Textarea } from "@moja/ui/components/ui/textarea";
import { Label } from "@moja/ui/components/ui/label";
import { useTRPC } from "@/trpc/client";

interface VerifyDriverDialogProps {
  driverId: string | null;
  driverName: string;
  licenseNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VerifyDriverDialog({
  driverId,
  driverName,
  licenseNumber,
  open,
  onOpenChange,
}: VerifyDriverDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState("");

  const verifyMutation = useMutation({
    ...trpc.drivers.verifyDriver.mutationOptions(),
    onSuccess: (_, vars) => {
      toast.success(
        vars.verificationStatus === "VERIFIED"
          ? "Driver verified and cleared for trip dispatch"
          : "Driver verification updated",
      );
      queryClient.invalidateQueries(trpc.drivers.listDrivers.pathFilter());
      queryClient.invalidateQueries(trpc.drivers.getDriver.pathFilter());
      onOpenChange(false);
      setRejectionReason("");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update verification status");
    },
  });

  // Phase-2 audit (T3b / R1): the APPROVAL MOMENT carries its own evidence —
  // the dialog fetches the dossier and renders the compliance docs above the
  // decision buttons instead of trusting a checklist.
  const dossierQuery = useQuery({
    ...trpc.drivers.getDriver.queryOptions({ id: driverId ?? "" }),
    enabled: open && !!driverId,
  });
  const dossier = dossierQuery.data;
  const hasComplianceDoc = !!(
    dossier?.licenseFrontUrl ||
    dossier?.licenseBackUrl ||
    dossier?.medicalDocUrl
  );

  const handleAction = (status: "VERIFIED" | "REJECTED") => {
    if (!driverId) return;
    verifyMutation.mutate({
      id: driverId,
      verificationStatus: status,
      rejectionReason: status === "REJECTED" ? rejectionReason : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Driver Compliance Verification
          </DialogTitle>
          <DialogDescription>
            Verify commercial driving credentials for{" "}
            <span className="font-semibold text-foreground">{driverName}</span>{" "}
            (License: <span className="font-mono">{licenseNumber}</span>).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {driverId && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <DriverDocPreview
                audience="operator"
                driverProfileId={driverId}
                docType="driver-license-front"
                label="Licence (Front)"
                storedValue={dossier?.licenseFrontUrl ?? null}
              />
              <DriverDocPreview
                audience="operator"
                driverProfileId={driverId}
                docType="driver-license-back"
                label="Licence (Back)"
                storedValue={dossier?.licenseBackUrl ?? null}
              />
              <DriverDocPreview
                audience="operator"
                driverProfileId={driverId}
                docType="driver-medical-doc"
                label="Medical Certificate"
                storedValue={dossier?.medicalDocUrl ?? null}
              />
            </div>
          )}
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg space-y-1">
            <p className="font-semibold text-foreground">
              Compliance Verification Checklist:
            </p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>License is valid and not expired.</li>
              <li>
                Category Class matches commercial passenger coach standards
                (Class D/E).
              </li>
              <li>Identity matches verified national records.</li>
            </ul>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rejectionReason">
              Rejection / Suspension Reason (If rejecting)
            </Label>
            <Textarea
              id="rejectionReason"
              placeholder="State reason for rejecting compliance verification..."
              rows={2}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="destructive"
            onClick={() => handleAction("REJECTED")}
            disabled={verifyMutation.isPending}
          >
            Reject License
          </Button>
          <Button
            type="button"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => handleAction("VERIFIED")}
            disabled={verifyMutation.isPending || !hasComplianceDoc}
            title={
              hasComplianceDoc
                ? undefined
                : "Attach at least one compliance document first"
            }
          >
            {verifyMutation.isPending ? "Verifying..." : "Approve & Verify"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

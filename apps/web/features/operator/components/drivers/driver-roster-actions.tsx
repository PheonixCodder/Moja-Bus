"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@moja/ui/components/ui/alert-dialog";
import { Button } from "@moja/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { Textarea } from "@moja/ui/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

const LICENSE_CATEGORIES = ["B", "C", "D", "E"] as const;

/**
 * Phase-2 audit (D3/C) — document replacement slots. Until driver self-service
 * ships (Phase 7), this is the ONLY remediation path anywhere in the product
 * for an unreadable/expired compliance document. Replacements flow through the
 * private storage purposes and are audit-logged server-side (DRIVER_DOCS_REPLACED).
 */
const DOC_SLOTS = [
  {
    field: "licenseFrontUrl",
    purpose: "driver-license-front",
    label: "Licence photo (front)",
  },
  {
    field: "licenseBackUrl",
    purpose: "driver-license-back",
    label: "Licence photo (back)",
  },
  {
    field: "medicalDocUrl",
    purpose: "driver-medical-doc",
    label: "Medical certificate",
  },
] as const;

type DocSlotField = (typeof DOC_SLOTS)[number]["field"];

interface DriverRosterActionsProps {
  driverId: string;
  driverName: string;
  /** False when viewing a terminated affiliation — no lifecycle actions apply. */
  isActive: boolean;
  isMidRun: boolean;
  defaults: {
    licenseNumber: string;
    licenseCategory: string;
    licenseExpiryDate: string;
    badgeNumber: string;
    notes: string;
  };
}

/**
 * Phase 13 (F-OP-02) — Edit + Remove-from-roster actions on the passport page.
 * Permission-gated server-side by drivers:update / drivers:delete; the Remove
 * path additionally refuses mid-run drivers at the API layer.
 */
export function DriverRosterActions({
  driverId,
  driverName,
  isActive,
  isMidRun,
  defaults,
}: DriverRosterActionsProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [form, setForm] = useState({
    licenseNumber: defaults.licenseNumber,
    licenseCategory: defaults.licenseCategory,
    licenseExpiryDate: defaults.licenseExpiryDate
      ? defaults.licenseExpiryDate.slice(0, 10)
      : "",
    badgeNumber: defaults.badgeNumber,
    notes: defaults.notes,
  });
  const [docSlots, setDocSlots] = useState<
    Partial<Record<DocSlotField, { key: string; name: string }>>
  >({});
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  const permsQuery = useQuery(trpc.drivers.getPermissions.queryOptions());

  const presignUpload = useMutation(
    trpc.storage.presignUpload.mutationOptions(),
  );

  const uploadDoc = async (field: DocSlotField, file: File) => {
    const slotMeta = DOC_SLOTS.find((s) => s.field === field)!;
    setUploadingSlot(field);
    try {
      const contentType = file.type || "application/octet-stream";
      const { uploadUrl, objectKey } = await presignUpload.mutateAsync({
        purpose: slotMeta.purpose,
        fileName: file.name,
        contentType,
        fileSize: file.size,
      });
      const put = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": contentType },
      });
      if (!put.ok) {
        throw new Error(`Storage rejected the upload (${put.status})`);
      }
      setDocSlots((prev) => ({
        ...prev,
        [field]: { key: objectKey, name: file.name },
      }));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Document upload failed",
      );
    } finally {
      setUploadingSlot(null);
    }
  };

  const updateMutation = useMutation(
    trpc.drivers.updateDriver.mutationOptions({
      onSuccess: () => {
        toast.success("Driver updated", { description: driverName });
        setEditOpen(false);
        setDocSlots({});
        queryClient.invalidateQueries(trpc.drivers.getDriver.pathFilter());
        router.refresh();
      },
      onError: (err) => toast.error(err.message || "Failed to update driver"),
    }),
  );

  const removeMutation = useMutation(
    trpc.drivers.deleteDriverAffiliation.mutationOptions({
      onSuccess: () => {
        toast.success("Driver removed from roster", {
          description: `${driverName} was notified.`,
        });
        setRemoveOpen(false);
        router.refresh();
      },
      onError: (err) => toast.error(err.message || "Failed to remove driver"),
    }),
  );

  if (!isActive || !permsQuery.data) return null;
  const canEdit = permsQuery.data.canUpdate;
  const canRemove = permsQuery.data.canDelete;
  if (!canEdit && !canRemove) return null;

  const submitEdit = () => {
    if (!form.licenseNumber.trim()) {
      toast.error("License number is required");
      return;
    }
    updateMutation.mutate({
      id: driverId,
      licenseNumber: form.licenseNumber.trim(),
      licenseCategory: form.licenseCategory as "B" | "C" | "D" | "E",
      ...(form.licenseExpiryDate
        ? { licenseExpiryDate: form.licenseExpiryDate }
        : {}),
      ...(form.badgeNumber.trim()
        ? { badgeNumber: form.badgeNumber.trim() }
        : { badgeNumber: undefined }),
      notes: form.notes,
      // Only replaced docs travel — absent fields keep their stored values.
      ...(docSlots.licenseFrontUrl
        ? { licenseFrontUrl: docSlots.licenseFrontUrl.key }
        : {}),
      ...(docSlots.licenseBackUrl
        ? { licenseBackUrl: docSlots.licenseBackUrl.key }
        : {}),
      ...(docSlots.medicalDocUrl
        ? { medicalDocUrl: docSlots.medicalDocUrl.key }
        : {}),
    });
  };

  return (
    <div className="flex items-center gap-2">
      {canEdit && (
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            setDocSlots({});
            setEditOpen(true);
          }}
        >
          <Pencil className="size-3.5" />
          Edit
        </Button>
      )}
      {canRemove && (
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-destructive hover:text-destructive"
          disabled={isMidRun}
          title={
            isMidRun ? "Complete or cancel the active run first." : undefined
          }
          onClick={() => setRemoveOpen(true)}
        >
          <UserMinus className="size-3.5" />
          Remove
        </Button>
      )}

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Driver</DialogTitle>
            <DialogDescription>
              Update license and roster details for {driverName}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="licenseNumber">License number</Label>
              <Input
                id="licenseNumber"
                value={form.licenseNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, licenseNumber: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>License category</Label>
                <Select
                  value={form.licenseCategory}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, licenseCategory: v ?? "D" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {LICENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        Class {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="licenseExpiry">License expiry</Label>
                <Input
                  id="licenseExpiry"
                  type="date"
                  value={form.licenseExpiryDate}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      licenseExpiryDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="badgeNumber">Badge number</Label>
              <Input
                id="badgeNumber"
                value={form.badgeNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, badgeNumber: e.target.value }))
                }
                placeholder="e.g. DRV-042"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="notes">Operational notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>

            {/* Phase-2 audit — document replacement slots (audit-logged
                server-side; verification status is intentionally kept). */}
            <div className="grid gap-1.5">
              <Label>Compliance documents (optional replacements)</Label>
              <div className="grid gap-2">
                {DOC_SLOTS.map((slotMeta) => {
                  const slot = docSlots[slotMeta.field];
                  const inputId = `doc-replace-${slotMeta.field}`;
                  return (
                    <div key={slotMeta.field} className="flex items-center">
                      <input
                        id={inputId}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void uploadDoc(slotMeta.field, file);
                          e.target.value = "";
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full justify-start font-normal"
                        disabled={uploadingSlot !== null}
                        onClick={() =>
                          document.getElementById(inputId)?.click()
                        }
                      >
                        {uploadingSlot === slotMeta.field
                          ? "Uploading…"
                          : slot
                            ? `✓ ${slot.name}`
                            : slotMeta.label}
                      </Button>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Replacements are audit-logged; verification status does not
                change.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove confirmation */}
      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {driverName} from your roster?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They will disappear from your active roster, assignment comboboxes
              and urgent dispatch feed immediately, and they will be notified.
              Their Moja profile, ratings and history remain intact and another
              operator can hire them. This cannot be undone from this screen —
              rehire via Add Driver if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={removeMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                removeMutation.mutate({ driverProfileId: driverId });
              }}
            >
              {removeMutation.isPending ? "Removing…" : "Remove driver"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

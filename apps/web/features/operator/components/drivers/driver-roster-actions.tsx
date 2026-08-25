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
import { useMutation, useQuery } from "@tanstack/react-query";
import { Pencil, UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

const LICENSE_CATEGORIES = ["B", "C", "D", "E"] as const;

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

  const permsQuery = useQuery(trpc.drivers.getPermissions.queryOptions());

  const updateMutation = useMutation(
    trpc.drivers.updateDriver.mutationOptions({
      onSuccess: () => {
        toast.success("Driver updated", { description: driverName });
        setEditOpen(false);
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
    });
  };

  return (
    <div className="flex items-center gap-2">
      {canEdit && (
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setEditOpen(true)}
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

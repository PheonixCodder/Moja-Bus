"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BusFront } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { Spinner } from "@moja/ui/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import { useTRPC } from "@/trpc/client";

interface BusEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  bus: any;
}

export function BusEditModal({ isOpen, onClose, bus }: BusEditModalProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateMutation = useMutation(
    trpc.fleet.updateBus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.fleet.getBuses.pathFilter());
      },
    }),
  );

  const [registrationPlate, setRegistrationPlate] = useState("");
  const [internalName, setInternalName] = useState("");
  const [manufactureYear, setManufactureYear] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "MAINTENANCE" | "INACTIVE" | "RETIRED">("ACTIVE");
  const [submitting, setSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (bus) {
      setRegistrationPlate(bus.registrationPlate ?? "");
      setInternalName(bus.internalName ?? "");
      setManufactureYear(bus.manufactureYear ? String(bus.manufactureYear) : "");
      setNotes(bus.notes ?? "");
      setStatus(bus.status ?? "ACTIVE");
      setIsDirty(false);
    }
  }, [bus, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bus) return;
    setSubmitting(true);

    try {
      const res = await updateMutation.mutateAsync({
        id: bus.id,
        data: {
          registrationPlate: registrationPlate.trim(),
          internalName: internalName.trim() || null,
          manufactureYear: manufactureYear ? parseInt(manufactureYear, 10) : null,
          notes: notes.trim() || null,
          status,
        },
      });

      toast.success("Vehicle details updated");
      if (res?.warning) {
        toast.warning(res.warning);
      }
      setIsDirty(false);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to update bus");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isDirty && !window.confirm("You have unsaved changes. Discard changes?")) {
      return;
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BusFront className="size-5 text-primary" />
            Edit Vehicle — {bus?.registrationPlate}
          </DialogTitle>
          <DialogDescription>
            Update vehicle registration, internal designation, notes, and maintenance status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="plate" className="text-xs font-semibold uppercase tracking-wider">
              Registration Plate *
            </Label>
            <Input
              id="plate"
              value={registrationPlate}
              onChange={(e) => {
                setRegistrationPlate(e.target.value);
                setIsDirty(true);
              }}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="internalName" className="text-xs font-semibold uppercase tracking-wider">
              Internal Designation / Fleet Number
            </Label>
            <Input
              id="internalName"
              placeholder="e.g. Bus 104 (Express)"
              value={internalName}
              onChange={(e) => {
                setInternalName(e.target.value);
                setIsDirty(true);
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year" className="text-xs font-semibold uppercase tracking-wider">
                Manufacture Year
              </Label>
              <Input
                id="year"
                type="number"
                placeholder="e.g. 2023"
                value={manufactureYear}
                onChange={(e) => {
                  setManufactureYear(e.target.value);
                  setIsDirty(true);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-xs font-semibold uppercase tracking-wider">
                Status
              </Label>
              <select
                id="status"
                value={status}
                onChange={(e: any) => {
                  setStatus(e.target.value);
                  setIsDirty(true);
                }}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="ACTIVE">Active</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="INACTIVE">Inactive</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wider">
              Notes
            </Label>
            <Input
              id="notes"
              placeholder="Optional operational or maintenance notes"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setIsDirty(true);
              }}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Spinner className="mr-2 size-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

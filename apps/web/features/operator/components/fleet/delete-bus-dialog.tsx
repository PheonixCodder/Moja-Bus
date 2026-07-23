"use client";

import { toast } from "sonner";
import { Button } from "@moja/ui/components/ui/button";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { RouterOutputs } from "@/trpc/client";

type Bus = RouterOutputs["fleet"]["getBuses"]["buses"][number];

interface DeleteBusDialogProps {
  bus: Bus | null;
  open: boolean;
  onClose: () => void;
}

export function DeleteBusDialog({
  bus,
  open,
  onClose,
}: DeleteBusDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation(
    trpc.fleet.deleteBus.mutationOptions({
      onSuccess: () => {
        toast.success(`Vehicle ${bus?.registrationPlate ?? ""} retired`);
        queryClient.invalidateQueries(trpc.fleet.getBuses.pathFilter());
        onClose();
      },
      onError: (err) => {
        toast.error(err.message || "Failed to delete vehicle");
      },
    }),
  );

  function handleDelete() {
    if (!bus) return;
    deleteMutation.mutate({ id: bus.id });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-base">
            Delete vehicle?
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            The vehicle{" "}
            <strong className="text-foreground font-mono">
              {bus?.registrationPlate}
            </strong>{" "}
            will be permanently removed from your active fleet. This action is irreversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2 sm:flex-row">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-muted-foreground"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="flex-1 h-8 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <Spinner className="size-3.5 mr-1.5" />
            ) : null}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

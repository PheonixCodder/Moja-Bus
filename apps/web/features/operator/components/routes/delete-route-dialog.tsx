"use client";

import { AlertCircle } from "lucide-react";
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

type RouteType = RouterOutputs["routes"]["list"][number];

interface DeleteRouteDialogProps {
  route: RouteType | null;
  open: boolean;
  onClose: () => void;
  onDeleted?: (id: string) => void;
}

export function DeleteRouteDialog({
  route,
  open,
  onClose,
  onDeleted,
}: DeleteRouteDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const deleteMutation = useMutation(trpc.routes.delete.mutationOptions());

  function handleDelete() {
    if (!route) return;
    deleteMutation.mutate(
      { id: route.id },
      {
        onSuccess: () => {
          toast.success(`Route "${route.name}" deleted`);
          if (onDeleted) onDeleted(route.id);
          onClose();
          queryClient.invalidateQueries(trpc.routes.list.pathFilter());
        },
        onError: (err) => {
          toast.error(err.message || "Failed to delete route");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            Delete route
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              "{route?.name}"
            </span>
            ? This action will remove the route. Active schedules or trips using this route must be updated or archived.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <Spinner className="size-4 mr-2" />
            ) : null}
            {deleteMutation.isPending ? "Deleting…" : "Delete Route"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

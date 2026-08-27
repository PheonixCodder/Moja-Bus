"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("operatorDashboard.routes");
  const tc = useTranslations("common");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const deleteMutation = useMutation(trpc.routes.delete.mutationOptions());

  function handleDelete() {
    if (!route) return;
    deleteMutation.mutate(
      { id: route.id },
      {
        onSuccess: () => {
          toast.success(t("deleteDialog.toastDeleted", { name: route.name }));
          if (onDeleted) onDeleted(route.id);
          onClose();
          queryClient.invalidateQueries(trpc.routes.list.pathFilter());
        },
        onError: (err) => {
          toast.error(err.message || t("deleteDialog.toastFailed"));
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
            {t("deleteDialog.title")}
          </DialogTitle>
          <DialogDescription>
            {t("deleteDialog.description", { name: route?.name ?? "" })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            {tc("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <Spinner className="size-4 mr-2" />
            ) : null}
            {deleteMutation.isPending
              ? t("deleteDialog.deleting")
              : tc("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

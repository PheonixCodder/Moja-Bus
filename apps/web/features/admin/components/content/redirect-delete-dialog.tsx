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
import { buttonVariants } from "@moja/ui/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

type Redirect = {
  id: string;
  source: string;
  destination: string;
  type: number;
  createdAt: Date;
};

interface RedirectDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirect?: Redirect | null;
}

export function RedirectDeleteDialog({
  open,
  onOpenChange,
  redirect,
}: RedirectDeleteDialogProps) {
  const t = useTranslations("adminDashboard.redirectDeleteDialog");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation(
    trpc.admin.deleteBlogRedirect.mutationOptions({
      onSuccess: () => {
        toast.success(t("deleteSuccess"));
        queryClient.invalidateQueries(
          trpc.admin.listBlogRedirects.pathFilter(),
        );
        onOpenChange(false);
      },
      onError: (error: any) => {
        toast.error(error.message || t("deleteError"));
      },
    }),
  );

  const handleDelete = () => {
    if (!redirect) return;
    deleteMutation.mutate({ id: redirect.id });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("description", { source: redirect?.source ?? "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            className={buttonVariants({ variant: "destructive" })}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? t("deleting") : t("deleteRedirect")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

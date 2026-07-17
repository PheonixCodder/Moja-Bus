"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

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

export function RedirectDeleteDialog({ open, onOpenChange, redirect }: RedirectDeleteDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation(
    trpc.admin.deleteBlogRedirect.mutationOptions({
      onSuccess: () => {
        toast.success("Redirect deleted successfully");
        queryClient.invalidateQueries(trpc.admin.listBlogRedirects.pathFilter());
        onOpenChange(false);
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to delete redirect");
      },
    })
  );

  const handleDelete = () => {
    if (!redirect) return;
    deleteMutation.mutate({ id: redirect.id });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the redirect from{" "}
            <span className="font-mono text-slate-700 font-medium">
              {redirect?.source}
            </span>
            . Any incoming traffic to that old URL will start throwing 404 Not Found errors unless a new redirect is created.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            className={buttonVariants({ variant: "destructive" })}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete Redirect"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

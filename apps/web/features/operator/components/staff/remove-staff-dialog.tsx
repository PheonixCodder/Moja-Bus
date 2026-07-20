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
import { Spinner } from "@moja/ui/components/ui/spinner";
import type { StaffMember } from "@/features/operator/lib/staff";

interface RemoveStaffDialogProps {
  member: StaffMember | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function RemoveStaffDialog({
  member,
  pending,
  onClose,
  onConfirm,
}: RemoveStaffDialogProps) {
  return (
    <AlertDialog open={!!member} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="border-border bg-card max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-semibold text-red-600">
            Remove from Company
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[13px] text-muted-foreground">
            Are you sure you want to remove{" "}
            <strong className="text-foreground">{member?.user.fullName}</strong>{" "}
            from the company? They will immediately lose access to the
            dashboard. This can be reversed by re-inviting them.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-9 text-[13px]">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="h-9 text-[13px] bg-red-600 hover:bg-red-700 text-white border-0"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? <Spinner className="h-3.5 w-3.5" /> : "Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

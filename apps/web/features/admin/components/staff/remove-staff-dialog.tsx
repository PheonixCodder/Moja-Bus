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
import { useTranslations } from "next-intl";
import type { AdminStaffMember } from "@/features/admin/lib/admin-staff";

interface RemoveStaffDialogProps {
  member: AdminStaffMember | null;
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
  const t = useTranslations("adminDashboard.staff.removeDialog");
  const tp = useTranslations("adminDashboard.staff");
  return (
    <AlertDialog open={!!member} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="border-border bg-card max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-semibold text-red-600">
            {t("title")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[13px] text-muted-foreground">
            {t("description", { name: member?.user.fullName ?? "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-9 text-[13px]">
            {tp("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            className="h-9 text-[13px] bg-red-600 hover:bg-red-700 text-white border-0"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? <Spinner className="h-3.5 w-3.5" /> : t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

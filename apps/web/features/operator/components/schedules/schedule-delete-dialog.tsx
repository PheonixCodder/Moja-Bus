"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
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
import type { ScheduleListItem } from "@/features/operator/lib/schedules/types";

export function ScheduleDeleteDialog({
  schedule,
  pending,
  onClose,
  onConfirm,
}: {
  schedule: ScheduleListItem | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("operatorDashboard.schedules");
  const tc = useTranslations("common");
  return (
    <Dialog open={!!schedule} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            {tc("delete")} schedule
          </DialogTitle>
          <DialogDescription>
            This permanently deletes the schedule and all of its trips. It is
            only allowed when the schedule has never had any passenger bookings.
            If bookings exist, use Retire instead to deactivate the schedule and
            prune empty future trips. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={pending}>
            {tc("cancel")}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={pending}>
            {pending ? <Spinner className="size-4 mr-2" /> : null}
            {pending ? "Deleting…" : tc("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

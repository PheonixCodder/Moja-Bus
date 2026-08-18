"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@moja/ui/components/ui/sheet";
import { Textarea } from "@moja/ui/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Mail,
  MapPin,
  MessageSquare,
  Monitor,
  Phone,
  Save,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  InquiryRow,
  InquiryStatus,
} from "@/features/admin/views/admin-inquiries-view";
import { useTRPC } from "@/trpc/client";

interface InquiryDetailDrawerProps {
  inquiry: InquiryRow | null;
  onClose: () => void;
}

const STATUS_ACTIONS: Array<{
  status: InquiryStatus;
  key: "markInProgress" | "markResolved" | "markClosed";
  variant: "default" | "outline" | "secondary";
}> = [
  { status: "IN_PROGRESS", key: "markInProgress", variant: "default" },
  { status: "RESOLVED", key: "markResolved", variant: "outline" },
  { status: "CLOSED", key: "markClosed", variant: "secondary" },
];

export function InquiryDetailDrawer({
  inquiry,
  onClose,
}: InquiryDetailDrawerProps) {
  const t = useTranslations("adminDashboard.inquiries.detail");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");

  useEffect(() => {
    setNote(inquiry?.adminNote ?? "");
  }, [inquiry]);

  const invalidate = () =>
    queryClient.invalidateQueries(trpc.contact.listInquiries.pathFilter());

  const statusMutation = useMutation(
    trpc.contact.updateInquiryStatus.mutationOptions({
      onSuccess: () => {
        toast.success(t("statusUpdated"));
        invalidate();
      },
      onError: (err) => toast.error(err.message || t("updateFailed")),
    }),
  );

  const noteMutation = useMutation(
    trpc.contact.updateInquiryStatus.mutationOptions({
      onSuccess: () => {
        toast.success(t("noteSaved"));
        invalidate();
      },
      onError: (err) => toast.error(err.message || t("updateFailed")),
    }),
  );

  if (!inquiry) return null;

  const isTerminal =
    inquiry.status === "RESOLVED" || inquiry.status === "CLOSED";
  const showReopen = isTerminal;

  const handleStatusChange = (status: InquiryStatus) => {
    statusMutation.mutate({
      id: inquiry.id,
      status,
      ...(note.trim() ? { adminNote: note.trim() } : {}),
    });
  };

  const handleSaveNote = () => {
    noteMutation.mutate({
      id: inquiry.id,
      status: inquiry.status,
      adminNote: note.trim(),
    });
  };

  return (
    <Sheet open={!!inquiry} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex flex-col p-0 sm:max-w-xl">
        <SheetHeader>
          <div className="flex items-start justify-between gap-3 pr-2">
            <div className="min-w-0">
              <SheetTitle className="text-base">{inquiry.subject}</SheetTitle>
              <SheetDescription className="mt-0.5">
                {format(new Date(inquiry.createdAt), "MMM d, yyyy 'at' h:mm a")}
              </SheetDescription>
            </div>
            <Badge
              variant="secondary"
              className={
                inquiry.status === "NEW"
                  ? "bg-blue-500/10 text-blue-600 shrink-0"
                  : inquiry.status === "IN_PROGRESS"
                    ? "bg-amber-500/10 text-amber-600 shrink-0"
                    : inquiry.status === "RESOLVED"
                      ? "bg-emerald-500/10 text-emerald-600 shrink-0"
                      : "bg-slate-500/10 text-slate-500 shrink-0"
              }
            >
              {t(
                `status.${inquiry.status.toLowerCase() as "new" | "inProgress" | "resolved" | "closed"}`,
              )}
            </Badge>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ee237c]/10 text-[#ee237c] text-xs font-bold shrink-0">
                {inquiry.name
                  .split(" ")
                  .map((part: string) => part[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">
                  {inquiry.name}
                </p>
                <Badge
                  variant="secondary"
                  className={
                    inquiry.userId
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-slate-500/10 text-slate-500"
                  }
                >
                  {inquiry.userId ? t("badge.loggedIn") : t("badge.guest")}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground shrink-0" />
                <a
                  href={`mailto:${inquiry.email}`}
                  className="hover:text-[#ee237c] transition-colors truncate"
                >
                  {inquiry.email}
                </a>
              </span>
              {inquiry.phone && (
                <span className="flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground shrink-0" />
                  {inquiry.phone}
                </span>
              )}
              {inquiry.user && (
                <span className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground shrink-0" />
                  {inquiry.user.fullName} ({inquiry.user.email})
                </span>
              )}
              {inquiry.ipAddress && (
                <span className="flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground shrink-0" />
                  {inquiry.ipAddress}
                </span>
              )}
              {inquiry.userAgent && (
                <span className="flex items-center gap-2">
                  <Monitor className="size-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{inquiry.userAgent}</span>
                </span>
              )}
            </div>
          </div>

          <div>
            <p className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
              <MessageSquare className="size-3.5" />
              {t("message")}
            </p>
            <p className="text-sm text-foreground whitespace-pre-wrap rounded-xl border border-border bg-card p-4">
              {inquiry.message}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
              {t("adminNote")}
            </p>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("notePlaceholder")}
              rows={3}
              className="bg-card"
            />
            <div className="flex justify-end mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveNote}
                disabled={
                  noteMutation.isPending ||
                  note.trim() === (inquiry.adminNote ?? "")
                }
              >
                <Save className="size-3.5 mr-1.5" />
                {t("saveNote")}
              </Button>
            </div>
          </div>

          {showReopen ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={statusMutation.isPending}
                onClick={() => handleStatusChange("IN_PROGRESS")}
              >
                {t("reopen")}
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {STATUS_ACTIONS.map((action) => (
                <Button
                  key={action.status}
                  variant={action.variant}
                  size="sm"
                  className="flex-1 min-w-[120px]"
                  disabled={
                    statusMutation.isPending || inquiry.status === action.status
                  }
                  onClick={() => handleStatusChange(action.status)}
                >
                  {t(action.key)}
                </Button>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

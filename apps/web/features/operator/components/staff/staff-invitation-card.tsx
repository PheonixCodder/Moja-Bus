"use client";

import { format } from "date-fns";
import { Clock, RefreshCw, XCircle } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { Button } from "@moja/ui/components/ui/button";
import { RoleBadge } from "@/features/operator/components/staff/role-badge";
import {
  formatInvitationExpiry,
  type StaffInvitation,
} from "@/features/operator/lib/staff";

interface StaffInvitationCardProps {
  invitation: StaffInvitation & { createdAt?: Date | string };
  onResend: (invitation: StaffInvitation) => void;
  onCancel: (invitation: StaffInvitation) => void;
}

export function StaffInvitationCard({
  invitation,
  onResend,
  onCancel,
}: StaffInvitationCardProps) {
  const expiry = formatInvitationExpiry(invitation.expiresAt);
  const createdAt = invitation.createdAt ?? invitation.expiresAt;

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <span className="truncate text-[13px] font-semibold text-foreground">
            {invitation.email}
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <RoleBadge role={invitation.role} />
            {invitation.jobTitle ? (
              <span className="text-[11px] text-muted-foreground">
                {invitation.jobTitle}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-0.5">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            Sent by {invitation.invitedBy.fullName} ·{" "}
            {format(new Date(createdAt), "MMM d, HH:mm")}
          </span>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 text-[11px] font-medium",
            expiry.expired ? "text-red-500" : "text-amber-600",
          )}
        >
          <span>{expiry.label}</span>
        </div>
      </div>

      <div className="flex gap-2 border-t border-border mt-1 pt-3">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8 text-[12px] gap-1 font-semibold"
          onClick={() => onResend(invitation)}
        >
          <RefreshCw className="h-3 w-3" />
          Resend
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8 text-[12px] gap-1 text-red-600 hover:text-red-600 hover:bg-red-50 border-red-200 font-semibold"
          onClick={() => onCancel(invitation)}
        >
          <XCircle className="h-3 w-3" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

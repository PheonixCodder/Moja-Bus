"use client";

import {
  MoreHorizontal,
  ShieldCheck,
  ArrowRightLeft,
  PauseCircle,
  PlayCircle,
  Trash2,
} from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { Button } from "@moja/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@moja/ui/components/ui/dropdown-menu";
import { MemberAvatar } from "@/features/operator/components/staff/member-avatar";
import { RoleBadge } from "@/features/operator/components/staff/role-badge";
import { StatusBadge } from "@/features/operator/components/staff/status-badge";
import {
  formatRelativeTime,
  type OperatorStatus,
  type StaffMember,
  type StaffRole,
} from "@/features/operator/lib/staff";

interface StaffMemberRowProps {
  member: StaffMember & {
    user: StaffMember["user"] & {
      sessions?: Array<{ createdAt: Date | string }>;
    };
  };
  isLast: boolean;
  callerRole: StaffRole;
  canUpdate: boolean;
  onEditRole: (member: StaffMember) => void;
  onEditPermissions: (member: StaffMember) => void;
  onStatusChange: (member: StaffMember, status: OperatorStatus) => void;
  onTransfer: (member: StaffMember) => void;
  onRemove: (member: StaffMember) => void;
}

export function StaffMemberRow({
  member,
  isLast,
  callerRole,
  canUpdate,
  onEditRole,
  onEditPermissions,
  onStatusChange,
  onTransfer,
  onRemove,
}: StaffMemberRowProps) {
  const lastActive =
    member.user.sessions?.[0]?.createdAt ?? member.joinedAt;

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-accent/40",
        !isLast && "border-b border-border",
        member.status === "SUSPENDED" && "opacity-60",
      )}
    >
      <MemberAvatar name={member.user.fullName} src={member.profilePhotoUrl} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-semibold text-foreground">
            {member.user.fullName}
          </span>
          <RoleBadge role={member.role} />
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[12px] text-muted-foreground truncate">
            {member.jobTitle ? member.jobTitle : member.user.email}
          </span>
          {member.jobTitle ? (
            <span className="text-[11px] text-muted-foreground/50 truncate hidden sm:block">
              {member.user.email}
            </span>
          ) : null}
        </div>
      </div>

      <div className="hidden md:flex flex-col items-end gap-1 min-w-[110px]">
        <div className="flex items-center gap-2">
          {member.isVerified ? (
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-600 border border-emerald-500/20">
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-600 border border-amber-500/20">
              Unverified
            </span>
          )}
          <StatusBadge status={member.status} />
        </div>
        <span className="text-[11px] text-muted-foreground">
          {formatRelativeTime(lastActive)}
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            />
          }
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 border-border">
          {canUpdate && member.role !== "OWNER" ? (
            <>
              <DropdownMenuItem
                className="text-[13px] cursor-pointer"
                onClick={() => onEditRole(member)}
              >
                <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                Edit Role
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-[13px] cursor-pointer"
                onClick={() => onEditPermissions(member)}
              >
                <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                Edit Permissions
              </DropdownMenuItem>
            </>
          ) : null}

          {member.role !== "OWNER" ? (
            member.status === "ACTIVE" ? (
              <DropdownMenuItem
                className="text-[13px] cursor-pointer text-amber-600 focus:text-amber-600"
                onClick={() => onStatusChange(member, "SUSPENDED")}
              >
                <PauseCircle className="mr-2 h-3.5 w-3.5" />
                Suspend
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="text-[13px] cursor-pointer text-emerald-600 focus:text-emerald-600"
                onClick={() => onStatusChange(member, "ACTIVE")}
              >
                <PlayCircle className="mr-2 h-3.5 w-3.5" />
                Activate
              </DropdownMenuItem>
            )
          ) : null}

          {callerRole === "OWNER" && member.role !== "OWNER" ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-[13px] cursor-pointer text-amber-600 focus:text-amber-600"
                onClick={() => onTransfer(member)}
              >
                <ArrowRightLeft className="mr-2 h-3.5 w-3.5" />
                Transfer Ownership
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-[13px] cursor-pointer text-red-600 focus:text-red-600"
                onClick={() => onRemove(member)}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Remove from Company
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

"use client";

import { Button } from "@moja/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@moja/ui/components/ui/dropdown-menu";
import { cn } from "@moja/ui/lib/utils";
import {
  ArrowRightLeft,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { AdminMemberAvatar } from "@/features/admin/components/staff/member-avatar";
import { AdminRoleBadge } from "@/features/admin/components/staff/role-badge";
import { AdminStatusBadge } from "@/features/admin/components/staff/status-badge";
import {
  type AdminStaffMember,
  type AdminStaffStatus,
  formatRelativeTime,
} from "@/features/admin/lib/admin-staff";

interface AdminStaffMemberRowProps {
  member: AdminStaffMember & {
    user: AdminStaffMember["user"] & {
      sessions?: Array<{ createdAt: Date | string }>;
    };
  };
  isLast: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canTransfer: boolean;
  onEditRole: (member: AdminStaffMember) => void;
  onEditPermissions: (member: AdminStaffMember) => void;
  onStatusChange: (member: AdminStaffMember, status: AdminStaffStatus) => void;
  onTransfer: (member: AdminStaffMember) => void;
  onRemove: (member: AdminStaffMember) => void;
}

export function AdminStaffMemberRow({
  member,
  isLast,
  canUpdate,
  canDelete,
  canTransfer,
  onEditRole,
  onEditPermissions,
  onStatusChange,
  onTransfer,
  onRemove,
}: AdminStaffMemberRowProps) {
  const t = useTranslations("adminDashboard.staff");
  const lastActive = member.user.sessions?.[0]?.createdAt ?? member.joinedAt;

  const isSuperAdmin = member.role === "SUPER_ADMIN";

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-accent/40",
        !isLast && "border-b border-border",
        member.status === "SUSPENDED" && "opacity-60",
      )}
    >
      <AdminMemberAvatar
        name={member.user.fullName}
        src={member.profilePhotoUrl}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-semibold text-foreground">
            {member.user.fullName}
          </span>
          <AdminRoleBadge role={member.role} />
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
          <AdminStatusBadge status={member.status} />
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
          {canUpdate && !isSuperAdmin ? (
            <>
              <DropdownMenuItem
                className="text-[13px] cursor-pointer"
                onClick={() => onEditRole(member)}
              >
                <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                {t("table.editRole")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-[13px] cursor-pointer"
                onClick={() => onEditPermissions(member)}
              >
                <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                {t("table.editPermissions")}
              </DropdownMenuItem>
            </>
          ) : null}

          {canUpdate && !isSuperAdmin ? (
            member.status === "ACTIVE" ? (
              <DropdownMenuItem
                className="text-[13px] cursor-pointer text-amber-600 focus:text-amber-600"
                onClick={() => onStatusChange(member, "SUSPENDED")}
              >
                <PauseCircle className="mr-2 h-3.5 w-3.5" />
                {t("table.suspend")}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="text-[13px] cursor-pointer text-emerald-600 focus:text-emerald-600"
                onClick={() => onStatusChange(member, "ACTIVE")}
              >
                <PlayCircle className="mr-2 h-3.5 w-3.5" />
                {t("table.activate")}
              </DropdownMenuItem>
            )
          ) : null}

          {canTransfer && !isSuperAdmin ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-[13px] cursor-pointer text-amber-600 focus:text-amber-600"
                onClick={() => onTransfer(member)}
              >
                <ArrowRightLeft className="mr-2 h-3.5 w-3.5" />
                {t("table.transferOwnership")}
              </DropdownMenuItem>
            </>
          ) : null}

          {canDelete && !isSuperAdmin ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-[13px] cursor-pointer text-red-600 focus:text-red-600"
                onClick={() => onRemove(member)}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                {t("table.remove")}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

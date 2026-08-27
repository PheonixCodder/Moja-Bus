"use client";

import { Button } from "@moja/ui/components/ui/button";
import { Label } from "@moja/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@moja/ui/components/ui/sheet";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import {
  ADMIN_PERMISSION_META,
  ADMIN_ROLE_LABELS,
  type AdminStaffMember,
  type AdminStaffRole,
  getAdminTemplatePermissions,
} from "@/features/admin/lib/admin-staff";
import { AdminMemberAvatar } from "./member-avatar";
import { AdminRoleBadge } from "./role-badge";

interface RoleSheetProps {
  member: AdminStaffMember | null;
  open: boolean;
  onClose: () => void;
  onSave: (memberId: string, role: AdminStaffRole) => Promise<void>;
  assignableRoles?: AdminStaffRole[];
}

const FALLBACK_ROLES: AdminStaffRole[] = [
  "ADMIN",
  "OPERATIONS",
  "SUPPORT",
  "COMPLIANCE",
  "FINANCE",
];

export function RoleSheet({
  member,
  open,
  onClose,
  onSave,
  assignableRoles,
}: RoleSheetProps) {
  const roles = useMemo(
    () =>
      (assignableRoles?.length ? assignableRoles : FALLBACK_ROLES).filter(
        (r) => r !== "SUPER_ADMIN",
      ),
    [assignableRoles],
  );

  const t = useTranslations("adminDashboard.staff");
  const [role, setRole] = useState<AdminStaffRole>("SUPPORT");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setRole(member.role === "SUPER_ADMIN" ? "ADMIN" : member.role);
    }
  }, [member]);

  const previewKeys =
    role === "SUPER_ADMIN"
      ? getAdminTemplatePermissions("SUPER_ADMIN").slice(0, 12)
      : getAdminTemplatePermissions(role);

  async function handleSave() {
    if (!member) return;
    setSaving(true);
    try {
      await onSave(member.id, role);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="flex flex-col p-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("roleSheet.title")}</SheetTitle>
          <SheetDescription>{t("roleSheet.description")}</SheetDescription>
        </SheetHeader>

        {member ? (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/30">
                <AdminMemberAvatar name={member.user.fullName} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {member.user.fullName}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <AdminRoleBadge role={member.role} />
                    <span className="truncate text-xs text-muted-foreground">
                      {member.user.email}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("roleSheet.newRoleLabel")}</Label>
                <Select
                  value={role}
                  onValueChange={(v) => setRole(v as AdminStaffRole)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ADMIN_ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("roleSheet.templateIncludes")}
                </p>
                <ul className="space-y-1">
                  {previewKeys.map((key) => (
                    <li key={key} className="text-[12px] text-foreground/80">
                      {ADMIN_PERMISSION_META[key]?.label ?? key}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  {t("roleSheet.resetNotice")}
                </p>
              </div>
            </div>

            <SheetFooter className="flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={saving}
              >
                {t("cancel")}
              </Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <Spinner className="size-4" /> : t("roleSheet.save")}
              </Button>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

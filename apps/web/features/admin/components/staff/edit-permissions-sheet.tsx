"use client";

import { Button } from "@moja/ui/components/ui/button";
import { Label } from "@moja/ui/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@moja/ui/components/ui/sheet";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ADMIN_ROLE_LABELS,
  type AdminPermissionKey,
  type AdminStaffMember,
} from "@/features/admin/lib/admin-staff";
import { AdminMemberAvatar } from "./member-avatar";
import { AdminPermissionMatrix } from "./permission-matrix";
import { AdminRoleBadge } from "./role-badge";

interface EditPermissionsSheetProps {
  member: AdminStaffMember | null;
  open: boolean;
  onClose: () => void;
  onSave: (
    memberId: string,
    permissions: AdminPermissionKey[],
  ) => Promise<void>;
  grantable: AdminPermissionKey[];
}

export function EditPermissionsSheet({
  member,
  open,
  onClose,
  onSave,
  grantable,
}: EditPermissionsSheetProps) {
  const t = useTranslations("adminDashboard.staff");
  const [permissions, setPermissions] = useState<AdminPermissionKey[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setPermissions((member.permissions ?? []) as AdminPermissionKey[]);
    }
  }, [member]);

  async function handleSave() {
    if (!member) return;
    if (permissions.length === 0) {
      toast.error(t("inviteSheet.permissionRequired"));
      return;
    }
    setSaving(true);
    try {
      await onSave(member.id, permissions);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col max-w-md sm:max-w-lg border-l border-border bg-card p-6 overflow-y-auto"
      >
        <SheetHeader className="mb-6">
          <SheetTitle>{t("editPermissionsSheet.title")}</SheetTitle>
          <SheetDescription>
            {t("editPermissionsSheet.description")}
          </SheetDescription>
        </SheetHeader>

        {member ? (
          <>
            <div className="mb-5 flex items-center gap-3">
              <AdminMemberAvatar name={member.user.fullName} />
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {member.user.fullName ?? member.user.email}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {member.user.email}
                </p>
                <div className="mt-1">
                  <AdminRoleBadge role={member.role} />
                  <span className="ml-2 text-xs text-muted-foreground">
                    {ADMIN_ROLE_LABELS[member.role]}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("permissions")}</Label>
              <AdminPermissionMatrix
                selected={permissions}
                onChange={setPermissions}
                grantable={grantable}
              />
            </div>

            <div className="mt-6 flex gap-2 border-t border-border pt-4">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                {t("cancel")}
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Spinner className="size-4" />
                ) : (
                  t("editPermissionsSheet.save")
                )}
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

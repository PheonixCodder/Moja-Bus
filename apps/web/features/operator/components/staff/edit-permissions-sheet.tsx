"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@moja/ui/components/ui/button";
import { Label } from "@moja/ui/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@moja/ui/components/ui/sheet";
import { Spinner } from "@moja/ui/components/ui/spinner";
import {
  ROLE_LABELS,
  type PermissionKey,
  type StaffMember,
} from "@/features/operator/lib/staff";
import { MemberAvatar } from "./member-avatar";
import { RoleBadge } from "./role-badge";
import { PermissionMatrix } from "./permission-matrix";

interface EditPermissionsSheetProps {
  member: StaffMember | null;
  open: boolean;
  onClose: () => void;
  onSave: (memberId: string, permissions: PermissionKey[]) => Promise<void>;
  grantable: PermissionKey[];
}

export function EditPermissionsSheet({
  member,
  open,
  onClose,
  onSave,
  grantable,
}: EditPermissionsSheetProps) {
  const t = useTranslations("operatorDashboard.staff");
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setPermissions((member.permissions ?? []) as PermissionKey[]);
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
      <SheetContent side="right" className="flex flex-col p-0 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{t("editPermissionsSheet.title")}</SheetTitle>
          <SheetDescription>
            {t("editPermissionsSheet.description")}
          </SheetDescription>
        </SheetHeader>

        {member ? (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/30">
                <MemberAvatar name={member.user.fullName} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {member.user.fullName ?? member.user.email}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {member.user.email}
                  </p>
                  <div className="mt-1">
                    <RoleBadge role={member.role} />
                    <span className="ml-2 text-xs text-muted-foreground">
                      {ROLE_LABELS[member.role]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("permissions")}</Label>
                <PermissionMatrix
                  selected={permissions}
                  onChange={setPermissions}
                  grantable={grantable}
                />
              </div>
            </div>

            <SheetFooter className="flex-row gap-2">
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
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

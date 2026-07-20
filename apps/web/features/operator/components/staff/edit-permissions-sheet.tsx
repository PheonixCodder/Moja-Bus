"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
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
      toast.error("Select at least one permission");
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
          <SheetTitle>Edit permissions</SheetTitle>
          <SheetDescription>
            Adjust what this team member can do. You can only grant permissions
            you hold.
          </SheetDescription>
        </SheetHeader>

        {member ? (
          <>
            <div className="mb-5 flex items-center gap-3">
              <MemberAvatar name={member.user.fullName} />
              <div className="min-w-0">
                <p className="truncate font-medium">
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
              <Label>Permissions</Label>
              <PermissionMatrix
                selected={permissions}
                onChange={setPermissions}
                grantable={grantable}
              />
            </div>

            <div className="mt-6 flex gap-2 border-t border-border pt-4">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? <Spinner className="size-4" /> : "Save permissions"}
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

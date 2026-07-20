"use client";

import { useEffect, useMemo, useState } from "react";
import { Spinner } from "@moja/ui/components/ui/spinner";
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
  SheetHeader,
  SheetTitle,
} from "@moja/ui/components/ui/sheet";
import { Checkbox } from "@moja/ui/components/ui/checkbox";
import {
  PERMISSION_META,
  ROLE_LABELS,
  ROLE_TEMPLATES,
  getTemplatePermissions,
  type StaffMember,
  type StaffRole,
} from "@/features/operator/lib/staff";
import { MemberAvatar } from "./member-avatar";
import { RoleBadge } from "./role-badge";

interface RoleSheetProps {
  member: StaffMember | null;
  open: boolean;
  onClose: () => void;
  onSave: (
    memberId: string,
    role: StaffRole,
    resetPermissions: boolean,
  ) => Promise<void>;
  callerRole: StaffRole;
  assignableRoles?: StaffRole[];
}

const FALLBACK_ROLES: StaffRole[] = [
  "ADMIN",
  "MANAGER",
  "OPERATIONS",
  "FINANCE",
  "SUPPORT",
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
        (r) => r !== "OWNER",
      ),
    [assignableRoles],
  );

  const [role, setRole] = useState<StaffRole>("SUPPORT");
  const [resetPermissions, setResetPermissions] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setRole(member.role === "OWNER" ? "ADMIN" : member.role);
      setResetPermissions(true);
    }
  }, [member]);

  const previewKeys =
    role === "OWNER"
      ? getTemplatePermissions("OWNER").slice(0, 12)
      : ROLE_TEMPLATES[role];

  async function handleSave() {
    if (!member) return;
    setSaving(true);
    try {
      await onSave(member.id, role, resetPermissions);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col max-w-md border-l border-border bg-card p-6 overflow-y-auto"
      >
        <SheetHeader className="mb-6">
          <SheetTitle>Edit role</SheetTitle>
          <SheetDescription>
            Role is a template label. Use Edit Permissions to fine-tune actions.
            Optionally reset permissions to the role template.
          </SheetDescription>
        </SheetHeader>

        {member ? (
          <>
            <div className="mb-5 flex items-center gap-3">
              <MemberAvatar name={member.user.fullName} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {member.user.fullName}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <RoleBadge role={member.role} />
                  <span className="truncate text-xs text-muted-foreground">
                    {member.user.email}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <Label>New role</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as StaffRole)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label className="mb-4 flex items-start gap-2 rounded-lg border border-border p-3 cursor-pointer">
              <Checkbox
                checked={resetPermissions}
                onCheckedChange={(v) => setResetPermissions(v === true)}
                className="mt-0.5"
              />
              <span className="text-[13px] text-foreground">
                Reset permissions to the{" "}
                <span className="font-medium">{ROLE_LABELS[role]}</span>{" "}
                template
              </span>
            </label>

            <div className="mb-6 rounded-lg border border-border bg-muted/30 p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Template includes
              </p>
              <ul className="space-y-1">
                {previewKeys.map((key) => (
                  <li key={key} className="text-[12px] text-foreground/80">
                    {PERMISSION_META[key]?.label ?? key}
                  </li>
                ))}
                {role === "OWNER" ? (
                  <li className="text-[12px] text-muted-foreground">
                    …and all other catalog actions
                  </li>
                ) : null}
              </ul>
            </div>

            <div className="mt-auto flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#ee237c] hover:bg-[#d11f6e] text-white"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <Spinner className="size-4" /> : "Save role"}
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@moja/ui/components/ui/sheet";
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
  "OPERATIONS",
  "MANAGER",
  "ADMIN",
  "FINANCE",
  "SUPPORT",
  "TREASURY",
  "DISPATCHER",
  "CONDUCTOR",
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

  const t = useTranslations("operatorDashboard.staff");
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
        className="flex flex-col p-0 sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle>{t("roleSheet.title")}</SheetTitle>
          <SheetDescription>
            {t("roleSheet.description")}
          </SheetDescription>
        </SheetHeader>

        {member ? (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/30">
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

              <div className="space-y-2">
                <Label>{t("roleSheet.newRoleLabel")}</Label>
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

              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("roleSheet.templateIncludes")}
                </p>
                <ul className="space-y-1">
                  {previewKeys.map((key) => (
                    <li key={key} className="text-[12px] text-foreground/80">
                      {PERMISSION_META[key]?.label ?? key}
                    </li>
                  ))}
                  {role === "OWNER" ? (
                    <li className="text-[12px] text-muted-foreground">
                      {t("roleSheet.allOtherActions")}
                    </li>
                  ) : null}
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
                className="flex-1 bg-[#ee237c] hover:bg-[#d11f6e] text-white"
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

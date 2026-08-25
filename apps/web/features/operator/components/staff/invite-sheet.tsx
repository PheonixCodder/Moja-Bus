"use client";

import type { InvitableStaffRole } from "@moja/schemas";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
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
import { Textarea } from "@moja/ui/components/ui/textarea";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  type PermissionKey,
  ROLE_LABELS,
  ROLE_TEMPLATES,
} from "@/features/operator/lib/staff";
import type { CreateInvitationInput } from "@/features/operator/lib/validations/staff";
import { PermissionMatrix } from "./permission-matrix";

const INVITABLE_ROLES: InvitableStaffRole[] = [
  "OPERATIONS",
  "MANAGER",
  "ADMIN",
  "FINANCE",
  "SUPPORT",
  "TREASURY",
  "DISPATCHER",
  "CONDUCTOR",
];

interface InviteSheetProps {
  open: boolean;
  onClose: () => void;
  onSend: (payload: CreateInvitationInput) => Promise<void>;
  grantable: PermissionKey[];
  assignableRoles?: InvitableStaffRole[];
}

function seedPermissions(
  role: InvitableStaffRole,
  grantable: PermissionKey[],
): PermissionKey[] {
  const template = ROLE_TEMPLATES[role] ?? [];
  const allowed = new Set(grantable);
  return template.filter((k) => allowed.has(k));
}

export function InviteSheet({
  open,
  onClose,
  onSend,
  grantable,
  assignableRoles,
}: InviteSheetProps) {
  const roles = useMemo(
    () => (assignableRoles?.length ? assignableRoles : INVITABLE_ROLES),
    [assignableRoles],
  );

  const t = useTranslations("operatorDashboard.staff");
  const defaultRole = roles[0] ?? "OPERATIONS";
  const [form, setForm] = useState<{
    email: string;
    role: InvitableStaffRole;
    jobTitle: string;
    message: string;
  }>({
    email: "",
    role: defaultRole,
    jobTitle: "",
    message: "",
  });
  const [permissions, setPermissions] = useState<PermissionKey[]>(() =>
    seedPermissions(defaultRole, grantable),
  );
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      setPermissions(seedPermissions(form.role, grantable));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reseed on open/grantable
  }, [open, grantable]);

  function onRoleChange(role: InvitableStaffRole) {
    setForm((f) => ({ ...f, role }));
    setPermissions(seedPermissions(role, grantable));
  }

  function reset() {
    setForm({
      email: "",
      role: defaultRole,
      jobTitle: "",
      message: "",
    });
    setPermissions(seedPermissions(defaultRole, grantable));
  }

  async function handleSend() {
    if (!form.email) {
      toast.error(t("inviteSheet.emailRequired"));
      return;
    }
    if (permissions.length === 0) {
      toast.error(t("inviteSheet.permissionRequired"));
      return;
    }
    setSending(true);
    try {
      const payload: CreateInvitationInput = {
        email: form.email,
        role: form.role,
        permissions,
        expiryDays: 7,
      };
      if (form.jobTitle) payload.jobTitle = form.jobTitle;
      if (form.message) payload.message = form.message;

      await onSend(payload);
      reset();
      onClose();
    } finally {
      setSending(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          reset();
          onClose();
        }
      }}
    >
      <SheetContent side="right" className="flex flex-col p-0 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-base font-semibold">
            {t("inviteSheet.title")}
          </SheetTitle>
          <SheetDescription className="text-sm">
            {t("inviteSheet.description")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="invite-email">{t("inviteSheet.emailLabel")}</Label>
            <Input
              id="invite-email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              placeholder={t("inviteSheet.emailPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("inviteSheet.roleLabel")}</Label>
            <Select
              value={form.role}
              onValueChange={(v) => onRoleChange(v as InvitableStaffRole)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-title">
              {t("inviteSheet.jobTitleLabel")}
            </Label>
            <Input
              id="invite-title"
              value={form.jobTitle}
              onChange={(e) =>
                setForm((f) => ({ ...f, jobTitle: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>{t("permissions")}</Label>
            <PermissionMatrix
              selected={permissions}
              onChange={setPermissions}
              grantable={grantable}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-message">
              {t("inviteSheet.messageLabel")}
            </Label>
            <Textarea
              id="invite-message"
              value={form.message}
              onChange={(e) =>
                setForm((f) => ({ ...f, message: e.target.value }))
              }
              rows={3}
            />
          </div>
        </div>

        <SheetFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button className="flex-1" onClick={handleSend} disabled={sending}>
            {sending ? (
              <Spinner className="size-4" />
            ) : (
              <>
                <Send className="mr-2 size-4" />
                {t("inviteSheet.send")}
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

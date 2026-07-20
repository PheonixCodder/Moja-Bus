"use client";

import { useEffect, useMemo, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { Textarea } from "@moja/ui/components/ui/textarea";
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
import { Spinner } from "@moja/ui/components/ui/spinner";
import {
  ROLE_LABELS,
  ROLE_TEMPLATES,
  type PermissionKey,
  type StaffRole,
} from "@/features/operator/lib/staff";
import type { CreateInvitationInput } from "@/features/operator/lib/validations/staff";
import { PermissionMatrix } from "./permission-matrix";

const INVITABLE_ROLES: StaffRole[] = [
  "ADMIN",
  "MANAGER",
  "OPERATIONS",
  "FINANCE",
  "SUPPORT",
];

interface InviteSheetProps {
  open: boolean;
  onClose: () => void;
  onSend: (payload: CreateInvitationInput) => Promise<void>;
  grantable: PermissionKey[];
  assignableRoles?: StaffRole[];
}

function seedPermissions(
  role: StaffRole,
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
    () =>
      (assignableRoles?.length ? assignableRoles : INVITABLE_ROLES).filter(
        (r) => r !== "OWNER",
      ),
    [assignableRoles],
  );

  const defaultRole = (roles[0] ?? "OPERATIONS") as StaffRole;
  const [form, setForm] = useState<{
    email: string;
    role: Exclude<StaffRole, "OWNER">;
    jobTitle: string;
    message: string;
  }>({
    email: "",
    role: defaultRole === "OWNER" ? "OPERATIONS" : defaultRole,
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

  function onRoleChange(role: Exclude<StaffRole, "OWNER">) {
    setForm((f) => ({ ...f, role }));
    setPermissions(seedPermissions(role, grantable));
  }

  function reset() {
    const role =
      defaultRole === "OWNER" ? ("OPERATIONS" as const) : defaultRole;
    setForm({ email: "", role, jobTitle: "", message: "" });
    setPermissions(seedPermissions(role, grantable));
  }

  async function handleSend() {
    if (!form.email) {
      toast.error("Email is required");
      return;
    }
    if (permissions.length === 0) {
      toast.error("Select at least one permission");
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
      <SheetContent
        side="right"
        className="flex w-full flex-col max-w-md sm:max-w-lg border-l border-border bg-card p-6 overflow-y-auto"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="text-lg font-semibold">
            Invite Team Member
          </SheetTitle>
          <SheetDescription className="text-[13px]">
            Choose a role template, then adjust individual permissions. They
            will receive an email invite link.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="colleague@company.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Role template</Label>
            <Select
              value={form.role}
              onValueChange={(v) =>
                onRoleChange(v as Exclude<StaffRole, "OWNER">)
              }
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
            <Label htmlFor="invite-title">Job title (optional)</Label>
            <Input
              id="invite-title"
              value={form.jobTitle}
              onChange={(e) =>
                setForm((f) => ({ ...f, jobTitle: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Permissions</Label>
            <PermissionMatrix
              selected={permissions}
              onChange={setPermissions}
              grantable={grantable}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-message">Message (optional)</Label>
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

        <div className="mt-6 flex gap-2 border-t border-border pt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSend} disabled={sending}>
            {sending ? (
              <Spinner className="size-4" />
            ) : (
              <>
                <Send className="mr-2 size-4" />
                Send invite
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

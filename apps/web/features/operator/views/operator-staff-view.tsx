"use client";

import { useCallback, useEffect, useState } from "react";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import {
  Users,
  UserPlus,
  Search,
  MoreHorizontal,
  ShieldCheck,
  Mail,
  Send,
  XCircle,
  RefreshCw,
  ArrowRightLeft,
  PauseCircle,
  PlayCircle,
  ChevronDown,
  AlertTriangle,
  Activity,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@moja/ui/lib/utils";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { Textarea } from "@moja/ui/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@moja/ui/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@moja/ui/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@moja/ui/components/ui/alert-dialog";
import { Spinner } from "@moja/ui/components/ui/spinner";

import {
  ROLE_LABELS,
  ROLE_COLORS,
  STATUS_CONFIG,
  getInitials,
  getAvatarColor,
  formatRelativeTime,
  formatInvitationExpiry,
  type StaffMember,
  type StaffInvitation,
  type ActivityLogEntry,
  type StaffRole,
  type OperatorStatus,
} from "../lib/staff";

type CreateInvitationPayload = {
  email: string;
  role: "OWNER" | "ADMIN" | "MANAGER" | "OPERATIONS" | "FINANCE" | "SUPPORT";
  jobTitle?: string;
  message?: string;
};

import { useTRPC } from "@/trpc/client";

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSION LABELS for UI preview (mirrors backend PERMISSIONS object)
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_PERMISSION_PREVIEW: Record<StaffRole, string[]> = {
  OWNER: [
    "Invite Staff",
    "Manage Staff",
    "View Staff",
    "Manage Routes",
    "Manage Schedules",
    "Manage Fleet",
    "View Finance",
    "Manage Finance",
    "Manage Dispatch",
    "View Trips",
    "View Bookings",
    "Transfer Ownership",
  ],
  ADMIN: [
    "Invite Staff",
    "Manage Staff",
    "View Staff",
    "Manage Routes",
    "Manage Schedules",
    "Manage Fleet",
    "View Finance",
    "Manage Dispatch",
  ],
  MANAGER: [
    "Manage Routes",
    "Manage Schedules",
    "Manage Dispatch",
    "View Staff",
  ],
  OPERATIONS: ["Manage Dispatch", "View Trips"],
  FINANCE: ["View Finance", "Manage Finance"],
  SUPPORT: ["View Bookings", "View Trips"],
};

const ALL_PERMISSIONS = [
  "Invite Staff",
  "Manage Staff",
  "View Staff",
  "Manage Routes",
  "Manage Schedules",
  "Manage Fleet",
  "View Finance",
  "Manage Finance",
  "Manage Dispatch",
  "View Trips",
  "View Bookings",
  "Transfer Ownership",
];

const INVITABLE_ROLES: StaffRole[] = [
  "ADMIN",
  "MANAGER",
  "OPERATIONS",
  "FINANCE",
  "SUPPORT",
];

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────────────────────────────────────

function MemberAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = getInitials(name);
  const color = getAvatarColor(name);
  const sizeClass =
    size === "sm"
      ? "h-8 w-8 text-[11px]"
      : size === "lg"
        ? "h-12 w-12 text-base"
        : "h-10 w-10 text-[13px]";
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        sizeClass,
        color,
      )}
    >
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE BADGE
// ─────────────────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: StaffRole }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold",
        ROLE_COLORS[role],
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OperatorStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[12px] font-medium",
        config.className,
      )}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE SHEET (Edit role with permissions preview)
// ─────────────────────────────────────────────────────────────────────────────

interface RoleSheetProps {
  member: StaffMember | null;
  open: boolean;
  onClose: () => void;
  onSave: (memberId: string, role: StaffRole) => Promise<void>;
  callerRole: StaffRole;
}

function RoleSheet({
  member,
  open,
  onClose,
  onSave,
  callerRole,
}: RoleSheetProps) {
  const [selectedRole, setSelectedRole] = useState<StaffRole>(
    member?.role ?? "OPERATIONS",
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (member) setSelectedRole(member.role);
  }, [member]);

  const allowed = ROLE_PERMISSION_PREVIEW[selectedRole] ?? [];

  async function handleSave() {
    if (!member) return;
    setSaving(true);
    try {
      await onSave(member.id, selectedRole);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col max-w-sm sm:max-w-md border-l border-border bg-card p-6 overflow-y-auto"
      >
        <SheetHeader className="mb-8">
          <SheetTitle className="text-lg font-semibold">Edit Role</SheetTitle>
          {member && (
            <SheetDescription className="flex items-center gap-3 mt-2 rounded-lg bg-accent/50 p-3">
              <MemberAvatar name={member.user.fullName} size="sm" />
              <div className="flex flex-col text-left">
                <span className="text-[13px] font-medium text-foreground">
                  {member.user.fullName}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {member.user.email}
                </span>
              </div>
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="flex-1 space-y-8">
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Current Role
            </Label>
            <div>{member && <RoleBadge role={member.role} />}</div>
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="role-select"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >
              New Role
            </Label>
            <Select
              value={selectedRole}
              onValueChange={(v) => setSelectedRole(v as StaffRole)}
            >
              <SelectTrigger
                id="role-select"
                className="h-10 border-border bg-background text-[13px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVITABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="text-[13px]">
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Permissions Preview
            </Label>
            <div className="rounded-xl border border-border bg-background p-4 space-y-2.5 shadow-sm">
              {ALL_PERMISSIONS.map((perm) => {
                const has = allowed.includes(perm);
                return (
                  <div
                    key={perm}
                    className={cn(
                      "flex items-center gap-3 text-[13px]",
                      has
                        ? "text-foreground font-medium"
                        : "text-muted-foreground/60",
                    )}
                  >
                    <span
                      className={cn(
                        "flex items-center justify-center h-4 w-4 rounded-full text-[10px] font-bold",
                        has
                          ? "bg-emerald-500/15 text-emerald-600"
                          : "bg-muted text-muted-foreground/40",
                      )}
                    >
                      {has ? "✓" : "✗"}
                    </span>
                    {perm}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-border flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-10 text-[13px]"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 h-10 text-[13px] bg-[#ee237c] hover:bg-[#d11f6e] text-white"
            onClick={handleSave}
            disabled={saving || selectedRole === member?.role}
          >
            {saving ? <Spinner className="h-4 w-4" /> : "Save Changes"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INVITE DRAWER
// ─────────────────────────────────────────────────────────────────────────────

interface InviteSheetProps {
  open: boolean;
  onClose: () => void;
  onSend: (payload: CreateInvitationPayload) => Promise<void>;
}

function InviteSheet({ open, onClose, onSend }: InviteSheetProps) {
  const [form, setForm] = useState({
    email: "",
    role: "OPERATIONS" as StaffRole,
    jobTitle: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  function reset() {
    setForm({ email: "", role: "OPERATIONS", jobTitle: "", message: "" });
  }

  async function handleSend() {
    if (!form.email) {
      toast.error("Email is required");
      return;
    }
    setSending(true);
    try {
      const payload: CreateInvitationPayload = {
        email: form.email,
        role: form.role,
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
        className="flex w-full flex-col max-w-sm sm:max-w-md border-l border-border bg-card p-6 overflow-y-auto"
      >
        <SheetHeader className="mb-8">
          <SheetTitle className="text-lg font-semibold">
            Invite Team Member
          </SheetTitle>
          <SheetDescription className="text-[13px]">
            They will receive an email with a link to join your company.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="invite-email"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Email *
            </Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@example.com"
              className="h-10 text-[13px] border-border"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="invite-role"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Role *
            </Label>
            <Select
              value={form.role}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, role: v as StaffRole }))
              }
            >
              <SelectTrigger
                id="invite-role"
                className="h-10 border-border text-[13px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVITABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="text-[13px]">
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="invite-title"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Job Title{" "}
              <span className="text-muted-foreground/60 normal-case tracking-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="invite-title"
              placeholder="e.g. Morning Dispatcher"
              className="h-10 text-[13px] border-border"
              value={form.jobTitle}
              onChange={(e) =>
                setForm((f) => ({ ...f, jobTitle: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="invite-message"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Welcome Message{" "}
              <span className="text-muted-foreground/60 normal-case tracking-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="invite-message"
              placeholder="Looking forward to having you on the team!"
              className="min-h-[80px] text-[13px] border-border resize-none"
              value={form.message}
              onChange={(e) =>
                setForm((f) => ({ ...f, message: e.target.value }))
              }
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Shown on the invite acceptance screen.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-border flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-10 text-[13px]"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 h-10 text-[13px] bg-[#ee237c] hover:bg-[#d11f6e] text-white"
            onClick={handleSend}
            disabled={sending}
          >
            {sending ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Invite
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OWNERSHIP TRANSFER DIALOG
// ─────────────────────────────────────────────────────────────────────────────

interface TransferDialogProps {
  member: StaffMember | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (memberId: string, password: string) => Promise<void>;
}

function TransferOwnershipDialog({
  member,
  open,
  onClose,
  onConfirm,
}: TransferDialogProps) {
  const [password, setPassword] = useState("");
  const [confirming, setConfirming] = useState(false);

  async function handleConfirm() {
    if (!member || !password) return;
    setConfirming(true);
    try {
      await onConfirm(member.id, password);
      setPassword("");
      onClose();
    } finally {
      setConfirming(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setPassword("");
          onClose();
        }
      }}
    >
      <AlertDialogContent className="border-border bg-card max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <AlertDialogTitle className="text-base font-semibold">
              Transfer Ownership
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-[13px] text-muted-foreground space-y-2">
            <p>
              You are about to transfer ownership of the company to{" "}
              <strong className="text-foreground">
                {member?.user.fullName}
              </strong>
              .
            </p>
            <p className="text-amber-600 font-medium">
              You will lose owner access. This cannot be undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-1.5 px-0 pb-2">
          <Label
            htmlFor="transfer-password"
            className="text-[12px] font-medium text-muted-foreground"
          >
            Confirm your password
          </Label>
          <Input
            id="transfer-password"
            type="password"
            placeholder="Enter your password"
            className="h-9 text-[13px] border-border"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="h-9 text-[13px]"
            onClick={() => setPassword("")}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="h-9 text-[13px] bg-red-600 hover:bg-red-700 text-white border-0"
            onClick={handleConfirm}
            disabled={confirming || !password}
          >
            {confirming ? (
              <Spinner className="h-3.5 w-3.5" />
            ) : (
              "Transfer Ownership"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN VIEW
// ─────────────────────────────────────────────────────────────────────────────

export function OperatorStaffView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<StaffRole | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<OperatorStatus | "ALL">(
    "ALL",
  );

  const { data: staffData } = useSuspenseQuery(
    trpc.staff.listStaff.queryOptions({
      search: search || undefined,
      role: roleFilter === "ALL" ? undefined : (roleFilter as StaffRole),
      status:
        statusFilter === "ALL" ? undefined : (statusFilter as OperatorStatus),
    }),
  );

  const { data: invitations } = useSuspenseQuery(
    trpc.staff.listInvitations.queryOptions(),
  );
  const { data: activityLog } = useSuspenseQuery(
    trpc.staff.getActivityLog.queryOptions({ limit: 100 }),
  );
  const { data: myRoleData } = useSuspenseQuery(
    trpc.staff.getMyRole.queryOptions(),
  );
  const members = staffData.members as any[];

  // Sheets/dialogs
  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleSheetMember, setRoleSheetMember] = useState<any | null>(null);
  const [transferMember, setTransferMember] = useState<any | null>(null);
  const [statusMember, setStatusMember] = useState<{
    member: any;
    nextStatus: OperatorStatus;
  } | null>(null);

  // Determine caller's role from the authenticated operator record
  const callerRole: StaffRole = myRoleData.role;

  // Mutations
  const createInviteMutation = useMutation(
    trpc.staff.createInvitation.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.staff.listInvitations.pathFilter());
        queryClient.invalidateQueries(trpc.staff.getActivityLog.pathFilter());
      },
    }),
  );

  const updateRoleMutation = useMutation(
    trpc.staff.updateRole.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.staff.listStaff.pathFilter());
        queryClient.invalidateQueries(trpc.staff.getActivityLog.pathFilter());
      },
    }),
  );

  const updateStatusMutation = useMutation(
    trpc.staff.updateStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.staff.listStaff.pathFilter());
        queryClient.invalidateQueries(trpc.staff.getActivityLog.pathFilter());
      },
    }),
  );

  const transferOwnershipMutation = useMutation(
    trpc.staff.transferOwnership.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.staff.listStaff.pathFilter());
        queryClient.invalidateQueries(trpc.staff.getActivityLog.pathFilter());
      },
    }),
  );

  const cancelInviteMutation = useMutation(
    trpc.staff.cancelInvitation.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.staff.listInvitations.pathFilter());
        queryClient.invalidateQueries(trpc.staff.getActivityLog.pathFilter());
      },
    }),
  );

  const resendInviteMutation = useMutation(
    trpc.staff.resendInvitation.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.staff.getActivityLog.pathFilter());
      },
    }),
  );

  // ── Actions ────────────────────────────────────────────────────────────────

  async function handleInvite(payload: CreateInvitationPayload) {
    try {
      await createInviteMutation.mutateAsync(payload);
      toast.success(`Invitation sent to ${payload.email}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to invite member");
    }
  }

  async function handleRoleSave(memberId: string, role: StaffRole) {
    try {
      await updateRoleMutation.mutateAsync({ memberId, role });
      toast.success("Role updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
      throw err;
    }
  }

  async function handleStatusChange(member: any, nextStatus: OperatorStatus) {
    try {
      await updateStatusMutation.mutateAsync({
        memberId: member.id,
        status: nextStatus,
      });
      toast.success(
        `${member.user.fullName} is now ${STATUS_CONFIG[nextStatus].label}`,
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  }

  async function handleTransfer(memberId: string, password: string) {
    try {
      const res = await transferOwnershipMutation.mutateAsync({
        memberId,
        password,
      });
      toast.success("Ownership transferred successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to transfer ownership");
      throw err;
    }
  }

  async function handleCancelInvite(inv: any) {
    try {
      await cancelInviteMutation.mutateAsync({ invitationId: inv.id });
      toast.success(`Invitation to ${inv.email} cancelled`);
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel invitation");
    }
  }

  async function handleResendInvite(inv: any) {
    try {
      await resendInviteMutation.mutateAsync({ invitationId: inv.id });
      toast.success(`Invitation resent to ${inv.email}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to resend invitation");
    }
  }

  // ── Activity feed grouping ─────────────────────────────────────────────────

  function groupActivityByDate(logs: ActivityLogEntry[]) {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const groups: Record<string, ActivityLogEntry[]> = {};

    for (const log of logs) {
      const d = new Date(log.createdAt).toDateString();
      const label =
        d === today
          ? "Today"
          : d === yesterday
            ? "Yesterday"
            : format(new Date(log.createdAt), "MMM d");
      if (!groups[label]) groups[label] = [];
      groups[label]!.push(log);
    }
    return groups;
  }

  const pendingInvites = invitations.filter((i) => i.status === "PENDING");
  const activityGroups = groupActivityByDate(activityLog);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-bg-base">
      {/* Top Header Panel */}
      <div className="border-b border-border bg-card px-6 py-5 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold font-display tracking-tight text-foreground flex items-center gap-2">
              <Users className="size-5.5 text-primary" />
              Staff
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your team, roles, and invitations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-8.5 text-xs font-semibold bg-[#ee237c] hover:bg-[#d11f6e] text-white"
              onClick={() => setInviteOpen(true)}
            >
              <UserPlus className="size-4 mr-1.5" />
              Invite Member
            </Button>
          </div>
        </div>
      </div>

      {/* Main Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border bg-card px-6 py-3.5 gap-3.5 shrink-0">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, phone, title…"
            className="pl-9 h-9 shadow-none text-xs bg-bg-base border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold">
              Role:
            </span>
            <Select
              value={roleFilter}
              onValueChange={(v) => setRoleFilter(v as StaffRole | "ALL")}
            >
              <SelectTrigger className="h-8.5 w-[130px] border-border bg-bg-base text-xs">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  All Roles
                </SelectItem>
                {(Object.keys(ROLE_LABELS) as StaffRole[]).map((r) => (
                  <SelectItem key={r} value={r} className="text-xs">
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold">
              Status:
            </span>
            <Select
              value={statusFilter}
              onValueChange={(v) =>
                setStatusFilter(v as OperatorStatus | "ALL")
              }
            >
              <SelectTrigger className="h-8.5 w-[130px] border-border bg-bg-base text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  All Statuses
                </SelectItem>
                <SelectItem value="ACTIVE" className="text-xs">
                  ✓ Active
                </SelectItem>
                <SelectItem value="INACTIVE" className="text-xs">
                  ⏸ Inactive
                </SelectItem>
                <SelectItem value="SUSPENDED" className="text-xs">
                  🚫 Suspended
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* ── Active Roster ── */}
        <section>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Team Members · {members.length}
          </h2>

          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 text-center shadow-sm">
              <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
              {search || roleFilter !== "ALL" || statusFilter !== "ALL" ? (
                <>
                  <p className="text-[14px] font-medium text-foreground">
                    No results found
                  </p>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    Try adjusting your search or filters.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[14px] font-medium text-foreground">
                    No team members yet
                  </p>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    Invite your first employee to get started.
                  </p>
                  <Button
                    size="sm"
                    className="mt-4 h-8.5 gap-1.5 bg-[#ee237c] hover:bg-[#d11f6e] text-white text-xs font-semibold"
                    onClick={() => setInviteOpen(true)}
                  >
                    <UserPlus className="size-4" />
                    Invite Member
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              {members.map((member, idx) => {
                const lastActive = member.user.sessions[0]?.createdAt;
                return (
                  <div
                    key={member.id}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-accent/40",
                      idx !== members.length - 1 && "border-b border-border",
                      member.status === "SUSPENDED" && "opacity-60",
                    )}
                  >
                    {/* Avatar */}
                    <MemberAvatar name={member.user.fullName} />

                    {/* Identity */}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-semibold text-foreground">
                          {member.user.fullName}
                        </span>
                        <RoleBadge role={member.role} />
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[12px] text-muted-foreground truncate">
                          {member.jobTitle
                            ? member.jobTitle
                            : member.user.email}
                        </span>
                        {member.jobTitle && (
                          <span className="text-[11px] text-muted-foreground/50 truncate hidden sm:block">
                            {member.user.email}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status */}
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

                    {/* Actions */}
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
                      <DropdownMenuContent
                        align="end"
                        className="w-48 border-border"
                      >
                        <DropdownMenuItem
                          className="text-[13px] cursor-pointer"
                          onClick={() => setRoleSheetMember(member)}
                          disabled={member.role === "OWNER"}
                        >
                          <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                          Edit Role
                        </DropdownMenuItem>

                        {member.role !== "OWNER" &&
                          (member.status === "ACTIVE" ? (
                            <DropdownMenuItem
                              className="text-[13px] cursor-pointer text-amber-600 focus:text-amber-600"
                              onClick={() =>
                                handleStatusChange(member, "SUSPENDED")
                              }
                            >
                              <PauseCircle className="mr-2 h-3.5 w-3.5" />
                              Suspend
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-[13px] cursor-pointer text-emerald-600 focus:text-emerald-600"
                              onClick={() =>
                                handleStatusChange(member, "ACTIVE")
                              }
                            >
                              <PlayCircle className="mr-2 h-3.5 w-3.5" />
                              Activate
                            </DropdownMenuItem>
                          ))}

                        {callerRole === "OWNER" && member.role !== "OWNER" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-[13px] cursor-pointer text-amber-600 focus:text-amber-600"
                              onClick={() => setTransferMember(member)}
                            >
                              <ArrowRightLeft className="mr-2 h-3.5 w-3.5" />
                              Transfer Ownership
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Pending Invitations ── */}
        <section>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Pending Invitations · {pendingInvites.length}
          </h2>

          {pendingInvites.length === 0 ? (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-card py-8 text-center shadow-sm">
              <div>
                <Mail className="h-7 w-7 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-[13px] text-muted-foreground">
                  No pending invitations
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pendingInvites.map((inv) => {
                const expiry = formatInvitationExpiry(inv.expiresAt);
                return (
                  <div
                    key={inv.id}
                    className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-[13px] font-semibold text-foreground">
                          {inv.email}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <RoleBadge role={inv.role} />
                          {inv.jobTitle && (
                            <span className="text-[11px] text-muted-foreground">
                              {inv.jobTitle}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          Sent by {inv.invitedBy.fullName} ·{" "}
                          {format(new Date(inv.createdAt), "MMM d, HH:mm")}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "flex items-center gap-1.5 text-[11px] font-medium",
                          expiry.expired ? "text-red-500" : "text-amber-600",
                        )}
                      >
                        <span>{expiry.label}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1 border-t border-border mt-1 pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-[12px] gap-1 font-semibold"
                        onClick={() => handleResendInvite(inv)}
                      >
                        <RefreshCw className="h-3 w-3" />
                        Resend
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-[12px] gap-1 text-red-600 hover:text-red-600 hover:bg-red-50 border-red-200 font-semibold"
                        onClick={() => handleCancelInvite(inv)}
                      >
                        <XCircle className="h-3 w-3" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Activity Feed ── */}
        <section>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Organization Activity
          </h2>

          {activityLog.length === 0 ? (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-card py-8 shadow-sm">
              <p className="text-[13px] text-muted-foreground">
                No recent activity
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden shadow-sm">
              {Object.entries(activityGroups).map(([dateLabel, logs]) => (
                <div key={dateLabel}>
                  <div className="px-4 py-2 bg-accent/30 border-y border-border/50 first:border-t-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {dateLabel}
                    </span>
                  </div>
                  <div className="divide-y divide-border/50">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-accent/20 transition-colors"
                      >
                        <MemberAvatar name={log.user.fullName} size="sm" />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="text-[13px] text-foreground">
                            {log.description}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5">
                          {format(new Date(log.createdAt), "HH:mm")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Sheets & Dialogs ── */}
      <InviteSheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSend={handleInvite}
      />

      <RoleSheet
        member={roleSheetMember}
        open={!!roleSheetMember}
        onClose={() => setRoleSheetMember(null)}
        onSave={handleRoleSave}
        callerRole={callerRole}
      />

      <TransferOwnershipDialog
        member={transferMember}
        open={!!transferMember}
        onClose={() => setTransferMember(null)}
        onConfirm={handleTransfer}
      />
    </div>
  );
}

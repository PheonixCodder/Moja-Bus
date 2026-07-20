"use client";

import { startTransition, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { toast } from "sonner";
import type { PermissionKey } from "@moja/schemas";

import { StaffPageHeader } from "@/features/operator/components/staff/staff-page-header";
import { StaffFiltersToolbar } from "@/features/operator/components/staff/staff-filters-toolbar";
import { StaffMembersSection } from "@/features/operator/components/staff/staff-members-section";
import { StaffInvitationsSection } from "@/features/operator/components/staff/staff-invitations-section";
import { StaffActivitySection } from "@/features/operator/components/staff/staff-activity-section";
import { InviteSheet } from "@/features/operator/components/staff/invite-sheet";
import { RoleSheet } from "@/features/operator/components/staff/role-sheet";
import { EditPermissionsSheet } from "@/features/operator/components/staff/edit-permissions-sheet";
import { TransferOwnershipDialog } from "@/features/operator/components/staff/transfer-ownership-dialog";
import { RemoveStaffDialog } from "@/features/operator/components/staff/remove-staff-dialog";
import { useStaffPermissions } from "@/features/operator/hooks/use-staff-permissions";
import { useDebounce } from "@/features/operator/hooks/useDebounce";
import { staffParsers } from "@/features/operator/lib/staff-search-params";
import {
  STATUS_CONFIG,
  type StaffMember,
  type StaffInvitation,
  type StaffRole,
  type OperatorStatus,
  type ActivityLogEntry,
} from "@/features/operator/lib/staff";
import type { CreateInvitationInput } from "@/features/operator/lib/validations/staff";
import { useTRPC } from "@/trpc/client";

const PAGE_SIZE = 50;

export function OperatorStaffView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [params, setParams] = useQueryStates(staffParsers, {
    history: "replace",
    shallow: true,
  });
  const { q, role, status, page, invite, member: memberId } = params;

  const debouncedSearch = useDebounce(q, 300);

  const [roleSheetMember, setRoleSheetMember] = useState<StaffMember | null>(
    null,
  );
  const [permissionsMember, setPermissionsMember] =
    useState<StaffMember | null>(null);
  const [transferMember, setTransferMember] = useState<StaffMember | null>(
    null,
  );
  const [removeMember, setRemoveMember] = useState<StaffMember | null>(null);

  const { permissions: grantable, assignableRoles, can } = useStaffPermissions();

  const staffQuery = useQuery({
    ...trpc.staff.listStaff.queryOptions({
      search: debouncedSearch || undefined,
      role: role !== "ALL" ? (role as StaffRole) : undefined,
      status: status !== "ALL" ? (status as OperatorStatus) : undefined,
      page,
      limit: PAGE_SIZE,
    }),
    placeholderData: keepPreviousData,
  });

  const invitationsQuery = useQuery(
    trpc.staff.listInvitations.queryOptions({}),
  );
  const activityQuery = useQuery(
    trpc.staff.getActivityLog.queryOptions({ limit: 100 }),
  );
  const myPermissionsQuery = useQuery(
    trpc.staff.getMyPermissions.queryOptions(),
  );

  const members = (staffQuery.data?.members ?? []) as StaffMember[];
  const total = staffQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const invitations =
    ((invitationsQuery.data as { invitations?: StaffInvitation[] } | undefined)
      ?.invitations ?? []) as StaffInvitation[];
  const activityLog =
    ((activityQuery.data as { activities?: ActivityLogEntry[] } | undefined)
      ?.activities ?? []) as ActivityLogEntry[];
  const callerRole: StaffRole = myPermissionsQuery.data?.role ?? "SUPPORT";
  const pendingInvites = invitations.filter((i) => i.status === "PENDING");

  // Deep-link: ?member=<id> opens edit-permissions sheet
  useEffect(() => {
    if (!memberId || members.length === 0) return;
    const found = members.find((m) => m.id === memberId);
    if (found && found.role !== "OWNER") {
      setPermissionsMember(found);
    }
  }, [memberId, members]);

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

  const updatePermissionsMutation = useMutation(
    trpc.staff.updatePermissions.mutationOptions({
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

  const removeStaffMutation = useMutation(
    trpc.staff.removeStaff.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.staff.listStaff.pathFilter());
        queryClient.invalidateQueries(trpc.staff.getActivityLog.pathFilter());
        setRemoveMember(null);
      },
    }),
  );

  const transferOwnershipMutation = useMutation(
    trpc.staff.transferOwnership.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.staff.listStaff.pathFilter());
        queryClient.invalidateQueries(
          trpc.staff.getMyPermissions.pathFilter(),
        );
        queryClient.invalidateQueries(trpc.staff.getActivityLog.pathFilter());
      },
    }),
  );

  const requestTransferOtpMutation = useMutation(
    trpc.staff.requestTransferOtp.mutationOptions(),
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
        queryClient.invalidateQueries(trpc.staff.listInvitations.pathFilter());
        queryClient.invalidateQueries(trpc.staff.getActivityLog.pathFilter());
      },
    }),
  );

  function applyFilter(patch: Partial<typeof params>) {
    startTransition(() => {
      void setParams({ ...patch, page: 1 });
    });
  }

  async function handleInvite(payload: CreateInvitationInput) {
    try {
      await createInviteMutation.mutateAsync(payload);
      toast.success(`Invitation sent to ${payload.email}`);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to invite member",
      );
    }
  }

  async function handleRoleSave(
    id: string,
    nextRole: StaffRole,
    resetPermissions: boolean,
  ) {
    try {
      await updateRoleMutation.mutateAsync({
        memberId: id,
        role: nextRole,
        resetPermissions,
      });
      toast.success("Role updated successfully");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update role",
      );
      throw err;
    }
  }

  async function handlePermissionsSave(
    id: string,
    permissions: PermissionKey[],
  ) {
    try {
      await updatePermissionsMutation.mutateAsync({
        memberId: id,
        permissions,
      });
      toast.success("Permissions updated");
      void setParams({ member: "" });
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update permissions",
      );
      throw err;
    }
  }

  async function handleStatusChange(
    target: StaffMember,
    nextStatus: OperatorStatus,
  ) {
    try {
      await updateStatusMutation.mutateAsync({
        memberId: target.id,
        status: nextStatus,
      });
      toast.success(
        `${target.user.fullName} is now ${STATUS_CONFIG[nextStatus].label}`,
      );
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update status",
      );
    }
  }

  async function handleRemoveStaff() {
    if (!removeMember) return;
    try {
      await removeStaffMutation.mutateAsync({ memberId: removeMember.id });
      toast.success(
        `${removeMember.user.fullName} has been removed from the company`,
      );
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove staff member",
      );
    }
  }

  async function handleTransfer(id: string, otp: string) {
    try {
      await transferOwnershipMutation.mutateAsync({
        memberId: id,
        otp,
        confirmationText: "TRANSFER OWNERSHIP",
      });
      toast.success("Ownership transferred successfully");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to transfer ownership",
      );
      throw err;
    }
  }

  async function handleCancelInvite(inv: StaffInvitation) {
    try {
      await cancelInviteMutation.mutateAsync({ invitationId: inv.id });
      toast.success(`Invitation to ${inv.email} cancelled`);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to cancel invitation",
      );
    }
  }

  async function handleResendInvite(inv: StaffInvitation) {
    try {
      await resendInviteMutation.mutateAsync({ invitationId: inv.id });
      toast.success(`Invitation resent to ${inv.email}`);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to resend invitation",
      );
    }
  }

  const hasActiveFilters = q !== "" || role !== "ALL" || status !== "ALL";

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-bg-base">
      <StaffPageHeader
        canInvite={can("staff:invite")}
        onInvite={() => void setParams({ invite: true })}
      />

      <StaffFiltersToolbar
        search={q}
        role={role}
        status={status}
        isFetching={staffQuery.isFetching}
        onSearchChange={(value) => void setParams({ q: value, page: 1 })}
        onRoleChange={(value) => applyFilter({ role: value })}
        onStatusChange={(value) => applyFilter({ status: value })}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <StaffMembersSection
          members={members}
          total={total}
          page={page}
          totalPages={totalPages}
          isLoading={staffQuery.isLoading}
          isFetching={staffQuery.isFetching}
          isError={staffQuery.isError}
          hasActiveFilters={hasActiveFilters}
          canInvite={can("staff:invite")}
          canUpdate={can("staff:update")}
          callerRole={callerRole}
          onRetry={() => staffQuery.refetch()}
          onInvite={() => void setParams({ invite: true })}
          onPageChange={(next) => void setParams({ page: next })}
          onEditRole={setRoleSheetMember}
          onEditPermissions={(m) => {
            setPermissionsMember(m);
            void setParams({ member: m.id });
          }}
          onStatusChange={handleStatusChange}
          onTransfer={setTransferMember}
          onRemove={setRemoveMember}
        />

        <StaffInvitationsSection
          invitations={pendingInvites}
          onResend={handleResendInvite}
          onCancel={handleCancelInvite}
        />

        <StaffActivitySection activities={activityLog} />
      </div>

      <InviteSheet
        open={invite}
        onClose={() => void setParams({ invite: false })}
        onSend={handleInvite}
        grantable={grantable}
        assignableRoles={assignableRoles}
      />

      <RoleSheet
        member={roleSheetMember}
        open={!!roleSheetMember}
        onClose={() => setRoleSheetMember(null)}
        onSave={handleRoleSave}
        callerRole={callerRole}
        assignableRoles={assignableRoles}
      />

      <EditPermissionsSheet
        member={permissionsMember}
        open={!!permissionsMember}
        onClose={() => {
          setPermissionsMember(null);
          void setParams({ member: "" });
        }}
        onSave={handlePermissionsSave}
        grantable={grantable}
      />

      <TransferOwnershipDialog
        member={transferMember}
        open={!!transferMember}
        onClose={() => setTransferMember(null)}
        onConfirm={handleTransfer}
        onRequestOtp={async () => {
          await requestTransferOtpMutation.mutateAsync();
        }}
        otpPending={requestTransferOtpMutation.isPending}
      />

      <RemoveStaffDialog
        member={removeMember}
        pending={removeStaffMutation.isPending}
        onClose={() => setRemoveMember(null)}
        onConfirm={handleRemoveStaff}
      />
    </div>
  );
}

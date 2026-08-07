"use client";

import type { AdminPermissionKey } from "@moja/schemas";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";
import { startTransition, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminStaffActivitySection } from "@/features/admin/components/staff/admin-staff-activity-section";
import { AdminStaffFiltersToolbar } from "@/features/admin/components/staff/admin-staff-filters-toolbar";
import { AdminStaffInvitationsSection } from "@/features/admin/components/staff/admin-staff-invitations-section";
import { AdminStaffMembersSection } from "@/features/admin/components/staff/admin-staff-members-section";
import { AdminStaffPageHeader } from "@/features/admin/components/staff/admin-staff-page-header";
import { EditPermissionsSheet } from "@/features/admin/components/staff/edit-permissions-sheet";
import { InviteSheet } from "@/features/admin/components/staff/invite-sheet";
import { RemoveStaffDialog } from "@/features/admin/components/staff/remove-staff-dialog";
import { RoleSheet } from "@/features/admin/components/staff/role-sheet";
import { TransferOwnershipDialog } from "@/features/admin/components/staff/transfer-ownership-dialog";
import { useAdminPermissions } from "@/features/admin/hooks/use-admin-permissions";
import {
  ADMIN_STATUS_CONFIG,
  type AdminActivityLogEntry,
  type AdminStaffInvitation,
  type AdminStaffMember,
  type AdminStaffRole,
  type AdminStaffStatus,
} from "@/features/admin/lib/admin-staff";
import { adminStaffParsers } from "@/features/admin/lib/admin-staff-search-params";
import type { CreateAdminInvitationInput } from "@/features/admin/lib/validations/admin-staff";
import { useDebounce } from "@/features/operator/hooks/useDebounce";
import { useTRPC } from "@/trpc/client";

const PAGE_SIZE = 50;

export function AdminStaffView() {
  const t = useTranslations("adminDashboard.staff");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [params, setParams] = useQueryStates(adminStaffParsers, {
    history: "replace",
    shallow: true,
  });
  const { q, role, status, page, invite, member: memberId } = params;

  const debouncedSearch = useDebounce(q, 300);

  const [roleSheetMember, setRoleSheetMember] =
    useState<AdminStaffMember | null>(null);
  const [permissionsMember, setPermissionsMember] =
    useState<AdminStaffMember | null>(null);
  const [transferMember, setTransferMember] = useState<AdminStaffMember | null>(
    null,
  );
  const [removeMember, setRemoveMember] = useState<AdminStaffMember | null>(
    null,
  );

  const {
    permissions: grantable,
    assignableRoles,
    can,
  } = useAdminPermissions();

  const staffQuery = useQuery({
    ...trpc.adminStaff.listStaff.queryOptions({
      search: debouncedSearch || undefined,
      role: role !== "ALL" ? (role as AdminStaffRole) : undefined,
      status: status !== "ALL" ? (status as AdminStaffStatus) : undefined,
      page,
      limit: PAGE_SIZE,
    }),
    placeholderData: keepPreviousData,
  });

  const invitationsQuery = useQuery(
    trpc.adminStaff.listInvitations.queryOptions({}),
  );
  const activityQuery = useQuery(
    trpc.adminStaff.getActivityLog.queryOptions({ limit: 100 }),
  );

  const members = (staffQuery.data?.members ?? []) as AdminStaffMember[];
  const total = staffQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const invitations = ((
    invitationsQuery.data as
      | { invitations?: AdminStaffInvitation[] }
      | undefined
  )?.invitations ?? []) as AdminStaffInvitation[];
  const activityLog = ((
    activityQuery.data as { activities?: AdminActivityLogEntry[] } | undefined
  )?.activities ?? []) as AdminActivityLogEntry[];
  const pendingInvites = invitations.filter((i) => i.status === "PENDING");

  // Deep-link: ?member=<id> opens edit-permissions sheet
  useEffect(() => {
    if (!memberId || members.length === 0) return;
    if (!can("admin-staff:update")) return;
    const found = members.find((m) => m.id === memberId);
    if (found && found.role !== "SUPER_ADMIN") {
      setPermissionsMember(found);
    }
  }, [memberId, members, can]);

  const createInviteMutation = useMutation(
    trpc.adminStaff.createInvitation.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.adminStaff.listInvitations.pathFilter(),
        );
        queryClient.invalidateQueries(
          trpc.adminStaff.getActivityLog.pathFilter(),
        );
      },
    }),
  );

  const updateRoleMutation = useMutation(
    trpc.adminStaff.updateRole.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.adminStaff.listStaff.pathFilter());
        queryClient.invalidateQueries(
          trpc.adminStaff.getActivityLog.pathFilter(),
        );
      },
    }),
  );

  const updatePermissionsMutation = useMutation(
    trpc.adminStaff.updatePermissions.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.adminStaff.listStaff.pathFilter());
        queryClient.invalidateQueries(
          trpc.adminStaff.getActivityLog.pathFilter(),
        );
      },
    }),
  );

  const updateStatusMutation = useMutation(
    trpc.adminStaff.updateStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.adminStaff.listStaff.pathFilter());
        queryClient.invalidateQueries(
          trpc.adminStaff.getActivityLog.pathFilter(),
        );
      },
    }),
  );

  const removeStaffMutation = useMutation(
    trpc.adminStaff.removeStaff.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.adminStaff.listStaff.pathFilter());
        queryClient.invalidateQueries(
          trpc.adminStaff.getActivityLog.pathFilter(),
        );
        setRemoveMember(null);
      },
    }),
  );

  const transferOwnershipMutation = useMutation(
    trpc.adminStaff.transferOwnership.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.adminStaff.listStaff.pathFilter());
        queryClient.invalidateQueries(
          trpc.adminStaff.getMyPermissions.pathFilter(),
        );
        queryClient.invalidateQueries(
          trpc.adminStaff.getActivityLog.pathFilter(),
        );
      },
    }),
  );

  const requestTransferOtpMutation = useMutation(
    trpc.adminStaff.requestTransferOtp.mutationOptions(),
  );

  const cancelInviteMutation = useMutation(
    trpc.adminStaff.cancelInvitation.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.adminStaff.listInvitations.pathFilter(),
        );
        queryClient.invalidateQueries(
          trpc.adminStaff.getActivityLog.pathFilter(),
        );
      },
    }),
  );

  const resendInviteMutation = useMutation(
    trpc.adminStaff.resendInvitation.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.adminStaff.listInvitations.pathFilter(),
        );
        queryClient.invalidateQueries(
          trpc.adminStaff.getActivityLog.pathFilter(),
        );
      },
    }),
  );

  function applyFilter(patch: Partial<typeof params>) {
    startTransition(() => {
      void setParams({ ...patch, page: 1 });
    });
  }

  async function handleInvite(payload: CreateAdminInvitationInput) {
    try {
      await createInviteMutation.mutateAsync(payload);
      toast.success(t("toast.invitationSent", { email: payload.email }));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("toast.inviteFailed"));
    }
  }

  async function handleRoleSave(id: string, nextRole: AdminStaffRole) {
    try {
      await updateRoleMutation.mutateAsync({
        memberId: id,
        role: nextRole,
        resetPermissions: true,
      });
      toast.success(t("toast.roleUpdated"));
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : t("toast.roleUpdateFailed"),
      );
      throw err;
    }
  }

  async function handlePermissionsSave(
    id: string,
    permissions: AdminPermissionKey[],
  ) {
    try {
      await updatePermissionsMutation.mutateAsync({
        memberId: id,
        permissions,
      });
      toast.success(t("toast.permissionsUpdated"));
      void setParams({ member: "" });
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : t("toast.permissionsUpdateFailed"),
      );
      throw err;
    }
  }

  async function handleStatusChange(
    target: AdminStaffMember,
    nextStatus: AdminStaffStatus,
  ) {
    try {
      await updateStatusMutation.mutateAsync({
        memberId: target.id,
        status: nextStatus,
      });
      toast.success(
        t("toast.statusChanged", {
          name: target.user.fullName ?? "",
          status: ADMIN_STATUS_CONFIG[nextStatus].label,
        }),
      );
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : t("toast.statusUpdateFailed"),
      );
    }
  }

  async function handleRemoveStaff() {
    if (!removeMember) return;
    try {
      await removeStaffMutation.mutateAsync({ memberId: removeMember.id });
      toast.success(
        t("toast.removed", { name: removeMember.user.fullName ?? "" }),
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("toast.removeFailed"));
    }
  }

  async function handleTransfer(id: string, otp: string) {
    try {
      await transferOwnershipMutation.mutateAsync({
        memberId: id,
        otp,
        confirmationText: "TRANSFER OWNERSHIP",
      });
      toast.success(t("toast.ownershipTransferred"));
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : t("toast.ownershipTransferFailed"),
      );
      throw err;
    }
  }

  async function handleCancelInvite(inv: AdminStaffInvitation) {
    try {
      await cancelInviteMutation.mutateAsync({ invitationId: inv.id });
      toast.success(t("toast.invitationCancelled", { email: inv.email }));
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : t("toast.cancelInviteFailed"),
      );
    }
  }

  async function handleResendInvite(inv: AdminStaffInvitation) {
    try {
      await resendInviteMutation.mutateAsync({ invitationId: inv.id });
      toast.success(t("toast.invitationResent", { email: inv.email }));
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : t("toast.resendInviteFailed"),
      );
    }
  }

  const hasActiveFilters = q !== "" || role !== "ALL" || status !== "ALL";

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-bg-base">
      <AdminStaffPageHeader
        canInvite={can("admin-staff:invite")}
        onInvite={() => void setParams({ invite: true })}
      />

      <AdminStaffFiltersToolbar
        search={q}
        role={role}
        status={status}
        isFetching={staffQuery.isFetching}
        onSearchChange={(value) => void setParams({ q: value, page: 1 })}
        onRoleChange={(value) => applyFilter({ role: value })}
        onStatusChange={(value) => applyFilter({ status: value })}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <AdminStaffMembersSection
          members={members}
          total={total}
          page={page}
          totalPages={totalPages}
          isLoading={staffQuery.isLoading}
          isFetching={staffQuery.isFetching}
          isError={staffQuery.isError}
          hasActiveFilters={hasActiveFilters}
          canInvite={can("admin-staff:invite")}
          canUpdate={can("admin-staff:update")}
          canDelete={can("admin-staff:remove")}
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

        <AdminStaffInvitationsSection
          invitations={pendingInvites}
          onResend={handleResendInvite}
          onCancel={handleCancelInvite}
          canDelete={can("admin-staff:remove")}
        />

        <AdminStaffActivitySection activities={activityLog} />
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

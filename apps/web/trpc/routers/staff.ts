import { TRPCError } from "@trpc/server";
import { z } from "zod";
import crypto from "node:crypto";
import { getNovuClient } from "@/lib/novu";
import type { PrismaClient, Prisma } from "@moja/db";
import {
  ROLE_TEMPLATES,
  type StaffRole,
} from "@moja/schemas";
import {
  createTRPCRouter,
  operatorCompanyProcedure,
} from "../init";
import {
  requirePermission,
  requireCanGrant,
  requireOwner,
  getOperatorEffectivePermissions,
  type PermissionContext,
} from "@/lib/permissions/authorize";
import {
  canAssignRole,
  canModifyMember,
} from "@/lib/permissions/staff-hierarchy";
import {
  ListStaffSchema,
  UpdateRoleSchema,
  UpdatePermissionsSchema,
  UpdateStatusSchema,
  TransferOwnershipSchema,
  CreateInvitationSchema,
  InvitationIdSchema,
  RemoveStaffSchema,
  GetActivityLogSchema,
} from "@/features/operator/lib/validations/staff";

type Ctx = PermissionContext & {
  prisma: PrismaClient;
  companyId: string;
  user: { id: string; email: string; name?: string | null; role: string };
  operator: {
    id: string;
    role: string;
    permissions: string[];
    status: string;
    companyId: string;
    userId: string;
  };
};

const memberInclude = {
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      image: true,
      sessions: {
        orderBy: { createdAt: "desc" as const },
        take: 1,
        select: { createdAt: true },
      },
    },
  },
} as const;

async function logStaffActivity(
  prisma: PrismaClient,
  input: {
    companyId: string;
    userId: string;
    action: string;
    description: string;
    metadata?: Prisma.InputJsonValue;
  },
) {
  await prisma.activityLog.create({
    data: {
      companyId: input.companyId,
      userId: input.userId,
      action: input.action,
      description: input.description,
      ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
    },
  });
}

async function getTargetStaff(ctx: Ctx, memberId: string) {
  const target = await ctx.prisma.operator.findFirst({
    where: { id: memberId, companyId: ctx.companyId, deletedAt: null },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
    },
  });
  if (!target) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Staff member not found." });
  }
  return target;
}

function assertCanModifyTarget(ctx: Ctx, targetRole: string) {
  if (ctx.user.role === "ADMIN") return;
  if (targetRole === "OWNER") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Cannot modify or remove the company owner.",
    });
  }
  if (!canModifyMember(ctx.operator.role, targetRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Insufficient permissions to modify this staff member.",
    });
  }
}

export const staffRouter = createTRPCRouter({
  getMyPermissions: operatorCompanyProcedure.query(async ({ ctx }) => {
    const permissions = getOperatorEffectivePermissions(ctx.operator);
    return {
      role: ctx.operator.role as StaffRole,
      permissions,
      companyId: ctx.companyId,
      status: ctx.operator.status,
      isActive: ctx.operator.isActive,
    };
  }),

  /** @deprecated Use getMyPermissions */
  getMyRole: operatorCompanyProcedure.query(async ({ ctx }) => {
    const permissions = getOperatorEffectivePermissions(ctx.operator);
    return {
      role: ctx.operator.role,
      permissions,
      companyId: ctx.companyId,
      status: ctx.operator.status,
      isActive: ctx.operator.isActive,
    };
  }),

  listStaff: operatorCompanyProcedure
    .input(ListStaffSchema)
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "staff:read");

      const { search, role, status, page, limit } = input;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {
        companyId: ctx.companyId,
        deletedAt: null,
      };
      if (role) where["role"] = role;
      if (status) where["status"] = status;
      if (search) {
        where["OR"] = [
          { user: { fullName: { contains: search, mode: "insensitive" } } },
          { user: { email: { contains: search, mode: "insensitive" } } },
          { user: { phoneNumber: { contains: search, mode: "insensitive" } } },
          { jobTitle: { contains: search, mode: "insensitive" } },
        ];
      }

      const [members, total] = await Promise.all([
        ctx.prisma.operator.findMany({
          where,
          include: memberInclude,
          orderBy: { joinedAt: "asc" },
          skip,
          take: limit,
        }),
        ctx.prisma.operator.count({ where }),
      ]);

      const callerIsPrivileged =
        ctx.user.role === "ADMIN" ||
        ["OWNER", "ADMIN"].includes(ctx.operator.role);

      return {
        members: members.map((m) => ({
          id: m.id,
          profilePhotoUrl: m.profilePhotoUrl,
          role: m.role,
          status: m.status,
          jobTitle: m.jobTitle,
          isVerified: m.isVerified,
          isActive: m.isActive,
          joinedAt: m.joinedAt,
          permissions: m.permissions,
          user: m.user,
          personalPhone: callerIsPrivileged ? m.personalPhone : null,
          emergencyContactName: callerIsPrivileged ? m.emergencyContactName : null,
          emergencyContactPhone: callerIsPrivileged ? m.emergencyContactPhone : null,
          nationalIdNumber: callerIsPrivileged ? m.nationalIdNumber : null,
          nationalIdType: callerIsPrivileged ? m.nationalIdType : null,
          dateOfBirth: callerIsPrivileged ? m.dateOfBirth : null,
          lastLoginAt: m.user.sessions[0]?.createdAt ?? null,
          canModify:
            m.role !== "OWNER" &&
            (ctx.user.role === "ADMIN" ||
              canModifyMember(ctx.operator.role, m.role)),
        })),
        total,
        page,
        limit,
        hasMore: skip + limit < total,
        currentUserRole: ctx.operator.role,
      };
    }),

  updatePermissions: operatorCompanyProcedure
    .input(UpdatePermissionsSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "staff:update");
      requireCanGrant(ctx, input.permissions);

      const target = await getTargetStaff(ctx, input.memberId);
      assertCanModifyTarget(ctx, target.role);

      const previous = [...target.permissions];
      const updated = await ctx.prisma.operator.update({
        where: { id: target.id },
        data: {
          permissions: input.permissions,
          permissionsUpdatedAt: new Date(),
          permissionsUpdatedBy: ctx.user.id,
        },
        include: memberInclude,
      });

      await logStaffActivity(ctx.prisma, {
        companyId: ctx.companyId,
        userId: ctx.user.id,
        action: "PERMISSIONS_CHANGED",
        description: `Updated permissions for ${target.user.fullName ?? target.user.email}.${input.reason ? ` Reason: ${input.reason}` : ""}`,
        metadata: {
          targetUserId: target.userId,
          previous,
          next: input.permissions,
          reason: input.reason,
        },
      });

      return updated;
    }),

  updateRole: operatorCompanyProcedure
    .input(UpdateRoleSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "staff:update");

      const target = await getTargetStaff(ctx, input.memberId);
      assertCanModifyTarget(ctx, target.role);

      if (!canAssignRole(ctx.operator.role, input.role) && ctx.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Cannot assign ${input.role} role.`,
        });
      }

      if (input.role === "ADMIN" && ctx.operator.role !== "OWNER" && ctx.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only company owners can assign ADMIN roles.",
        });
      }

      // Always reset permissions to the target role template (prevents privilege retention)
      const nextPermissions = ROLE_TEMPLATES[input.role as StaffRole];
      requireCanGrant(ctx, nextPermissions);

      const updated = await ctx.prisma.operator.update({
        where: { id: target.id },
        data: {
          role: input.role,
          permissions: nextPermissions,
          permissionsUpdatedAt: new Date(),
          permissionsUpdatedBy: ctx.user.id,
        },
        include: memberInclude,
      });

      await logStaffActivity(ctx.prisma, {
        companyId: ctx.companyId,
        userId: ctx.user.id,
        action: "ROLE_CHANGED",
        description: `Changed ${target.user.fullName} role from ${target.role} to ${input.role}.${input.reason ? ` Reason: ${input.reason}` : ""}`,
        metadata: {
          targetUserId: target.userId,
          previousRole: target.role,
          newRole: input.role,
          resetPermissions: true,
          reason: input.reason,
        },
      });

      return updated;
    }),

  updateStatus: operatorCompanyProcedure
    .input(UpdateStatusSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "staff:update");

      const target = await getTargetStaff(ctx, input.memberId);
      assertCanModifyTarget(ctx, target.role);

      if (input.status === "SUSPENDED" && target.role === "OWNER") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot suspend the company owner.",
        });
      }

      const updated = await ctx.prisma.operator.update({
        where: { id: target.id },
        data: {
          status: input.status,
          isActive: input.status === "ACTIVE",
        },
        include: memberInclude,
      });

      await logStaffActivity(ctx.prisma, {
        companyId: ctx.companyId,
        userId: ctx.user.id,
        action: "STATUS_CHANGED",
        description: `Changed ${target.user.fullName} status from ${target.status} to ${input.status}.${input.reason ? ` Reason: ${input.reason}` : ""}`,
        metadata: {
          targetUserId: target.userId,
          previousStatus: target.status,
          newStatus: input.status,
          reason: input.reason,
        },
      });

      return updated;
    }),

  removeStaff: operatorCompanyProcedure
    .input(RemoveStaffSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "staff:remove");

      const target = await getTargetStaff(ctx, input.memberId);
      assertCanModifyTarget(ctx, target.role);

      if (target.userId === ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot remove yourself from the company.",
        });
      }

      await ctx.prisma.$transaction(async (tx) => {
        await tx.operator.update({
          where: { id: target.id },
          data: {
            deletedAt: new Date(),
            isActive: false,
            status: "INACTIVE",
          },
        });

        await tx.activityLog.create({
          data: {
            companyId: ctx.companyId,
            userId: ctx.user.id,
            action: "MEMBER_REMOVED",
            description: `Removed ${target.user.fullName} from the company.${input.reason ? ` Reason: ${input.reason}` : ""}`,
            metadata: {
              targetUserId: target.userId,
              targetRole: target.role,
              reason: input.reason,
            },
          },
        });
      });

      return { success: true };
    }),

  requestTransferOtp: operatorCompanyProcedure.mutation(async ({ ctx }) => {
    requireOwner(ctx);

    const recentOtp = await ctx.prisma.verification.findFirst({
      where: {
        identifier: `transfer-ownership:${ctx.user.email}`,
        createdAt: { gte: new Date(Date.now() - 2 * 60 * 1000) },
      },
    });
    if (recentOtp) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Please wait 2 minutes before requesting another verification code.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const identifier = `transfer-ownership:${ctx.user.email}`;

    await ctx.prisma.$transaction([
      ctx.prisma.verification.deleteMany({ where: { identifier } }),
      ctx.prisma.verification.create({
        data: {
          id: crypto.randomUUID(),
          identifier,
          value: hashedOtp,
          expiresAt,
        },
      }),
    ]);

    await logStaffActivity(ctx.prisma, {
      companyId: ctx.companyId,
      userId: ctx.user.id,
      action: "OWNERSHIP_TRANSFER_OTP_REQUESTED",
      description: "Requested verification code for ownership transfer",
    });

    const novu = getNovuClient();
    if (novu) {
      try {
        await novu.trigger({
          workflowId: "auth-otp",
          to: { subscriberId: ctx.user.email, email: ctx.user.email },
          payload: {
            identifier: ctx.user.email,
            otpCode: otp,
            type: "transfer-ownership",
            email: ctx.user.email,
          },
          transactionId: `transfer-ownership-otp-${ctx.user.id}-${Date.now()}`,
        });
      } catch (err) {
        console.error("Failed to send transfer OTP:", err);
      }
    } else {
      console.log(`\n=== OTP for ${ctx.user.email}: ${otp} ===\n`);
    }

    return { success: true };
  }),

  transferOwnership: operatorCompanyProcedure
    .input(TransferOwnershipSchema)
    .mutation(async ({ ctx, input }) => {
      requireOwner(ctx);

      if (input.confirmationText !== "TRANSFER OWNERSHIP") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: 'Please type "TRANSFER OWNERSHIP" to confirm.',
        });
      }

      const identifier = `transfer-ownership:${ctx.user.email}`;
      const record = await ctx.prisma.verification.findFirst({
        where: { identifier },
        orderBy: { createdAt: "desc" },
      });
      if (!record) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No verification code found. Please request a new code.",
        });
      }
      if (record.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Verification code has expired.",
        });
      }

      const hashedInputOtp = crypto.createHash("sha256").update(input.otp).digest("hex");
      if (record.value !== hashedInputOtp) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid verification code." });
      }

      const target = await getTargetStaff(ctx, input.memberId);
      if (target.role === "OWNER") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Target is already the owner." });
      }
      if (target.status !== "ACTIVE") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Target must be an active member." });
      }

      const currentOwner = await ctx.prisma.operator.findFirst({
        where: {
          userId: ctx.user.id,
          companyId: ctx.companyId,
          role: "OWNER",
          deletedAt: null,
        },
        include: { user: { select: { fullName: true } } },
      });
      if (!currentOwner) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Current owner record not found." });
      }

      await ctx.prisma.$transaction([
        ctx.prisma.verification.delete({ where: { id: record.id } }),
        ctx.prisma.operator.update({
          where: { id: currentOwner.id },
          data: {
            role: "ADMIN",
            permissions: ROLE_TEMPLATES.ADMIN,
            permissionsUpdatedAt: new Date(),
            permissionsUpdatedBy: ctx.user.id,
          },
        }),
        ctx.prisma.operator.update({
          where: { id: target.id },
          data: {
            role: "OWNER",
            permissions: [],
            permissionsUpdatedAt: new Date(),
            permissionsUpdatedBy: ctx.user.id,
          },
        }),
        ctx.prisma.activityLog.create({
          data: {
            companyId: ctx.companyId,
            userId: ctx.user.id,
            action: "OWNERSHIP_TRANSFERRED",
            description: `Transferred ownership from ${currentOwner.user.fullName} to ${target.user.fullName}.`,
            metadata: {
              previousOwnerId: currentOwner.userId,
              newOwnerId: target.userId,
            },
          },
        }),
      ]);

      return {
        success: true,
        message: `Ownership transferred to ${target.user.fullName}`,
        newOwner: {
          id: target.id,
          name: target.user.fullName,
          email: target.user.email,
        },
      };
    }),

  listInvitations: operatorCompanyProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "ACCEPTED", "CANCELLED", "EXPIRED"]).optional(),
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "staff:read");

      const where: Record<string, unknown> = { companyId: ctx.companyId };
      if (input.status) where["status"] = input.status;

      const [invitations, total] = await Promise.all([
        ctx.prisma.staffInvitation.findMany({
          where,
          include: {
            invitedBy: { select: { fullName: true, email: true } },
            acceptedBy: { select: { fullName: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.prisma.staffInvitation.count({ where }),
      ]);

      return {
        invitations: invitations.map((inv) => ({
          ...inv,
          isExpired: inv.expiresAt < new Date(),
          daysUntilExpiry:
            inv.status === "PENDING"
              ? Math.ceil((inv.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null,
        })),
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  createInvitation: operatorCompanyProcedure
    .input(CreateInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "staff:invite");
      requireCanGrant(ctx, input.permissions);

      if (!canAssignRole(ctx.operator.role, input.role) && ctx.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Cannot invite staff with ${input.role} role.`,
        });
      }

      if (input.role === "ADMIN" && ctx.operator.role !== "OWNER" && ctx.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only company owners can invite ADMIN staff.",
        });
      }

      const existingUser = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });
      if (existingUser) {
        const existingOp = await ctx.prisma.operator.findFirst({
          where: {
            userId: existingUser.id,
            companyId: ctx.companyId,
            deletedAt: null,
          },
        });
        if (existingOp) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "User is already a member of this company.",
          });
        }
      }

      const pendingInvite = await ctx.prisma.staffInvitation.findFirst({
        where: {
          email: input.email,
          companyId: ctx.companyId,
          status: "PENDING",
          expiresAt: { gte: new Date() },
        },
      });
      if (pendingInvite) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A pending invitation already exists for this email.",
        });
      }

      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentCount = await ctx.prisma.staffInvitation.count({
        where: { companyId: ctx.companyId, createdAt: { gte: hourAgo } },
      });
      if (recentCount >= 10) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many invitations sent recently.",
        });
      }

      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + input.expiryDays * 24 * 60 * 60 * 1000);

      const invitation = await ctx.prisma.staffInvitation.create({
        data: {
          companyId: ctx.companyId,
          email: input.email,
          role: input.role,
          permissions: input.permissions,
          jobTitle: input.jobTitle ?? null,
          message: input.message ?? null,
          token: hashedToken,
          expiresAt,
          invitedById: ctx.user.id,
        },
        include: {
          invitedBy: { select: { fullName: true, email: true } },
          company: { select: { name: true } },
        },
      });

      await logStaffActivity(ctx.prisma, {
        companyId: ctx.companyId,
        userId: ctx.user.id,
        action: "INVITATION_SENT",
        description: `Invited ${invitation.email} as ${invitation.role}.`,
        metadata: {
          inviteeEmail: invitation.email,
          role: invitation.role,
          permissions: input.permissions,
          invitationId: invitation.id,
        },
      });

      const appUrl = process.env["APP_URL"] || "http://localhost:3000";
      const inviteUrl = `${appUrl}/invite?token=${rawToken}`;
      const expiresAtFormatted = invitation.expiresAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const novu = getNovuClient();
      if (novu) {
        try {
          await novu.trigger({
            workflowId: "operator-staff-invite",
            to: { subscriberId: invitation.email, email: invitation.email },
            payload: {
              email: invitation.email,
              companyName: invitation.company.name,
              inviterName: invitation.invitedBy.fullName ?? "A team member",
              inviterEmail: invitation.invitedBy.email,
              role: invitation.role,
              jobTitle: invitation.jobTitle,
              inviteUrl,
              expiresAt: expiresAtFormatted,
              message: invitation.message,
            },
            transactionId: `operator-staff-invite-${invitation.id}`,
          });
        } catch (err) {
          console.error("[NOVU] Failed to trigger operator-staff-invite:", err);
        }
      } else {
        console.log(`\n=== Staff Invitation: ${inviteUrl} ===\n`);
      }

      // H21: Never return inviteUrl in the API response.
      // The token is delivered exclusively via Novu email.
      // In dev (no Novu configured), the URL is printed to server stdout only.
      return {
        success: true,
        invitationId: invitation.id,
        invitedEmail: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      };
    }),

  cancelInvitation: operatorCompanyProcedure
    .input(InvitationIdSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "staff:invite");

      const invite = await ctx.prisma.staffInvitation.findFirst({
        where: { id: input.invitationId, companyId: ctx.companyId },
        include: { invitedBy: { select: { fullName: true } } },
      });
      if (!invite) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found." });
      }
      if (invite.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot cancel ${invite.status.toLowerCase()} invitation.`,
        });
      }

      const canCancel =
        ctx.operator.role === "OWNER" ||
        ctx.operator.role === "ADMIN" ||
        invite.invitedById === ctx.user.id ||
        ctx.user.role === "ADMIN";
      if (!canCancel) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Can only cancel invitations you sent or have admin privileges.",
        });
      }

      await ctx.prisma.staffInvitation.update({
        where: { id: invite.id },
        data: { status: "CANCELLED" },
      });

      await logStaffActivity(ctx.prisma, {
        companyId: ctx.companyId,
        userId: ctx.user.id,
        action: "INVITATION_CANCELLED",
        description: `Cancelled invitation for ${invite.email}.${input.reason ? ` Reason: ${input.reason}` : ""}`,
        metadata: { inviteeEmail: invite.email, reason: input.reason },
      });

      return { success: true };
    }),

  resendInvitation: operatorCompanyProcedure
    .input(
      InvitationIdSchema.extend({
        extendExpiry: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "staff:invite");

      const invite = await ctx.prisma.staffInvitation.findFirst({
        where: { id: input.invitationId, companyId: ctx.companyId },
        include: {
          invitedBy: { select: { fullName: true, email: true } },
          company: { select: { name: true } },
        },
      });
      if (!invite) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found." });
      }
      if (invite.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot resend ${invite.status.toLowerCase()} invitation.`,
        });
      }

      const resendCount = await ctx.prisma.activityLog.count({
        where: {
          companyId: ctx.companyId,
          action: "INVITATION_RESENT",
          description: { contains: invite.email },
        },
      });
      if (resendCount >= 3) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Maximum resend limit reached for this invitation.",
        });
      }

      const newExpiresAt = input.extendExpiry
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        : invite.expiresAt;
      const newRawToken = crypto.randomBytes(32).toString("hex");
      const newHashedToken = crypto.createHash("sha256").update(newRawToken).digest("hex");

      const updated = await ctx.prisma.staffInvitation.update({
        where: { id: invite.id },
        data: { expiresAt: newExpiresAt, token: newHashedToken },
        include: {
          invitedBy: { select: { fullName: true, email: true } },
          company: { select: { name: true } },
        },
      });

      await logStaffActivity(ctx.prisma, {
        companyId: ctx.companyId,
        userId: ctx.user.id,
        action: "INVITATION_RESENT",
        description: `Resent invitation to ${invite.email}.`,
        metadata: { inviteeEmail: invite.email, resendCount: resendCount + 1 },
      });

      const appUrl = process.env["APP_URL"] || "http://localhost:3000";
      const inviteUrl = `${appUrl}/invite?token=${newRawToken}`;

      const novu = getNovuClient();
      if (novu) {
        try {
          await novu.trigger({
            workflowId: "operator-staff-invite",
            to: { subscriberId: updated.email, email: updated.email },
            payload: {
              email: updated.email,
              companyName: updated.company.name,
              inviterName: updated.invitedBy.fullName ?? "A team member",
              inviterEmail: updated.invitedBy.email,
              role: updated.role,
              jobTitle: updated.jobTitle,
              inviteUrl,
              expiresAt: updated.expiresAt.toLocaleDateString("en-US"),
              message: updated.message,
              isResend: true,
            },
            transactionId: `operator-staff-invite-resend-${updated.id}-${resendCount}`,
          });
        } catch (err) {
          console.error("[NOVU] Failed to resend invitation:", err);
        }
      }

      return {
        ...updated,
        resendCount: resendCount + 1,
        newInviteUrl:
          process.env["NODE_ENV"] === "production" ? undefined : inviteUrl,
      };
    }),

  getActivityLog: operatorCompanyProcedure
    .input(GetActivityLogSchema)
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "staff:read");

      const where: Record<string, unknown> = { companyId: ctx.companyId };
      if (input.action) where["action"] = input.action;
      if (input.userId) where["userId"] = input.userId;

      const [activities, total] = await Promise.all([
        ctx.prisma.activityLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
          include: {
            user: { select: { fullName: true, image: true, email: true } },
          },
        }),
        ctx.prisma.activityLog.count({ where }),
      ]);

      return {
        activities: activities.map((activity) => ({
          ...activity,
          parsedMetadata: activity.metadata
            ? (() => {
                try {
                  return JSON.parse(activity.metadata as string);
                } catch {
                  return null;
                }
              })()
            : null,
        })),
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  getPermissionCatalog: operatorCompanyProcedure.query(async ({ ctx }) => {
    requirePermission(ctx, "staff:invite");
    const grantable = getOperatorEffectivePermissions(ctx.operator);
    return {
      grantable,
      templates: ROLE_TEMPLATES,
      role: ctx.operator.role,
    };
  }),
});

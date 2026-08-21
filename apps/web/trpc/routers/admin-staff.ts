import crypto from "node:crypto";
import type { Prisma, PrismaClient } from "@moja/db";
import {
  ADMIN_ROLE_TEMPLATES,
  type AdminStaffRole,
  getAdminTemplatePermissions,
} from "@moja/schemas";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  AdminInvitationIdSchema,
  CreateAdminInvitationSchema,
  GetAdminActivityLogSchema,
  ListAdminStaffSchema,
  RemoveAdminStaffSchema,
  ResendAdminInvitationSchema,
  TransferAdminOwnershipSchema,
  UpdateAdminPermissionsSchema,
  UpdateAdminRoleSchema,
  UpdateAdminStatusSchema,
} from "@/features/admin/lib/validations/admin-staff";
import { getNovuClient } from "@/lib/novu";
import { createRateLimiter } from "@/lib/rate-limit";
import {
  type AdminPermissionContext,
  adminHasPermission,
  getAdminEffectivePermissionsFn,
  requireAdminCanGrant,
  requireAdminPermission,
  requireSuperAdmin,
} from "@/lib/permissions/admin-authorize";
import {
  canAssignAdminRole,
  canModifyAdminMember,
} from "@/lib/permissions/admin-staff-hierarchy";
import {
  adminStaffProcedure,
  createTRPCRouter,
  publicProcedure,
} from "../init";

const validateAdminTokenLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
});

type Ctx = AdminPermissionContext & {
  prisma: PrismaClient;
  user: { id: string; email: string; name?: string | null; role: string };
  adminStaff: {
    id: string;
    role: string;
    permissions: string[];
    status: string;
    userId: string;
  };
};

const memberInclude = {
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      image: true,
      sessions: {
        orderBy: { createdAt: "desc" as const },
        take: 1,
        select: { createdAt: true },
      },
    },
  },
} as const;

async function logAdminStaffActivity(
  prisma: PrismaClient,
  input: {
    userId: string;
    action: string;
    description: string;
    metadata?: Prisma.InputJsonValue;
    targetUserId?: string;
  },
) {
  await prisma.adminStaffActivityLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      description: input.description,
      ...(input.targetUserId !== undefined
        ? { targetUserId: input.targetUserId }
        : {}),
      ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
    },
  });
}

async function getTargetAdminStaff(ctx: Ctx, memberId: string) {
  const target = await ctx.prisma.adminStaff.findUnique({
    where: { id: memberId },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
    },
  });
  if (!target || target.deletedAt) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Admin staff member not found.",
    });
  }
  return target;
}

function assertCanModifyAdminTarget(ctx: Ctx, targetRole: string) {
  if (targetRole === "SUPER_ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Cannot modify a Super Admin.",
    });
  }
  if (!canModifyAdminMember(ctx.adminStaff.role, targetRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Insufficient permissions to modify this admin staff member.",
    });
  }
}

function assertCanAssignAdminRole(ctx: Ctx, targetRole: string) {
  if (!canAssignAdminRole(ctx.adminStaff.role, targetRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Cannot assign ${targetRole} role.`,
    });
  }
}

export const adminStaffRouter = createTRPCRouter({
  /**
   * PUBLIC — validate an admin-staff invitation token and return its details.
   * No authentication required; used to render the `/admin/invite` landing page.
   * Never returns the raw (or hashed) token.
   */
  validateToken: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const forwarded = ctx.headers.get("x-forwarded-for");
      const ip =
        forwarded?.split(",")[0]?.trim() ||
        ctx.headers.get("x-real-ip") ||
        "unknown";
      const limit = validateAdminTokenLimiter(`admin-val:${ip}`);
      if (!limit.ok) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many attempts. Please try again shortly.",
        });
      }

      const hashedToken = crypto
        .createHash("sha256")
        .update(input.token)
        .digest("hex");

      const invitation = await ctx.prisma.adminStaffInvitation.findUnique({
        where: { token: hashedToken },
        select: {
          id: true,
          email: true,
          role: true,
          jobTitle: true,
          message: true,
          expiresAt: true,
          status: true,
          invitedBy: { select: { fullName: true } },
        },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This invitation link is invalid or has expired.",
        });
      }

      if (invitation.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            invitation.status === "ACCEPTED"
              ? "This invitation has already been accepted."
              : "This invitation has been cancelled or has expired.",
        });
      }

      if (new Date(invitation.expiresAt) < new Date()) {
        await ctx.prisma.adminStaffInvitation.update({
          where: { token: hashedToken },
          data: { status: "EXPIRED" },
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "This invitation has expired. Please ask the sender for a new one.",
        });
      }

      return invitation;
    }),

  /**
   * PUBLIC — accept an admin-staff invitation.
   * If the invitee is not signed in, returns `requiresAuth` so the client
   * completes an OTP sign-in (creating the account if needed) with the token
   * preserved, then calls this again. On acceptance the user's role is set to
   * ADMIN and a live AdminStaff profile is created from the invitation.
   */
  accept: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const hashedToken = crypto
        .createHash("sha256")
        .update(input.token)
        .digest("hex");

      const invitation = await ctx.prisma.adminStaffInvitation.findUnique({
        where: { token: hashedToken },
        include: {
          invitedBy: { select: { fullName: true, email: true } },
        },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found.",
        });
      }
      if (invitation.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation is no longer valid.",
        });
      }
      if (new Date(invitation.expiresAt) < new Date()) {
        await ctx.prisma.adminStaffInvitation.update({
          where: { token: hashedToken },
          data: { status: "EXPIRED" },
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has expired.",
        });
      }

      if (!ctx.user) {
        return {
          requiresAuth: true as const,
          email: invitation.email,
        };
      }

      if (ctx.user.email !== invitation.email) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `This invitation was sent to ${invitation.email}. Please sign in with that account.`,
        });
      }

      const userId = ctx.user.id;
      const userName = ctx.user.name ?? "A new member";

      const existingStaff = await ctx.prisma.adminStaff.findUnique({
        where: { userId },
      });

      // Copy invitation permissions; fall back to the role template if the set
      // is empty (legacy invitations persisted before perms were included).
      const grantedPermissions =
        invitation.permissions.length > 0
          ? invitation.permissions
          : getAdminTemplatePermissions(invitation.role);

      await ctx.prisma.$transaction([
        ctx.prisma.user.update({
          where: { id: userId },
          data: {
            emailVerified: true,
            role: "ADMIN",
          },
        }),
        existingStaff
          ? ctx.prisma.adminStaff.update({
              where: { id: existingStaff.id },
              data: {
                role: invitation.role,
                permissions: grantedPermissions,
                permissionsUpdatedAt: new Date(),
                status: "ACTIVE",
                isActive: true,
                deletedAt: null,
                jobTitle: invitation.jobTitle ?? existingStaff.jobTitle,
              },
            })
          : ctx.prisma.adminStaff.create({
              data: {
                userId,
                role: invitation.role,
                permissions: grantedPermissions,
                permissionsUpdatedAt: new Date(),
                status: "ACTIVE",
                isActive: true,
                jobTitle: invitation.jobTitle ?? null,
              },
            }),
        ctx.prisma.adminStaffInvitation.update({
          where: { token: hashedToken },
          data: {
            status: "ACCEPTED",
            acceptedById: userId,
            acceptedAt: new Date(),
          },
        }),
        ctx.prisma.adminStaffActivityLog.create({
          data: {
            userId,
            action: "INVITATION_ACCEPTED",
            description: `${userName} accepted their invitation as ${invitation.role}.`,
            metadata: {
              email: invitation.email,
              role: invitation.role,
              permissions: grantedPermissions,
              invitationId: invitation.id,
            },
          },
        }),
      ]);

      // Trigger Novu acceptance alert to the inviter
      const novu = getNovuClient();
      if (novu) {
        try {
          await novu.trigger({
            workflowId: "admin-staff-acceptance-alert",
            to: {
              subscriberId: invitation.invitedBy?.email ?? invitation.email,
              email: invitation.invitedBy?.email ?? invitation.email,
            },
            payload: {
              staffName: userName,
              staffEmail: invitation.email,
              role: invitation.role,
            },
            transactionId: `admin-staff-acceptance-${invitation.id}-${userId}`,
          });
          console.log(
            `[NOVU] Triggered admin-staff-acceptance-alert for inviter ${invitation.invitedById}`,
          );
        } catch (err) {
          console.error(
            "[NOVU] Failed to trigger admin-staff-acceptance-alert workflow:",
            err,
          );
        }
      }

      return { success: true };
    }),

  getMyPermissions: adminStaffProcedure.query(async ({ ctx }) => {
    const permissions = getAdminEffectivePermissionsFn(ctx.adminStaff);
    return {
      role: ctx.adminStaff.role as AdminStaffRole,
      permissions,
      status: ctx.adminStaff.status,
      isActive: ctx.adminStaff.isActive,
    };
  }),

  listStaff: adminStaffProcedure
    .input(ListAdminStaffSchema)
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "admin-staff:read");

      const { search, role, status, page, limit } = input;
      const skip = (page - 1) * limit;

      const where: Prisma.AdminStaffWhereInput = { deletedAt: null };
      if (role) where.role = role;
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { user: { fullName: { contains: search, mode: "insensitive" } } },
          { user: { email: { contains: search, mode: "insensitive" } } },
          { jobTitle: { contains: search, mode: "insensitive" } },
          { department: { contains: search, mode: "insensitive" } },
        ];
      }

      const [members, total] = await Promise.all([
        ctx.prisma.adminStaff.findMany({
          where,
          include: memberInclude,
          orderBy: { joinedAt: "asc" },
          skip,
          take: limit,
        }),
        ctx.prisma.adminStaff.count({ where }),
      ]);

      const canViewSensitive = adminHasPermission(ctx, "admin-staff:update");

      return {
        members: members.map((m) => ({
          id: m.id,
          profilePhotoUrl: m.profilePhotoUrl,
          role: m.role,
          status: m.status,
          jobTitle: m.jobTitle,
          department: m.department,
          isActive: m.isActive,
          joinedAt: m.joinedAt,
          ...(canViewSensitive
            ? {
                permissions: m.permissions,
                user: {
                  ...m.user,
                  phone: m.user.phoneNumber,
                },
                lastLoginAt: m.user.sessions[0]?.createdAt ?? null,
              }
            : {
                user: {
                  id: m.user.id,
                  fullName: m.user.fullName,
                  email: m.user.email,
                  image: m.user.image,
                },
              }),
          canModify:
            m.role !== "SUPER_ADMIN" &&
            canModifyAdminMember(ctx.adminStaff.role, m.role),
        })),
        total,
        page,
        limit,
        hasMore: skip + limit < total,
        currentUserRole: ctx.adminStaff.role,
      };
    }),

  getStaffMember: adminStaffProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "admin-staff:read");

      const target = await getTargetAdminStaff(ctx, input.id);
      return {
        id: target.id,
        profilePhotoUrl: target.profilePhotoUrl,
        role: target.role,
        status: target.status,
        jobTitle: target.jobTitle,
        department: target.department,
        isActive: target.isActive,
        joinedAt: target.joinedAt,
        permissions: target.permissions,
        permissionsUpdatedAt: target.permissionsUpdatedAt,
        permissionsUpdatedBy: target.permissionsUpdatedBy,
        user: {
          id: target.user.id,
          fullName: target.user.fullName,
          email: target.user.email,
        },
      };
    }),

  updatePermissions: adminStaffProcedure
    .input(UpdateAdminPermissionsSchema)
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "admin-staff:update");
      requireAdminCanGrant(ctx, input.permissions);

      const target = await getTargetAdminStaff(ctx, input.memberId);
      assertCanModifyAdminTarget(ctx, target.role);

      const previous = [...target.permissions];
      const updated = await ctx.prisma.adminStaff.update({
        where: { id: target.id },
        data: {
          permissions: input.permissions,
          permissionsUpdatedAt: new Date(),
          permissionsUpdatedBy: ctx.user.id,
        },
        include: memberInclude,
      });

      await logAdminStaffActivity(ctx.prisma, {
        userId: ctx.user.id,
        action: "PERMISSIONS_CHANGED",
        description: `Updated permissions for ${target.user.fullName ?? target.user.email}.${input.reason ? ` Reason: ${input.reason}` : ""}`,
        targetUserId: target.userId,
        metadata: {
          targetUserId: target.userId,
          previous,
          next: input.permissions,
          reason: input.reason,
        },
      });

      return updated;
    }),

  updateRole: adminStaffProcedure
    .input(UpdateAdminRoleSchema)
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "admin-staff:update");

      const target = await getTargetAdminStaff(ctx, input.memberId);
      assertCanModifyAdminTarget(ctx, target.role);
      assertCanAssignAdminRole(ctx, input.role);

      // Always reset permissions to the target role template (prevents privilege retention)
      const nextPermissions = getAdminTemplatePermissions(input.role);
      requireAdminCanGrant(ctx, nextPermissions);

      const updated = await ctx.prisma.adminStaff.update({
        where: { id: target.id },
        data: {
          role: input.role,
          permissions: nextPermissions,
          permissionsUpdatedAt: new Date(),
          permissionsUpdatedBy: ctx.user.id,
        },
        include: memberInclude,
      });

      await logAdminStaffActivity(ctx.prisma, {
        userId: ctx.user.id,
        action: "ROLE_CHANGED",
        description: `Changed ${target.user.fullName} role from ${target.role} to ${input.role}.${input.reason ? ` Reason: ${input.reason}` : ""}`,
        targetUserId: target.userId,
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

  updateStatus: adminStaffProcedure
    .input(UpdateAdminStatusSchema)
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "admin-staff:update");

      const target = await getTargetAdminStaff(ctx, input.memberId);
      assertCanModifyAdminTarget(ctx, target.role);

      if (input.status === "SUSPENDED" && target.role === "SUPER_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot suspend a Super Admin.",
        });
      }

      if (input.status === "SUSPENDED") {
        await ctx.prisma.session.deleteMany({
          where: { userId: target.userId },
        });
      }

      const updated = await ctx.prisma.adminStaff.update({
        where: { id: target.id },
        data: {
          status: input.status,
          isActive: input.status === "ACTIVE",
        },
        include: memberInclude,
      });

      await logAdminStaffActivity(ctx.prisma, {
        userId: ctx.user.id,
        action: "STATUS_CHANGED",
        description: `Changed ${target.user.fullName} status from ${target.status} to ${input.status}.${input.reason ? ` Reason: ${input.reason}` : ""}`,
        targetUserId: target.userId,
        metadata: {
          targetUserId: target.userId,
          previousStatus: target.status,
          newStatus: input.status,
          reason: input.reason,
        },
      });

      return updated;
    }),

  removeStaff: adminStaffProcedure
    .input(RemoveAdminStaffSchema)
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "admin-staff:remove");

      const target = await getTargetAdminStaff(ctx, input.memberId);
      assertCanModifyAdminTarget(ctx, target.role);

      if (target.userId === ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot remove yourself from the admin team.",
        });
      }

      await ctx.prisma.$transaction(async (tx) => {
        await tx.adminStaff.update({
          where: { id: target.id },
          data: {
            deletedAt: new Date(),
            isActive: false,
            status: "INACTIVE",
          },
        });

        await tx.session.deleteMany({
          where: { userId: target.userId },
        });

        await tx.adminStaffActivityLog.create({
          data: {
            userId: ctx.user.id,
            action: "MEMBER_REMOVED",
            description: `Removed ${target.user.fullName} from the admin team.${input.reason ? ` Reason: ${input.reason}` : ""}`,
            targetUserId: target.userId,
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

  requestTransferOtp: adminStaffProcedure.mutation(async ({ ctx }) => {
    requireSuperAdmin(ctx);

    const recentOtp = await ctx.prisma.verification.findFirst({
      where: {
        identifier: `admin-transfer-ownership:${ctx.user.email}`,
        createdAt: { gte: new Date(Date.now() - 2 * 60 * 1000) },
      },
    });
    if (recentOtp) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message:
          "Please wait 2 minutes before requesting another verification code.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const identifier = `admin-transfer-ownership:${ctx.user.email}`;

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

    await logAdminStaffActivity(ctx.prisma, {
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
            type: "admin-transfer-ownership",
            email: ctx.user.email,
          },
          transactionId: `admin-transfer-ownership-otp-${ctx.user.id}-${Date.now()}`,
        });
      } catch (err) {
        console.error("Failed to send transfer OTP:", err);
      }
    } else {
      console.log(`\n=== OTP for ${ctx.user.email}: ${otp} ===\n`);
    }

    return { success: true };
  }),

  transferOwnership: adminStaffProcedure
    .input(TransferAdminOwnershipSchema)
    .mutation(async ({ ctx, input }) => {
      requireSuperAdmin(ctx);

      if (input.confirmationText !== "TRANSFER OWNERSHIP") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: 'Please type "TRANSFER OWNERSHIP" to confirm.',
        });
      }

      const identifier = `admin-transfer-ownership:${ctx.user.email}`;
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

      const hashedInputOtp = crypto
        .createHash("sha256")
        .update(input.otp)
        .digest("hex");
      if (record.value !== hashedInputOtp) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid verification code.",
        });
      }

      const target = await getTargetAdminStaff(ctx, input.memberId);
      if (target.role === "SUPER_ADMIN") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Target is already a Super Admin.",
        });
      }
      if (target.status !== "ACTIVE") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Target must be an active member.",
        });
      }

      const currentSuperAdmin = await ctx.prisma.adminStaff.findUnique({
        where: { userId: ctx.user.id },
        include: { user: { select: { fullName: true } } },
      });
      if (currentSuperAdmin?.role !== "SUPER_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Super Admin record not found.",
        });
      }

      await ctx.prisma.$transaction([
        ctx.prisma.verification.delete({ where: { id: record.id } }),
        ctx.prisma.adminStaff.update({
          where: { id: currentSuperAdmin.id },
          data: {
            role: "ADMIN",
            permissions: ADMIN_ROLE_TEMPLATES.ADMIN,
            permissionsUpdatedAt: new Date(),
            permissionsUpdatedBy: ctx.user.id,
          },
        }),
        ctx.prisma.adminStaff.update({
          where: { id: target.id },
          data: {
            role: "SUPER_ADMIN",
            permissions: [],
            permissionsUpdatedAt: new Date(),
            permissionsUpdatedBy: ctx.user.id,
          },
        }),
        ctx.prisma.adminStaffActivityLog.create({
          data: {
            userId: ctx.user.id,
            action: "OWNERSHIP_TRANSFERRED",
            description: `Transferred admin ownership from ${currentSuperAdmin.user.fullName} to ${target.user.fullName}.`,
            targetUserId: target.userId,
            metadata: {
              previousOwnerId: currentSuperAdmin.userId,
              newOwnerId: target.userId,
            },
          },
        }),
      ]);

      return {
        success: true,
        message: `Admin ownership transferred to ${target.user.fullName}`,
        newOwner: {
          id: target.id,
          name: target.user.fullName,
          email: target.user.email,
        },
      };
    }),

  listInvitations: adminStaffProcedure
    .input(
      z.object({
        status: z
          .enum(["PENDING", "ACCEPTED", "CANCELLED", "EXPIRED"])
          .optional(),
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "admin-staff:read");

      const where: Prisma.AdminStaffInvitationWhereInput = {};
      if (input.status) where.status = input.status;

      const [invitations, total] = await Promise.all([
        ctx.prisma.adminStaffInvitation.findMany({
          where,
          include: {
            invitedBy: { select: { fullName: true, email: true } },
            acceptedBy: { select: { fullName: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.prisma.adminStaffInvitation.count({ where }),
      ]);

      return {
        invitations: invitations.map((inv) => {
          const { token, ...safeInv } = inv;
          return {
            ...safeInv,
            isExpired: inv.expiresAt < new Date(),
            daysUntilExpiry:
              inv.status === "PENDING"
                ? Math.ceil(
                    (inv.expiresAt.getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24),
                  )
                : null,
          };
        }),
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  createInvitation: adminStaffProcedure
    .input(CreateAdminInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "admin-staff:invite");
      requireAdminCanGrant(ctx, input.permissions);
      assertCanAssignAdminRole(ctx, input.role);

      const existingUser = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });
      if (existingUser) {
        const existingStaff = await ctx.prisma.adminStaff.findFirst({
          where: { userId: existingUser.id, deletedAt: null },
        });
        if (existingStaff) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "User is already an admin team member.",
          });
        }
      }

      const pendingInvite = await ctx.prisma.adminStaffInvitation.findFirst({
        where: {
          email: input.email,
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
      const recentCount = await ctx.prisma.adminStaffInvitation.count({
        where: { createdAt: { gte: hourAgo } },
      });
      if (recentCount >= 10) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many invitations sent recently.",
        });
      }

      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");
      const expiresAt = new Date(
        Date.now() + input.expiryDays * 24 * 60 * 60 * 1000,
      );

      const invitation = await ctx.prisma.adminStaffInvitation.create({
        data: {
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
        },
      });

      await logAdminStaffActivity(ctx.prisma, {
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
      const inviteUrl = `${appUrl}/admin/invite?token=${rawToken}`;
      const expiresAtFormatted = invitation.expiresAt.toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        },
      );

      const novu = getNovuClient();
      if (novu) {
        try {
          await novu.trigger({
            workflowId: "admin-staff-invite",
            to: { subscriberId: invitation.email, email: invitation.email },
            payload: {
              email: invitation.email,
              inviterName: invitation.invitedBy.fullName ?? "A team member",
              role: invitation.role,
              jobTitle: invitation.jobTitle,
              inviteUrl,
              expiresAt: expiresAtFormatted,
              message: invitation.message,
            },
            transactionId: `admin-staff-invite-${invitation.id}`,
          });
        } catch (err) {
          console.error("[NOVU] Failed to trigger admin-staff-invite:", err);
        }
      } else {
        console.log(`\n=== Admin Staff Invitation: ${inviteUrl} ===\n`);
      }

      // H21: Never return inviteUrl in the API response.
      return {
        success: true,
        invitationId: invitation.id,
        invitedEmail: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      };
    }),

  cancelInvitation: adminStaffProcedure
    .input(AdminInvitationIdSchema)
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "admin-staff:invite");

      const invite = await ctx.prisma.adminStaffInvitation.findUnique({
        where: { id: input.invitationId },
        include: { invitedBy: { select: { fullName: true } } },
      });
      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found.",
        });
      }
      if (invite.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot cancel ${invite.status.toLowerCase()} invitation.`,
        });
      }

      await ctx.prisma.adminStaffInvitation.update({
        where: { id: invite.id },
        data: { status: "CANCELLED" },
      });

      await logAdminStaffActivity(ctx.prisma, {
        userId: ctx.user.id,
        action: "INVITATION_CANCELLED",
        description: `Cancelled invitation for ${invite.email}.${input.reason ? ` Reason: ${input.reason}` : ""}`,
        metadata: { inviteeEmail: invite.email, reason: input.reason },
      });

      return { success: true };
    }),

  resendInvitation: adminStaffProcedure
    .input(ResendAdminInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "admin-staff:invite");

      const invite = await ctx.prisma.adminStaffInvitation.findUnique({
        where: { id: input.invitationId },
        include: { invitedBy: { select: { fullName: true, email: true } } },
      });
      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found.",
        });
      }
      if (invite.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot resend ${invite.status.toLowerCase()} invitation.`,
        });
      }

      const resendCount = await ctx.prisma.adminStaffActivityLog.count({
        where: {
          userId: ctx.user.id,
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
      const newHashedToken = crypto
        .createHash("sha256")
        .update(newRawToken)
        .digest("hex");

      const updated = await ctx.prisma.adminStaffInvitation.update({
        where: { id: invite.id },
        data: { expiresAt: newExpiresAt, token: newHashedToken },
        include: { invitedBy: { select: { fullName: true, email: true } } },
      });

      await logAdminStaffActivity(ctx.prisma, {
        userId: ctx.user.id,
        action: "INVITATION_RESENT",
        description: `Resent invitation to ${invite.email}.`,
        metadata: { inviteeEmail: invite.email, resendCount: resendCount + 1 },
      });

      const appUrl = process.env["APP_URL"] || "http://localhost:3000";
      const inviteUrl = `${appUrl}/admin/invite?token=${newRawToken}`;

      const novu = getNovuClient();
      if (novu) {
        try {
          await novu.trigger({
            workflowId: "admin-staff-invite",
            to: { subscriberId: updated.email, email: updated.email },
            payload: {
              email: updated.email,
              inviterName: updated.invitedBy.fullName ?? "A team member",
              role: updated.role,
              jobTitle: updated.jobTitle,
              inviteUrl,
              expiresAt: updated.expiresAt.toLocaleDateString("en-US"),
              message: updated.message,
              isResend: true,
            },
            transactionId: `admin-staff-invite-resend-${updated.id}-${resendCount}`,
          });
        } catch (err) {
          console.error("[NOVU] Failed to resend admin-staff-invite:", err);
        }
      }

      return {
        id: updated.id,
        email: updated.email,
        role: updated.role,
        status: updated.status,
        expiresAt: updated.expiresAt,
        resendCount: resendCount + 1,
      };
    }),

  getActivityLog: adminStaffProcedure
    .input(GetAdminActivityLogSchema)
    .query(async ({ ctx, input }) => {
      requireAdminPermission(ctx, "audit:read");

      const where: Prisma.AdminStaffActivityLogWhereInput = {};
      if (input.action) where.action = input.action;
      if (input.userId) where.userId = input.userId;

      const [activities, total] = await Promise.all([
        ctx.prisma.adminStaffActivityLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
          include: {
            user: { select: { fullName: true, image: true, email: true } },
          },
        }),
        ctx.prisma.adminStaffActivityLog.count({ where }),
      ]);

      return {
        activities: activities.map((activity) => ({
          ...activity,
          parsedMetadata: activity.metadata
            ? (activity.metadata as Record<string, unknown>)
            : null,
        })),
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),
});

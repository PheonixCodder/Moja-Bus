import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { headers } from "next/headers";
import {
  createTRPCRouter,
  operatorCompanyProcedure,
  operatorStaffManageProcedure,
} from "../init";
import crypto from "node:crypto";
import { auth } from "@/lib/auth-server";
import { sendStaffInvitationEmail } from "@/lib/staff-email";
import { Novu } from "@novu/api";
import type { PrismaClient } from "@moja/db";

async function logStaffActivity(
  prisma: PrismaClient,
  input: {
    companyId: string;
    userId: string;
    action: string;
    description: string;
  },
) {
  await prisma.activityLog.create({ data: input });
}

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

export const staffRouter = createTRPCRouter({
  getMyRole: operatorCompanyProcedure.query(async ({ ctx }) => {
    return { role: ctx.operator.role };
  }),

  listStaff: operatorStaffManageProcedure
    .input(
      z.object({
        search: z.string().optional(),
        role: z
          .enum([
            "OWNER",
            "ADMIN",
            "MANAGER",
            "OPERATIONS",
            "FINANCE",
            "SUPPORT",
          ])
          .optional(),
        status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
        page: z.number().default(1),
        limit: z.number().default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { search, role, status, page, limit } = input;
      const skip = (page - 1) * limit;

      const where: any = {
        companyId: ctx.companyId,
        deletedAt: null,
      };

      if (role) where.role = role;
      if (status) where.status = status;

      if (search) {
        where.OR = [
          { user: { fullName: { contains: search, mode: "insensitive" } } },
          { user: { email: { contains: search, mode: "insensitive" } } },
          { user: { phone: { contains: search, mode: "insensitive" } } },
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

      return { members, total, page, limit };
    }),

  updateRole: operatorStaffManageProcedure
    .input(
      z.object({
        memberId: z.string(),
        role: z.enum([
          "OWNER",
          "ADMIN",
          "MANAGER",
          "OPERATIONS",
          "FINANCE",
          "SUPPORT",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.role === "OWNER") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Use the transfer-ownership endpoint to assign the OWNER role.",
        });
      }

      const target = await ctx.prisma.operator.findFirst({
        where: {
          id: input.memberId,
          companyId: ctx.companyId,
          deletedAt: null,
        },
      });

      if (!target)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Staff member not found.",
        });
      if (target.role === "OWNER")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot change the role of the company OWNER.",
        });

      const updated = await ctx.prisma.operator.update({
        where: { id: target.id },
        data: { role: input.role },
        include: memberInclude,
      });

      await logStaffActivity(ctx.prisma, {
        companyId: ctx.companyId,
        userId: ctx.user.id,
        action: "ROLE_CHANGED",
        description: `Changed a staff member role to ${input.role}.`,
      });

      return updated;
    }),

  updateStatus: operatorStaffManageProcedure
    .input(
      z.object({
        memberId: z.string(),
        status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const target = await ctx.prisma.operator.findFirst({
        where: {
          id: input.memberId,
          companyId: ctx.companyId,
          deletedAt: null,
        },
      });

      if (!target)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Staff member not found.",
        });
      if (target.role === "OWNER")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot change the status of the company OWNER.",
        });

      const updated = await ctx.prisma.operator.update({
        where: { id: target.id },
        data: { status: input.status },
        include: memberInclude,
      });

      await logStaffActivity(ctx.prisma, {
        companyId: ctx.companyId,
        userId: ctx.user.id,
        action: "STATUS_CHANGED",
        description: `Changed a staff member status to ${input.status}.`,
      });

      return updated;
    }),

  transferOwnership: operatorStaffManageProcedure
    .input(
      z.object({
        memberId: z.string(),
        password: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.operator.role !== "OWNER") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the current OWNER can transfer ownership.",
        });
      }

      // Verify current owner password before transferring ownership
      try {
        await auth.api.verifyPassword({
          body: { password: input.password },
          headers: await headers(),
        });
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid password. Ownership transfer was not completed.",
        });
      }

      const target = await ctx.prisma.operator.findFirst({
        where: {
          id: input.memberId,
          companyId: ctx.companyId,
          deletedAt: null,
        },
        include: { user: true },
      });

      if (!target)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Target staff member not found.",
        });

      await ctx.prisma.$transaction([
        ctx.prisma.operator.update({
          where: { id: ctx.operator.id },
          data: { role: "ADMIN" },
        }),
        ctx.prisma.operator.update({
          where: { id: target.id },
          data: { role: "OWNER" },
        }),
      ]);

      await logStaffActivity(ctx.prisma, {
        companyId: ctx.companyId,
        userId: ctx.user.id,
        action: "OWNERSHIP_TRANSFERRED",
        description: `Transferred company ownership to ${target.user.fullName}.`,
      });

      return {
        success: true,
        message: `Ownership transferred to ${target.user.fullName}`,
      };
    }),

  // Invitations
  listInvitations: operatorStaffManageProcedure.query(async ({ ctx }) => {
    return ctx.prisma.staffInvitation.findMany({
      where: { companyId: ctx.companyId },
      include: {
        invitedBy: { select: { fullName: true } },
        acceptedBy: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  createInvitation: operatorStaffManageProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum([
          "OWNER",
          "ADMIN",
          "MANAGER",
          "OPERATIONS",
          "FINANCE",
          "SUPPORT",
        ]),
        jobTitle: z.string().optional(),
        message: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.role === "OWNER") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot invite a new OWNER.",
        });
      }

      const existingUser = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        const existingOperator = await ctx.prisma.operator.findFirst({
          where: {
            userId: existingUser.id,
            companyId: ctx.companyId,
            deletedAt: null,
          },
        });
        if (existingOperator) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User is already a member of this company.",
          });
        }
      }

      const pendingInvite = await ctx.prisma.staffInvitation.findFirst({
        where: {
          email: input.email,
          companyId: ctx.companyId,
          status: "PENDING",
        },
      });

      if (pendingInvite) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A pending invitation already exists for this email.",
        });
      }

      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const invitation = await ctx.prisma.staffInvitation.create({
        data: {
          companyId: ctx.companyId,
          email: input.email,
          role: input.role,
          jobTitle: input.jobTitle ?? null,
          message: input.message ?? null,
          token: hashedToken,
          expiresAt,
          invitedById: ctx.user.id,
        },
        include: {
          invitedBy: { select: { fullName: true } },
          acceptedBy: { select: { fullName: true } },
          company: { select: { name: true } },
        },
      });

      console.log(rawToken);

      const appUrl = process.env["APP_URL"] || "http://localhost:3000";
      const inviteUrl = `${appUrl}/invite?token=${rawToken}`;
      const expiresAtFormatted = invitation.expiresAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const novuSecret = process.env["NOVU_SECRET_KEY"];
      if (novuSecret) {
        try {
          const novu = new Novu({ secretKey: novuSecret });
          await novu.trigger({
            workflowId: "operator-staff-invite",
            to: {
              subscriberId: invitation.email,
              email: invitation.email,
            },
            payload: {
              email: invitation.email,
              companyName: invitation.company.name,
              inviterName: invitation.invitedBy.fullName ?? "A team member",
              role: invitation.role,
              inviteUrl,
              expiresAt: expiresAtFormatted,
              message: invitation.message,
            },
          });
          console.log(`[NOVU] Triggered operator-staff-invite for ${invitation.email}`);
        } catch (err) {
          console.error("[NOVU] Failed to trigger operator-staff-invite workflow:", err);
          await sendStaffInvitationEmail({
            to: invitation.email,
            companyName: invitation.company.name,
            inviterName: invitation.invitedBy.fullName ?? "A team member",
            role: invitation.role,
            token: rawToken,
            message: invitation.message,
            expiresAt: invitation.expiresAt,
          });
        }
      } else {
        await sendStaffInvitationEmail({
          to: invitation.email,
          companyName: invitation.company.name,
          inviterName: invitation.invitedBy.fullName ?? "A team member",
          role: invitation.role,
          token: rawToken,
          message: invitation.message,
          expiresAt: invitation.expiresAt,
        });
      }

      await logStaffActivity(ctx.prisma, {
        companyId: ctx.companyId,
        userId: ctx.user.id,
        action: "INVITATION_SENT",
        description: `Invited ${invitation.email} as ${invitation.role}.`,
      });

      return invitation;
    }),

  cancelInvitation: operatorStaffManageProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invite = await ctx.prisma.staffInvitation.findFirst({
        where: { id: input.invitationId, companyId: ctx.companyId },
      });

      if (!invite)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found.",
        });
      if (invite.status !== "PENDING")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only pending invitations can be cancelled.",
        });

      await ctx.prisma.staffInvitation.update({
        where: { id: invite.id },
        data: { status: "CANCELLED" },
      });

      await logStaffActivity(ctx.prisma, {
        companyId: ctx.companyId,
        userId: ctx.user.id,
        action: "INVITATION_CANCELLED",
        description: `Cancelled invitation for ${invite.email}.`,
      });

      return { success: true };
    }),

  resendInvitation: operatorStaffManageProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invite = await ctx.prisma.staffInvitation.findFirst({
        where: { id: input.invitationId, companyId: ctx.companyId },
      });

      if (!invite)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found.",
        });
      if (invite.status !== "PENDING")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only pending invitations can be resent.",
        });

      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const newRawToken = crypto.randomBytes(32).toString("hex");
      const newHashedToken = crypto.createHash("sha256").update(newRawToken).digest("hex");

      const updated = await ctx.prisma.staffInvitation.update({
        where: { id: invite.id },
        data: { expiresAt: newExpiresAt, token: newHashedToken },
        include: {
          invitedBy: { select: { fullName: true } },
          acceptedBy: { select: { fullName: true } },
          company: { select: { name: true } },
        },
      });

      const appUrl = process.env["APP_URL"] || "http://localhost:3000";
      const inviteUrl = `${appUrl}/invite?token=${newRawToken}`;
      const expiresAtFormatted = updated.expiresAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const novuSecret = process.env["NOVU_SECRET_KEY"];
      if (novuSecret) {
        try {
          const novu = new Novu({ secretKey: novuSecret });
          await novu.trigger({
            workflowId: "operator-staff-invite",
            to: {
              subscriberId: updated.email,
              email: updated.email,
            },
            payload: {
              email: updated.email,
              companyName: updated.company.name,
              inviterName: updated.invitedBy.fullName ?? "A team member",
              role: updated.role,
              inviteUrl,
              expiresAt: expiresAtFormatted,
              message: updated.message,
            },
          });
          console.log(`[NOVU] Triggered operator-staff-invite for ${updated.email}`);
        } catch (err) {
          console.error("[NOVU] Failed to trigger operator-staff-invite workflow:", err);
          await sendStaffInvitationEmail({
            to: updated.email,
            companyName: updated.company.name,
            inviterName: updated.invitedBy.fullName ?? "A team member",
            role: updated.role,
            token: newRawToken,
            message: updated.message,
            expiresAt: updated.expiresAt,
          });
        }
      } else {
        await sendStaffInvitationEmail({
          to: updated.email,
          companyName: updated.company.name,
          inviterName: updated.invitedBy.fullName ?? "A team member",
          role: updated.role,
          token: newRawToken,
          message: updated.message,
          expiresAt: updated.expiresAt,
        });
      }

      await logStaffActivity(ctx.prisma, {
        companyId: ctx.companyId,
        userId: ctx.user.id,
        action: "INVITATION_RESENT",
        description: `Resent invitation to ${updated.email}.`,
      });

      return updated;
    }),

  getActivityLog: operatorCompanyProcedure
    .input(z.object({ limit: z.number().default(40) }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.activityLog.findMany({
        where: { companyId: ctx.companyId },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        include: {
          user: { select: { fullName: true, image: true } },
        },
      });
    }),
});

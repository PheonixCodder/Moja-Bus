import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../init";
import crypto from "node:crypto";
import { Novu } from "@novu/api";

// ─────────────────────────────────────────────────────────────────────────────
// Shared select shape returned to the client
// ─────────────────────────────────────────────────────────────────────────────

const invitationSelect = {
  id: true,
  email: true,
  role: true,
  jobTitle: true,
  message: true,
  expiresAt: true,
  status: true,
  company: {
    select: { id: true, name: true, logoUrl: true },
  },
  invitedBy: {
    select: { fullName: true },
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────────────

export const invitationRouter = createTRPCRouter({
  /**
   * PUBLIC — validate an invitation token and return its details.
   * No authentication required; used to render the invite landing page.
   */
  validateToken: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const hashedToken = crypto.createHash("sha256").update(input.token).digest("hex");
      const invitation = await ctx.prisma.staffInvitation.findUnique({
        where: { token: hashedToken },
        select: invitationSelect,
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
        // Mark as expired so the check is fast next time
        await ctx.prisma.staffInvitation.update({
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
   * PUBLIC — accept an invitation.
   * Checks if user is already registered or logged in, verifies their email,
   * upgrades their role to OPERATOR if needed, and links them to the company.
   */
  accept: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const hashedToken = crypto.createHash("sha256").update(input.token).digest("hex");
      const invitation = await ctx.prisma.staffInvitation.findUnique({
        where: { token: hashedToken },
        include: {
          company: { select: { id: true, name: true } },
          invitedBy: { select: { email: true } },
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
        await ctx.prisma.staffInvitation.update({
          where: { token: hashedToken },
          data: { status: "EXPIRED" },
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has expired.",
        });
      }

      let userId: string;
      let userName: string;

      if (ctx.user) {
        // Logged-in user must match the invitation email
        if (ctx.user.email !== invitation.email) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `This invitation was sent to ${invitation.email}. Please sign in with that account.`,
          });
        }
        userId = ctx.user.id;
        userName = ctx.user.name ?? "A new member";
      } else {
        // User not logged in, look them up by email in DB
        const dbUser = await ctx.prisma.user.findUnique({
          where: { email: invitation.email },
        });

        if (!dbUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User account not found. Please register first.",
          });
        }
        userId = dbUser.id;
        userName = dbUser.fullName;
      }

      // Check if the user is already a member of this company
      const existingMembership = await ctx.prisma.operator.findFirst({
        where: {
          userId,
          companyId: invitation.companyId,
          deletedAt: null,
        },
      });

      if (existingMembership) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You are already a member of this company.",
        });
      }

      // Execute in a transaction: update User (emailVerified & role), create Operator, update invitation, log action
      await ctx.prisma.$transaction([
        ctx.prisma.user.update({
          where: { id: userId },
          data: {
            emailVerified: true,
            role: "OPERATOR",
          },
        }),
        ctx.prisma.operator.create({
          data: {
            userId,
            companyId: invitation.companyId,
            role: invitation.role,
            jobTitle: invitation.jobTitle ?? null,
            status: "ACTIVE",
            isActive: true,
            isVerified: false,
            onboardingStatus: "COMPLETED",
          },
        }),
        ctx.prisma.staffInvitation.update({
          where: { token: hashedToken },
          data: {
            status: "ACCEPTED",
            acceptedById: userId,
          },
        }),
        ctx.prisma.activityLog.create({
          data: {
            companyId: invitation.companyId,
            userId,
            action: "MEMBER_JOINED",
            description: `${userName} joined the company as ${invitation.role}.`,
          },
        }),
      ]);

      // Trigger Novu staff invitation acceptance alert to the inviter
      const novuSecret = process.env["NOVU_SECRET_KEY"];
      if (novuSecret) {
        try {
          const novu = new Novu({ secretKey: novuSecret });
          await novu.trigger({
            workflowId: "staff-acceptance-alert",
            to: {
              subscriberId: invitation.invitedBy?.email ?? invitation.email,
              email: invitation.invitedBy?.email ?? invitation.email,
            },
            payload: {
              staffName: userName,
              staffEmail: invitation.email,
              role: invitation.role,
            },
          });
          console.log(`[NOVU] Triggered staff-acceptance-alert for inviter ${invitation.invitedById}`);
        } catch (err) {
          console.error("[NOVU] Failed to trigger staff-acceptance-alert workflow:", err);
        }
      }

      return { success: true, companyName: invitation.company.name };
    }),
});

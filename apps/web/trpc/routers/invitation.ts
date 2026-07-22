import { TRPCError } from "@trpc/server";
import { z } from "zod";
import crypto from "node:crypto";
import { getNovuClient } from "@/lib/novu";
import {
  ROLE_TEMPLATES,
  type StaffRole,
} from "@moja/schemas";
import { createTRPCRouter, publicProcedure } from "../init";


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

      // If the user is NOT logged in, redirect them to OTP sign-in.
      // The invitation token is preserved as a query param so acceptance
      // completes automatically after they verify their identity.
      if (!ctx.user) {
        return {
          requiresAuth: true as const,
          email: invitation.email,
          companyName: invitation.company.name,
        };
      }

      // Logged-in user must match the invitation email
      if (ctx.user.email !== invitation.email) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `This invitation was sent to ${invitation.email}. Please sign in with that account.`,
        });
      }

      const userId = ctx.user.id;
      // Better Auth session user exposes `name` (not `fullName` which is the DB field)
      const userName = ctx.user.name ?? "A new member";

      // Check if the user is already an active member of this company
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

      // Check if this user was previously a member but was soft-deleted (left the company).
      // If so, restore them instead of creating a duplicate record (avoids unique constraint
      // violation on @@unique([userId, companyId])).
      const softDeletedMembership = await ctx.prisma.operator.findFirst({
        where: {
          userId,
          companyId: invitation.companyId,
          deletedAt: { not: null },
        },
      });

      // Copy invitation.permissions onto Operator (IAM source of truth).
      // Fall back to role template if an old invitation has an empty set.
      const grantedPermissions =
        invitation.permissions?.length > 0
          ? invitation.permissions
          : (ROLE_TEMPLATES[invitation.role as StaffRole] ?? []);

      await ctx.prisma.$transaction([
        ctx.prisma.user.update({
          where: { id: userId },
          data: {
            emailVerified: true,
            role: "OPERATOR",
          },
        }),
        softDeletedMembership
          ? ctx.prisma.operator.update({
              where: { id: softDeletedMembership.id },
              data: {
                role: invitation.role,
                jobTitle: invitation.jobTitle ?? null,
                permissions: grantedPermissions,
                permissionsUpdatedAt: new Date(),
                status: "ACTIVE",
                isActive: true,
                deletedAt: null,
                onboardingStatus: "COMPLETED",
              },
            })
          : ctx.prisma.operator.create({
              data: {
                userId,
                companyId: invitation.companyId,
                role: invitation.role,
                jobTitle: invitation.jobTitle ?? null,
                permissions: grantedPermissions,
                permissionsUpdatedAt: new Date(),
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
            metadata: JSON.stringify({ permissions: grantedPermissions }),
          },
        }),
      ]);

      // Session is managed by Better Auth natively — no manual createSession needed.

      // Trigger Novu staff invitation acceptance alert to the inviter
      const novu = getNovuClient();
      if (novu) {
        try {
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
            transactionId: `staff-acceptance-alert-${invitation.id}-${userId}`,
          });
          console.log(`[NOVU] Triggered staff-acceptance-alert for inviter ${invitation.invitedById}`);
        } catch (err) {
          console.error("[NOVU] Failed to trigger staff-acceptance-alert workflow:", err);
        }
      }

      return { success: true, companyName: invitation.company.name };
    }),
});

import { type Router as ExpressRouter, Router } from "express";
import { auth } from "../auth/auth.js";
import { getPrismaClient } from "@moja/db";
import { AppError } from "../lib/errors.js";
import { logActivity, ACTIVITY_ACTIONS } from "../lib/activity-logger.js";

const prisma = getPrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC INVITATION ENDPOINTS — No auth required for GET (token validation).
// Accept requires the user to be logged in.
// ─────────────────────────────────────────────────────────────────────────────

export function createInvitationsRouter(): ExpressRouter {
  const router = Router();

  // ─── GET /auth/invitations/:token ─────────────────────────────────────────
  // Validate a token before showing the invitation acceptance UI.
  router.get("/auth/invitations/:token", async (req, res, next) => {
    try {
      const invitation = await prisma.staffInvitation.findUnique({
        where: { token: req.params.token },
        include: {
          company: { select: { id: true, name: true, logoUrl: true } },
          invitedBy: { select: { fullName: true } },
        },
      });

      if (!invitation) {
        return next(new AppError(404, "Invitation not found or link is invalid."));
      }

      if (invitation.status === "ACCEPTED") {
        return next(new AppError(410, "This invitation has already been accepted."));
      }

      if (invitation.status === "CANCELLED") {
        return next(new AppError(410, "This invitation has been cancelled."));
      }

      // Check expiry (also mark as expired if past)
      if (invitation.expiresAt < new Date()) {
        await prisma.staffInvitation.update({
          where: { id: invitation.id },
          data: { status: "EXPIRED" },
        });
        return next(new AppError(410, "This invitation has expired. Ask the admin to resend it."));
      }

      res.json({
        valid: true,
        email: invitation.email,
        role: invitation.role,
        jobTitle: invitation.jobTitle,
        message: invitation.message,
        expiresAt: invitation.expiresAt,
        company: invitation.company,
        invitedBy: invitation.invitedBy.fullName,
      });
    } catch (error) {
      next(error);
    }
  });

  // ─── POST /auth/invitations/accept ────────────────────────────────────────
  // Called after the invitee signs up or logs in.
  // The frontend passes the token + the authenticated user's session.
  router.post("/auth/invitations/accept", async (req: any, res, next) => {
    try {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.session) {
        return next(new AppError(401, "You must be logged in to accept an invitation."));
      }

      const { token } = req.body as { token: string };
      if (!token) return next(new AppError(400, "Invitation token is required."));

      const invitation = await prisma.staffInvitation.findUnique({
        where: { token },
        include: { company: { select: { id: true, name: true } } },
      });

      if (!invitation) return next(new AppError(404, "Invitation not found or link is invalid."));
      if (invitation.status !== "PENDING") {
        return next(new AppError(410, `Cannot accept an invitation with status: ${invitation.status}`));
      }
      if (invitation.expiresAt < new Date()) {
        await prisma.staffInvitation.update({ where: { id: invitation.id }, data: { status: "EXPIRED" } });
        return next(new AppError(410, "This invitation has expired."));
      }

      // Make sure the logged-in user's email matches the invitation email
      if (session.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
        return next(new AppError(403, "This invitation was sent to a different email address."));
      }

      // Check if this user is already a member
      const existingMembership = await prisma.operator.findFirst({
        where: { userId: session.user.id, companyId: invitation.companyId, deletedAt: null },
      });
      if (existingMembership) {
        return next(new AppError(409, "You are already a member of this company."));
      }

      // Create the Operator (membership) record
      const newMember = await prisma.operator.create({
        data: {
          userId: session.user.id,
          companyId: invitation.companyId,
          role: invitation.role,
          status: "ACTIVE",
          isActive: true,
          jobTitle: invitation.jobTitle ?? null,
          joinedAt: new Date(),
        },
        include: {
          user: { select: { fullName: true, email: true } },
          company: { select: { name: true } },
        },
      });

      // Update user role to OPERATOR if they're currently TRAVELER
      if (session.user.role === "TRAVELER") {
        await prisma.user.update({
          where: { id: session.user.id },
          data: { role: "OPERATOR" },
        });
      }

      // Mark invitation as accepted
      await prisma.staffInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED", acceptedById: session.user.id },
      });

      await logActivity(
        invitation.companyId,
        session.user.id,
        ACTIVITY_ACTIONS.INVITATION_ACCEPTED,
        `${newMember.user.fullName} joined ${newMember.company.name} as ${invitation.role}`,
      );

      res.status(201).json({
        success: true,
        member: newMember,
        message: `Welcome to ${newMember.company.name}!`,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

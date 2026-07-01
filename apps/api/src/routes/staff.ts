import { type Router as ExpressRouter, Router } from "express";
import { auth } from "../auth/auth.js";
import { getPrismaClient } from "@moja/db";
import { AppError } from "../lib/errors.js";
import { emailAdapter } from "../lib/email-adapter.js";
import { logActivity, ACTIVITY_ACTIONS } from "../lib/activity-logger.js";
import { hasPermission, PERMISSIONS } from "../lib/permissions.js";
import crypto from "node:crypto";
import type { StaffRole, OperatorStatus } from "@moja/db";

const prisma = getPrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// AUTH MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────

async function requireOperatorSession(req: any, _res: any, next: any) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.session) return next(new AppError(401, "Authentication is required."));

    const role = session.user.role;
    if (role !== "OPERATOR" && role !== "ADMIN") {
      return next(new AppError(403, "You do not have permission to access this resource."));
    }

    // Fetch the caller's Operator record for the active company
    const operatorProfile = await prisma.operator.findFirst({
      where: { userId: session.user.id, deletedAt: null },
      orderBy: { joinedAt: "desc" },
    });

    if (!operatorProfile) return next(new AppError(404, "Operator profile not found."));
    if (operatorProfile.status === "SUSPENDED") {
      return next(new AppError(403, "Your account has been suspended."));
    }

    req.user = session.user;
    req.session = session.session;
    req.operator = operatorProfile;
    next();
  } catch (error) {
    next(error);
  }
}

/** Middleware: requires caller to be OWNER or ADMIN */
function requireStaffManagePermission(req: any, _res: any, next: any) {
  const op = req.operator;
  if (!op) return next(new AppError(401, "Authentication required."));
  if (!hasPermission(op.role as StaffRole, PERMISSIONS.STAFF_MANAGE)) {
    return next(new AppError(403, "You do not have permission to manage staff."));
  }
  next();
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED INCLUDE — full member profile join
// ─────────────────────────────────────────────────────────────────────────────

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

export function createStaffRouter(): ExpressRouter {
  const router = Router();

  // ─── GET /operator/staff ───────────────────────────────────────────────────
  // Returns the active roster for the caller's company.
  // Supports ?search=, ?role=, ?status=, ?page=, ?limit=
  router.get(
    "/operator/staff",
    requireOperatorSession,
    requireStaffManagePermission,
    async (req: any, res, next) => {
      try {
        const { companyId } = req.operator;
        const { search, role, status, page = "1", limit = "50" } = req.query;

        const skip = (Number(page) - 1) * Number(limit);

        const where: any = {
          companyId,
          deletedAt: null,
          // Exclude the current user from the "manage others" list? No — OWNER sees all
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
          prisma.operator.findMany({
            where,
            include: memberInclude,
            orderBy: { joinedAt: "asc" },
            skip,
            take: Number(limit),
          }),
          prisma.operator.count({ where }),
        ]);

        res.json({ members, total, page: Number(page), limit: Number(limit) });
      } catch (error) {
        next(error);
      }
    },
  );

  // ─── PATCH /operator/staff/:id/role ───────────────────────────────────────
  // Change a member's role. OWNER role changes require transfer-ownership endpoint.
  router.patch(
    "/operator/staff/:id/role",
    requireOperatorSession,
    requireStaffManagePermission,
    async (req: any, res, next) => {
      try {
        const { companyId, role: callerRole, id: callerId } = req.operator;
        const { role: newRole } = req.body as { role: StaffRole };

        if (!newRole) return next(new AppError(400, "Role is required."));

        // OWNER role can only be assigned via ownership transfer
        if (newRole === "OWNER") {
          return next(new AppError(400, "Use the transfer-ownership endpoint to assign the OWNER role."));
        }

        const target = await prisma.operator.findFirst({
          where: { id: req.params.id, companyId, deletedAt: null },
          include: { user: { select: { fullName: true } } },
        });

        if (!target) return next(new AppError(404, "Staff member not found."));

        // Prevent modifying yourself
        if (target.id === req.operator.id) {
          return next(new AppError(400, "You cannot modify your own role."));
        }

        // Cannot demote another OWNER via this endpoint
        if (target.role === "OWNER") {
          return next(new AppError(400, "Cannot change the role of the company Owner via this endpoint. Use ownership transfer."));
        }

        const oldRole = target.role;
        const updated = await prisma.operator.update({
          where: { id: target.id },
          data: { role: newRole },
          include: memberInclude,
        });

        await logActivity(
          companyId,
          req.user.id,
          ACTIVITY_ACTIONS.ROLE_CHANGED,
          `${req.user.fullName} changed ${target.user.fullName}'s role: ${oldRole} → ${newRole}`,
        );

        res.json(updated);
      } catch (error) {
        next(error);
      }
    },
  );

  // ─── PATCH /operator/staff/:id/status ─────────────────────────────────────
  // Set ACTIVE / INACTIVE / SUSPENDED. Never deletes.
  router.patch(
    "/operator/staff/:id/status",
    requireOperatorSession,
    requireStaffManagePermission,
    async (req: any, res, next) => {
      try {
        const { companyId } = req.operator;
        const { status } = req.body as { status: OperatorStatus };

        const validStatuses: OperatorStatus[] = ["ACTIVE", "INACTIVE", "SUSPENDED"];
        if (!status || !validStatuses.includes(status)) {
          return next(new AppError(400, `Status must be one of: ${validStatuses.join(", ")}`));
        }

        const target = await prisma.operator.findFirst({
          where: { id: req.params.id, companyId, deletedAt: null },
          include: { user: { select: { fullName: true } } },
        });

        if (!target) return next(new AppError(404, "Staff member not found."));

        // Prevent modifying yourself
        if (target.id === req.operator.id) {
          return next(new AppError(400, "You cannot suspend or modify your own status."));
        }

        // Cannot suspend an OWNER
        if (target.role === "OWNER" && status !== "ACTIVE") {
          return next(new AppError(400, "You cannot suspend the company Owner. Transfer ownership first."));
        }

        const updated = await prisma.operator.update({
          where: { id: target.id },
          data: {
            status,
            isActive: status === "ACTIVE",
            deletedAt: status === "INACTIVE" ? new Date() : null,
          },
          include: memberInclude,
        });

        await logActivity(
          companyId,
          req.user.id,
          ACTIVITY_ACTIONS.STATUS_CHANGED,
          `${req.user.fullName} set ${target.user.fullName}'s status to ${status}`,
        );

        res.json(updated);
      } catch (error) {
        next(error);
      }
    },
  );

  // ─── POST /operator/staff/:id/transfer-ownership ──────────────────────────
  // Dedicated ownership transfer flow. OWNER only.
  router.post(
    "/operator/staff/:id/transfer-ownership",
    requireOperatorSession,
    async (req: any, res, next) => {
      try {
        const { companyId, role: callerRole, id: callerId } = req.operator;

        if (callerRole !== "OWNER") {
          return next(new AppError(403, "Only the Owner can transfer ownership."));
        }

        const { password } = req.body as { password: string };
        if (!password) return next(new AppError(400, "Password confirmation is required."));

        // Verify caller's password via Better Auth
        const verification = await auth.api.signInEmail({
          body: { email: req.user.email, password },
        }).catch(() => null);

        if (!verification) {
          return next(new AppError(401, "Password is incorrect."));
        }

        const target = await prisma.operator.findFirst({
          where: { id: req.params.id, companyId, deletedAt: null },
          include: { user: { select: { fullName: true } } },
        });

        if (!target) return next(new AppError(404, "Staff member not found."));
        if (target.id === callerId) {
          return next(new AppError(400, "You cannot transfer ownership to yourself."));
        }

        // Demote current OWNER → ADMIN, promote target → OWNER
        await prisma.$transaction([
          prisma.operator.update({ where: { id: callerId }, data: { role: "ADMIN" } }),
          prisma.operator.update({ where: { id: target.id }, data: { role: "OWNER" } }),
        ]);

        await logActivity(
          companyId,
          req.user.id,
          ACTIVITY_ACTIONS.OWNERSHIP_TRANSFERRED,
          `${req.user.fullName} transferred ownership to ${target.user.fullName}`,
        );

        res.json({ success: true, message: `Ownership transferred to ${target.user.fullName}.` });
      } catch (error) {
        next(error);
      }
    },
  );

  // ─── GET /operator/staff/invitations ─────────────────────────────────────
  router.get(
    "/operator/staff/invitations",
    requireOperatorSession,
    requireStaffManagePermission,
    async (req: any, res, next) => {
      try {
        const { companyId } = req.operator;

        // Auto-expire any tokens that have passed their expiry
        await prisma.staffInvitation.updateMany({
          where: { companyId, status: "PENDING", expiresAt: { lt: new Date() } },
          data: { status: "EXPIRED" },
        });

        const invitations = await prisma.staffInvitation.findMany({
          where: { companyId },
          include: {
            invitedBy: { select: { fullName: true } },
            acceptedBy: { select: { fullName: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        res.json(invitations);
      } catch (error) {
        next(error);
      }
    },
  );

  // ─── POST /operator/staff/invitations ────────────────────────────────────
  router.post(
    "/operator/staff/invitations",
    requireOperatorSession,
    requireStaffManagePermission,
    async (req: any, res, next) => {
      try {
        const { companyId } = req.operator;

        if (!hasPermission(req.operator.role as StaffRole, PERMISSIONS.STAFF_INVITE)) {
          return next(new AppError(403, "You do not have permission to invite staff."));
        }

        const { email, role, jobTitle, message } = req.body as {
          email: string;
          role: StaffRole;
          jobTitle?: string;
          message?: string;
        };

        if (!email) return next(new AppError(400, "Email is required."));
        if (!role) return next(new AppError(400, "Role is required."));
        if (role === "OWNER") {
          return next(new AppError(400, "Cannot invite someone as Owner. Use ownership transfer."));
        }

        // Check for existing active member with this email
        const existingMember = await prisma.operator.findFirst({
          where: {
            companyId,
            deletedAt: null,
            user: { email: { equals: email, mode: "insensitive" } },
          },
        });
        if (existingMember) {
          return next(new AppError(409, "A staff member with this email already exists in the company."));
        }

        // Cancel any prior pending invitations to the same email
        await prisma.staffInvitation.updateMany({
          where: { companyId, email, status: "PENDING" },
          data: { status: "CANCELLED" },
        });

        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

        const company = await prisma.company.findUnique({ where: { id: companyId }, select: { name: true } });

        const invitation = await prisma.staffInvitation.create({
          data: {
            email,
            role,
            jobTitle: jobTitle ?? null,
            message: message ?? null,
            companyId,
            token,
            expiresAt,
            invitedById: req.user.id,
          },
          include: {
            invitedBy: { select: { fullName: true } },
          },
        });

        // Send invitation email (mock in dev)
        await emailAdapter.sendStaffInvitation({
          to: email,
          companyName: company?.name ?? "Moja Ride Company",
          inviterName: req.user.fullName,
          role,
          token,
          message: message ?? null,
          expiresAt,
        });

        await logActivity(
          companyId,
          req.user.id,
          ACTIVITY_ACTIONS.STAFF_INVITED,
          `${req.user.fullName} invited ${email} as ${role}`,
        );

        res.status(201).json(invitation);
      } catch (error) {
        next(error);
      }
    },
  );

  // ─── PATCH /operator/staff/invitations/:id/cancel ─────────────────────────
  router.patch(
    "/operator/staff/invitations/:id/cancel",
    requireOperatorSession,
    requireStaffManagePermission,
    async (req: any, res, next) => {
      try {
        const { companyId } = req.operator;

        const invitation = await prisma.staffInvitation.findFirst({
          where: { id: req.params.id, companyId },
        });

        if (!invitation) return next(new AppError(404, "Invitation not found."));
        if (invitation.status !== "PENDING") {
          return next(new AppError(400, `Cannot cancel an invitation with status: ${invitation.status}`));
        }

        const updated = await prisma.staffInvitation.update({
          where: { id: invitation.id },
          data: { status: "CANCELLED" },
        });

        await logActivity(
          companyId,
          req.user.id,
          ACTIVITY_ACTIONS.INVITATION_CANCELLED,
          `${req.user.fullName} cancelled invitation for ${invitation.email}`,
        );

        res.json(updated);
      } catch (error) {
        next(error);
      }
    },
  );

  // ─── POST /operator/staff/invitations/:id/resend ──────────────────────────
  router.post(
    "/operator/staff/invitations/:id/resend",
    requireOperatorSession,
    requireStaffManagePermission,
    async (req: any, res, next) => {
      try {
        const { companyId } = req.operator;

        const invitation = await prisma.staffInvitation.findFirst({
          where: { id: req.params.id, companyId },
        });

        if (!invitation) return next(new AppError(404, "Invitation not found."));
        if (invitation.status === "ACCEPTED") {
          return next(new AppError(400, "This invitation has already been accepted."));
        }

        const newToken = crypto.randomBytes(32).toString("hex");
        const newExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
        const company = await prisma.company.findUnique({ where: { id: companyId }, select: { name: true } });

        const updated = await prisma.staffInvitation.update({
          where: { id: invitation.id },
          data: { token: newToken, expiresAt: newExpiresAt, status: "PENDING" },
          include: { invitedBy: { select: { fullName: true } } },
        });

        await emailAdapter.sendStaffInvitation({
          to: invitation.email,
          companyName: company?.name ?? "Moja Ride Company",
          inviterName: req.user.fullName,
          role: invitation.role,
          token: newToken,
          message: invitation.message,
          expiresAt: newExpiresAt,
        });

        await logActivity(
          companyId,
          req.user.id,
          ACTIVITY_ACTIONS.INVITATION_RESENT,
          `${req.user.fullName} resent invitation to ${invitation.email}`,
        );

        res.json(updated);
      } catch (error) {
        next(error);
      }
    },
  );

  // ─── GET /operator/activity-log ───────────────────────────────────────────
  router.get(
    "/operator/activity-log",
    requireOperatorSession,
    async (req: any, res, next) => {
      try {
        const { companyId } = req.operator;
        const { limit = "40", page = "1" } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const logs = await prisma.activityLog.findMany({
          where: { companyId },
          include: { user: { select: { fullName: true, image: true } } },
          orderBy: { createdAt: "desc" },
          skip,
          take: Number(limit),
        });

        res.json(logs);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}

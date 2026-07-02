import { getPrismaClient } from "@moja/db";

const prisma = getPrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY LOG HELPER
// All staff management actions write here. Descriptions always include
// old→new values so audit entries are self-contained without extra lookups.
// ─────────────────────────────────────────────────────────────────────────────

export const ACTIVITY_ACTIONS = {
  STAFF_INVITED: "STAFF_INVITED",
  INVITATION_ACCEPTED: "INVITATION_ACCEPTED",
  INVITATION_CANCELLED: "INVITATION_CANCELLED",
  INVITATION_RESENT: "INVITATION_RESENT",
  ROLE_CHANGED: "ROLE_CHANGED",
  STATUS_CHANGED: "STATUS_CHANGED",
  OWNERSHIP_TRANSFERRED: "OWNERSHIP_TRANSFERRED",
} as const;

export type ActivityAction =
  (typeof ACTIVITY_ACTIONS)[keyof typeof ACTIVITY_ACTIONS];

export async function logActivity(
  companyId: string,
  userId: string,
  action: ActivityAction,
  description: string,
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: { companyId, userId, action, description },
    });
  } catch (err) {
    // Activity logging must never crash the main request
    console.error("[ActivityLog] Failed to write:", err);
  }
}

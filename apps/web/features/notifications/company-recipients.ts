import type { OfferSubscriber } from "./outbox/driver-offers";

/**
 * All active operator users of a company — canonical notification recipient
 * resolution.
 *
 * P2-1: rostered drivers must never receive company notifications. Their
 * legacy DRIVER-role Operator rows (auto-created by createDriver before
 * Phase 17) are excluded here as defense-in-depth on top of the migration
 * that soft-deletes those rows.
 */
export async function companyOperatorRecipients(
  db: { operator: any },
  companyId: string,
): Promise<OfferSubscriber[]> {
  const ops = await db.operator.findMany({
    where: {
      companyId,
      isActive: true,
      deletedAt: null,
      role: { not: "DRIVER" },
    },
    include: { user: true },
  });
  return ops.map((o: any) => ({
    subscriberId: o.userId,
    ...(o.user.email ? { email: o.user.email } : {}),
    ...(o.user.fullName ? { firstName: o.user.fullName.split(" ")[0] } : {}),
  }));
}

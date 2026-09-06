import { REQUIRED_OPERATOR_DOCUMENT_TYPES } from "@moja/schemas";
import type { PrismaClient } from "@moja/db";

type Tx = Pick<PrismaClient, "companyDocument" | "companyVerification">;

/**
 * Marks current required compliance docs APPROVED and syncs CompanyVerification
 * checklist flags. Used by admin company approve + historical backfill.
 *
 * Leaves REJECTED / EXPIRED / optional doc types untouched.
 */
export async function approveRequiredOperatorDocuments(
  tx: Tx,
  params: {
    companyId: string;
    reviewedById?: string | null;
    reviewedAt?: Date;
  },
): Promise<{ documentsUpdated: number }> {
  const reviewedAt = params.reviewedAt ?? new Date();
  const reviewedById = params.reviewedById ?? null;

  const result = await tx.companyDocument.updateMany({
    where: {
      companyId: params.companyId,
      isCurrent: true,
      supersededAt: null,
      type: { in: [...REQUIRED_OPERATOR_DOCUMENT_TYPES] },
      status: "PENDING",
    },
    data: {
      status: "APPROVED",
      reviewedById,
      reviewedAt,
      notes: null,
    },
  });

  await tx.companyVerification.upsert({
    where: { companyId: params.companyId },
    update: {
      documentsVerified: true,
      permitVerified: true,
      bankVerified: true,
      reviewedById,
      reviewedAt,
    },
    create: {
      companyId: params.companyId,
      ownerIdentityVerified: false,
      bankVerified: true,
      documentsVerified: true,
      permitVerified: true,
      reviewedById,
      reviewedAt,
    },
  });

  return { documentsUpdated: result.count };
}

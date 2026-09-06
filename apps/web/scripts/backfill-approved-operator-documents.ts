/**
 * One-time backfill: for ACTIVE/VERIFIED companies, approve PENDING current
 * required compliance documents and sync CompanyVerification checklist flags.
 *
 *   pnpm --filter web tsx scripts/backfill-approved-operator-documents.ts
 *
 * Idempotent: only touches PENDING required docs; skips already APPROVED.
 */
import { getPrismaClient } from "@moja/db";
import { approveRequiredOperatorDocuments } from "../features/admin/services/approve-required-operator-documents";

async function main() {
  const prisma = getPrismaClient();

  const companies = await prisma.company.findMany({
    where: { status: { in: ["ACTIVE", "VERIFIED"] } },
    select: {
      id: true,
      name: true,
      verifiedById: true,
      documents: {
        where: {
          isCurrent: true,
          supersededAt: null,
          status: "PENDING",
          type: {
            in: [
              "BUSINESS_REGISTRATION_CERTIFICATE",
              "TAX_CLEARANCE_CERTIFICATE",
              "TRANSPORT_OPERATING_PERMIT",
            ],
          },
        },
        select: { id: true },
      },
    },
  });

  let companiesTouched = 0;
  let docsApproved = 0;

  for (const company of companies) {
    if (company.documents.length === 0) continue;

    const { documentsUpdated } = await prisma.$transaction((tx) =>
      approveRequiredOperatorDocuments(tx as any, {
        companyId: company.id,
        reviewedById: company.verifiedById,
      }),
    );

    if (documentsUpdated > 0) {
      companiesTouched += 1;
      docsApproved += documentsUpdated;
      console.log(
        `Approved ${documentsUpdated} doc(s) for ${company.name} (${company.id})`,
      );
    }
  }

  console.log(
    `Done. Companies updated: ${companiesTouched}. Documents approved: ${docsApproved}.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

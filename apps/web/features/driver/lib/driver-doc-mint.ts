import { TRPCError } from "@trpc/server";
import {
  type DriverPresignDocInput,
  driverDocKeyMatches,
} from "@/features/driver/lib/driver-doc-access";
import { createPresignedDownload } from "@/lib/storage";

/**
 * Phase-2 audit — SERVER-SIDE mint core shared by BOTH presign procedures:
 * operators pass their companyId as `viewerCompanyId` (active-affiliation
 * scoping enforced in-query, mirroring getDriver); admins omit it for
 * platform-wide access. Kept separate from the pure contracts in
 * driver-doc-access.ts because @/lib/storage is server-only.
 */
/** Minimal structural surface this helper touches on the Prisma client. */
interface MintPrisma {
  driverProfile: {
    findFirst: (args: {
      where: Record<string, unknown>;
      select: { userId: true };
    }) => Promise<{ userId: string } | null>;
  };
}

export async function mintDriverDocUrl(
  prisma: MintPrisma,
  input: DriverPresignDocInput & { viewerCompanyId?: string | null },
): Promise<{ downloadUrl: string }> {
  const driver = await prisma.driverProfile.findFirst({
    where: {
      id: input.driverProfileId,
      ...(input.viewerCompanyId
        ? {
            companyAffiliations: {
              some: { companyId: input.viewerCompanyId, isActive: true },
            },
          }
        : {}),
    },
    select: { userId: true },
  });

  if (!driver) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Driver not found or not affiliated with your company.",
    });
  }

  if (!driverDocKeyMatches(driver.userId, input.docType, input.objectKey)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Document does not belong to this driver.",
    });
  }

  return createPresignedDownload({
    purpose: input.docType,
    objectKey: input.objectKey,
  });
}

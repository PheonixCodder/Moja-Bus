import { randomBytes } from "node:crypto";
import type { PrismaClient } from "@moja/db";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCouponSuffix(length = 8): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return out;
}

export type BulkCouponResult = {
  batchId: string;
  codes: string[];
  failed: Array<{ attempt: number; code: string; error: string }>;
};

/**
 * Crypto-random bulk coupons with retry on unique collision (P3-12).
 */
export async function bulkCreateCouponCodes(
  prisma: PrismaClient,
  input: {
    campaignId: string;
    prefix: string;
    count: number;
    maxRedemptions?: number | null | undefined;
    expiresAt?: Date | null | undefined;
    maxAttemptsPerCode?: number;
  },
): Promise<BulkCouponResult> {
  const batchId = `bulk_${Date.now().toString(36)}_${generateCouponSuffix(4)}`;
  const codes: string[] = [];
  const failed: BulkCouponResult["failed"] = [];
  const maxAttempts = input.maxAttemptsPerCode ?? 5;
  const prefix = input.prefix.trim().toUpperCase();

  for (let i = 0; i < input.count; i++) {
    let created = false;
    let lastCode = "";
    let lastError = "";
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const code = `${prefix}-${generateCouponSuffix(8)}`;
      lastCode = code;
      try {
        await prisma.couponCode.create({
          data: {
            campaignId: input.campaignId,
            code,
            maxRedemptions: input.maxRedemptions ?? null,
            expiresAt: input.expiresAt ?? null,
          },
        });
        codes.push(code);
        created = true;
        break;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        // Unique collision → retry; other errors abort this slot
        if (!lastError.includes("Unique") && !lastError.includes("unique")) {
          break;
        }
      }
    }
    if (!created) {
      failed.push({
        attempt: i + 1,
        code: lastCode,
        error: lastError || "Could not allocate unique code",
      });
    }
  }

  return { batchId, codes, failed };
}

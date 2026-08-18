import "dotenv/config";
import { getPrismaClient } from "../src";

interface RawVoucher {
  id: string;
  userId: string;
  code: string | null;
  source: string;
  status: string;
  originalAmountXOF: number;
  remainingAmountXOF: number;
  reservedAmountXOF: number;
  currency: string;
  expiresAt: Date | null;
  expiresOnFirstCompletedBooking: boolean;
  scheduleId: string | null;
  companyId: string | null;
  sourceHoldGroupId: string | null;
  sourceBookingId: string | null;
  issuedByAdminId: string | null;
  campaignId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Migration Script: Migrate legacy monetary_voucher rows into credit_lot records.
 *
 * Mapping Rules:
 * 1. Promotional & Support vouchers (MARKETING_GRANT, GOODWILL, ADMIN_MANUAL, REFERRAL_REWARD)
 *    -> Migrated to CreditLot with matching source (REFERRAL_REWARD -> REFERRAL).
 * 2. Unredeemed Cancellation vouchers (CANCELLATION, MODIFICATION_DIFFERENCE)
 *    -> Migrated to CreditLot (source: GOODWILL) so passengers preserve their funds.
 * 3. Historical DiscountRedemptions with voucherId
 *    -> Updated with creditLotId pointing to the newly minted CreditLot and instrumentType='CREDIT_LOT'.
 * 4. Financial accounts with accountClass='VOUCHER_LIABILITY'
 *    -> Re-classified to 'PROMO_LIABILITY_PLATFORM'.
 */
async function main() {
  const prisma = getPrismaClient();
  console.log("=================================================");
  console.log(" Moja Bus: Legacy Voucher -> Promo Credit Migration");
  console.log("=================================================");

  // 1. Check if monetary_voucher table exists in Postgres
  const tableCheck = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'monetary_voucher'
    );
  `;

  if (!tableCheck[0]?.exists) {
    console.log("ℹ Table 'monetary_voucher' does not exist in the database. Nothing to migrate.");
    return;
  }

  // 2. Fetch all existing monetary_voucher records
  const vouchers = await prisma.$queryRaw<RawVoucher[]>`
    SELECT * FROM "monetary_voucher" ORDER BY "createdAt" ASC;
  `;

  console.log(`Found ${vouchers.length} legacy monetary_voucher record(s) to process.`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const mv of vouchers) {
    const lotId = `lot_migrated_${mv.id}`;
    const grantIdempotencyKey = `migrated-voucher-${mv.id}`;

    // Map source
    let targetSource: "REFERRAL" | "MARKETING_GRANT" | "ADMIN_MANUAL" | "GOODWILL";
    if (mv.source === "REFERRAL_REWARD") {
      targetSource = "REFERRAL";
    } else if (mv.source === "MARKETING_GRANT") {
      targetSource = "MARKETING_GRANT";
    } else if (mv.source === "ADMIN_MANUAL") {
      targetSource = "ADMIN_MANUAL";
    } else {
      targetSource = "GOODWILL";
    }

    // Map status
    let targetStatus: "PENDING" | "ACTIVE" | "PARTIALLY_REDEEMED" | "REDEEMED" | "EXPIRED" | "REVOKED";
    if (mv.status === "PARTIALLY_REDEEMED") {
      targetStatus = "PARTIALLY_REDEEMED";
    } else if (mv.status === "REDEEMED") {
      targetStatus = "REDEEMED";
    } else if (mv.status === "EXPIRED") {
      targetStatus = "EXPIRED";
    } else if (mv.status === "REVOKED" || mv.status === "CANCELLED") {
      targetStatus = "REVOKED";
    } else {
      targetStatus = "ACTIVE";
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Upsert CreditLot
        await tx.$executeRaw`
          INSERT INTO "credit_lot" (
            "id",
            "userId",
            "source",
            "status",
            "amountXOF",
            "remainingXOF",
            "reservedXOF",
            "expiresAt",
            "sourceBookingId",
            "sourceHoldGroupId",
            "grantIdempotencyKey",
            "createdAt",
            "updatedAt"
          )
          VALUES (
            ${lotId},
            ${mv.userId},
            ${targetSource}::"CreditLotSource",
            ${targetStatus}::"CreditLotStatus",
            ${mv.originalAmountXOF},
            ${mv.remainingAmountXOF},
            ${mv.reservedAmountXOF},
            ${mv.expiresAt},
            ${mv.sourceBookingId},
            ${mv.sourceHoldGroupId},
            ${grantIdempotencyKey},
            ${mv.createdAt},
            ${mv.updatedAt}
          )
          ON CONFLICT ("grantIdempotencyKey") DO NOTHING;
        `;

        // Update discount redemptions linking to this voucher
        const colCheck = await tx.$queryRaw<Array<{ exists: boolean }>>`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = 'discount_redemption' 
              AND column_name = 'voucherId'
          );
        `;

        if (colCheck[0]?.exists) {
          await tx.$executeRaw`
            UPDATE "discount_redemption"
            SET 
              "creditLotId" = ${lotId},
              "instrumentType" = 'CREDIT_LOT'::"InstrumentType"
            WHERE "voucherId" = ${mv.id} AND "creditLotId" IS NULL;
          `;
        }
      });

      migratedCount++;
    } catch (err) {
      console.error(`Failed to migrate voucher ${mv.id}:`, err);
      skippedCount++;
    }
  }

  // 3. Update any remaining discount_redemption rows with instrumentType = 'MONETARY_VOUCHER'
  await prisma.$executeRaw`
    UPDATE "discount_redemption"
    SET "instrumentType" = 'CREDIT_LOT'
    WHERE "instrumentType"::text = 'MONETARY_VOUCHER';
  `;

  // 4. Update any remaining refund rows with channel = 'VOUCHER'
  await prisma.$executeRaw`
    UPDATE "refund"
    SET "channel" = 'WALLET'
    WHERE "channel"::text = 'VOUCHER';
  `;

  // 5. Re-classify any existing financial_account VOUCHER_LIABILITY balances
  const accountsUpdated = await prisma.$executeRaw`
    UPDATE "financial_account"
    SET "accountClass" = 'PROMO_LIABILITY_PLATFORM'
    WHERE "accountClass" = 'VOUCHER_LIABILITY';
  `;

  console.log(`\nMigration completed successfully!`);
  console.log(`- Vouchers migrated to Credit Lots: ${migratedCount}`);
  console.log(`- Errors / Skipped: ${skippedCount}`);
  console.log(`- Financial Accounts re-classified: ${accountsUpdated}`);
  console.log("=================================================");
}

main()
  .catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });

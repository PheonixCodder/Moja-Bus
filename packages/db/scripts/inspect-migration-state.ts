/**
 * Phase 00 (F-DV-01) — read-only migration-state introspection.
 *
 * Prints ONLY structural metadata (enum label sets, _prisma_migrations ledger,
 * driver-table row counts). Never prints connection strings or secrets.
 *
 * Purpose: before committing previously-untracked migrations to an environment
 * that received their schema via `prisma db push`, check whether the
 * `_prisma_migrations` ledger already records them. If NOT recorded, run
 * `prisma migrate resolve --applied <name>` per migration BEFORE the next
 * `migrate deploy` — otherwise deploy will re-execute SQL (including phase18's
 * duplicate-repair DELETEs) against objects that may already exist.
 *
 * Usage: pnpm --filter @moja/db exec tsx scripts/inspect-migration-state.ts
 */
import "dotenv/config";
import { Client } from "pg";

const DRIVER_ENUMS = [
  "DriverStatus",
  "DriverVerificationStatus",
  "DriverEmploymentType",
  "LicenseCategory",
] as const;

const UNTRACKED_MIGRATIONS = [
  "20260821120000_phase09_driver_service_preference",
  "20260821130000_phase11_driver_employment_offer",
  "20260821140000_phase12_bus_type_license_category",
  "20260822000000_phase17_user_role_driver_enum",
  "20260822000000_phase18_assignment_race_safety",
  "20260822000001_phase17_driver_operator_cleanup",
] as const;

async function main() {
  const url = process.env["DATABASE_URL"];
  if (!url) {
    console.error("DATABASE_URL is not set — nothing inspected.");
    process.exit(1);
  }
  // Print host only; never credentials.
  console.log("TARGET_HOST:", new URL(url).host.replace(/:\d+$/, ":<port>"));

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  for (const enumName of DRIVER_ENUMS) {
    const res = await client.query(
      `SELECT unnest(enum_range(NULL::"${enumName}"))::text AS v`,
    );
    console.log(`ENUM ${enumName}: ${res.rows.map((r) => r.v).join(", ")}`);
  }

  const ledger = await client.query(
    `SELECT migration_name,
            (finished_at IS NOT NULL AND rolled_back_at IS NULL) AS applied
       FROM _prisma_migrations ORDER BY started_at`,
  );
  console.log(
    `--- _prisma_migrations (${ledger.rows.length} rows, applied only shown) ---`,
  );
  for (const row of ledger.rows) {
    if (row.applied) console.log("APPLIED ", row.migration_name);
  }
  console.log("--- untracked-migration presence in ledger ---");
  for (const name of UNTRACKED_MIGRATIONS) {
    const known = ledger.rows.some(
      (r: { migration_name: string }) => r.migration_name === name,
    );
    console.log(`${known ? "RECORDED   " : "NOT_RECORDED"} ${name}`);
  }

  for (const table of [
    "driver_profile",
    "driver_company_affiliation",
    "driver_service_preference",
    "driver_employment_offer",
    "trip_driver_assignment",
  ]) {
    try {
      const res = await client.query(`SELECT count(*)::int AS n FROM "${table}"`);
      console.log(`ROWS ${table}: ${res.rows[0].n}`);
    } catch {
      console.log(`ROWS ${table}: TABLE_MISSING`);
    }
  }

  await client.end();
}

main().catch((err: Error) => {
  console.error("INTROSPECTION_ERROR:", err.message.split("\n")[0]);
  process.exit(1);
});

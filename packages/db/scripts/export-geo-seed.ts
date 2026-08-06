/**
 * Exports the Côte d'Ivoire geography (city / municipality / quarter) currently
 * in the connected database into a single portable, idempotent SQL file.
 *
 * Output: `packages/db/seed/geo-seed.sql`
 *
 * The SQL uses `INSERT ... ON CONFLICT DO UPDATE` keyed on the natural unique
 * constraints (city.name, (cityId, name) for municipality, (municipalityId,
 * name) for quarter) so it can be re-run against the same database OR applied
 * to a fresh database — parent ids are resolved with subselects by name.
 * PostGIS geometry is exported via ST_AsGeoJSON and written back with
 * ST_GeomFromGeoJSON, so nothing is lost (polygons, points, coords).
 *
 * Usage:
 *   pnpm --filter @moja/db export:geo-seed
 *   psql "$DATABASE_URL" -f packages/db/seed/geo-seed.sql
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPrismaClient } from "../src";

type SqlValue = string | number | boolean | null;

const lit = (v: SqlValue): string => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (typeof v === "boolean") return v ? "true" : "false";
  return `'${String(v).replace(/'/g, "''")}'`;
};

const run = async () => {
  const prisma = getPrismaClient();

  const cities = await prisma.$queryRawUnsafe<
    {
      id: string;
      name: string;
      nameEn: string | null;
      region: string;
      district: string;
      latitude: number | null;
      longitude: number | null;
      isActive: boolean;
      isMajorHub: boolean;
      pcode: string | null;
      source: string | null;
    }[]
  >(
    `SELECT id, name, "nameEn", region, district, latitude, longitude, "isActive", "isMajorHub", pcode, source
     FROM city ORDER BY name`,
  );

  const municipalities = await prisma.$queryRawUnsafe<
    {
      id: string;
      cityId: string;
      cityName: string;
      name: string;
      nameEn: string | null;
      isActive: boolean;
      isPassThrough: boolean;
      latitude: number | null;
      longitude: number | null;
      pcode: string | null;
      source: string | null;
      geom: string | null;
    }[]
  >(
    `SELECT m.id, m."cityId", c.name AS "cityName", m.name, m."nameEn", m."isActive", m."isPassThrough",
            m.latitude, m.longitude, m.pcode, m.source, ST_AsGeoJSON(m.geometry) AS geom
     FROM municipality m
     JOIN city c ON c.id = m."cityId"
     ORDER BY c.name, m.name`,
  );

  const quarters = await prisma.$queryRawUnsafe<
    {
      id: string;
      municipalityId: string;
      cityName: string;
      muniName: string;
      name: string;
      nameEn: string | null;
      isActive: boolean;
      externalId: string | null;
      latitude: number | null;
      longitude: number | null;
      source: string | null;
      geom: string | null;
    }[]
  >(
    `SELECT q.id, q."municipalityId", c.name AS "cityName", m.name AS "muniName", q.name, q."nameEn", q."isActive", q."externalId",
            q.latitude, q.longitude, q.source, ST_AsGeoJSON(q.geometry) AS geom
     FROM quarter q
     JOIN municipality m ON m.id = q."municipalityId"
     JOIN city c ON c.id = m."cityId"
     ORDER BY c.name, m.name, q.name`,
  );

  const sql: string[] = [];
  sql.push(`-- Moja Ride — Côte d'Ivoire geography seed (idempotent snapshot)`);
  sql.push(`-- Generated: ${new Date().toISOString()}`);
  sql.push(`-- Tables: city (${cities.length}), municipality (${municipalities.length}), quarter (${quarters.length})`);
  sql.push(`-- Requires: PostGIS (CREATE EXTENSION IF NOT EXISTS postgis;)`);
  sql.push(`-- Re-runnable: upserts keyed on natural unique constraints. Parent`);
  sql.push(`-- ids resolve by name, so it works on both the existing and a fresh DB.`);
  sql.push(``);

  // ---- Cities ----
  sql.push(`-- ============ CITY ============`);
  const cityRows = cities.map(
    (c) =>
      `  (${lit(c.id)}, ${lit(c.name)}, ${lit(c.nameEn)}, ${lit(c.region)}, ${lit(c.district)}, ${lit(c.latitude)}, ${lit(c.longitude)}, ${lit(c.isActive)}, ${lit(c.isMajorHub)}, ${lit(c.pcode)}, ${lit(c.source)})`,
  );
  sql.push(`INSERT INTO city (id, name, "nameEn", region, district, latitude, longitude, "isActive", "isMajorHub", pcode, source) VALUES`);
  sql.push(cityRows.join(",\n"));
  sql.push(
    `ON CONFLICT (name) DO UPDATE SET "nameEn"=EXCLUDED."nameEn", region=EXCLUDED.region, district=EXCLUDED.district, latitude=EXCLUDED.latitude, longitude=EXCLUDED.longitude, "isActive"=EXCLUDED."isActive", "isMajorHub"=EXCLUDED."isMajorHub", pcode=EXCLUDED.pcode, source=EXCLUDED.source;`,
  );
  sql.push(``);

  // ---- Municipalities ----
  sql.push(`-- ============ MUNICIPALITY ============`);
  const muniRows = municipalities.map(
    (m) =>
      `  (${lit(m.id)}, (SELECT id FROM city WHERE name=${lit(m.cityName)}), ${lit(m.name)}, ${lit(m.nameEn)}, ${lit(m.isActive)}, ${lit(m.isPassThrough)}, ${lit(m.latitude)}, ${lit(m.longitude)}, ${lit(m.pcode)}, ${lit(m.source)}, ${m.geom ? `ST_SetSRID(ST_GeomFromGeoJSON(${lit(m.geom)}), 4326)` : "NULL"})`,
  );
  sql.push(`INSERT INTO municipality (id, "cityId", name, "nameEn", "isActive", "isPassThrough", latitude, longitude, pcode, source, geometry) VALUES`);
  sql.push(muniRows.join(",\n"));
  sql.push(
    `ON CONFLICT ("cityId", name) DO UPDATE SET "nameEn"=EXCLUDED."nameEn", "isActive"=EXCLUDED."isActive", "isPassThrough"=EXCLUDED."isPassThrough", latitude=EXCLUDED.latitude, longitude=EXCLUDED.longitude, pcode=EXCLUDED.pcode, source=EXCLUDED.source, geometry=EXCLUDED.geometry;`,
  );
  sql.push(``);

  // ---- Quarters ----
  sql.push(`-- ============ QUARTER ============`);
  const quarterRows = quarters.map(
    (q) =>
      `  (${lit(q.id)}, (SELECT id FROM municipality WHERE "cityId"=(SELECT id FROM city WHERE name=${lit(q.cityName)}) AND name=${lit(q.muniName)}), ${lit(q.name)}, ${lit(q.nameEn)}, ${lit(q.isActive)}, ${lit(q.externalId)}, ${lit(q.latitude)}, ${lit(q.longitude)}, ${lit(q.source)}, ${q.geom ? `ST_SetSRID(ST_GeomFromGeoJSON(${lit(q.geom)}), 4326)` : "NULL"})`,
  );
  sql.push(`INSERT INTO quarter (id, "municipalityId", name, "nameEn", "isActive", "externalId", latitude, longitude, source, geometry) VALUES`);
  sql.push(quarterRows.join(",\n"));
  sql.push(
    `ON CONFLICT ("municipalityId", name) DO UPDATE SET "nameEn"=EXCLUDED."nameEn", "isActive"=EXCLUDED."isActive", "externalId"=EXCLUDED."externalId", latitude=EXCLUDED.latitude, longitude=EXCLUDED.longitude, source=EXCLUDED.source, geometry=EXCLUDED.geometry;`,
  );
  sql.push(``);

  const outDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "seed",
  );
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "geo-seed.sql");
  fs.writeFileSync(outPath, sql.join("\n"), "utf8");
  console.log(`✅ Wrote ${outPath} (${cities.length} cities, ${municipalities.length} municipalities, ${quarters.length} quarters)`);

  await prisma.$disconnect();
};

run().catch((e) => {
  console.error("❌ Export failed:", e);
  process.exit(1);
});

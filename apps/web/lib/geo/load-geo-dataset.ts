import type { PrismaClient } from "@moja/db";
import type { GeoMunicipality, GeoQuarter } from "./geocode-point";

export interface GeoDataset {
  municipalities: GeoMunicipality[];
  quarters: GeoQuarter[];
}

/**
 * Load the full active geography dataset (municipality polygons via
 * ST_AsGeoJSON + curated coordinates, and quarter centroids) once, as needed
 * by both `locations.geocodePoint` and the capture-link submit resolver.
 */
export async function loadGeoDataset(
  prisma: PrismaClient,
): Promise<GeoDataset> {
  const rawMunis = await prisma.$queryRaw<
    Array<{
      id: string;
      cityId: string;
      cityName: string;
      name: string;
      latitude: number | null;
      longitude: number | null;
      geometry: string | null;
    }>
  >`
    SELECT m."id",
           m."cityId",
           c."name" AS "cityName",
           m."name",
           m."latitude",
           m."longitude",
           ST_AsGeoJSON(m."geometry") AS "geometry"
    FROM "municipality" m
    JOIN "city" c ON c."id" = m."cityId"
    WHERE m."isActive" = true
  `;

  const rawQuarters = await prisma.$queryRaw<
    Array<{
      id: string;
      municipalityId: string;
      name: string;
      latitude: number | null;
      longitude: number | null;
    }>
  >`
    SELECT q."id",
           q."municipalityId",
           q."name",
           q."latitude",
           q."longitude"
    FROM "quarter" q
    WHERE q."isActive" = true
  `;

  const municipalities: GeoMunicipality[] = rawMunis.map((m) => {
    let polygons: number[][][][] | null = null;
    if (m.geometry) {
      const parsed = JSON.parse(m.geometry) as {
        type: string;
        coordinates: number[][][][] | number[][][];
      };
      polygons =
        parsed.type === "Polygon"
          ? [parsed.coordinates as number[][][]]
          : parsed.type === "MultiPolygon"
            ? (parsed.coordinates as number[][][][])
            : null;
    }
    return {
      id: m.id,
      cityId: m.cityId,
      cityName: m.cityName,
      name: m.name,
      latitude: m.latitude,
      longitude: m.longitude,
      polygons,
    };
  });

  const quarters: GeoQuarter[] = rawQuarters.map((q) => ({
    id: q.id,
    municipalityId: q.municipalityId,
    name: q.name,
    latitude: q.latitude,
    longitude: q.longitude,
  }));

  return { municipalities, quarters };
}

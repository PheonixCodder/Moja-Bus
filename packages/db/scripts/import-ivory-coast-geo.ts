/**
 * Full Côte d'Ivoire geography importer (M0).
 *
 * Idempotent, re-runnable pipeline that replaces the hand-written 30-city seed:
 *   1. Cities   <- OSM `city`/`town` places + GADM department capitals + existing seed, deduped
 *   2. Regions/Districts derived by point-in-polygon against authoritative GeoJSON
 *   3. Municipality (commune) = pass-through per city, geometry = containing sous-préfecture polygon
 *      (Abidjan's 13 seeded communes are preserved untouched)
 *   4. Quarter = OSM suburb/neighbourhood/village points inside each municipality polygon
 *   5. Geometry written via PostGIS (ST_GeomFromGeoJSON) through raw SQL
 *   6. CompanyLocation free-text `city` backfilled to new cityId
 *
 * Sources (all in `ivory_coast_data/`, plain GeoJSON):
 *   - populated_places.geojson  (converted from .gpkg, points)
 *   - SousPrefecture.geojson    (510 polygon), Departement/Region/District.geojson
 *   - civ_admincapitals.geojson (108 department capitals)
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPrismaClient } from "../src";

const DATA_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "ivory_coast_data",
);

const normalize = (str: string) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

type Feat = { properties: Record<string, any>; geometry: any };

/**
 * Abidjan's 13 communes (kept verbatim from the original seed) with their
 * curated quarters. These are not derived from the GeoJSON sources — they are
 * platform-seeded so Abidjan's dense urban fabric is preserved.
 */
const ABIDJAN_COMMUNES: { name: string; quarters: string[] }[] = [
  {
    name: "Abobo",
    quarters: [
      "Abobo Baoule",
      "Abobo Sagbe",
      "Abobo Te",
      "Agbekoi",
      "Anonkoi 2",
      "Gare Abobo",
    ],
  },
  {
    name: "Adjamé",
    quarters: [
      "Adjamé Liberté",
      "Adjamé village",
      "Anador",
      "Attié",
      "Djinou",
      "Monsieur",
    ],
  },
  {
    name: "Attécoubé",
    quarters: [
      "Abia",
      "Agbo",
      "Ahongbon",
      "Attecoube Centre",
      "Baco",
      "Camp Militaire",
      "Dogosso",
      "Gare Attecoube",
    ],
  },
  {
    name: "Cocody",
    quarters: [
      "Angré",
      "Blokosso",
      "Bonie",
      "Cocody Centre",
      "Danga",
      "Deux-Plateaux",
      "M'Badon",
      "Palmeraie",
      "Riviera 2",
      "Riviera 3",
      "Riviera 4",
      "Saint-Jean",
    ],
  },
  {
    name: "Koumassi",
    quarters: [
      "Koumassi Campement",
      "Koumassi Gare",
      "Koumassi Marché",
      "Koumassi Nord",
      "Koumassi Remblais",
      "Koumassi Sud",
      "Petite Koumassi",
    ],
  },
  {
    name: "Marcory",
    quarters: [
      "Anoumabo",
      "Marcory Avenue 3",
      "Marcory Gare",
      "Marcory Nord",
      "Marcory Sud",
      "Marcory Zone 4",
    ],
  },
  {
    name: "Plateau",
    quarters: ["Le Plateau", "Plateau Centre", "Plateau Gare", "Plateau Nord"],
  },
  {
    name: "Port-Bouët",
    quarters: [
      "Abidjan Port",
      "Gare Port-Bouet",
      "Koumassi Port",
      "Port Bouet Centre",
      "Vridi",
      "Vridi Gare",
    ],
  },
  {
    name: "Treichville",
    quarters: [
      "Belleville",
      "Djelan",
      "Ficgayo",
      "Gare Treichville",
      "Mobidoum",
      "Treichville Centre",
    ],
  },
  {
    name: "Yopougon",
    quarters: [
      "Andokoi",
      "Ayé",
      "Bel Air",
      "Camp Militaire",
      "Gare Yopougon",
      "Koute",
      "Nianguan",
      "Niangon",
      "Niangon Adiaho",
      "Selmer",
      "Sicogi",
      "Sodeci",
      "Toit Rouge",
      "Yopougon Centre",
    ],
  },
  { name: "Anyama", quarters: ["Anyama Centre", "Anyama Gare", "Anyama Nord"] },
  { name: "Bingerville", quarters: ["Bingerville Centre", "Bingerville Gare"] },
  { name: "Brodoukou", quarters: ["Brodoukou Centre"] },
];

function readGeoJSON(name: string): { features: Feat[] } {
  const raw = fs.readFileSync(path.join(DATA_DIR, name), "utf8");
  return JSON.parse(raw);
}

/**
 * Curated coordinates for Abidjan's 13 communes + 81 quarters, sourced from
 * OSM (ivory-coast.gpkg) and user-supplied values. Keyed by
 * commune -> quarter -> { latitude, longitude }. An empty commune key carries
 * the commune's own coordinates.
 */
type CuratedCoords = { latitude: number; longitude: number };
function readAbidjanCoords(): {
  communes: Map<string, CuratedCoords>;
  quarters: Map<string, CuratedCoords>;
} {
  const csvPath = path.join(DATA_DIR, "abidjan_communes_quarters_osm.csv");
  if (!fs.existsSync(csvPath)) {
    console.warn(
      `  (${csvPath} not found — Abidjan communes/quarters keep null coordinates)`,
    );
    return { communes: new Map(), quarters: new Map() };
  }
  const lines = fs
    .readFileSync(csvPath, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("level,"));
  const communes = new Map<string, CuratedCoords>();
  const quarters = new Map<string, CuratedCoords>();
  let commune: string | null = null;
  for (const line of lines) {
    const parts = line.split(",");
    const [level, _comm, name, , latRaw, lonRaw] = parts;
    const lat = Number.parseFloat(latRaw ?? "");
    const lon = Number.parseFloat(lonRaw ?? "");
    const coords: CuratedCoords | null =
      Number.isFinite(lat) && Number.isFinite(lon)
        ? { latitude: lat, longitude: lon }
        : null;
    if (level === "commune") {
      commune = name;
      if (coords) communes.set(name, coords);
    } else if (level === "quarter" && commune && coords) {
      quarters.set(`${commune}\u0000${name}`, coords);
    }
  }
  return { communes, quarters };
}

// ---- Point-in-polygon (ray casting) with bbox prefilter ----
function pointInRing(pt: [number, number], ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]![0],
      yi = ring[i]![1];
    const xj = ring[j]![0],
      yj = ring[j]![1];
    const intersect =
      yi > pt[1] !== yj > pt[1] &&
      pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInGeometry(pt: [number, number], geom: any): boolean {
  if (!geom) return false;
  const polys: number[][][][] =
    geom.type === "Polygon"
      ? [geom.coordinates]
      : geom.type === "MultiPolygon"
        ? geom.coordinates
        : [];
  for (const poly of polys) {
    const outer = poly[0] ?? [];
    if (!pointInRing(pt, outer)) continue;
    let inHole = false;
    for (let r = 1; r < poly.length; r++) {
      if (pointInRing(pt, poly[r]!)) {
        inHole = true;
        break;
      }
    }
    if (!inHole) return true;
  }
  return false;
}

function bboxOf(geom: any): [number, number, number, number] | null {
  if (!geom || !Array.isArray(geom.coordinates)) return null;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  const walk = (cs: any) => {
    if (typeof cs[0] === "number") {
      minX = Math.min(minX, cs[0]);
      maxX = Math.max(maxX, cs[0]);
      minY = Math.min(minY, cs[1]);
      maxY = Math.max(maxY, cs[1]);
    } else for (const c of cs) walk(c);
  };
  walk(geom.coordinates);
  return [minX, minY, maxX, maxY];
}

function buildSpatialIndex(feats: Feat[]) {
  return feats
    .map((f) => ({ f, bbox: bboxOf(f.geometry) }))
    .filter((x) => x.bbox);
}

function findContaining(
  index: { f: Feat; bbox: [number, number, number, number] }[],
  pt: [number, number],
): Feat | null {
  for (const { f, bbox } of index) {
    if (
      pt[0] < bbox[0] ||
      pt[0] > bbox[2] ||
      pt[1] < bbox[1] ||
      pt[1] > bbox[3]
    )
      continue;
    if (pointInGeometry(pt, f.geometry)) return f;
  }
  return null;
}

export async function runIvoryCoastGeoImport(
  prisma: ReturnType<typeof getPrismaClient>,
): Promise<void> {
  // ---- Load sources ----
  const places = readGeoJSON("populated_places.geojson").features;
  const sousPref = readGeoJSON("SousPrefecture.geojson").features;
  const regionGeo = readGeoJSON("Region.geojson").features;
  const districtGeo = readGeoJSON("District.geojson").features;
  const capitals = readGeoJSON("civ_admincapitals.geojson").features;

  const spIndex = buildSpatialIndex(sousPref);
  const regionIndex = buildSpatialIndex(regionGeo);
  const districtIndex = buildSpatialIndex(districtGeo);

  const spByName = new Map<string, Feat>();
  for (const f of sousPref) {
    const k = normalize(f.properties.NomSp);
    if (!spByName.has(k)) spByName.set(k, f);
  }

  // ---- Build city candidates (dedup by normalized name) ----
  type CityCandidate = {
    name: string;
    nameEn?: string;
    lat: number;
    lon: number;
    source: string;
    place: string;
    population?: string | null;
  };
  const candidates = new Map<string, CityCandidate>();
  const addCandidate = (c: CityCandidate) => {
    const k = normalize(c.name);
    const existing = candidates.get(k);
    if (!existing || (existing.place !== "city" && c.place === "city")) {
      candidates.set(k, c);
    }
  };

  for (const f of places) {
    if (!["city", "town"].includes(f.properties.place)) continue;
    const name = f.properties.name || f.properties.name_latin;
    if (!name) continue;
    addCandidate({
      name,
      nameEn: f.properties.name_en ?? undefined,
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      source: "OSM",
      place: f.properties.place,
      population: f.properties.population ?? null,
    });
  }
  for (const f of capitals) {
    const name = f.properties.name;
    if (!name) continue;
    addCandidate({
      name,
      lat: f.properties.y_coord,
      lon: f.properties.x_coord,
      source: "GADM",
      place: "capital",
      population: null,
    });
  }

  // Include every existing seeded city so legacy rows stay active.
  const existingCities = await prisma.city.findMany();
  for (const c of existingCities) {
    const k = normalize(c.name);
    if (!candidates.has(k)) {
      candidates.set(k, {
        name: c.name,
        lat: c.latitude ?? 0,
        lon: c.longitude ?? 0,
        source: "LEGACY",
        place: "seed",
        population: null,
      });
    }
  }

  // ---- City pass ----
  const cityIdByName = new Map<string, string>();
  let cityCreated = 0;
  let cityUpdated = 0;
  const cityNoSp: string[] = [];

  // Major hubs flagged on a fresh DB; preserved automatically on re-runs since
  // the update data below never touches isMajorHub.
  const MAJOR_HUBS = new Set(
    [
      "Abidjan",
      "Bouaké",
      "Yamoussoukro",
      "San-Pédro",
      "Daloa",
      "Korhogo",
      "Man",
    ].map(normalize),
  );

  for (const cand of candidates.values()) {
    const sp =
      findContaining(spIndex, [cand.lon, cand.lat]) ??
      spByName.get(normalize(cand.name)) ??
      null;
    if (!sp) cityNoSp.push(cand.name);

    const regFeat = findContaining(regionIndex, [cand.lon, cand.lat]);
    const distFeat = findContaining(districtIndex, [cand.lon, cand.lat]);
    const region = regFeat?.properties.NomReg ?? null;
    const district = distFeat?.properties.NomDistric ?? null;

    const existing = existingCities.find(
      (c) => normalize(c.name) === normalize(cand.name),
    );
    const isMajorHub = MAJOR_HUBS.has(normalize(cand.name));
    const data = {
      name: cand.name,
      latitude: cand.lat,
      longitude: cand.lon,
      region: region ?? existing?.region ?? "Côte d'Ivoire",
      district: district ?? existing?.district ?? "Côte d'Ivoire",
      pcode: sp
        ? `${sp.properties.CodDistric}.${sp.properties.CodReg}.${sp.properties.CodDep}.${sp.properties.CodSp}`
        : null,
      source: cand.source,
      isMajorHub: existing ? existing.isMajorHub : isMajorHub,
    };
    const city = existing
      ? await prisma.city.update({ where: { id: existing.id }, data })
      : await prisma.city.create({ data: { ...data, isActive: true } });
    if (existing) cityUpdated += 1;
    else cityCreated += 1;
    cityIdByName.set(normalize(cand.name), city.id);
  }

  const cities = await prisma.city.findMany();
  console.log(
    `Cities: ${cityCreated} created, ${cityUpdated} updated, ${cities.length} total.`,
  );
  if (cityNoSp.length)
    console.log(
      `  (${cityNoSp.length} cities had no matching sous-préfecture)`,
    );

  // ---- Municipality pass ----
  const ABIDJAN = "Abidjan";
  const munisBefore = await prisma.municipality.count();
  const municipalityByCityName = new Map<
    string,
    { id: string; name: string }
  >();
  const cityById = new Map(cities.map((c) => [c.id, c]));
  const muniGeomSql: { id: string; geojson: string }[] = [];

  // Abidjan's 13 curated communes (not derived from GeoJSON). Seeded here so the
  // importer is the single source of truth for all geography.
  const abidjanCity = cities.find(
    (c) => normalize(c.name) === normalize(ABIDJAN),
  );
  const { communes: abidjanCommuneCoords, quarters: abidjanQuarterCoords } =
    readAbidjanCoords();
  let abidjanCommons = 0;
  let abidjanQuarters = 0;
  if (abidjanCity) {
    for (const commune of ABIDJAN_COMMUNES) {
      const cCoords = abidjanCommuneCoords.get(commune.name);
      const muni = await prisma.municipality.upsert({
        where: { cityId_name: { cityId: abidjanCity.id, name: commune.name } },
        update: {
          isActive: true,
          source: "CURATED",
          latitude: cCoords?.latitude ?? undefined,
          longitude: cCoords?.longitude ?? undefined,
        },
        create: {
          cityId: abidjanCity.id,
          name: commune.name,
          isPassThrough: false,
          isActive: true,
          source: "CURATED",
          latitude: cCoords?.latitude,
          longitude: cCoords?.longitude,
        },
      });
      abidjanCommons += 1;
      for (const qName of commune.quarters) {
        const qCoords = abidjanQuarterCoords.get(
          `${commune.name}\u0000${qName}`,
        );
        await prisma.quarter.upsert({
          where: {
            municipalityId_name: { municipalityId: muni.id, name: qName },
          },
          update: {
            isActive: true,
            source: "CURATED",
            latitude: qCoords?.latitude ?? undefined,
            longitude: qCoords?.longitude ?? undefined,
          },
          create: {
            municipalityId: muni.id,
            name: qName,
            isActive: true,
            source: "CURATED",
            latitude: qCoords?.latitude,
            longitude: qCoords?.longitude,
          },
        });
        abidjanQuarters += 1;
      }
    }
  }

  for (const city of cities) {
    if (normalize(city.name) === normalize(ABIDJAN)) continue; // Abidjan handled above
    const sp =
      city.latitude && city.longitude
        ? (findContaining(spIndex, [city.longitude, city.latitude]) ??
          spByName.get(normalize(city.name)) ??
          null)
        : null;

    const muni = await prisma.municipality.upsert({
      where: { cityId_name: { cityId: city.id, name: city.name } },
      update: {
        isPassThrough: true,
        isActive: true,
        latitude: city.latitude,
        longitude: city.longitude,
        pcode: sp
          ? `${sp.properties.CodDistric}.${sp.properties.CodReg}.${sp.properties.CodDep}.${sp.properties.CodSp}`
          : city.pcode,
        source: sp ? "GADM" : city.source,
      },
      create: {
        cityId: city.id,
        name: city.name,
        isPassThrough: true,
        isActive: true,
        latitude: city.latitude,
        longitude: city.longitude,
        pcode: sp
          ? `${sp.properties.CodDistric}.${sp.properties.CodReg}.${sp.properties.CodDep}.${sp.properties.CodSp}`
          : null,
        source: sp ? "GADM" : city.source,
      },
    });
    if (sp) {
      muniGeomSql.push({ id: muni.id, geojson: JSON.stringify(sp.geometry) });
    }
    municipalityByCityName.set(normalize(city.name), {
      id: muni.id,
      name: city.name,
    });
  }

  // Write municipality polygons via PostGIS (Unsupported("geometry") => raw SQL).
  for (const { id, geojson } of muniGeomSql) {
    await prisma.$executeRaw`
      UPDATE "municipality"
      SET "geometry" = ST_SetSRID(ST_GeomFromGeoJSON(${geojson}), 4326)
      WHERE "id" = ${id}
    `;
  }

  const munis = await prisma.municipality.findMany();
  console.log(
    `Municipalities: ${munis.length - munisBefore} new (${munis.length} total, ` +
      `incl. ${abidjanCommons} Abidjan communes with ${abidjanQuarters} quarters).`,
  );

  // ---- Cleanup: drop stale legacy pass-through municipalities.
  // A legacy seed pass-through (source = null) is superseded when the city now
  // has a GADM pass-through (same normalized name). Safe to delete when unused.
  const cityById2 = new Map(cities.map((c) => [c.id, c]));
  const byCityNorm = new Map<
    string,
    { m: (typeof munis)[number]; normName: string }[]
  >();
  for (const m of munis) {
    const city = cityById2.get(m.cityId);
    if (!city || !m.isPassThrough) continue;
    const arr = byCityNorm.get(city.id) ?? [];
    arr.push({ m, normName: normalize(m.name) });
    byCityNorm.set(city.id, arr);
  }
  let staleDeleted = 0;
  for (const arr of byCityNorm.values()) {
    if (arr.length < 2) continue;
    const hasSource = arr.some((x) => !!x.m.source);
    for (const { m } of arr) {
      if (!m.source && hasSource) {
        const refs = await prisma.$transaction([
          prisma.quarter.count({ where: { municipalityId: m.id } }),
          prisma.companyLocation.count({ where: { municipalityId: m.id } }),
        ]);
        if (refs[0] === 0 && refs[1] === 0) {
          await prisma.municipality.delete({ where: { id: m.id } });
          staleDeleted += 1;
        }
      }
    }
  }
  if (staleDeleted) {
    console.log(
      `Cleanup: removed ${staleDeleted} stale legacy pass-through municipalities.`,
    );
  }

  // ---- Quarter pass ----
  const quarterSources = places.filter((f) =>
    ["suburb", "neighbourhood", "village"].includes(f.properties.place),
  );
  const munisForQuarters = await prisma.municipality.findMany();
  const spByPcode = new Map<string, Feat>();
  for (const f of sousPref) {
    spByPcode.set(
      `${f.properties.CodDistric}.${f.properties.CodReg}.${f.properties.CodDep}.${f.properties.CodSp}`,
      f,
    );
  }
  const muniSpatial = munisForQuarters
    .map((m) => {
      const sp = m.pcode ? (spByPcode.get(m.pcode) ?? null) : null;
      if (!sp || !sp.geometry) return null;
      const bbox = bboxOf(sp.geometry);
      if (!bbox) return null;
      return { m, bbox, geom: sp.geometry };
    })
    .filter(
      (
        x,
      ): x is {
        m: (typeof munis)[number];
        bbox: [number, number, number, number];
        geom: any;
      } => !!x,
    );

  // Grid index: bucket each municipality under every cell its bbox touches, so
  // a point only tests municipalities overlapping its own cell. Cell size 1/50°.
  const CELL = 1 / 50; // 0.02°
  const cellKey = (lon: number, lat: number) =>
    `${Math.floor(lon * 50)}:${Math.floor(lat * 50)}`;
  const grid = new Map<
    string,
    {
      m: (typeof munis)[number];
      bbox: [number, number, number, number];
      geom: any;
    }[]
  >();
  for (const entry of muniSpatial) {
    const [minX, minY, maxX, maxY] = entry.bbox;
    const c0 = Math.floor(minX * 50),
      c1 = Math.floor(minY * 50);
    const c2 = Math.floor(maxX * 50),
      c3 = Math.floor(maxY * 50);
    for (let cx = c0; cx <= c2; cx++) {
      for (let cy = c1; cy <= c3; cy++) {
        const k = `${cx}:${cy}`;
        const arr = grid.get(k);
        if (arr) arr.push(entry);
        else grid.set(k, [entry]);
      }
    }
  }

  // Assign each OSM place to the municipality whose sous-préfecture polygon
  // contains it (single point-in-polygon pass over the grid-candidate index).
  const quarterAssignments = new Map<
    string,
    { m: (typeof munis)[number]; lon: number; lat: number; q: Feat }
  >();
  for (const q of quarterSources) {
    const lon = q.geometry.coordinates[0];
    const lat = q.geometry.coordinates[1];
    const pt: [number, number] = [lon, lat];
    const candidates = grid.get(cellKey(lon, lat)) ?? [];
    for (const { m, bbox, geom } of candidates) {
      if (
        pt[0] < bbox[0] ||
        pt[0] > bbox[2] ||
        pt[1] < bbox[1] ||
        pt[1] > bbox[3]
      )
        continue;
      if (!pointInGeometry(pt, geom)) continue;
      const key = `${m.id}:${normalize(q.properties.name)}`;
      if (!quarterAssignments.has(key))
        quarterAssignments.set(key, { m, lon, lat, q });
      break;
    }
  }

  // Batch-upsert: load existing quarters once, create only rows that are new.
  // (Re-runs refresh nothing — the OSM source is static and coordinates never drift.)
  const existingQuarters = await prisma.quarter.findMany({
    select: { municipalityId: true, name: true },
  });
  const existingKey = new Set(
    existingQuarters.map((q) => `${q.municipalityId}:${normalize(q.name)}`),
  );

  const toCreate: {
    municipalityId: string;
    name: string;
    latitude: number;
    longitude: number;
    externalId: string | null;
    source: string;
  }[] = [];

  for (const { m, lon, lat, q } of quarterAssignments.values()) {
    const qName = q.properties.name || q.properties.name_latin;
    const key = `${m.id}:${normalize(qName)}`;
    if (existingKey.has(key)) continue;
    toCreate.push({
      municipalityId: m.id,
      name: qName,
      latitude: lat,
      longitude: lon,
      externalId: q.properties.id ?? null,
      source: "OSM",
    });
  }

  let quarterCreated = 0;
  if (toCreate.length) {
    const created = await prisma.quarter.createMany({
      data: toCreate,
      skipDuplicates: true,
    });
    quarterCreated = created.count;
  }
  const qCount = await prisma.quarter.count();
  console.log(
    `Quarters: ${toCreate.length} to create (${quarterCreated} created), ${qCount} total. ` +
      `${quarterSources.length} OSM place candidates, ${quarterAssignments.size} assigned to a municipality.`,
  );

  // ---- Backfill CompanyLocation free-text city ----
  const locations = await prisma.companyLocation.findMany({
    where: { cityId: null, city: { not: null } },
    select: { id: true, city: true, cityId: true },
  });
  let locFixed = 0;
  for (const loc of locations) {
    if (!loc.city) continue;
    const cityId = cityIdByName.get(normalize(loc.city));
    if (!cityId) continue;
    await prisma.companyLocation.update({
      where: { id: loc.id },
      data: { cityId },
    });
    locFixed += 1;
  }
  console.log(
    `CompanyLocations: resolved cityId for ${locFixed} of ${locations.length} legacy rows.`,
  );

  // ---- Reconciliation ----
  const spUsed = new Set(
    munis.map((m) => m.pcode).filter((p): p is string => !!p),
  );
  const spTotal = sousPref.length;
  console.log("\n=== Reconciliation ===");
  console.log(
    `Districts: ${districtGeo.length} | Regions: ${regionGeo.length} | Sous-préfectures: ${spTotal} (${spUsed.size} linked to a municipality)`,
  );
  console.log(
    `Cities ${cities.length} | Municipalities ${munis.length} | Quarters ${qCount}`,
  );
}

// CLI entrypoint (only when executed directly, not when imported by seed.ts).
if (process.argv[1]?.endsWith("import-ivory-coast-geo.ts")) {
  runIvoryCoastGeoImport(getPrismaClient())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

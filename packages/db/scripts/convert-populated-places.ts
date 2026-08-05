/**
 * One-time converter: `populated_places.gpkg` -> `populated_places.geojson`
 *
 * Reads the GeoPackage (a SQLite DB) with Node's built-in `node:sqlite` (no GDAL
 * dependency), decodes GeoPackage Binary (GPB) point/centroid geometry, and emits
 * a GeoJSON FeatureCollection filtered to the places the geo importer needs:
 * cities/towns (City candidates) and suburbs/neighbourhoods/named villages
 * (Quarter candidates). Runs against the committed `.gpkg` so the importer only
 * ever reads plain GeoJSON.
 */
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const GPKG = path.join(here, "..", "..", "..", "ivory_coast_data", "populated_places.gpkg");
const OUT = path.join(here, "..", "..", "..", "ivory_coast_data", "populated_places.geojson");

/** Decode a GPB geometry blob into [lon, lat] (centroid for polygons/lines). */
function decodePoint(blob) {
  const b = Buffer.from(blob);
  if (b.length < 8 || b[0] !== 0x47 || b[1] !== 0x50) return null; // not "GP"
  const flags = b[3];
  const littleEndian = (flags & 0x01) === 1;
  const envelopeType = (flags >> 1) & 0x07; // 0 none, 1 xy, 2 xyz, 3 xym, 4 xyzm
  let off = 8;
  if (envelopeType > 0) off += envelopeType * 4 * 8; // skip envelope doubles (x,y[,z,m] min/max)
  if (off + 5 > b.length) return null;
  const wkbLE = b[off] === 1;
  const readU32 = (o) => (wkbLE ? b.readUInt32LE(o) : b.readUInt32BE(o));
  const readF64 = (o) => (wkbLE ? b.readDoubleLE(o) : b.readDoubleBE(o));
  const type = readU32(off + 1) & 0x7fffffff;
  const start = off + 5;

  const collect = (count) => {
    const coords = [];
    for (let i = 0; i < count; i++) {
      coords.push([readF64(start + i * 16), readF64(start + i * 16 + 8)]);
    }
    return coords;
  };
  const centroid = (coords) => {
    if (coords.length === 0) return null;
    const x = coords.reduce((s, c) => s + c[0], 0) / coords.length;
    const y = coords.reduce((s, c) => s + c[1], 0) / coords.length;
    return [x, y];
  };

  if (type === 1) return collect(1)[0] ?? null; // Point
  if (type === 2) return centroid(collect(1)); // LineString -> centroid of vertices
  if (type === 3) {
    // Polygon: ringCount(u32) then rings of [n, x,y...]
    let p = start;
    const ringCount = readU32(p);
    p += 4;
    const all = [];
    for (let r = 0; r < ringCount; r++) {
      const n = readU32(p);
      p += 4;
      const pts = [];
      for (let i = 0; i < n; i++) {
        pts.push([readF64(p), readF64(p + 8)]);
        p += 16;
      }
      all.push(...pts);
    }
    return centroid(all);
  }
  return null; // Multi*: not needed for point places
}

const db = new DatabaseSync(GPKG, { readOnly: true });

// Filter to places that carry a name AND are relevant to City/Quarter building.
const rows = db
  .prepare(
    `SELECT id, geom, name, name_latin, name_fr, place, population, is_in,
            adm1_name, adm2_name, adm3_name
     FROM populated_places
     WHERE place IN ('city','town','suburb','neighbourhood','village','hamlet')
       AND (name IS NOT NULL OR name_latin IS NOT NULL OR name_fr IS NOT NULL)
     ORDER BY fid;`,
  )
  .all();

const features = [];
for (const r of rows) {
  const lonLat = decodePoint(r.geom);
  if (!lonLat) continue;
  features.push({
    type: "Feature",
    properties: {
      id: r.id,
      name: r.name ?? r.name_latin ?? r.name_fr,
      name_latin: r.name_latin,
      name_fr: r.name_fr,
      place: r.place,
      population: r.population,
      is_in: r.is_in,
      adm1_name: r.adm1_name,
      adm2_name: r.adm2_name,
      adm3_name: r.adm3_name,
    },
    geometry: { type: "Point", coordinates: lonLat },
  });
}

const out = JSON.stringify({ type: "FeatureCollection", features });
fs.writeFileSync(OUT, out);
console.log(`Wrote ${features.length} features to ${path.relative(here, OUT)}`);
db.close();
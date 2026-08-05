/**
 * Offline geo-resolution engine (M1).
 *
 * Turns raw GPS coordinates into a resolved City / Municipality / Quarter using
 * only our own PostGIS polygons + curated coordinates — no external API, no
 * recurring cost. Pure function: the tRPC layer loads the dataset via
 * `$queryRaw` and delegates here, so the resolution rules are unit-testable.
 *
 * Resolution order:
 *   1. Municipality point-in-polygon (primary, exact).
 *   2. Nearest quarter centroid within the resolved municipality.
 *   3. Fallback (no polygon match): nearest municipality by distance.
 *   4. Address label: not derived here — callers use `formatLocationLabel`.
 */

export interface GeoMunicipality {
  id: string;
  cityId: string;
  cityName: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  /**
   * Polygon rings in GeoJSON order ([lon, lat]); one entry per polygon so a
   * MultiPolygon becomes an array of polygons, each with an outer + hole rings.
   * Null when the municipality has no geometry (e.g. curated Abidjan communes).
   */
  polygons: number[][][][] | null;
}

export interface GeoQuarter {
  id: string;
  municipalityId: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
}

export type GeoResolveMethod = "polygon" | "nearest";

export interface GeoResolvedPlace {
  cityId: string;
  cityName: string;
  municipalityId: string;
  municipalityName: string;
  quarterId: string | null;
  quarterName: string | null;
  method: GeoResolveMethod;
  /** Approximate distance (m) to the resolved quarter, else to the municipality. */
  distanceMeters: number;
}

// ---- Geometry helpers -----------------------------------------------------

function pointInRing(lon: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]![0]!;
    const yi = ring[i]![1]!;
    const xj = ring[j]![0]!;
    const yj = ring[j]![1]!;
    const intersects =
      yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/** A point is inside a polygon (outer ring, excluding holes). */
function pointInPolygon(
  lon: number,
  lat: number,
  rings: number[][][],
): boolean {
  const outer = rings[0];
  if (!outer || !pointInRing(lon, lat, outer)) return false;
  for (let r = 1; r < rings.length; r++) {
    if (pointInRing(lon, lat, rings[r]!)) return false;
  }
  return true;
}

/** Shoelace area (signed, lon/lat degrees) summed across all polygons. */
function polygonsArea(polygons: number[][][][]): number {
  let total = 0;
  for (const rings of polygons) {
    const outer = rings[0] ?? [];
    let area = 0;
    for (let i = 0, j = outer.length - 1; i < outer.length; j = i++) {
      const a = outer[i]!;
      const b = outer[j]!;
      area += a[0]! * b[1]! - b[0]! * a[1]!;
    }
    total += Math.abs(area / 2);
  }
  return total;
}

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ---- Resolver -------------------------------------------------------------

export interface GeocodeInput {
  latitude: number;
  longitude: number;
  municipalities: GeoMunicipality[];
  quarters: GeoQuarter[];
}

/**
 * Resolve a GPS point to City / Municipality / Quarter. Deterministic and
 * offline. Returns null only for invalid coordinates or an empty dataset.
 */
export function geocodePoint(input: GeocodeInput): GeoResolvedPlace | null {
  const { latitude, longitude } = input;
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  // 1. Municipality point-in-polygon (exact). If several overlapping polygons
  // contain the point, the smallest-area one wins (most specific boundary).
  let muni: GeoMunicipality | null = null;
  let method: GeoResolveMethod = "polygon";
  let muniDist: number | null = null;
  const hits = input.municipalities.filter(
    (m) =>
      m.polygons &&
      m.polygons.some((p) => pointInPolygon(longitude, latitude, p)),
  );
  if (hits.length === 1) {
    muni = hits[0]!;
  } else if (hits.length > 1) {
    muni = hits.reduce((a, b) =>
      polygonsArea(a.polygons!) < polygonsArea(b.polygons!) ? a : b,
    );
  }

  // 3. Fallback: nearest municipality by coordinate (point or polygon-less).
  if (!muni) {
    method = "nearest";
    let best: GeoMunicipality | null = null;
    let bestDist = Infinity;
    for (const m of input.municipalities) {
      if (m.latitude == null || m.longitude == null) continue;
      const d = haversineMeters(latitude, longitude, m.latitude, m.longitude);
      if (d < bestDist) {
        bestDist = d;
        best = m;
      }
    }
    if (best) {
      muni = best;
      muniDist = bestDist;
    }
  }

  if (!muni) return null;

  // 2. Nearest quarter within the resolved municipality.
  let quarter: GeoQuarter | null = null;
  let quarterDist: number | null = null;
  for (const q of input.quarters) {
    if (
      q.municipalityId !== muni.id ||
      q.latitude == null ||
      q.longitude == null
    ) {
      continue;
    }
    const d = haversineMeters(latitude, longitude, q.latitude, q.longitude);
    if (quarterDist == null || d < quarterDist) {
      quarterDist = d;
      quarter = q;
    }
  }

  return {
    cityId: muni.cityId,
    cityName: muni.cityName,
    municipalityId: muni.id,
    municipalityName: muni.name,
    quarterId: quarter?.id ?? null,
    quarterName: quarter?.name ?? null,
    method,
    distanceMeters: quarterDist ?? muniDist ?? 0,
  };
}

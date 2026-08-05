import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  type GeoMunicipality,
  type GeoQuarter,
  geocodePoint,
} from "../geocode-point";

/** A simple square polygon around a lon/lat center (±deg). */
function square(lon: number, lat: number, half = 0.01): number[][][][] {
  return [
    [
      [
        [lon - half, lat - half],
        [lon + half, lat - half],
        [lon + half, lat + half],
        [lon - half, lat + half],
        [lon - half, lat - half],
      ],
    ],
  ];
}

const muni = (
  id: string,
  name: string,
  cityId: string,
  cityName: string,
  lon: number,
  lat: number,
  polygons: number[][][][] | null = square(lon, lat),
): GeoMunicipality => ({
  id,
  name,
  cityId,
  cityName,
  latitude: lat,
  longitude: lon,
  polygons,
});

const quarter = (
  id: string,
  municipalityId: string,
  name: string,
  lon: number,
  lat: number,
): GeoQuarter => ({ id, municipalityId, name, latitude: lat, longitude: lon });

const ABIDJAN = "city-abidjan";
const ABOBO = "m-abobo";
const COCODY = "m-cocody";

function dataset(): {
  municipalities: GeoMunicipality[];
  quarters: GeoQuarter[];
} {
  return {
    municipalities: [
      muni(ABOBO, "Abobo", ABIDJAN, "Abidjan", -4.029, 5.435),
      muni(COCODY, "Cocody", ABIDJAN, "Abidjan", -3.994, 5.357),
    ],
    quarters: [
      quarter("q-baoule", ABOBO, "Abobo Baoule", -3.996, 5.4343),
      quarter("q-riviera3", COCODY, "Riviera 3", -3.958, 5.3534),
      quarter("q-angre", COCODY, "Angré", -3.9836, 5.4054),
    ],
  };
}

describe("geocodePoint — point-in-polygon (primary)", () => {
  it("resolves a point inside a municipality polygon", () => {
    const { municipalities, quarters } = dataset();
    const r = geocodePoint({
      latitude: 5.435,
      longitude: -4.029,
      municipalities,
      quarters,
    });
    assert.ok(r);
    assert.equal(r.municipalityId, ABOBO);
    assert.equal(r.municipalityName, "Abobo");
    assert.equal(r.cityId, ABIDJAN);
    assert.equal(r.cityName, "Abidjan");
    assert.equal(r.method, "polygon");
  });

  it("chooses the nearest quarter within the resolved municipality", () => {
    const { municipalities, quarters } = dataset();
    // Inside Abobo's polygon; its only quarter (Abobo Baoule) is the nearest.
    const r = geocodePoint({
      latitude: 5.43,
      longitude: -4.025,
      municipalities,
      quarters,
    });
    assert.ok(r);
    assert.equal(r.municipalityId, ABOBO);
    assert.equal(r.quarterId, "q-baoule");
    assert.equal(r.quarterName, "Abobo Baoule");
    assert.equal(r.method, "polygon");
  });

  it("returns null quarterId when the municipality has no quarters", () => {
    const { municipalities } = dataset();
    const r = geocodePoint({
      latitude: 5.435,
      longitude: -4.029,
      municipalities,
      quarters: [],
    });
    assert.ok(r);
    assert.equal(r.quarterId, null);
    assert.equal(r.quarterName, null);
    assert.equal(r.method, "polygon");
  });

  it("resolves quarters only from the resolved municipality (not neighbours)", () => {
    const { municipalities, quarters } = dataset();
    // Point inside Cocody's polygon. Abobo Baoule's coordinates are actually
    // nearest in raw distance, but the quarter lookup is scoped to the resolved
    // municipality (Cocody), so Riviera 3 must win.
    const r = geocodePoint({
      latitude: 5.355,
      longitude: -3.99,
      municipalities,
      quarters,
    });
    assert.ok(r);
    assert.equal(r.municipalityId, COCODY);
    assert.equal(r.method, "polygon");
    assert.equal(r.quarterId, "q-riviera3");
  });

  it("picks the smallest-area polygon when boundaries overlap", () => {
    const small = square(-4.02, 5.4, 0.002);
    const big = square(-4.02, 5.4, 0.01);
    const munis = [
      muni("m-big", "Big", ABIDJAN, "Abidjan", -4.02, 5.4, big),
      muni("m-small", "Small", ABIDJAN, "Abidjan", -4.02, 5.4, small),
    ];
    const r = geocodePoint({
      latitude: 5.4,
      longitude: -4.02,
      municipalities: munis,
      quarters: [],
    });
    assert.ok(r);
    assert.equal(r.municipalityId, "m-small");
    assert.equal(r.method, "polygon");
  });

  it("supports polygons with holes (point in hole is outside)", () => {
    const withHole: number[][][][] = [
      [
        [
          [-4.05, 5.4],
          [-4.0, 5.4],
          [-4.0, 5.45],
          [-4.05, 5.45],
          [-4.05, 5.4],
        ],
        [
          [-4.035, 5.42],
          [-4.015, 5.42],
          [-4.015, 5.43],
          [-4.035, 5.43],
          [-4.035, 5.42],
        ],
      ],
    ];
    const munis = [
      muni("m-hole", "WithHole", ABIDJAN, "Abidjan", -4.025, 5.425, withHole),
    ];
    // Inside the hole → falls back to nearest (its own centroid is in the hole).
    const r = geocodePoint({
      latitude: 5.425,
      longitude: -4.025,
      municipalities: munis,
      quarters: [],
    });
    assert.ok(r);
    assert.equal(r.method, "nearest");
    assert.equal(r.municipalityId, "m-hole");
  });
});

describe("geocodePoint — hierarchical nearest fallback", () => {
  it("falls back to nearest municipality when no polygon matches", () => {
    const { municipalities, quarters } = dataset();
    // Far from both polygons (no containment) — Cocody is closer.
    const r = geocodePoint({
      latitude: 5.42,
      longitude: -3.95,
      municipalities,
      quarters,
    });
    assert.ok(r);
    assert.equal(r.method, "nearest");
    assert.equal(r.municipalityId, COCODY);
  });

  it("resolves nearest quarter after the municipality fallback", () => {
    const { municipalities, quarters } = dataset();
    const r = geocodePoint({
      latitude: 5.42,
      longitude: -3.95,
      municipalities,
      quarters,
    });
    assert.ok(r);
    assert.equal(r.method, "nearest");
    assert.equal(r.quarterId, "q-angre");
  });

  it("skips polygon-less municipalities in the nearest fallback only if they lack coords", () => {
    const noCoords: GeoMunicipality = {
      id: "m-nocoords",
      name: "NoCoords",
      cityId: ABIDJAN,
      cityName: "Abidjan",
      latitude: null,
      longitude: null,
      polygons: null,
    };
    const munis = [
      noCoords,
      muni("m-far", "Far", ABIDJAN, "Abidjan", -3.9, 5.4),
    ];
    const r = geocodePoint({
      latitude: 5.4,
      longitude: -3.91,
      municipalities: munis,
      quarters: [],
    });
    assert.ok(r);
    assert.equal(r.method, "nearest");
    assert.equal(r.municipalityId, "m-far");
  });
});

describe("geocodePoint — edges & validation", () => {
  it("returns null for out-of-range coordinates", () => {
    const { municipalities, quarters } = dataset();
    assert.equal(
      geocodePoint({ latitude: 91, longitude: 0, municipalities, quarters }),
      null,
    );
    assert.equal(
      geocodePoint({ latitude: 0, longitude: -181, municipalities, quarters }),
      null,
    );
    assert.equal(
      geocodePoint({ latitude: NaN, longitude: 0, municipalities, quarters }),
      null,
    );
  });

  it("returns null for an empty dataset", () => {
    assert.equal(
      geocodePoint({
        latitude: 5.4,
        longitude: -4.0,
        municipalities: [],
        quarters: [],
      }),
      null,
    );
  });

  it("handles polygon-less municipalities that still have coords via fallback", () => {
    const curated: GeoMunicipality = {
      id: "m-curated",
      name: "Curated",
      cityId: ABIDJAN,
      cityName: "Abidjan",
      latitude: 5.35,
      longitude: -4.0,
      polygons: null,
    };
    const r = geocodePoint({
      latitude: 5.351,
      longitude: -4.002,
      municipalities: [curated],
      quarters: [],
    });
    assert.ok(r);
    assert.equal(r.municipalityId, "m-curated");
    assert.equal(r.method, "nearest");
    assert.ok(r.distanceMeters > 0);
  });

  it("reports distanceMeters to the nearest quarter", () => {
    const { municipalities, quarters } = dataset();
    const r = geocodePoint({
      latitude: 5.435,
      longitude: -4.029,
      municipalities,
      quarters,
    });
    assert.ok(r);
    assert.ok(r.distanceMeters > 0);
  });
});

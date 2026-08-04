import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatCityWithMuni,
  formatLocationLabel,
} from "@/lib/format-location-label";
import {
  seedAbidjanMunicipalities,
  seedPassThroughCities,
} from "./geo-fixtures";

describe("formatLocationLabel — urban (same city on both ends)", () => {
  it("renders the city name when no municipality/quarter is known", () => {
    assert.equal(
      formatLocationLabel({ cityName: "Abidjan", isUrban: true }),
      "Abidjan",
    );
  });

  it("renders the municipality name alone (no city) for urban searches", () => {
    assert.equal(
      formatLocationLabel({
        cityName: "Abidjan",
        municipalityName: "Cocody",
        isUrban: true,
      }),
      "Cocody",
    );
  });

  it("renders 'Municipality – Quarter' for a quarter in the same city", () => {
    assert.equal(
      formatLocationLabel({
        cityName: "Abidjan",
        municipalityName: "Cocody",
        quarterName: "Riviera 3",
        isUrban: true,
      }),
      "Cocody – Riviera 3",
    );
  });

  it("renders 'City – Quarter' when only the quarter is known (city is the base)", () => {
    assert.equal(
      formatLocationLabel({
        cityName: "Bouaké",
        quarterName: "Zone 4",
        isUrban: true,
      }),
      "Bouaké – Zone 4",
    );
  });
});

describe("formatLocationLabel — intercity (different cities)", () => {
  it("renders the plain city name with no municipality", () => {
    assert.equal(
      formatLocationLabel({ cityName: "Bouaké", isUrban: false }),
      "Bouaké",
    );
  });

  it("renders 'City (Municipality)' when the municipality is known", () => {
    assert.equal(
      formatLocationLabel({
        cityName: "Abidjan",
        municipalityName: "Cocody",
        isUrban: false,
      }),
      "Abidjan (Cocody)",
    );
  });

  it("renders 'City (Municipality - Quarter)' when the quarter is known", () => {
    assert.equal(
      formatLocationLabel({
        cityName: "Abidjan",
        municipalityName: "Cocody",
        quarterName: "Riviera 3",
        isUrban: false,
      }),
      "Abidjan (Cocody - Riviera 3)",
    );
  });
});

describe("formatLocationLabel — full seeded dataset", () => {
  it("renders every Abidjan municipality in both urban and intercity form", () => {
    for (const m of seedAbidjanMunicipalities) {
      assert.equal(
        formatLocationLabel({
          cityName: "Abidjan",
          municipalityName: m.name,
          isUrban: true,
        }),
        m.name,
        `urban muni ${m.name}`,
      );
      assert.equal(
        formatLocationLabel({
          cityName: "Abidjan",
          municipalityName: m.name,
          isUrban: false,
        }),
        `Abidjan (${m.name})`,
        `intercity muni ${m.name}`,
      );
    }
  });

  it("renders every Abidjan quarter in both urban and intercity form", () => {
    for (const m of seedAbidjanMunicipalities) {
      for (const q of m.quarters) {
        assert.equal(
          formatLocationLabel({
            cityName: "Abidjan",
            municipalityName: m.name,
            quarterName: q,
            isUrban: true,
          }),
          `${m.name} – ${q}`,
          `urban quarter ${m.name}/${q}`,
        );
        assert.equal(
          formatLocationLabel({
            cityName: "Abidjan",
            municipalityName: m.name,
            quarterName: q,
            isUrban: false,
          }),
          `Abidjan (${m.name} - ${q})`,
          `intercity quarter ${m.name}/${q}`,
        );
      }
    }
  });

  it("renders every pass-through city as its plain name (intercity)", () => {
    for (const c of seedPassThroughCities) {
      // A pass-through terminal carries a municipality named after the city
      // ("Bouaké (Bouaké)") — the label must suppress that duplicate.
      assert.equal(
        formatLocationLabel({
          cityName: c.name,
          municipalityName: c.name,
          isUrban: false,
        }),
        c.name,
      );
      assert.equal(
        formatLocationLabel({ cityName: c.name, isUrban: false }),
        c.name,
      );
    }
  });

  it("suppresses a pass-through municipality identical to the city (intercity)", () => {
    assert.equal(
      formatLocationLabel({
        cityName: "Bouaké",
        municipalityName: "Bouaké",
        isUrban: false,
      }),
      "Bouaké",
    );
    assert.equal(
      formatLocationLabel({
        cityName: "Yamoussoukro",
        municipalityName: "Yamoussoukro",
        isUrban: false,
      }),
      "Yamoussoukro",
    );
  });

  it("does NOT suppress a municipality that differs from the city (intercity)", () => {
    assert.equal(
      formatLocationLabel({
        cityName: "Abidjan",
        municipalityName: "Cocody",
        isUrban: false,
      }),
      "Abidjan (Cocody)",
    );
  });

  it("handles a pass-through city in urban mode (city only base)", () => {
    assert.equal(
      formatLocationLabel({
        cityName: "Bouaké",
        municipalityName: "Bouaké",
        isUrban: true,
      }),
      "Bouaké",
    );
  });

  it("handles empty city gracefully for both urban and intercity", () => {
    assert.equal(formatLocationLabel({ cityName: null, isUrban: true }), "");
    assert.equal(formatLocationLabel({ cityName: null, isUrban: false }), "");
  });
});

describe("formatCityWithMuni (operator surface)", () => {
  it("renders 'City (Municipality)'", () => {
    assert.equal(formatCityWithMuni("Abidjan", "Cocody"), "Abidjan (Cocody)");
  });

  it("renders plain city when municipality is missing", () => {
    assert.equal(formatCityWithMuni("Bouaké"), "Bouaké");
  });
});

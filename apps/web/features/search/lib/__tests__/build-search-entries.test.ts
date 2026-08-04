import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSearchEntries } from "../build-search-entries";
import { seedAbidjanMunicipalities, seedCities } from "./geo-fixtures";

const city = (
  name: string,
  isMajorHub = false,
): { id: string; name: string; isMajorHub: boolean } => ({
  id: `c-${name}`,
  name,
  isMajorHub,
});

/** Synthetic search results matching a typed query across the whole dataset. */
function rowsFor(query: string) {
  const cities = seedCities
    .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    .map((c) => city(c.name, c.isMajorHub));

  const municipalities: {
    id: string;
    name: string;
    isPassThrough: boolean;
    city: ReturnType<typeof city>;
  }[] = [];
  const quarters: {
    id: string;
    name: string;
    municipality: {
      id: string;
      name: string;
      city: ReturnType<typeof city>;
    };
  }[] = [];

  for (const m of seedAbidjanMunicipalities) {
    if (m.name.toLowerCase().includes(query.toLowerCase())) {
      municipalities.push({
        id: `m-${m.name}`,
        name: m.name,
        isPassThrough: false,
        city: city("Abidjan", true),
      });
    }
    for (const q of m.quarters) {
      if (q.toLowerCase().includes(query.toLowerCase())) {
        quarters.push({
          id: `q-${m.name}-${q}`,
          name: q,
          municipality: {
            id: `m-${m.name}`,
            name: m.name,
            city: city("Abidjan", true),
          },
        });
      }
    }
  }

  return { cities, municipalities, quarters };
}

describe("buildSearchEntries — pass-through suppression", () => {
  it("returns only the city row (no 'City (City)' duplicate) for a pass-through match", () => {
    // Typing "Yamoussoukro" matches the city AND its pass-through municipality
    // (named "Yamoussoukro"). The city row should win; the redundant
    // municipality row (would read "Yamoussoukro (Yamoussoukro)") is skipped.
    const cityMatch = city("Yamoussoukro", true);
    const passThroughMuni = {
      id: "m-Yamoussoukro",
      name: "Yamoussoukro",
      isPassThrough: true,
      city: cityMatch,
    };
    const entries = buildSearchEntries([cityMatch], [passThroughMuni], []);
    assert.equal(entries.length, 1);
    assert.equal(entries[0]?.level, "city");
    assert.equal(entries[0]?.name, "Yamoussoukro");
    assert.equal(entries[0]?.hierarchyLabel, "Yamoussoukro");
  });

  it("does NOT suppress a pass-through municipality when the city did not match", () => {
    // Edge: the municipality matched but the identically-named city row did not
    // (cannot happen with identical names, but the guard must not over-suppress).
    const passThroughMuni = {
      id: "m-Korhogo",
      name: "Korhogo",
      isPassThrough: true,
      city: city("Korhogo", true),
    };
    const entries = buildSearchEntries([], [passThroughMuni], []);
    assert.equal(entries.length, 1);
    assert.equal(entries[0]?.level, "municipality");
    assert.equal(entries[0]?.hierarchyLabel, "Korhogo (Korhogo)");
  });

  it("keeps a real (non-pass-through) municipality alongside its matching city", () => {
    // "Abidjan" matches the city; never suppress a real municipality entry.
    const abidjan = city("Abidjan", true);
    const cocody = {
      id: "m-Cocody",
      name: "Cocody",
      isPassThrough: false,
      city: abidjan,
    };
    const entries = buildSearchEntries([abidjan], [cocody], []);
    assert.deepEqual(
      entries.map((e) => e.hierarchyLabel),
      ["Abidjan", "Abidjan (Cocody)"],
    );
  });
});

describe("buildSearchEntries — de-dupe by full (city, muni, quarter, level) key", () => {
  it("dedupes identical quarter rows with the same key", () => {
    const abidjan = city("Abidjan", true);
    const q = {
      id: "q-Cocody-Riviera 3",
      name: "Riviera 3",
      municipality: { id: "m-Cocody", name: "Cocody", city: abidjan },
    };
    const entries = buildSearchEntries([], [], [q, q]);
    assert.equal(entries.length, 1);
    assert.equal(entries[0]?.level, "quarter");
    assert.equal(entries[0]?.hierarchyLabel, "Abidjan (Cocody - Riviera 3)");
  });

  it("keeps distinct quarters of the same municipality as separate rows", () => {
    const abidjan = city("Abidjan", true);
    const q1 = {
      id: "q-Cocody-Riviera 2",
      name: "Riviera 2",
      municipality: { id: "m-Cocody", name: "Cocody", city: abidjan },
    };
    const q2 = {
      id: "q-Cocody-Riviera 3",
      name: "Riviera 3",
      municipality: { id: "m-Cocody", name: "Cocody", city: abidjan },
    };
    const entries = buildSearchEntries([], [], [q1, q2]);
    assert.equal(entries.length, 2);
    assert.deepEqual(entries.map((e) => e.hierarchyLabel).sort(), [
      "Abidjan (Cocody - Riviera 2)",
      "Abidjan (Cocody - Riviera 3)",
    ]);
  });

  it("never collapses a quarter row into a city row (levels are part of the key)", () => {
    const abidjan = city("Abidjan", true);
    const riviera = {
      id: "q-Cocody-Riviera 3",
      name: "Riviera 3",
      municipality: { id: "m-Cocody", name: "Cocody", city: abidjan },
    };
    const entries = buildSearchEntries([abidjan], [], [riviera]);
    assert.equal(entries.length, 2);
    assert.deepEqual(
      entries.map((e) => e.level),
      ["city", "quarter"],
    );
  });
});

describe("buildSearchEntries — full seeded dataset", () => {
  it("every Abidjan municipality is reachable as a row when typed", () => {
    for (const m of seedAbidjanMunicipalities) {
      const { municipalities } = rowsFor(m.name);
      // A distinct municipality may share query text (e.g. "Camp Militaire"
      // appears in two municipalities) — assert at least the one we asked for.
      const found = municipalities.filter((x) => x.name === m.name);
      assert.ok(found.length > 0, `municipality ${m.name} missing`);
    }
  });

  it("every Abidjan quarter is reachable as a row when typed", () => {
    for (const m of seedAbidjanMunicipalities) {
      for (const q of m.quarters) {
        const { quarters: quarterRows } = rowsFor(q);
        const found = quarterRows.filter((x) => x.name === q);
        assert.ok(found.length > 0, `quarter ${m.name}/${q} missing`);
      }
    }
  });

  it("a blank query yields no rows", () => {
    assert.equal(buildSearchEntries([], [], []).length, 0);
  });
});

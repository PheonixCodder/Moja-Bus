/**
 * Assembles autocomplete search entries from raw city/municipality/quarter
 * rows into a de-duplicated, level-tagged result list. Pure — no DB access —
 * so the exact rules (dedup key, pass-through suppression) are unit-testable.
 */

export interface SearchCityRow {
  id: string;
  name: string;
  nameEn?: string | null;
  isMajorHub: boolean;
}

export interface SearchMunicipalityRow {
  id: string;
  name: string;
  isPassThrough: boolean;
  city: SearchCityRow;
}

export interface SearchQuarterRow {
  id: string;
  name: string;
  municipality: { id: string; name: string; city: SearchCityRow };
}

export interface SearchCityEntry {
  id: string;
  name: string;
  hierarchyLabel: string;
  isMajorHub: boolean;
  municipalityId: string | null;
  quarterId: string | null;
  level: "city" | "municipality" | "quarter";
}

export function buildSearchEntries(
  cities: SearchCityRow[],
  municipalities: SearchMunicipalityRow[],
  quarters: SearchQuarterRow[],
  limit = 10,
): SearchCityEntry[] {
  const results = new Map<string, SearchCityEntry>();
  const entryKey = (e: SearchCityEntry) =>
    `${e.id}|${e.municipalityId ?? ""}|${e.quarterId ?? ""}|${e.level}`;
  const add = (e: SearchCityEntry) => {
    if (!results.has(entryKey(e))) results.set(entryKey(e), e);
  };

  // 1. Direct city matches (city id is always the result id at every level)
  for (const c of cities) {
    add({
      id: c.id,
      name: c.name,
      hierarchyLabel: c.name,
      isMajorHub: c.isMajorHub,
      municipalityId: null,
      quarterId: null,
      level: "city",
    });
  }

  // 2. Municipality matches (e.g. "Cocody" → "Abidjan (Cocody)"). Pass-through
  //    municipalities share their city's name (label would collapse to
  //    "City (City)"); when the city itself already matched, the city row
  //    represents the whole place — skip the redundant municipality entry.
  for (const m of municipalities) {
    const cityMatched = Array.from(results.values()).some(
      (e) => e.level === "city" && e.id === m.city.id,
    );
    if (m.isPassThrough && cityMatched) continue;

    add({
      id: m.city.id,
      name: m.city.name,
      hierarchyLabel: `${m.city.name} (${m.name})`,
      isMajorHub: m.city.isMajorHub,
      municipalityId: m.id,
      quarterId: null,
      level: "municipality",
    });
  }

  // 3. Quarter matches (e.g. "Riviera 3" → "Abidjan (Cocody - Riviera 3)")
  for (const qr of quarters) {
    add({
      id: qr.municipality.city.id,
      name: qr.municipality.city.name,
      hierarchyLabel: `${qr.municipality.city.name} (${qr.municipality.name} - ${qr.name})`,
      isMajorHub: qr.municipality.city.isMajorHub,
      municipalityId: qr.municipality.id,
      quarterId: qr.id,
      level: "quarter",
    });
  }

  return Array.from(results.values()).slice(0, limit);
}

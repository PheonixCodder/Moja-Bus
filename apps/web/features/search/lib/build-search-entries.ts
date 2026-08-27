/**
 * Assembles autocomplete search entries from raw city/municipality/quarter/terminal
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

export interface SearchTerminalRow {
  id: string;
  name: string;
  cityId: string | null;
  municipalityId: string | null;
  quarterId: string | null;
  company: { id: string; name: string; logoUrl: string | null };
}

export interface SearchCityEntry {
  id: string;
  name: string;
  hierarchyLabel: string;
  isMajorHub: boolean;
  municipalityId: string | null;
  quarterId: string | null;
  level: "city" | "municipality" | "quarter" | "terminal";
  terminalId?: string;
  companyName?: string;
  companyId?: string;
}

export function buildSearchEntries(
  cities: SearchCityRow[],
  municipalities: SearchMunicipalityRow[],
  quarters: SearchQuarterRow[],
  terminals: SearchTerminalRow[],
  limit = 10,
): SearchCityEntry[] {
  const results = new Map<string, SearchCityEntry>();
  const entryKey = (e: SearchCityEntry) =>
    `${e.id}|${e.municipalityId ?? ""}|${e.quarterId ?? ""}|${e.terminalId ?? ""}|${e.level}`;
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

  // 4. Terminal matches — "Gare Nord (STC)" style labels
  for (const t of terminals) {
    if (!t.cityId) continue;
    add({
      id: t.cityId,
      name: t.name,
      hierarchyLabel: `${t.name} (${t.company.name})`,
      isMajorHub: false,
      municipalityId: t.municipalityId,
      quarterId: t.quarterId,
      level: "terminal",
      terminalId: t.id,
      companyName: t.company.name,
      companyId: t.company.id,
    });
  }

  // Interleave by name so terminals don't always sink to the bottom
  const entries = Array.from(results.values());
  entries.sort((a, b) =>
    a.hierarchyLabel.localeCompare(b.hierarchyLabel, "fr", {
      sensitivity: "base",
    }),
  );

  return entries.slice(0, limit);
}

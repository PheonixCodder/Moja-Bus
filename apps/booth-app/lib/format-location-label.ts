/**
 * Canonical geographic formatting for Côte d'Ivoire trips in Moja Booth.
 * Mirrors apps/web/lib/format-location-label.ts.
 *
 * Convention:
 * - Urban: "Cocody" or "Cocody – Riviera 3" (municipality/commune + quarter)
 * - Intercity: "Abidjan (Cocody)" or "Abidjan (Cocody - Riviera 3)"
 */
export interface LocationLabelParts {
  cityName: string | null | undefined;
  municipalityName?: string | null | undefined;
  quarterName?: string | null | undefined;
  isUrban: boolean;
}

export function formatLocationLabel({
  cityName,
  municipalityName,
  quarterName,
  isUrban,
}: LocationLabelParts): string {
  // Pass-through municipalities share their city's name (e.g. Bouaké / Bouaké).
  // Suppress duplicate municipality when it matches the city.
  const muni =
    municipalityName && municipalityName !== cityName ? municipalityName : null;

  if (isUrban) {
    const base = muni ?? cityName ?? "";
    return quarterName ? `${base} – ${quarterName}` : base;
  }

  const city = cityName ?? "";
  if (!muni) return city;
  return quarterName
    ? `${city} (${muni} - ${quarterName})`
    : `${city} (${muni})`;
}

/** Operator-surface variant: always "City (Muni)". */
export function formatCityWithMuni(
  cityName: string | null | undefined,
  municipalityName?: string | null,
): string {
  return formatLocationLabel({
    cityName,
    municipalityName,
    isUrban: false,
  });
}

/**
 * Returns clean primary display label and optional secondary detail for a terminal.
 */
export function formatTerminalDisplay(
  terminal: {
    name?: string | null;
    cityRelation?: { name: string } | null;
    municipality?: { name: string } | null;
    quarter?: { name: string } | null;
  } | null | undefined,
  isUrban: boolean,
): { primary: string; secondary?: string } {
  if (!terminal) return { primary: "—" };

  const cityName = terminal.cityRelation?.name;
  const municipalityName = terminal.municipality?.name;
  const quarterName = terminal.quarter?.name;

  const formattedGeo = formatLocationLabel({
    cityName,
    municipalityName,
    quarterName,
    isUrban,
  });

  const termName = terminal.name?.trim();

  // If urban and no municipality or quarter is available, prefer the terminal name over bare city name
  // so we avoid "Abidjan → Abidjan" repetition
  if (isUrban && !municipalityName && !quarterName && termName && termName.toLowerCase() !== (cityName ?? "").toLowerCase()) {
    return { primary: termName, secondary: cityName ?? undefined };
  }

  // If there's no formatted geo label, fall back to terminal name
  if (!formattedGeo) {
    return { primary: termName || "—" };
  }

  // If terminal name is specific (e.g. "Gare Nord", "Gare Centrale", "Arrêt St-Jean")
  // and doesn't exactly equal the geo label, show both gracefully
  if (
    termName &&
    termName.toLowerCase() !== formattedGeo.toLowerCase() &&
    termName.toLowerCase() !== (cityName ?? "").toLowerCase()
  ) {
    return {
      primary: formattedGeo,
      secondary: termName,
    };
  }

  return { primary: formattedGeo };
}

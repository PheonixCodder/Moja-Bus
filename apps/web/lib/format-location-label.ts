/**
 * Single label convention for a geographic place, used on every surface
 * (search, booking, tickets, operator, admin). Kills the 4 ad-hoc formats.
 *
 * Convention (R6):
 * - urban:  "Cocody" or "Cocody – Riviera 3" (quarter shown when known; city fallback)
 * - intercity: "Abidjan (Cocody)" or "Abidjan (Cocody - Riviera 3)" (quarter shown when known)
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
  // Pass-through municipalities always share their city's name (seed:
  // isPassThrough cities get a single municipality named after the city).
  // Rendering both would produce a degenerate "Bouaké (Bouaké)" — suppress the
  // municipality whenever it duplicates the city.
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

/** Operator-surface variant (R11): always "City (Muni)". */
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

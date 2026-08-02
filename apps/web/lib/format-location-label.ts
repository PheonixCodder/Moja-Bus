/**
 * Single label convention for a geographic place, used on every surface
 * (search, booking, tickets, operator, admin). Kills the 4 ad-hoc formats.
 *
 * Convention (R6):
 * - urban:  "Cocody" or "Cocody – Riviera 3" (quarter shown when known; city fallback)
 * - intercity: "Abidjan (Cocody)" (quarter never shown)
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
  if (isUrban) {
    const base = municipalityName ?? cityName ?? "";
    return quarterName ? `${base} – ${quarterName}` : base;
  }
  const city = cityName ?? "";
  return municipalityName ? `${city} (${municipalityName})` : city;
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

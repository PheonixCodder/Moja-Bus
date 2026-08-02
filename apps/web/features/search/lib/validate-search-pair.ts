import type { PlaceLevel } from "./places";

/**
 * Minimal shape shared by every search UI value (CityValue-compatible).
 */
export interface SearchPairInput {
  id: string;
  text: string;
  municipalityId?: string;
  quarterId?: string;
  level?: PlaceLevel;
}

export type PairValidationError = "sameCity" | null;

/**
 * Validates an origin/destination pair for a meaningful search.
 *
 * A pair is invalid only when both ends are indistinguishable at every level
 * they specify: identical unresolved names, same city with no refinement on
 * either side, or same municipality/quarter. One-sided refinements
 * (city → municipality, city → quarter) are valid urban searches.
 */
export function validateSearchPair(
  origin: SearchPairInput,
  destination: SearchPairInput,
): PairValidationError {
  const originVal = origin.id || origin.text.trim();
  const destVal = destination.id || destination.text.trim();

  if (!originVal || !destVal) return null;

  const sameCity =
    !!origin.id && !!destination.id && origin.id === destination.id;

  if (!sameCity) {
    return originVal === destVal ? "sameCity" : null;
  }

  const sameQuarter =
    !!origin.quarterId &&
    !!destination.quarterId &&
    origin.quarterId === destination.quarterId;
  if (sameQuarter) return "sameCity";

  const sameMunicipality =
    !!origin.municipalityId &&
    !!destination.municipalityId &&
    origin.municipalityId === destination.municipalityId;
  if (sameMunicipality) return "sameCity";

  const bothCityLevel =
    origin.level !== "municipality" &&
    origin.level !== "quarter" &&
    destination.level !== "municipality" &&
    destination.level !== "quarter";
  if (bothCityLevel) return "sameCity";

  return null;
}

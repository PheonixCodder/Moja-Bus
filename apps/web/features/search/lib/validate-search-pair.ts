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
 * Normalizes a display name for equality comparison — mirrors the server-side
 * `normalize()` in search.ts/locations.ts (lowercase, strip accents, drop
 * non-alphanumerics) so "San-Pédro" == "San Pedro" == "sanpedro".
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Validates an origin/destination pair for a meaningful search.
 *
 * A pair is invalid only when both ends are indistinguishable at every level
 * they specify: identical unresolved names, same city with no refinement on
 * either side, or same municipality/quarter. One-sided refinements
 * (city → municipality, city → quarter) are valid urban searches.
 *
 * City identity is decided by resolved ids when both sides have them; when at
 * least one side is name-based (popular chips, free-typed text) the display
 * texts are normalized and compared instead — closing the hole where a
 * dropdown-picked city (cuid) + same-named chip (id "") slipped past.
 */
export function validateSearchPair(
  origin: SearchPairInput,
  destination: SearchPairInput,
): PairValidationError {
  const originVal = origin.id || origin.text.trim();
  const destVal = destination.id || destination.text.trim();

  if (!originVal || !destVal) return null;

  let sameCity: boolean;
  if (origin.id && destination.id) {
    sameCity = origin.id === destination.id;
  } else {
    sameCity = normalize(origin.text) === normalize(destination.text);
  }

  if (!sameCity) return null;

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

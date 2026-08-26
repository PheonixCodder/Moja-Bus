import type { CityValue } from '../types';

/**
 * Minimal shape shared by every search UI value (CityValue-compatible).
 */
export interface SearchPairInput {
  id: string;
  text: string;
  municipalityId?: string;
  quarterId?: string;
  level?: 'city' | 'municipality' | 'quarter' | 'terminal';
}

export type PairValidationError = 'sameCity' | null;

/**
 * Normalizes a display name for equality comparison — mirrors the server-side
 * `normalize()` so "San-Pédro" == "San Pedro" == "sanpedro".
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Validates an origin/destination pair for a meaningful search.
 *
 * Invalid only when both ends are indistinguishable at every level they
 * specify. One-sided urban refinements (city → municipality/quarter) are valid.
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
  if (sameQuarter) return 'sameCity';

  const sameMunicipality =
    !!origin.municipalityId &&
    !!destination.municipalityId &&
    origin.municipalityId === destination.municipalityId;
  if (sameMunicipality) return 'sameCity';

  const bothCityLevel =
    origin.level !== 'municipality' &&
    origin.level !== 'quarter' &&
    destination.level !== 'municipality' &&
    destination.level !== 'quarter';
  if (bothCityLevel) return 'sameCity';

  return null;
}

export function isValidSearchPair(a: CityValue, b: CityValue): boolean {
  return validateSearchPair(a, b) === null;
}

import type { CityValue } from '../types';

export function validateSearchPair(
  a: CityValue,
  b: CityValue,
): 'sameCity' | null {
  if (!a.id || !b.id) return null;
  if (a.id !== b.id) return null;
  // Same city — check if different municipality makes it valid
  if (a.municipalityId && b.municipalityId && a.municipalityId !== b.municipalityId) {
    return null;
  }
  return 'sameCity';
}

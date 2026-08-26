export type PlaceLevel = "city" | "municipality" | "quarter" | "terminal";

/**
 * Level-aware geographic place. Municipality/quarter are refinements of the
 * city, not prerequisites: matching always starts at the city and narrows to
 * the deepest level given.
 */
export interface GeoPlace {
  cityId: string;
  municipalityId?: string | null;
  quarterId?: string | null;
  level: PlaceLevel;
}

export interface GeoTerminal {
  cityId: string | null;
  municipalityId: string | null;
  quarterId: string | null;
}

/** A search is urban when both ends are in the same city — refinements optional. */
export function isUrban(origin: GeoPlace, destination: GeoPlace): boolean {
  return origin.cityId === destination.cityId;
}

/** Returns true when a terminal satisfies a place at its deepest given level. */
export function placeMatchesTerminal(
  place: GeoPlace,
  terminal: GeoTerminal,
): boolean {
  if (terminal.cityId !== place.cityId) return false;
  if (place.municipalityId && terminal.municipalityId !== place.municipalityId)
    return false;
  if (place.quarterId && terminal.quarterId !== place.quarterId) return false;
  return true;
}

import type { PlaceLevel } from "./places";

export interface SearchPairInput {
  id: string;
  text: string;
  municipalityId?: string;
  quarterId?: string;
  level?: PlaceLevel;
  terminalId?: string;
}

export type PairValidationError = "sameCity" | null;

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

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
  if (sameMunicipality) {
    const bothHaveDistinctQuarters =
      !!origin.quarterId &&
      !!destination.quarterId &&
      origin.quarterId !== destination.quarterId;
    if (!bothHaveDistinctQuarters) return "sameCity";
  }

  if (
    origin.terminalId &&
    destination.terminalId &&
    origin.terminalId === destination.terminalId
  ) {
    return "sameCity";
  }

  const bothCityLevel =
    origin.level !== "municipality" &&
    origin.level !== "quarter" &&
    origin.level !== "terminal" &&
    destination.level !== "municipality" &&
    destination.level !== "quarter" &&
    destination.level !== "terminal";
  if (bothCityLevel) return "sameCity";

  return null;
}

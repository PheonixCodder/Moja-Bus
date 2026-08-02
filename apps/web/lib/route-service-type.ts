import type { ServiceType } from "@moja/schemas";

export type ServiceTypeResolution =
  | { ok: true; serviceType: ServiceType }
  | { ok: false; message: string };

interface ResolveRouteServiceTypeParams {
  originCityId: string;
  destCityId: string;
  originCityName: string | null | undefined;
  destCityName: string | null | undefined;
  requestedServiceType: ServiceType | undefined;
}

/**
 * Single source of truth for route service type.
 *
 * Service type is always derived from terminal geography (never names):
 * same cityId => URBAN, different cityIds => INTERCITY. An explicit operator
 * toggle is validated against that derivation and rejected when it contradicts
 * it, so a route's `serviceType` can never diverge from search's `isUrban`.
 */
export function resolveRouteServiceType({
  originCityId,
  destCityId,
  originCityName,
  destCityName,
  requestedServiceType,
}: ResolveRouteServiceTypeParams): ServiceTypeResolution {
  const derived: ServiceType =
    originCityId === destCityId ? "URBAN" : "INTERCITY";
  const originLabel = originCityName ?? originCityId;
  const destLabel = destCityName ?? destCityId;

  if (requestedServiceType && requestedServiceType !== derived) {
    if (requestedServiceType === "INTERCITY") {
      return {
        ok: false,
        message:
          `An intercity route must connect terminals in different cities. ` +
          `Both endpoints are in ${originLabel} — choose Urban or change a terminal.`,
      };
    }
    return {
      ok: false,
      message:
        `An urban route requires all stops in the same city. ` +
        `Origin is in ${originLabel} and destination is in ${destLabel} — ` +
        `choose Intercity or change a terminal.`,
    };
  }

  return { ok: true, serviceType: requestedServiceType ?? derived };
}

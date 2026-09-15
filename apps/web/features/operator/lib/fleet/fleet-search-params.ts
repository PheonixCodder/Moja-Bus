import {
  createSearchParamsCache,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

export const FLEET_TABS = ["buses", "layouts"] as const;
export type FleetTab = (typeof FLEET_TABS)[number];

export const fleetSearchParams = {
  tab: parseAsStringLiteral(FLEET_TABS).withDefault("buses"),
  q: parseAsString.withDefault(""),
  status: parseAsString.withDefault("ALL"),
  action: parseAsString.withDefault(""),
};

export const fleetSearchParamsCache = createSearchParamsCache(fleetSearchParams);

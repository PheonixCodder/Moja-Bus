import {
  createSearchParamsCache,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

export const ROUTE_STATUS_OPTIONS = [
  "ALL",
  "ACTIVE",
  "DRAFT",
  "SUSPENDED",
  "ARCHIVED",
] as const;

export type RouteStatusOption = (typeof ROUTE_STATUS_OPTIONS)[number];

export const routeSearchParams = {
  q: parseAsString.withDefault(""),
  status: parseAsStringLiteral(ROUTE_STATUS_OPTIONS).withDefault("ALL"),
};

export const routeSearchParamsCache = createSearchParamsCache(routeSearchParams);

import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";

export const driverSearchParams = {
  q: parseAsString.withDefault(""),
  status: parseAsString.withDefault("ALL"),
  category: parseAsString.withDefault("ALL"),
  verification: parseAsString.withDefault("ALL"),
  employment: parseAsString.withDefault("ALL"),
  page: parseAsInteger.withDefault(1),
};

export const driverSearchParamsCache = createSearchParamsCache(driverSearchParams);

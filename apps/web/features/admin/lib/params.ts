import {
  parseAsString,
  parseAsInteger,
  createSearchParamsCache
} from "nuqs/server";

export const adminUsersParamsSchema = {
  q: parseAsString.withDefault(""),
  role: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};

export const adminSettlementsParamsSchema = {
  tab: parseAsString.withDefault("ledger"),
  company: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};

export const adminOperationsParamsSchema = {
  company: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};

export const adminSettingsParamsSchema = {
  tab: parseAsString.withDefault("global"),
};

export const adminBlogParamsSchema = {
  q: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};

export const adminBlogParamsCache = createSearchParamsCache(adminBlogParamsSchema);

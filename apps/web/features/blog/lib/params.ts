import {
  createSearchParamsCache,
  parseAsString,
  parseAsInteger,
} from "nuqs/server";

export const blogParamsSchema = {
  q: parseAsString.withDefault(""),
  category: parseAsString.withDefault(""),
  tag: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};

export const blogParamsCache = createSearchParamsCache(blogParamsSchema);

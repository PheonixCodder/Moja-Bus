import {
  createSearchParamsCache,
  parseAsString,
  parseAsInteger,
} from "nuqs/server";

export const blogParamsSchema = {
  q: parseAsString.withDefault(""),
  category: parseAsString.withDefault(""),
  tag: parseAsString.withDefault(""),
  page: {
    ...parseAsInteger,
    parse: (value: string) => {
      const val = parseAsInteger.parse(value);
      return val === null || val < 1 ? 1 : val;
    },
  }.withDefault(1),
};

export const blogParamsCache = createSearchParamsCache(blogParamsSchema);

import {
  parseAsString,
  parseAsInteger,
  parseAsArrayOf,
  parseAsStringLiteral,
  createSearchParamsCache,
} from "nuqs/server";

export const SORT_OPTIONS = [
  "BEST",
  "CHEAPEST",
  "FASTEST",
  "EARLIEST",
  "LATEST",
  "MOST_AVAILABLE",
] as const;

export type SearchSortOption = (typeof SORT_OPTIONS)[number];

export const searchParamsSchema = {
  // 1. Criteria (Mandatory for triggering search)
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  date: parseAsString.withDefault(""),
  passengers: parseAsInteger.withDefault(1),

  // 2. Filters (Optional reducers)
  operators: parseAsArrayOf(parseAsString).withDefault([]),
  amenities: parseAsArrayOf(parseAsString).withDefault([]),
  departureTime: parseAsArrayOf(
    parseAsStringLiteral(["MORNING", "AFTERNOON", "EVENING"]),
  ).withDefault([]),
  maxPrice: parseAsInteger,

  // 3. Sorting
  sort: parseAsStringLiteral(SORT_OPTIONS).withDefault("BEST"),

  // 4. Pagination
  page: parseAsInteger.withDefault(1),
};

export const searchParamsCache = createSearchParamsCache(searchParamsSchema);

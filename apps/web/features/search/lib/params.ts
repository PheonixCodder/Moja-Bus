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
  fromMuni: parseAsString.withDefault(""),
  toMuni: parseAsString.withDefault(""),
  fromQuarter: parseAsString.withDefault(""),
  toQuarter: parseAsString.withDefault(""),
   fromTerminal: parseAsString.withDefault(""),
  toTerminal: parseAsString.withDefault(""),
  fromTerminalName: parseAsString.withDefault(""),
  toTerminalName: parseAsString.withDefault(""),
  fromCompanyName: parseAsString.withDefault(""),
  toCompanyName: parseAsString.withDefault(""),
  date: parseAsString.withDefault(""),
  passengers: parseAsInteger.withDefault(1),

  // 2. Filters (stored in sessionStorage, not URL — kept in schema for server-side type safety)
  operators: parseAsArrayOf(parseAsString),
  amenities: parseAsArrayOf(parseAsString),
  departureTime: parseAsArrayOf(
    parseAsStringLiteral(["MORNING", "AFTERNOON", "EVENING", "LATE_NIGHT"] as const),
  ),
  seatClass: parseAsArrayOf(parseAsStringLiteral(["ECONOMY", "STANDARD", "VIP"] as const)),
  isExpress: parseAsArrayOf(parseAsStringLiteral(["true"] as const)),
  maxPrice: parseAsInteger,

  // 3. Sorting
  sort: parseAsStringLiteral(SORT_OPTIONS).withDefault("BEST"),

  // 4. Pagination
  page: parseAsInteger.withDefault(1),

  // 5. Booking Modal State
  bookingOfferId: parseAsString,
  seatIds: parseAsArrayOf(parseAsString),
};

export const searchParamsCache = createSearchParamsCache(searchParamsSchema);

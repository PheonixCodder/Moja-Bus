import {
  parseAsString,
  parseAsInteger,
  parseAsStringLiteral,
  createSearchParamsCache,
} from "nuqs/server";

export const bookingListParsers = {
  filter: parseAsStringLiteral([
    "today",
    "upcoming",
    "past",
  ] as const).withDefault("today"),
  q: parseAsString.withDefault(""),
  status: parseAsStringLiteral([
    "ALL",
    "PENDING_PAYMENT",
    "CONFIRMED",
    "CANCELLED",
    "EXPIRED",
    "COMPLETED",
  ] as const).withDefault("ALL"),
  tripId: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  detail: parseAsString.withDefault(""),
};

export const bookingListParamsCache =
  createSearchParamsCache(bookingListParsers);

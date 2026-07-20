import {
  parseAsString,
  parseAsInteger,
  parseAsStringLiteral,
  createSearchParamsCache,
} from "nuqs/server";
import { tripStatusEnum } from "@moja/schemas";

const tripStatusValues = tripStatusEnum.options;

export const tripListParsers = {
  q: parseAsString.withDefault(""),
  status: parseAsStringLiteral([
    "ALL",
    ...tripStatusValues,
  ] as const).withDefault("ALL"),
  scheduleId: parseAsString.withDefault(""),
  manifest: parseAsString.withDefault(""),
  startDate: parseAsString.withDefault(""),
  endDate: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};

export const tripListParamsCache = createSearchParamsCache(tripListParsers);

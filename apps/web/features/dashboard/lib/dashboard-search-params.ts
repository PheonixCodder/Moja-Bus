import { startOfMonth, subMonths } from "date-fns";
import { createSearchParamsCache, parseAsIsoDateTime } from "nuqs/server";

export const dashboardParsers = {
  from: parseAsIsoDateTime.withDefault(startOfMonth(subMonths(new Date(), 5))),
  to: parseAsIsoDateTime.withDefault(new Date()),
};

export const dashboardSearchParamsCache =
  createSearchParamsCache(dashboardParsers);

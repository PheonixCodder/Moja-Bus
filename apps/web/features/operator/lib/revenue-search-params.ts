import { createSearchParamsCache, parseAsIsoDateTime, parseAsString, parseAsInteger } from "nuqs/server";
import { subDays, startOfMonth } from "date-fns";

export const revenueParsers = {
  from: parseAsIsoDateTime.withDefault(startOfMonth(new Date())),
  to: parseAsIsoDateTime.withDefault(new Date()),
  preset: parseAsString.withDefault('this-month'),
  tab: parseAsString.withDefault('overview'), // 'overview' | 'routes' | 'ledger'
  page: parseAsInteger.withDefault(1),
  txType: parseAsString.withDefault('ALL'), // 'ALL', 'TICKET_SALE', 'WITHDRAWAL', 'REFUND', 'ADJUSTMENT'
};

export const revenueSearchParamsCache = createSearchParamsCache(revenueParsers);

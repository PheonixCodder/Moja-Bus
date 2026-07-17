import {
  createSerializer,
  parseAsString,
  parseAsStringEnum,
  parseAsInteger,
  createSearchParamsCache,
} from "nuqs/server";
import { z } from "zod";
import { subDays } from "date-fns";

export const dashboardSearchParams = {
  from: parseAsString.withDefault(subDays(new Date(), 29).toISOString()),
  to: parseAsString.withDefault(new Date().toISOString()),
};
export const dashboardSearchParamsCache = createSearchParamsCache(dashboardSearchParams);


export const searchParamsSchema = z.object({
  search: z.string().optional().default(""),
  status: z.enum(["All", "Verified", "Unverified", "Active", "Pending"]).optional().default("All"),
  view: z.enum(["list", "grid"]).optional().default("list"),
});

export const travelerSearchParams = {
  search: parseAsString.withDefault(""),
  status: parseAsStringEnum(["All", "Verified", "Unverified"]).withDefault("All"),
  view: parseAsStringEnum(["list", "grid"]).withDefault("list"),
};

export const operatorSearchParams = {
  search: parseAsString.withDefault(""),
  status: parseAsStringEnum(["All", "Active", "Pending"]).withDefault("All"),
  view: parseAsStringEnum(["list", "grid"]).withDefault("list"),
};

export const serializeTravelerParams = createSerializer(travelerSearchParams);
export const serializeOperatorParams = createSerializer(operatorSearchParams);

export const ledgerSearchParams = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
  q: parseAsString.withDefault(""),
  side: parseAsString.withDefault("ALL"),
  type: parseAsString.withDefault("ALL"),
};
export const ledgerSearchParamsCache = createSearchParamsCache(ledgerSearchParams);

export const settlementsSearchParams = {
  page: parseAsInteger.withDefault(1),
};
export const settlementsSearchParamsCache = createSearchParamsCache(settlementsSearchParams);

export const withdrawalsSearchParams = {
  status: parseAsString.withDefault("All"),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};
export const withdrawalsSearchParamsCache = createSearchParamsCache(withdrawalsSearchParams);

export const dispatchSearchParams = {
  status: parseAsString.withDefault("All"),
  companyId: parseAsString,
  from: parseAsString,
  to: parseAsString,
};
export const dispatchSearchParamsCache = createSearchParamsCache(dispatchSearchParams);

export const webhookLogsSearchParams = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(20),
  search: parseAsString.withDefault(""),
  status: parseAsString.withDefault("All"),
  provider: parseAsString.withDefault("All"),
};
export const webhookLogsSearchParamsCache = createSearchParamsCache(webhookLogsSearchParams);

export const tripAuditSearchParams = {
  q: parseAsString.withDefault(""),
  status: parseAsString.withDefault("All"),
  tab: parseAsString.withDefault("overview"),
};
export const tripAuditSearchParamsCache = createSearchParamsCache(tripAuditSearchParams);

export const verificationDetailsSearchParams = {
  tab: parseAsString,
};
export const verificationDetailsSearchParamsCache = createSearchParamsCache(verificationDetailsSearchParams);

export const verificationsSearchParams = {
  status: parseAsString.withDefault("All"),
  q: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
};
export const verificationsSearchParamsCache = createSearchParamsCache(verificationsSearchParams);

export const adminRoutesSearchParams = {
  q: parseAsString.withDefault(""),
  status: parseAsString.withDefault("All"),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(15),
};
export const adminRoutesSearchParamsCache = createSearchParamsCache(adminRoutesSearchParams);

export const blogAnalyticsSearchParams = {
  period: parseAsString.withDefault("30d"),
};
export const blogAnalyticsSearchParamsCache = createSearchParamsCache(blogAnalyticsSearchParams);

export const adminRedirectsParamsSchema = {
  q: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};
export const adminRedirectsParamsCache = createSearchParamsCache(adminRedirectsParamsSchema);

export const adminActivityLogsParamsSchema = {
  search: parseAsString.withDefault(""),
  channel: parseAsString.withDefault(""),
  template: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(0),
};
export const adminActivityLogsParamsCache = createSearchParamsCache(adminActivityLogsParamsSchema);

export const bankAccessLogSearchParams = {
  page: parseAsInteger.withDefault(0),
  companyId: parseAsString,
  userId: parseAsString,
  action: parseAsString,
};
export const bankAccessLogSearchParamsCache = createSearchParamsCache(bankAccessLogSearchParams);


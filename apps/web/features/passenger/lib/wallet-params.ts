import { parseAsInteger, parseAsString, createSearchParamsCache } from "nuqs/server";

export const walletParamsSchema = {
  page: parseAsInteger.withDefault(1),
  topup: parseAsString.withDefault(""),
  ref: parseAsString.withDefault(""),
};

export const walletParamsCache = createSearchParamsCache(walletParamsSchema);

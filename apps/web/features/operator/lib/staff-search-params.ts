import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  parseAsBoolean,
} from "nuqs/server";

/**
 * Shared staff URL parsers — import from here in client views and server pages.
 * Do not redefine these inline.
 */
export const staffParsers = {
  tab: parseAsStringEnum(["members", "invitations", "activity"]).withDefault(
    "members",
  ),
  q: parseAsString.withDefault(""),
  role: parseAsString.withDefault("ALL"),
  status: parseAsString.withDefault("ALL"),
  page: parseAsInteger.withDefault(1),
  invite: parseAsBoolean.withDefault(false),
  member: parseAsString.withDefault(""),
};

export const staffSearchParamsCache = createSearchParamsCache(staffParsers);

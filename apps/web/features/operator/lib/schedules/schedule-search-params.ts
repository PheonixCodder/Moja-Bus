import {
  createSearchParamsCache,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

export const scheduleListParsers = {
  q: parseAsString.withDefault(""),
  routeId: parseAsString.withDefault(""),
  status: parseAsStringEnum(["all", "active", "inactive"]).withDefault("all"),
  page: parseAsInteger.withDefault(1),
  sort: parseAsStringEnum([
    "departureTime_asc",
    "departureTime_desc",
    "name_asc",
    "updated_desc",
  ]).withDefault("departureTime_asc"),
  new: parseAsBoolean.withDefault(false),
  step: parseAsStringEnum(["Route", "Calendar", "Pricing", "Preview"]).withDefault(
    "Route",
  ),
  routePick: parseAsString.withDefault(""),
  edit: parseAsString.withDefault(""),
};

export const scheduleSearchParamsCache =
  createSearchParamsCache(scheduleListParsers);

export const DAYS = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
] as const;

export type DayKey = (typeof DAYS)[number]["key"];

export function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h ?? "0", 10);
  if (Number.isNaN(hour)) return t;
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m ?? "00"} ${ampm}`;
}

export function parseLocalDate(dateStr: string | null | undefined): Date | undefined {
  if (!dateStr) return undefined;
  const parts = dateStr.split("T")[0]?.split("-");
  if (!parts || parts.length !== 3) return undefined;
  const year = parseInt(parts[0]!, 10);
  const month = parseInt(parts[1]!, 10) - 1;
  const day = parseInt(parts[2]!, 10);
  return new Date(year, month, day);
}

export function humanizeEnum(value: string) {
  return value
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

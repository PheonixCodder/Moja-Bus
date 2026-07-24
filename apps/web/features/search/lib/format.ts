export function formatPriceXOF(value: number): string {
  return `${new Intl.NumberFormat("en-US").format(value)} F`;
}

export { formatDepartureTime } from "@/lib/format-date";

export function formatTripDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

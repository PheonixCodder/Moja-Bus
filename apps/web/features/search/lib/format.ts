export function formatPriceXOF(value: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(value)} F`;
}

export function formatDepartureTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function formatTripDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}
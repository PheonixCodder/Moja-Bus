export function formatPriceXOF(price: number): string {
  return `${price.toLocaleString('fr-CI')} XOF`;
}

export function formatTripDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function formatDepartureTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-CI', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function toLocalISODate(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function parseDateStrip(dateStr: string): { weekday: string; day: number; month: string } {
  const [y, m, d] = dateStr.split('-').map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  return {
    weekday: WEEKDAYS[dt.getUTCDay()]!,
    day: dt.getUTCDate(),
    month: MONTHS[dt.getUTCMonth()]!,
  };
}

export function todayISODate(): string {
  return toLocalISODate(new Date());
}

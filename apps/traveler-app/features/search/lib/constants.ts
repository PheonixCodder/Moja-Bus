import type { SearchFilters } from '../types';

export const AMENITY_IDS = ['AC', 'WIFI', 'TOILET', 'LUGGAGE'] as const;
export type AmenityId = (typeof AMENITY_IDS)[number];

export const TIME_IDS = ['MORNING', 'AFTERNOON', 'EVENING', 'LATE_NIGHT'] as const;
export type TimeFilterId = (typeof TIME_IDS)[number];

export const SEAT_CLASS_IDS = ['ECONOMY', 'STANDARD', 'VIP'] as const;
export type SeatClassFilter = (typeof SEAT_CLASS_IDS)[number];

export const SORT_KEYS = ['CHEAPEST', 'FASTEST', 'EARLIEST', 'LATEST'] as const;

export const POPULAR_ROUTES = [
  { from: 'Abidjan', to: 'Bouaké', label: 'Abidjan → Bouaké' },
  { from: 'Abidjan', to: 'Yamoussoukro', label: 'Abidjan → Yamoussoukro' },
  { from: 'Abidjan', to: 'San-Pédro', label: 'Abidjan → San-Pédro' },
  { from: 'Korhogo', to: 'Abidjan', label: 'Korhogo → Abidjan' },
] as const;

export const FILTER_STORAGE_KEY = '@moja/search_filters';

export const EMPTY_FILTERS: SearchFilters = {
  operators: [],
  amenities: [],
  departureTime: [],
  seatClass: [],
  isExpress: false,
};

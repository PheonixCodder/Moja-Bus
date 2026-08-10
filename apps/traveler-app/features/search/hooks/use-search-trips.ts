import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/lib/trpc';
import type { SearchFilters, SortKey } from '../types';

export function useSearchTrips(
  from: string,
  to: string,
  fromMuni: string,
  toMuni: string,
  fromQuarter: string,
  toQuarter: string,
  date: string,
  passengers: number,
  filters: SearchFilters,
  sort: SortKey,
  page: number,
) {
  const trpc = useTRPC();
  const enabled = !!from && !!to && !!date;

  return useQuery({
    ...trpc.search.search.queryOptions({
      originCityId: from,
      destinationCityId: to,
      originMunicipalityId: fromMuni || undefined,
      destinationMunicipalityId: toMuni || undefined,
      originQuarterId: fromQuarter || undefined,
      destinationQuarterId: toQuarter || undefined,
      date,
      passengers,
      operators: filters.operators.length ? filters.operators : undefined,
      amenities: filters.amenities.length ? filters.amenities : undefined,
      departureTime: filters.departureTime.length
        ? (filters.departureTime as ('MORNING' | 'AFTERNOON' | 'EVENING' | 'LATE_NIGHT')[])
        : undefined,
      seatClass: filters.seatClass.length
        ? (filters.seatClass as ('ECONOMY' | 'STANDARD' | 'VIP')[])
        : undefined,
      isExpress: filters.isExpress ? ['true'] : undefined,
      sort,
      page,
    }),
    enabled,
    staleTime: 10_000,
  });
}

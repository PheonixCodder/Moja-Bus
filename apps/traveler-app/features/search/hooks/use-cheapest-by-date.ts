import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/lib/trpc';

export function useCheapestByDate(
  from: string,
  to: string,
  centerDate: string,
  fromMuni?: string,
  toMuni?: string,
  fromQuarter?: string,
  toQuarter?: string,
) {
  const trpc = useTRPC();
  const enabled = !!from && !!to && !!centerDate;

  return useQuery({
    ...trpc.search.cheapestByDate.queryOptions({
      originCityId: from,
      destinationCityId: to,
      originMunicipalityId: fromMuni || undefined,
      destinationMunicipalityId: toMuni || undefined,
      originQuarterId: fromQuarter || undefined,
      destinationQuarterId: toQuarter || undefined,
      centerDate,
    }),
    enabled,
    staleTime: 30_000,
  });
}

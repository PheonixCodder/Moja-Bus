import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/lib/trpc';
import { useDebounce } from './use-debounce';

export function useSearchCities(query: string) {
  const trpc = useTRPC();
  const debounced = useDebounce(query, 300);
  const isSearchable = debounced.trim().length >= 2;

  const { data: cities = [], isLoading } = useQuery({
    ...trpc.locations.searchCities.queryOptions({ query: debounced.trim() }),
    enabled: isSearchable,
    staleTime: 60_000,
  });

  return { cities, isLoading, isSearchable };
}

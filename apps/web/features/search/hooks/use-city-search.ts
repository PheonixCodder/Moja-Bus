"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useDebounce } from "./use-debounce";

export function useCitySearch(query: string, delayMs = 250) {
  const trpc = useTRPC();
  const debouncedQuery = useDebounce(query, delayMs);

  const { data } = useQuery({
    ...trpc.locations.searchCities.queryOptions({ query: debouncedQuery }),
    enabled: debouncedQuery.length >= 2,
  });

  return { cities: data ?? [], isSearchable: debouncedQuery.length >= 2 };
}
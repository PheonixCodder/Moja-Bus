"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function useCheapestByDate(
  originCityId: string,
  destinationCityId: string,
  centerDate: string,
  originMunicipalityId?: string,
  destinationMunicipalityId?: string,
) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.search.cheapestByDate.queryOptions({
      originCityId,
      destinationCityId,
      originMunicipalityId,
      destinationMunicipalityId,
      centerDate,
    }),
    enabled: !!originCityId && !!destinationCityId && !!centerDate,
  });
}

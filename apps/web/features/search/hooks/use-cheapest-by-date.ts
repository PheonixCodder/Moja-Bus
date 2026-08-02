"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function useCheapestByDate(
  originCityId: string,
  destinationCityId: string,
  centerDate: string,
  originMunicipalityId?: string,
  destinationMunicipalityId?: string,
  originQuarterId?: string,
  destinationQuarterId?: string,
) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.search.cheapestByDate.queryOptions({
      originCityId,
      destinationCityId,
      originMunicipalityId,
      destinationMunicipalityId,
      originQuarterId,
      destinationQuarterId,
      centerDate,
    }),
    enabled: !!originCityId && !!destinationCityId && !!centerDate,
  });
}

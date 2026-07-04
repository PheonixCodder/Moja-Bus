"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function useCityDetails(cityId: string | undefined) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.locations.getCityDetails.queryOptions({ id: cityId ?? "" }),
    enabled: !!cityId,
  });
}
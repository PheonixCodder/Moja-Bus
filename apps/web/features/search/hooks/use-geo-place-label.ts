"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

interface GeoPlaceKey {
  cityId?: string;
  municipalityId?: string;
  quarterId?: string;
}

/**
 * Resolves a city + optional municipality/quarter into names so a deep-linked
 * search can render the full hierarchy label (e.g. "Abidjan (Cocody - Riviera 3)")
 * instead of just the plain city name.
 */
export function useGeoPlaceLabel({ cityId, municipalityId, quarterId }: GeoPlaceKey) {
  const trpc = useTRPC();
  const enabled = !!cityId || !!municipalityId || !!quarterId;
  return useQuery({
    ...trpc.locations.getGeoPlaceLabel.queryOptions({
      cityId: cityId ?? "",
      municipalityId: municipalityId || undefined,
      quarterId: quarterId || undefined,
    }),
    enabled,
  });
}
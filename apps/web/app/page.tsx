import type { SearchParams } from "nuqs/server";
import { SearchPageClient } from "@/features/search/components/search-page-client";
import { searchParamsCache } from "@/features/search/lib/params";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

export const metadata = {
    title: "Search Buses - Moja Ride",
    description: "Search and compare intercity bus departures across Côte d'Ivoire.",
};

interface SearchPageProps {
    searchParams: Promise<SearchParams>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const params = searchParamsCache.parse(await searchParams);

    if (params.from) {
        await prefetch(trpc.locations.getCityDetails.queryOptions({ id: params.from }));
    }
    if (params.to) {
        await prefetch(trpc.locations.getCityDetails.queryOptions({ id: params.to }));
    }
    if (params.from && params.to && params.date) {
        await prefetch(
            trpc.search.search.queryOptions({
                originCityId: params.from,
                destinationCityId: params.to,
                date: params.date,
                passengers: params.passengers,
                operators: params.operators.length > 0 ? params.operators : undefined,
                amenities: params.amenities.length > 0 ? params.amenities : undefined,
                departureTime:
                    params.departureTime.length > 0 ? params.departureTime : undefined,
                maxPrice: params.maxPrice ?? undefined,
                sort: params.sort,
                page: params.page,
            }),
        );
    }

    return (
        <HydrateClient>
            <SearchPageClient />
        </HydrateClient>
    );
}
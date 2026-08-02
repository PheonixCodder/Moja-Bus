import type { SearchParams } from "nuqs/server";
import { getTranslations } from "next-intl/server";
import { SearchPageClient } from "@/features/search/components/search-page-client";
import { searchParamsCache } from "@/features/search/lib/params";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { getServerSession } from "@/lib/auth-server";

interface SearchPageProps {
    searchParams: Promise<SearchParams>;
    params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: SearchPageProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "search" });
    return { title: t("title") };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const params = searchParamsCache.parse(await searchParams);
    const session = await getServerSession();

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
                originMunicipalityId: params.fromMuni || undefined,
                destinationMunicipalityId: params.toMuni || undefined,
                originQuarterId: params.fromQuarter || undefined,
                destinationQuarterId: params.toQuarter || undefined,
                date: params.date,
                passengers: params.passengers,
                operators: params.operators?.length ? params.operators : undefined,
                amenities: params.amenities?.length ? params.amenities : undefined,
                departureTime:
                    params.departureTime?.length ? params.departureTime : undefined,
                maxPrice: params.maxPrice ?? undefined,
                sort: params.sort,
                page: params.page,
            }),
        );
        await prefetch(
            trpc.search.cheapestByDate.queryOptions({
                originCityId: params.from,
                destinationCityId: params.to,
                originMunicipalityId: params.fromMuni || undefined,
                destinationMunicipalityId: params.toMuni || undefined,
                originQuarterId: params.fromQuarter || undefined,
                destinationQuarterId: params.toQuarter || undefined,
                centerDate: params.date,
            }),
        );
    }

    return (
        <HydrateClient>
            <SearchPageClient user={session?.user} />
        </HydrateClient>
    );
}

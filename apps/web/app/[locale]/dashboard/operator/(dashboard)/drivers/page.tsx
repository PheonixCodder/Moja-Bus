import type { SearchParams } from "nuqs/server";
import { OperatorDriversView } from "@/features/operator/views/operator-drivers-view";
import { driverSearchParamsCache } from "@/features/operator/lib/drivers/driver-search-params";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return {
    title: "Driver Fleet Management | Moja Operator",
    description:
      "Manage commercial drivers, license verifications, and real-time trip allocations.",
  };
}

export default async function DriversPage({ searchParams }: Props) {
  const { q, status, category, verification, employment, page } =
    driverSearchParamsCache.parse(await searchParams);

  await prefetch(
    trpc.drivers.listDrivers.queryOptions({
      search: q || undefined,
      status: status !== "ALL" ? (status as any) : undefined,
      licenseCategory: category !== "ALL" ? (category as any) : undefined,
      verificationStatus:
        verification !== "ALL" ? (verification as any) : undefined,
      employmentType:
        employment !== "ALL" ? (employment as any) : undefined,
      page,
      limit: 50,
    }),
  );

  return (
    <HydrateClient>
      <OperatorDriversView />
    </HydrateClient>
  );
}

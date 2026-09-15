import type { SearchParams } from "nuqs/server";
import { getTranslations } from "next-intl/server";
import { OperatorStaffView } from "@/features/operator/views/operator-staff-view";
import { staffSearchParamsCache } from "@/features/operator/lib/staff-search-params";
import type { StaffRole, OperatorStatus } from "@/features/operator/lib/staff";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "operatorDashboard.staff",
  });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function OperatorStaffPage({ searchParams }: Props) {
  const parsed = staffSearchParamsCache.parse(await searchParams);

  await Promise.all([
    prefetch(
      trpc.staff.listStaff.queryOptions({
        search: parsed.q || undefined,
        role: parsed.role !== "ALL" ? (parsed.role as StaffRole) : undefined,
        status: parsed.status !== "ALL" ? (parsed.status as OperatorStatus) : undefined,
        page: parsed.page,
        limit: 50,
      }),
    ),
    prefetch(trpc.staff.listInvitations.queryOptions({})),
    prefetch(trpc.staff.getActivityLog.queryOptions({ limit: 100 })),
    prefetch(trpc.staff.getMyPermissions.queryOptions()),
  ]);

  return (
    <HydrateClient>
      <OperatorStaffView />
    </HydrateClient>
  );
}

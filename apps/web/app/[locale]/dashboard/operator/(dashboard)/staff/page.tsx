import { getTranslations } from "next-intl/server";
import { OperatorStaffView } from "@/features/operator/views/operator-staff-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "operatorDashboard.staff" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function OperatorStaffPage() {
  // Prefetch with exact default args that match the client-side useQuery defaults.
  // search: undefined, role: undefined, status: undefined, page: 1, limit: 50
  // This ensures the SSR cache is a perfect hit on first client render.
  await Promise.all([
    prefetch(
      trpc.staff.listStaff.queryOptions({
        search: undefined,
        role: undefined,
        status: undefined,
        page: 1,
        limit: 50,
      }),
    ),
    prefetch(trpc.staff.listInvitations.queryOptions({ limit: 20 })),
    prefetch(trpc.staff.getActivityLog.queryOptions({ limit: 100 })),
    prefetch(trpc.staff.getMyPermissions.queryOptions()),
  ]);

  return (
    <HydrateClient>
      <OperatorStaffView />
    </HydrateClient>
  );
}

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { OperatorDashboardView } from "@/features/operator/views/operator-dashboard-view";
import { AccessDeniedCard } from "@/features/operator/components/access-denied-card";
import { trpc, HydrateClient, prefetch, getQueryClient } from "@/trpc/server";
import { hasPermission } from "@moja/schemas";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "operatorDashboard.overview" });
  return { title: t("metaTitle") };
}

export default async function OperatorDashboardPage({ params }: Props) {
  const { locale } = await params;
  const queryClient = getQueryClient();

  const [onboardingData, permsData] = await Promise.all([
    queryClient.fetchQuery(trpc.operator.getOnboardingStatus.queryOptions()),
    queryClient.fetchQuery(trpc.staff.getMyPermissions.queryOptions()),
  ]);

  if (!onboardingData || onboardingData.onboardingStatus !== "COMPLETED") {
    redirect("/dashboard/operator/onboarding");
  }

  const canViewDashboard =
    permsData?.role === "OWNER" ||
    (permsData?.permissions.some(
      (key) =>
        key === "trips:read" ||
        key === "bookings:read" ||
        key === "company:view",
    ) ?? false);

  if (!canViewDashboard) {
    return (
      <HydrateClient>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AccessDeniedCard />
        </div>
      </HydrateClient>
    );
  }

  await prefetch(trpc.operator.getDashboardMetrics.queryOptions());

  return (
    <HydrateClient>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <OperatorDashboardView />
      </div>
    </HydrateClient>
  );
}

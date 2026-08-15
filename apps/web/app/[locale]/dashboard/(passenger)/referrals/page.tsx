import { getTranslations } from "next-intl/server";
import { PassengerReferralsView } from "@/features/passenger/views/passenger-referrals-view";
import { PageTitleHeader } from "@/features/dashboard/components/page-title-header";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "passengerDashboard.referrals",
  });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function ReferralsPage() {
  const t = await getTranslations("passengerDashboard.referrals");
  await Promise.all([
    prefetch(trpc.discounts.myReferral.queryOptions()),
    prefetch(
      trpc.discounts.listMyInvitees.queryOptions({ limit: 50, offset: 0 }),
    ),
  ]);

  return (
    <HydrateClient>
      <div className="flex-1 p-6 lg:p-10 max-w-6xl mx-auto w-full">
        <PageTitleHeader
          title={t("pageTitle")}
          description={t("pageDescription")}
        />
        <PassengerReferralsView />
      </div>
    </HydrateClient>
  );
}

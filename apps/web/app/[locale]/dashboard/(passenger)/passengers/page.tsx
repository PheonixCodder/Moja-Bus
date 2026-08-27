import { getTranslations } from "next-intl/server";
import { SavedPassengersView } from "@/features/passenger/views/saved-passengers-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { PageTitleHeader } from "@/features/dashboard/components/page-title-header";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "passengerDashboard.savedPassengers",
  });
  return { title: t("metaTitle") };
}

export default async function PassengersPage() {
  const t = await getTranslations("passengerDashboard.savedPassengers");

  await prefetch(trpc.passenger.listSaved.queryOptions());

  return (
    <HydrateClient>
      <div className="flex-1 p-6 lg:p-10 max-w-6xl mx-auto w-full">
        <PageTitleHeader
          title={t("pageTitle")}
          description={t("pageDescription")}
        />
        <SavedPassengersView />
      </div>
    </HydrateClient>
  );
}
